import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { Database } from '../types/database.types';
import { validateCorporateEmail } from '../utils/authValidators';
import { logAuthEvent } from '../services/auditService';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
export type TeamRow = Database['public']['Tables']['teams']['Row'];
export type RolePermissionRow = Database['public']['Tables']['role_permissions']['Row'];

export type AuthStateStatus = 
  | 'LOADING' 
  | 'AUTHENTICATED' 
  | 'UNAUTHENTICATED' 
  | 'PROFILE_NOT_FOUND' 
  | 'ACCOUNT_SUSPENDED';

export interface AuthContextType {
  // Session & Identity
  session: Session | null;
  authUser: SupabaseAuthUser | null;
  profile: ProfileRow | null;
  organization: OrganizationRow | null;
  team: TeamRow | null;
  manager: ProfileRow | null;
  permissions: RolePermissionRow[];
  
  // States
  authState: AuthStateStatus;
  isLoading: boolean;
  accessDeniedReason: string | null;
  isCloudConnected: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  refreshProfile: () => Promise<void>;
  clearAccessDenied: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [organization, setOrganization] = useState<OrganizationRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [manager, setManager] = useState<ProfileRow | null>(null);
  const [permissions, setPermissions] = useState<RolePermissionRow[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authState, setAuthState] = useState<AuthStateStatus>('LOADING');
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null);

  const isCloudConnected = isSupabaseConfigured();

  /**
   * Loads the CRM profile, organization, team, manager, and role permissions.
   */
  const loadCRMProfile = useCallback(async (userId: string): Promise<boolean> => {
    if (!isCloudConnected) {
      return false;
    }

    try {
      // 1. Fetch Profile
      const { data: rawProfile, error: profileError } = await (supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() as any);

      const userProfile = rawProfile as ProfileRow | null;

      if (profileError) {
        console.error('Error fetching CRM profile:', profileError);
      }

      // Strict Rule: If profile does not exist -> Access Not Provisioned (Do not create a default user)
      if (!userProfile) {
        setProfile(null);
        setOrganization(null);
        setTeam(null);
        setManager(null);
        setPermissions([]);
        setAuthState('PROFILE_NOT_FOUND');
        setAccessDeniedReason(
          'Your account has authenticated, but no CRM profile has been provisioned in the directory. ' +
          'Please contact your System Administrator to assign your role and organization.'
        );
        return false;
      }

      // Strict Rule: If profile is inactive or suspended -> Deny CRM Access
      if (userProfile.status !== 'active') {
        setProfile(userProfile);
        setOrganization(null);
        setTeam(null);
        setManager(null);
        setPermissions([]);
        setAuthState('ACCOUNT_SUSPENDED');
        setAccessDeniedReason(
          `Your CRM account is currently ${userProfile.status.toUpperCase()}. ` +
          'Access to the platform is restricted. Please contact your System Administrator.'
        );
        logAuthEvent('ACCESS_DENIED', userProfile.email, { reason: 'ACCOUNT_SUSPENDED', status: userProfile.status }, {
          id: userProfile.id,
          name: userProfile.full_name,
          organizationId: userProfile.organization_id,
        });
        return false;
      }

      setProfile(userProfile);

      // 2. Fetch Organization Info
      if (userProfile.organization_id) {
        const { data: orgData } = await (supabase
          .from('organizations')
          .select('*')
          .eq('id', userProfile.organization_id)
          .maybeSingle() as any);

        if (orgData) {
          setOrganization(orgData as OrganizationRow);
        }
      }

      // 3. Fetch Team Info (if assigned)
      if (userProfile.team_id) {
        const { data: teamData } = await (supabase
          .from('teams')
          .select('*')
          .eq('id', userProfile.team_id)
          .maybeSingle() as any);

        if (teamData) {
          setTeam(teamData as TeamRow);
        }
      } else {
        setTeam(null);
      }

      // 4. Fetch Manager Info (if assigned)
      if (userProfile.manager_id) {
        const { data: managerData } = await (supabase
          .from('profiles')
          .select('*')
          .eq('id', userProfile.manager_id)
          .maybeSingle() as any);

        if (managerData) {
          setManager(managerData as ProfileRow);
        }
      } else {
        setManager(null);
      }

      // 5. Fetch Role Permissions for user's active role & organization
      if (userProfile.organization_id && userProfile.role) {
        const { data: permsData } = await (supabase
          .from('role_permissions')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
          .eq('role', userProfile.role) as any);

        if (permsData) {
          setPermissions(permsData as RolePermissionRow[]);
        }
      }

      // 6. Expose Authenticated State
      setAuthState('AUTHENTICATED');
      setAccessDeniedReason(null);
      return true;

    } catch (err: any) {
      console.error('CRM Profile fetch exception:', err);
      setAuthState('PROFILE_NOT_FOUND');
      setAccessDeniedReason('Unable to load CRM profile due to a network or system error. Please retry.');
      return false;
    }
  }, [isCloudConnected]);

  const getProfileForEmail = (emailLower: string): ProfileRow => {
    const isSuper = emailLower.startsWith('devika') || emailLower.includes('super_admin');
    const nameFromEmail = emailLower.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const fullName = isSuper
      ? 'Devika Pangam'
      : emailLower.includes('connect')
      ? 'Connect Support Team'
      : nameFromEmail;
    const designation = isSuper ? 'Managing Director / System Administrator' : 'Corporate BD Member';
    const role = isSuper ? 'super_admin' : 'bd_exec';
    const id = isSuper ? '00000000-0000-0000-0000-000000000001' : `USR-${emailLower.replace(/[^a-z0-9]/g, '')}`;

    return {
      id,
      organization_id: '00000000-0000-0000-0000-000000000001',
      email: emailLower,
      full_name: fullName,
      role,
      status: 'active',
      department: isSuper ? 'Executive Management' : 'Business Development',
      designation,
      employee_id: `EMP-${emailLower.slice(0, 3).toUpperCase()}`,
      phone: '+91 99999 00000',
      avatar_url: '',
      team_id: null,
      manager_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as ProfileRow;
  };

  // Initialize and listen to Supabase Auth State changes
  useEffect(() => {
    let isMounted = true;

    if (!isCloudConnected) {
      setIsLoading(false);
      const mockAuthed = localStorage.getItem('CORPBD_MOCK_AUTHENTICATED');
      if (mockAuthed === 'true') {
        const emailLower = (localStorage.getItem('CORPBD_MOCK_EMAIL') || 'devika.p@rajmudragroup.com').toLowerCase();
        setProfile(getProfileForEmail(emailLower));
        setAuthState('AUTHENTICATED');
      } else {
        setAuthState('UNAUTHENTICATED');
      }
      return;
    }

    // 1. Recover existing session from Supabase client storage
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      if (initialSession) {
        setSession(initialSession);
        setAuthUser(initialSession.user);
        loadCRMProfile(initialSession.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setAuthState('UNAUTHENTICATED');
        setIsLoading(false);
      }
    });

    // 2. Realtime Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);

      if (newSession?.user) {
        setAuthUser(newSession.user);
        await loadCRMProfile(newSession.user.id);
      } else {
        setAuthUser(null);
        setProfile(null);
        setOrganization(null);
        setTeam(null);
        setManager(null);
        setPermissions([]);
        setAuthState('UNAUTHENTICATED');
        setAccessDeniedReason(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isCloudConnected, loadCRMProfile]);

  // Sign In Action (Enforces @rajmudragroup.com corporate domain)
  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const domainValidation = validateCorporateEmail(email);
    if (!domainValidation.isValid) {
      logAuthEvent('LOGIN_FAILURE', email, { reason: domainValidation.error });
      return { success: false, error: domainValidation.error };
    }

    if (!isCloudConnected) {
      const emailLower = email.trim().toLowerCase();
      const mockProfile = getProfileForEmail(emailLower);
      setProfile(mockProfile);
      setAuthState('AUTHENTICATED');
      localStorage.setItem('CORPBD_MOCK_AUTHENTICATED', 'true');
      localStorage.setItem('CORPBD_MOCK_EMAIL', emailLower);
      logAuthEvent('LOGIN_SUCCESS', email, { mode: 'mock_local' });
      return { success: true };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      });

      if (error) {
        setIsLoading(false);
        logAuthEvent('LOGIN_FAILURE', email, { error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        setSession(data.session);
        setAuthUser(data.user);
        const profileLoaded = await loadCRMProfile(data.user.id);
        setIsLoading(false);
        if (!profileLoaded) {
          return { success: false, error: accessDeniedReason || 'Access denied.' };
        }
        logAuthEvent('LOGIN_SUCCESS', email, { method: 'corporate_password' }, {
          id: data.user.id,
          organizationId: profile?.organization_id,
        });
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Login failed. Please check your credentials.' };
    } catch (err: any) {
      setIsLoading(false);
      logAuthEvent('LOGIN_FAILURE', email, { error: err.message });
      return { success: false, error: err.message || 'An unexpected login error occurred.' };
    }
  };

  // Sign Out Action
  const signOut = async () => {
    if (profile) {
      logAuthEvent('LOGOUT', profile.email, {}, {
        id: profile.id,
        name: profile.full_name,
        organizationId: profile.organization_id,
      });
    }
    if (isCloudConnected) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setSession(null);
    setAuthUser(null);
    setProfile(null);
    setOrganization(null);
    setTeam(null);
    setManager(null);
    setPermissions([]);
    setAuthState('UNAUTHENTICATED');
    setAccessDeniedReason(null);
    localStorage.removeItem('CORPBD_MOCK_AUTHENTICATED');
    localStorage.removeItem('CORPBD_MOCK_EMAIL');
  };

  // Password Reset Request (Enforces @rajmudragroup.com corporate domain)
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    const domainValidation = validateCorporateEmail(email);
    if (!domainValidation.isValid) {
      return { success: false, error: domainValidation.error };
    }

    logAuthEvent('PASSWORD_RESET_INITIATED', email, { channel: 'zoho_corporate' });

    if (!isCloudConnected) {
      return { 
        success: true, 
        message: 'Password reset simulation: In production, a recovery email is sent to your Zoho corporate mailbox via Supabase Auth.' 
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/index.html?type=recovery`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: `A secure password reset link has been dispatched to your corporate inbox (${email}). Please check your Zoho webmail.` 
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch reset email.' };
    }
  };

  // Password Update Action
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    if (!isCloudConnected) {
      return { success: true, message: 'Password updated in local development mode.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Your password has been successfully updated.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  };

  const refreshProfile = async () => {
    if (authUser) {
      await loadCRMProfile(authUser.id);
    }
  };

  const clearAccessDenied = () => {
    setAccessDeniedReason(null);
    setAuthState('UNAUTHENTICATED');
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        authUser,
        profile,
        organization,
        team,
        manager,
        permissions,
        authState,
        isLoading,
        accessDeniedReason,
        isCloudConnected,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        clearAccessDenied,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
