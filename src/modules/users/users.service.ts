import { Injectable } from '@nestjs/common';
import { Prisma, Role, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { PageResultDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { BizCode } from '../../common/exceptions/biz-code.constant';
import { BizException } from '../../common/exceptions/biz.exception';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateUserDto,
  ResetUserPasswordDto,
  UpdateMyProfileDto,
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UserResponseDto,
} from './users.dto';
import { SafeUser, userSafeSelect } from './users.select';

const BCRYPT_SALT_ROUNDS = 10;

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ helpers ============

  // 软删除显式过滤(详见 §7.8):所有非"管理员看回收站"查询经此过滤
  private notDeletedWhere<T extends Prisma.UserWhereInput>(
    where: T = {} as T,
  ): T & { deletedAt: null } {
    return { ...where, deletedAt: null };
  }

  private hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
  }

  // email 归一化:trim + lowercase;空字符串视为清空(入库 null);undefined 表示不更新
  private normalizeEmail(raw: string | undefined): string | null | undefined {
    if (raw === undefined) return undefined;
    const trimmed = raw.trim().toLowerCase();
    return trimmed === '' ? null : trimmed;
  }

  private normalizeUsername(raw: string): string {
    return raw.trim().toLowerCase();
  }

  // 双层校验(§7.11):Guard 已通过 + Service 再按当前/目标角色校验
  // v1 设计选择:SUPER_ADMIN 可管理任何角色(含其他 SUPER_ADMIN),
  // 仅受自我保护和最后一个 SUPER_ADMIN 保护约束。
  private assertCanManageUser(
    currentUser: CurrentUserPayload,
    targetUser: Pick<User, 'role'>,
  ): void {
    if (currentUser.role === Role.SUPER_ADMIN) return;
    if (currentUser.role === Role.ADMIN && targetUser.role === Role.USER) return;
    throw new BizException(BizCode.FORBIDDEN_ROLE_OPERATION);
  }

  private assertNotSelf(currentUser: CurrentUserPayload, targetId: string): void {
    if (currentUser.id === targetId) {
      throw new BizException(BizCode.CANNOT_OPERATE_SELF);
    }
  }

  // 最后一个 SUPER_ADMIN 保护:必须在调用方 transaction 内运行(§12 + §13)。
  // 排除目标用户自身后,剩余活跃 super admin 必须 ≥ 1。
  private async assertNotLastSuperAdmin(tx: PrismaTx, userIdAffected: string): Promise<void> {
    const remaining = await tx.user.count({
      where: {
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        deletedAt: null,
        id: { not: userIdAffected },
      },
    });
    if (remaining === 0) {
      throw new BizException(BizCode.LAST_SUPER_ADMIN_PROTECTED);
    }
  }

  // P2002 唯一约束兜底转换。预检查应该已经拦住绝大多数,这层处理并发场景。
  private async runWithUniqueConstraintGuard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined) ?? [];
        if (target.includes('username')) throw new BizException(BizCode.USERNAME_ALREADY_EXISTS);
        if (target.includes('email')) throw new BizException(BizCode.EMAIL_ALREADY_EXISTS);
      }
      throw err;
    }
  }

  // 唯一性预检查:**必须用 findUnique**(包含软删记录),禁止 findFirst+notDeletedWhere
  // (§7.8 — 软删后 username/email 不复用)。
  private async checkUniqueOrThrow(
    username: string | undefined,
    email: string | null | undefined,
    excludeId?: string,
  ): Promise<void> {
    if (username !== undefined) {
      const existing = await this.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (existing && existing.id !== excludeId) {
        throw new BizException(BizCode.USERNAME_ALREADY_EXISTS);
      }
    }
    if (email !== undefined && email !== null) {
      const existing = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing && existing.id !== excludeId) {
        throw new BizException(BizCode.EMAIL_ALREADY_EXISTS);
      }
    }
  }

  // 业务详情查询:findFirst + notDeletedWhere,找不到/已软删统一抛 USER_NOT_FOUND。
  private async findByIdOrThrow(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: this.notDeletedWhere({ id }),
      select: userSafeSelect,
    });
    if (!user) throw new BizException(BizCode.USER_NOT_FOUND);
    return user;
  }

  // 同上,但只返回管理校验所需字段(role/status),少一次完整 select 拷贝。
  private async findRawByIdOrThrow(id: string): Promise<Pick<User, 'id' | 'role' | 'status'>> {
    const user = await this.prisma.user.findFirst({
      where: this.notDeletedWhere({ id }),
      select: { id: true, role: true, status: true },
    });
    if (!user) throw new BizException(BizCode.USER_NOT_FOUND);
    return user;
  }

  // ============ /me ============

  findMe(currentUser: CurrentUserPayload): Promise<UserResponseDto> {
    return this.findByIdOrThrow(currentUser.id);
  }

  async updateMyProfile(
    currentUser: CurrentUserPayload,
    dto: UpdateMyProfileDto,
  ): Promise<UserResponseDto> {
    // 纵深防御:JwtStrategy.validate 已保证 currentUser 存在且未软删,
    // 这里再次显式检查避免极端 race(管理员刚刚软删该用户的窗口)。
    await this.findByIdOrThrow(currentUser.id);
    return this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        nickname: dto.nickname,
        avatarKey: dto.avatarKey,
      },
      select: userSafeSelect,
    });
  }

  // ============ admin: list ============

  async list(
    currentUser: CurrentUserPayload,
    query: PaginationQueryDto,
  ): Promise<PageResultDto<UserResponseDto>> {
    const { page, pageSize } = query;
    const where: Prisma.UserWhereInput = this.notDeletedWhere({});

    if (currentUser.role === Role.ADMIN) {
      where.role = Role.USER;
    } else if (currentUser.role !== Role.SUPER_ADMIN) {
      // defensive,Guard 已拦截非 SUPER_ADMIN/ADMIN
      throw new BizException(BizCode.FORBIDDEN);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSafeSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // ============ admin: create ============

  async create(currentUser: CurrentUserPayload, dto: CreateUserDto): Promise<UserResponseDto> {
    // role 透传安全(§7.11):
    const targetRole = dto.role ?? Role.USER;
    if (targetRole === Role.SUPER_ADMIN) {
      // 任何业务 API 永远不能创建 SUPER_ADMIN(只有 seed 能)
      throw new BizException(BizCode.FORBIDDEN_ROLE_OPERATION);
    }
    if (currentUser.role === Role.ADMIN && targetRole !== Role.USER) {
      throw new BizException(BizCode.FORBIDDEN_ROLE_OPERATION);
    }

    const username = this.normalizeUsername(dto.username);
    const email = this.normalizeEmail(dto.email);

    // 唯一性预检查(包含软删):findUnique
    await this.checkUniqueOrThrow(username, email);

    const passwordHash = await this.hashPassword(dto.password);

    return this.runWithUniqueConstraintGuard(() =>
      this.prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          nickname: dto.nickname,
          avatarKey: dto.avatarKey,
          role: targetRole,
        },
        select: userSafeSelect,
      }),
    );
  }

  // ============ admin: read ============

  async findOne(currentUser: CurrentUserPayload, id: string): Promise<UserResponseDto> {
    const target = await this.findRawByIdOrThrow(id);
    this.assertCanManageUser(currentUser, target);
    return this.findByIdOrThrow(id);
  }

  // ============ admin: update profile ============

  async update(
    currentUser: CurrentUserPayload,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const target = await this.findRawByIdOrThrow(id);
    this.assertCanManageUser(currentUser, target);

    const data: Prisma.UserUpdateInput = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.avatarKey !== undefined) data.avatarKey = dto.avatarKey;
    if (dto.email !== undefined) {
      const normalized = this.normalizeEmail(dto.email);
      data.email = normalized;
      if (normalized !== null) {
        await this.checkUniqueOrThrow(undefined, normalized, id);
      }
    }

    return this.runWithUniqueConstraintGuard(() =>
      this.prisma.user.update({
        where: { id },
        data,
        select: userSafeSelect,
      }),
    );
  }

  // ============ admin: reset password ============

  async resetPassword(
    currentUser: CurrentUserPayload,
    id: string,
    dto: ResetUserPasswordDto,
  ): Promise<UserResponseDto> {
    const target = await this.findRawByIdOrThrow(id);
    this.assertCanManageUser(currentUser, target);

    // 管理员重置密码后 v1 不主动吊销旧 token(§7.7);
    // 如需立即阻断,管理员同步把目标 status 改 DISABLED。
    const passwordHash = await this.hashPassword(dto.newPassword);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: userSafeSelect,
    });
  }

  // ============ admin: update role ============

  async updateRole(
    currentUser: CurrentUserPayload,
    id: string,
    dto: UpdateUserRoleDto,
  ): Promise<UserResponseDto> {
    // 自我保护(§7.11):自改 role 永远拦
    this.assertNotSelf(currentUser, id);

    const target = await this.findRawByIdOrThrow(id);
    this.assertCanManageUser(currentUser, target);

    // 业务 API 禁止把任何人设成 SUPER_ADMIN
    if (dto.role === Role.SUPER_ADMIN) {
      throw new BizException(BizCode.FORBIDDEN_ROLE_OPERATION);
    }

    // 最后一个保护:目标当前是 SUPER_ADMIN 且新 role 不是 SUPER_ADMIN(降级)
    return this.prisma.$transaction(async (tx) => {
      if (target.role === Role.SUPER_ADMIN && dto.role !== Role.SUPER_ADMIN) {
        await this.assertNotLastSuperAdmin(tx, id);
      }
      return tx.user.update({
        where: { id },
        data: { role: dto.role },
        select: userSafeSelect,
      });
    });
  }

  // ============ admin: update status ============

  async updateStatus(
    currentUser: CurrentUserPayload,
    id: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    const target = await this.findRawByIdOrThrow(id);
    this.assertCanManageUser(currentUser, target);

    // 自我保护:仅当改成 DISABLED 时拦截(防止把自己禁用后无人能再启用)
    if (dto.status === UserStatus.DISABLED) {
      this.assertNotSelf(currentUser, id);
    }

    // 最后一个保护:目标当前是 SUPER_ADMIN 且新 status === DISABLED
    return this.prisma.$transaction(async (tx) => {
      if (target.role === Role.SUPER_ADMIN && dto.status === UserStatus.DISABLED) {
        await this.assertNotLastSuperAdmin(tx, id);
      }
      return tx.user.update({
        where: { id },
        data: { status: dto.status },
        select: userSafeSelect,
      });
    });
  }

  // ============ admin: soft delete ============

  async softDelete(currentUser: CurrentUserPayload, id: string): Promise<UserResponseDto> {
    this.assertNotSelf(currentUser, id);

    const target = await this.findRawByIdOrThrow(id);
    this.assertCanManageUser(currentUser, target);

    // 删除走 update,而非 prisma.user.delete()(§7.8)
    return this.prisma.$transaction(async (tx) => {
      if (target.role === Role.SUPER_ADMIN) {
        await this.assertNotLastSuperAdmin(tx, id);
      }
      return tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: UserStatus.DISABLED,
        },
        select: userSafeSelect,
      });
    });
  }
}
