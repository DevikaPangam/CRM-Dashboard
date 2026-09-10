import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';
import { getAuthorizedDefaultTab } from '../../constants/moduleAccess';

interface AccessDeniedProps {
  moduleName?: string;
  onNavigateHome?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ moduleName, onNavigateHome }) => {
  const { setCurrentTab } = useCRM();
  const { can } = useRBAC();

  const handleReturn = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      const defaultTab = getAuthorizedDefaultTab(can);
      setCurrentTab(defaultTab);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
        }}
      >
        <ShieldAlert size={36} />
      </div>

      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 8px 0',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Access Denied
      </h2>

      <p
        style={{
          fontSize: '14px',
          color: '#64748b',
          maxWidth: '460px',
          margin: '0 0 24px 0',
          lineHeight: '1.6',
          fontFamily: 'var(--font-sans)',
        }}
      >
        You do not have permission to access {moduleName ? `the ${moduleName} module` : 'this module'}.
        Please contact your System Administrator if you believe this is in error.
      </p>

      <button
        type="button"
        onClick={handleReturn}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '14px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
          transition: 'all 0.2s ease',
        }}
      >
        <ArrowLeft size={16} />
        Return to Authorized Workspace
      </button>
    </div>
  );
};
