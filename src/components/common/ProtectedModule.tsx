import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { CRMModuleKey, PermissionActionEnum } from '../../types/database.types';
import { AccessDenied } from './AccessDenied';
import { RefreshCw } from 'lucide-react';

interface ProtectedModuleProps {
  moduleKey: CRMModuleKey;
  action?: PermissionActionEnum;
  children: React.ReactNode;
}

/**
 * Route & Module Guard Component.
 * Ensures tab modules render ONLY when authentication is resolved and live RBAC permissions permit access.
 */
export const ProtectedModule: React.FC<ProtectedModuleProps> = ({
  moduleKey,
  action = 'view',
  children,
}) => {
  const { isLoading, authState, profile, isCloudConnected } = useAuth();
  const { can } = useRBAC();

  // 1. Loading State: Wait while authentication / profile is resolving
  if (isLoading || authState === 'LOADING') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
        }}
      >
        <RefreshCw size={28} className="animate-spin" style={{ color: '#0284c7', marginBottom: '12px' }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
          Verifying module authorization...
        </span>
      </div>
    );
  }

  // 2. Unauthenticated or Profile Missing State
  if (authState !== 'AUTHENTICATED' || (isCloudConnected && !profile)) {
    return <AccessDenied moduleName={moduleKey} />;
  }

  // 3. RBAC Permission Engine Check
  const isAuthorized = can(moduleKey, action);

  if (!isAuthorized) {
    return <AccessDenied moduleName={moduleKey} />;
  }

  // 4. Render Protected Component
  return <>{children}</>;
};
