import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useCRM } from './CRMContext';
import { UserRoleEnum, PermissionActionEnum, CRMModuleKey } from '../types/database.types';

export interface RBACContextType {
  currentRole: UserRoleEnum;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isManagerOrAbove: boolean;
  hasPermission: (moduleKey: CRMModuleKey, action: PermissionActionEnum) => boolean;
  isRole: (roles: UserRoleEnum | UserRoleEnum[]) => boolean;
  canApprove: (moduleKey?: CRMModuleKey) => boolean;
  canExport: (moduleKey?: CRMModuleKey) => boolean;
  canAdmin: (moduleKey?: CRMModuleKey) => boolean;
  allowedSegments: string[];
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// Map frontend User role string to standard UserRoleEnum
const mapUserRoleToEnum = (roleStr?: string): UserRoleEnum => {
  if (!roleStr) return 'bd_exec';
  switch (roleStr) {
    case 'System Administrator':
    case 'super_admin':
      return 'super_admin';
    case 'BD Director':
    case 'bd_director':
      return 'bd_director';
    case 'BD Manager':
    case 'bd_manager':
      return 'bd_manager';
    case 'BD Senior Executive':
    case 'bd_sr_exec':
      return 'bd_sr_exec';
    case 'BD Executive':
    case 'bd_exec':
      return 'bd_exec';
    case 'Management Reviewer':
    case 'management_viewer':
      return 'management_viewer';
    case 'Analyst':
    case 'analyst':
      return 'analyst';
    default:
      return 'bd_exec';
  }
};

// Baseline in-memory fallback permission matrix for UI rendering
const BASELINE_PERMISSIONS: Record<UserRoleEnum, Partial<Record<CRMModuleKey, PermissionActionEnum[]>>> = {
  super_admin: {
    dashboard: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    clients: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    team: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    segments: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    opportunities: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    calculator: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    activities: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    followups: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    internal: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    documents: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    review: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
    users: ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'admin'],
  },
  bd_director: {
    dashboard: ['view', 'export', 'approve'],
    clients: ['view', 'create', 'edit', 'export', 'assign', 'approve'],
    team: ['view', 'create', 'edit', 'export', 'assign'],
    segments: ['view', 'create', 'edit', 'export', 'assign'],
    opportunities: ['view', 'create', 'edit', 'export', 'assign', 'approve'],
    calculator: ['view', 'create', 'edit', 'export', 'approve'],
    activities: ['view', 'create', 'edit', 'export', 'assign'],
    followups: ['view', 'create', 'edit', 'export', 'assign'],
    internal: ['view', 'create', 'edit', 'export', 'assign', 'approve'],
    documents: ['view', 'create', 'edit', 'delete', 'export', 'approve'],
    review: ['view', 'edit', 'export', 'approve'],
    users: ['view', 'export'],
  },
  bd_manager: {
    dashboard: ['view', 'export'],
    clients: ['view', 'create', 'edit', 'export', 'assign'],
    team: ['view', 'export'],
    segments: ['view'],
    opportunities: ['view', 'create', 'edit', 'export', 'assign'],
    calculator: ['view', 'create', 'edit', 'export'],
    activities: ['view', 'create', 'edit', 'export', 'assign'],
    followups: ['view', 'create', 'edit', 'export', 'assign'],
    internal: ['view', 'create', 'edit', 'export', 'assign', 'approve'],
    documents: ['view', 'create', 'edit', 'export'],
    review: ['view', 'export'],
    users: [],
  },
  bd_sr_exec: {
    dashboard: ['view'],
    clients: ['view', 'create', 'edit', 'export'],
    team: [],
    segments: [],
    opportunities: ['view', 'create', 'edit', 'export'],
    calculator: ['view', 'create', 'edit', 'export'],
    activities: ['view', 'create', 'edit'],
    followups: ['view', 'create', 'edit'],
    internal: ['view', 'create', 'edit'],
    documents: ['view', 'create', 'edit', 'export'],
    review: [],
    users: [],
  },
  bd_exec: {
    dashboard: ['view'],
    clients: ['view', 'create', 'edit'],
    team: [],
    segments: [],
    opportunities: ['view', 'create', 'edit'],
    calculator: ['view', 'create', 'edit'],
    activities: ['view', 'create', 'edit'],
    followups: ['view', 'create', 'edit'],
    internal: ['view', 'create'],
    documents: ['view', 'create'],
    review: [],
    users: [],
  },
  management_viewer: {
    dashboard: ['view', 'export'],
    clients: ['view', 'export'],
    team: ['view'],
    segments: ['view'],
    opportunities: ['view', 'export'],
    calculator: ['view'],
    activities: ['view'],
    followups: ['view'],
    internal: ['view'],
    documents: ['view'],
    review: ['view', 'export'],
    users: [],
  },
  analyst: {
    dashboard: ['view', 'export'],
    clients: ['view', 'export'],
    team: ['view', 'export'],
    segments: ['view', 'export'],
    opportunities: ['view', 'export'],
    calculator: ['view', 'export'],
    activities: ['view', 'export'],
    followups: ['view', 'export'],
    internal: ['view', 'export'],
    documents: ['view', 'export'],
    review: ['view', 'export'],
    users: [],
  },
};

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, permissions: livePermissions, isCloudConnected } = useAuth();
  const { currentUser } = useCRM();

  // Resolve current active role (from Supabase profile if cloud-connected, else CRMContext simulation)
  const currentRole = useMemo<UserRoleEnum>(() => {
    if (isCloudConnected && profile?.role) {
      return profile.role;
    }
    return mapUserRoleToEnum(currentUser?.role || 'bd_exec');
  }, [isCloudConnected, profile, currentUser]);

  const allowedSegments = useMemo<string[]>(() => {
    if (isCloudConnected && profile?.allowed_segments) {
      return profile.allowed_segments;
    }
    return ['All'];
  }, [isCloudConnected, profile]);

  const isSuperAdmin = currentRole === 'super_admin';
  const isOrgAdmin = currentRole === 'super_admin' || currentRole === 'bd_director';
  const isManagerOrAbove = isOrgAdmin || currentRole === 'bd_manager';

  // Dynamic permission check: prefers live database permissions, falls back to baseline matrix
  const hasPermission = (moduleKey: CRMModuleKey, action: PermissionActionEnum): boolean => {
    if (isSuperAdmin) return true;

    // 1. Check live permissions from Supabase if available
    if (isCloudConnected && livePermissions && livePermissions.length > 0) {
      const match = livePermissions.find(
        (p) => p.module_key === moduleKey && p.action === action
      );
      if (match !== undefined) {
        return Boolean(match.is_allowed);
      }
    }

    // 2. Fallback to client baseline permissions
    const rolePerms = BASELINE_PERMISSIONS[currentRole]?.[moduleKey];
    return Boolean(rolePerms && rolePerms.includes(action));
  };

  const isRole = (roles: UserRoleEnum | UserRoleEnum[]): boolean => {
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(currentRole);
  };

  const canApprove = (moduleKey: CRMModuleKey = 'internal'): boolean => {
    return hasPermission(moduleKey, 'approve');
  };

  const canExport = (moduleKey: CRMModuleKey = 'dashboard'): boolean => {
    return hasPermission(moduleKey, 'export');
  };

  const canAdmin = (moduleKey: CRMModuleKey = 'users'): boolean => {
    return hasPermission(moduleKey, 'admin');
  };

  return (
    <RBACContext.Provider
      value={{
        currentRole,
        isSuperAdmin,
        isOrgAdmin,
        isManagerOrAbove,
        hasPermission,
        isRole,
        canApprove,
        canExport,
        canAdmin,
        allowedSegments,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};
