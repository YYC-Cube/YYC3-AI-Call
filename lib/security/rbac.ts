export enum Permission {
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
 _TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_EXPORT = 'task:export',

  CALL_RECORD_READ = 'call_record:read',
  CALL_RECORD_DOWNLOAD = 'call_record:download',
  CALL_RECORD_DELETE = 'call_record:delete',

  AGENT_MANAGE = 'agent:manage',
  AGENT_CONFIGURE = 'agent:configure',

  USER_MANAGE = 'user:manage',
  USER_ROLE_ASSIGN = 'user:role_assign',

  SYSTEM_CONFIG = 'system:config',
  SYSTEM_MONITOR = 'system:monitor',

  AI_CALL_EXECUTE = 'ai_call:execute',
  AI_CALL_BULK = 'ai_call:bulk',

  DATA_ANALYTICS = 'data:analytics',
  DATA_EXPORT = 'data:export',
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),

  [Role.ADMIN]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission._TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_EXPORT,
    Permission.CALL_RECORD_READ,
    Permission.CALL_RECORD_DOWNLOAD,
    Permission.CALL_RECORD_DELETE,
    Permission.AGENT_MANAGE,
    Permission.AGENT_CONFIGURE,
    Permission.USER_MANAGE,
    Permission.USER_ROLE_ASSIGN,
    Permission.AI_CALL_EXECUTE,
    Permission.AI_CALL_BULK,
    Permission.DATA_ANALYTICS,
    Permission.DATA_EXPORT,
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_MONITOR,
  ],

  [Role.OPERATOR]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission._TASK_UPDATE,
    Permission.CALL_RECORD_READ,
    Permission.CALL_RECORD_DOWNLOAD,
    Permission.AGENT_CONFIGURE,
    Permission.AI_CALL_EXECUTE,
  ],

  [Role.ANALYST]: [
    Permission.TASK_READ,
    Permission.CALL_RECORD_READ,
    Permission.DATA_ANALYTICS,
    Permission.DATA_EXPORT,
  ],

  [Role.VIEWER]: [
    Permission.TASK_READ,
    Permission.CALL_RECORD_READ,
  ],
};

export interface UserContext {
  id: string;
  role: Role;
  organizationId?: string;
  departmentId?: string;
  permissions?: Permission[];
}

export class RBACService {
  private static instance: RBACService;

  private constructor() {}

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  hasPermission(user: UserContext, permission: Permission): boolean {
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }

    const rolePermissions = RolePermissions[user.role];
    return rolePermissions?.includes(permission) || false;
  }

  hasAnyPermission(user: UserContext, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  hasAllPermissions(user: UserContext, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  checkResourceOwnership(
    user: UserContext,
    resourceOwnerId: string
  ): boolean {
    if (this.hasPermission(user, Permission.USER_MANAGE)) {
      return true;
    }

    return user.id === resourceOwnerId;
  }

  getAccessibleResources(user: UserContext): {
    tasks: string[];
    callRecords: string[];
    organizations: string[];
  } {
    const canManageAll = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
    ].includes(user.role);

    return {
      tasks: canManageAll ? ['*'] : [],
      callRecords: canManageAll ? ['*'] : [],
      organizations: user.organizationId ? [user.organizationId] : [],
    };
  }

  filterByPermission<T extends { createdBy?: string; organizationId?: string }>(
    items: T[],
    user: UserContext,
    permission: Permission
  ): T[] {
    const canAccessAll = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
    ].includes(user.role);

    if (canAccessAll) {
      return items;
    }

    if (!this.hasPermission(user, permission)) {
      return [];
    }

    return items.filter(item => {
      if (item.createdBy === user.id) {
        return true;
      }

      if (user.organizationId && item.organizationId === user.organizationId) {
        return true;
      }

      return false;
    });
  }

  validateRoleTransition(
    currentRole: Role,
    targetRole: Role,
    operatorRole: Role
  ): boolean {
    const roleHierarchy: Record<Role, number> = {
      [Role.SUPER_ADMIN]: 100,
      [Role.ADMIN]: 80,
      [Role.OPERATOR]: 60,
      [Role.ANALYST]: 40,
      [Role.VIEWER]: 20,
    };

    const operatorLevel = roleHierarchy[operatorRole];
    const currentLevel = roleHierarchy[currentRole];
    const targetLevel = roleHierarchy[targetRole];

    if (operatorLevel <= currentLevel || operatorLevel <= targetLevel) {
      return false;
    }

    if (currentRole === Role.SUPER_ADMIN && operatorRole !== Role.SUPER_ADMIN) {
      return false;
    }

    return true;
  }
}

export const rbac = RBACService.getInstance();

export function requirePermission(permission: Permission) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const user = args[0] as UserContext | undefined;

      if (!user) {
        throw new Error('未授权：缺少用户上下文');
      }

      if (!rbac.hasPermission(user, permission)) {
        throw new Error(`权限不足：需要 ${permission} 权限`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const user = args[0] as UserContext | undefined;

      if (!user) {
        throw new Error('未授权：缺少用户上下文');
      }

      if (!rbac.hasAnyPermission(user, permissions)) {
        throw new Error(`权限不足：需要以下任一权限 ${permissions.join(', ')}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
