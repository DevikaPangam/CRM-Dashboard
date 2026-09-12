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
  | 'ACCOUNT_SUSPENDED'
  | 'PASSWORD_RECOVERY';

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
  isPasswordRecoveryMode: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyRecoveryOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
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
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState<boolean>(false);

  const isCloudConnected = isSupabaseConfigured();

  /**
   * Loads the CRM profile, organization, team, manager, and role permissions for an authenticated Supabase user.
   */
  const loadCRMProfile = useCallback(async (userId: string): Promise<boolean> => {
    if (!isCloudConnected) {
      setAuthState('UNAUTHENTICATED');
      setAccessDeniedReason('Supabase Cloud is not configured.');
      return false;
    }

    try {
      // 1. Fetch Profile from public.profiles by auth userId
      let { data: rawProfile, error: profileError } = await (supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() as any);

      let userProfile = rawProfile as ProfileRow | null;

      if (profileError) {
        console.error('Error fetching CRM profile from database:', profileError);
      }

      // Strict Rule: If profile does not exist in public.profiles -> Show Access Not Provisioned
      if (!userProfile) {
        setProfile(null);
        setOrganization(null);
        setTeam(null);
        setManager(null);
        setPermissions([]);
        setAuthState('PROFILE_NOT_FOUND');
        setAccessDeniedReason(
          'Your corporate account authenticated successfully, but no CRM profile has been provisioned in the directory. ' +
          'Please contact your System Administrator to assign your role and organization workspace.'
        );
        return false;
      }

      // Strict Rule: If profile status is not active -> Deny CRM Access
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

      // 6. Confirm Authenticated State
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

  // Initialize and listen to Supabase Auth State changes
  useEffect(() => {
    let isMounted = true;
    const isRecoveryUrl = window.location.search.includes('type=recovery') || window.location.hash.includes('type=recovery');

    if (isRecoveryUrl) {
      setIsPasswordRecoveryMode(true);
      setAuthState('PASSWORD_RECOVERY');
    }

    // 1. Realtime Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'PASSWORD_RECOVERY' || (isRecoveryUrl && newSession?.user)) {
        setSession(newSession);
        setAuthUser(newSession?.user || null);
        setIsPasswordRecoveryMode(true);
        setAuthState('PASSWORD_RECOVERY');
        setIsLoading(false);
        return;
      }

      if (newSession?.user) {
        setSession(newSession);
        setAuthUser(newSession.user);
        await loadCRMProfile(newSession.user.id);
        setIsLoading(false);
      } else {
        setSession(null);
        setAuthUser(null);
        setProfile(null);
        setOrganization(null);
        setTeam(null);
        setManager(null);
        setPermissions([]);
        if (!isPasswordRecoveryMode) {
          setAuthState('UNAUTHENTICATED');
        }
        setAccessDeniedReason(null);
        setIsLoading(false);
      }
    });

    // 2. Initial Session Recovery (Only when not processing a recovery callback URL)
    if (!isRecoveryUrl) {
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (!isMounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setAuthUser(initialSession.user);
          loadCRMProfile(initialSession.user.id).finally(() => {
            if (isMounted) setIsLoading(false);
          });
        } else {
          setAuthState('UNAUTHENTICATED');
          setIsLoading(false);
        }
      }).catch((err) => {
        console.warn('Session recovery notice:', err);
        if (isMounted) {
          setAuthState('UNAUTHENTICATED');
          setIsLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadCRMProfile, isPasswordRecoveryMode]);

  // Sign In Action (Enforces @rajmudragroup.com corporate domain and authenticates via Supabase Auth)
  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    let rawEmail = email ? email.trim().toLowerCase() : '';
    if (rawEmail && !rawEmail.includes('@')) {
      rawEmail = `${rawEmail}@rajmudragroup.com`;
    }

    const domainValidation = validateCorporateEmail(rawEmail);
    if (!domainValidation.isValid) {
      logAuthEvent('LOGIN_FAILURE', rawEmail, { reason: domainValidation.error });
      return { success: false, error: domainValidation.error };
    }

    const emailLower = rawEmail;
    setIsLoading(true);

    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password: pass,
      });

      // If user is not yet registered in Supabase Auth, attempt automatic corporate signup/bootstrap
      if (error && (
        error.message?.toLowerCase().includes('invalid login credentials') ||
        error.message?.toLowerCase().includes('user not found') ||
        error.status === 400
      )) {
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailLower,
            password: pass,
            options: {
              data: {
                full_name: emailLower.split('@')[0],
              },
            },
          });

          if (signUpData?.user) {
            if (signUpData.session) {
              data = signUpData;
              error = null;
            } else {
              const retryRes = await supabase.auth.signInWithPassword({
                email: emailLower,
                password: pass,
              });
              if (retryRes.data?.user) {
                data = retryRes.data;
                error = null;
              }
            }
          } else if (signUpError && !signUpError.message?.includes('already registered')) {
            console.warn('Supabase auth auto-registration notice:', signUpError.message);
          }
        } catch (signUpEx: any) {
          console.warn('Supabase auth auto-registration exception:', signUpEx?.message);
        }
      }

      if (error) {
        setIsLoading(false);
        logAuthEvent('LOGIN_FAILURE', emailLower, { reason: error.message });
        return { success: false, error: error.message || 'Invalid credentials or authentication failed.' };
      }

      if (data?.user) {
        setSession(data.session);
        setAuthUser(data.user);
        const profileLoaded = await loadCRMProfile(data.user.id);
        setIsLoading(false);

        if (profileLoaded) {
          logAuthEvent('LOGIN_SUCCESS', emailLower, { method: 'supabase_email_password' });
          return { success: true };
        } else {
          return {
            success: false,
            error: 'Authentication confirmed, but no active CRM profile was found for this user in the directory.',
          };
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Authentication failed. Please check your credentials.' };
    } catch (err: any) {
      setIsLoading(false);
      console.error('Supabase signInWithPassword exception:', err);
      return { success: false, error: err?.message || 'A network error occurred during sign in.' };
    }
  };

  // Sign Up / Corporate Registration Action
  const signUp = async (email: string, pass: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    let rawEmail = email ? email.trim().toLowerCase() : '';
    if (rawEmail && !rawEmail.includes('@')) {
      rawEmail = `${rawEmail}@rajmudragroup.com`;
    }

    const domainValidation = validateCorporateEmail(rawEmail);
    if (!domainValidation.isValid) {
      return { success: false, error: domainValidation.error };
    }

    const emailLower = rawEmail;
    setIsLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailLower,
        password: pass,
        options: {
          data: {
            full_name: emailLower === 'devika.p@rajmudragroup.com' ? 'Devika Pangam' : emailLower.split('@')[0],
            role: emailLower === 'devika.p@rajmudragroup.com' ? 'super_admin' : 'bd_exec',
          },
        },
      });

      if (signUpError) {
        setIsLoading(false);
        return { success: false, error: signUpError.message };
      }

      if (signUpData?.user) {
        if (signUpData.session) {
          setSession(signUpData.session);
          setAuthUser(signUpData.user);
          await loadCRMProfile(signUpData.user.id);
          setIsLoading(false);
          return { success: true, message: 'Account registered and authenticated successfully!' };
        } else {
          // Attempt immediate login in case auto-confirm is enabled
          const loginRes = await supabase.auth.signInWithPassword({
            email: emailLower,
            password: pass,
          });
          if (loginRes.data?.user && loginRes.data?.session) {
            setSession(loginRes.data.session);
            setAuthUser(loginRes.data.user);
            await loadCRMProfile(loginRes.data.user.id);
            setIsLoading(false);
            return { success: true, message: 'Account registered and logged in!' };
          }
          setIsLoading(false);
          return {
            success: true,
            message: `Account registered for ${emailLower}! If email confirmation is enabled, check your inbox or click 'Forgot Password?' to issue a direct password reset link.`,
          };
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Registration did not complete. Please try signing in.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'A network error occurred during registration.' };
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

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
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
  };

  // Password Reset Request (Dispatches 6-digit OTP verification code via Supabase Auth)
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    let rawEmail = email ? email.trim().toLowerCase() : '';
    if (rawEmail && !rawEmail.includes('@')) {
      rawEmail = `${rawEmail}@rajmudragroup.com`;
    }

    const domainValidation = validateCorporateEmail(rawEmail);
    if (!domainValidation.isValid) {
      return { success: false, error: domainValidation.error };
    }

    logAuthEvent('PASSWORD_RESET_INITIATED', rawEmail, { channel: 'supabase_auth_otp' });

    try {
      const redirectUrl = new URL(`${window.location.origin}/index.html`);
      redirectUrl.searchParams.set('type', 'recovery');

      const { error } = await supabase.auth.resetPasswordForEmail(rawEmail, {
        redirectTo: redirectUrl.toString(),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: `If an account exists, a verification code has been sent to your corporate email (${rawEmail}).`
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch verification code.' };
    }
  };

  // Verifies numeric OTP code for recovery via Supabase Auth
  const verifyRecoveryOtp = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
    let rawEmail = email ? email.trim().toLowerCase() : '';
    if (rawEmail && !rawEmail.includes('@')) {
      rawEmail = `${rawEmail}@rajmudragroup.com`;
    }

    const domainValidation = validateCorporateEmail(rawEmail);
    if (!domainValidation.isValid) {
      return { success: false, error: domainValidation.error };
    }

    const cleanToken = token ? token.trim() : '';
    if (!cleanToken || cleanToken.length < 6) {
      return { success: false, error: 'Verification code is invalid or has expired. Please request a new code.' };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: rawEmail,
        token: cleanToken,
        type: 'recovery',
      });

      if (error) {
        logAuthEvent('PASSWORD_RESET_INITIATED', rawEmail, { channel: 'supabase_otp', status: 'failure' });
        return { success: false, error: 'Verification code is invalid or has expired. Please request a new code.' };
      }

      if (data?.session && data?.user) {
        setSession(data.session);
        setAuthUser(data.user);
        setIsPasswordRecoveryMode(true);
        setAuthState('PASSWORD_RECOVERY');
        logAuthEvent('PASSWORD_RESET_INITIATED', rawEmail, { channel: 'supabase_otp', status: 'verified' });
        return { success: true };
      }

      return { success: false, error: 'Verification code is invalid or has expired. Please request a new code.' };
    } catch (err: any) {
      return { success: false, error: 'An error occurred during OTP verification.' };
    }
  };

  // Password Update Action
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setIsPasswordRecoveryMode(false);
      if (authUser) {
        const profileLoaded = await loadCRMProfile(authUser.id);
        if (!profileLoaded && authState === 'PASSWORD_RECOVERY') {
          setAuthState('AUTHENTICATED');
        }
      } else {
        setAuthState('AUTHENTICATED');
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
        isPasswordRecoveryMode,
        signIn,
        signUp,
        signOut,
        resetPassword,
        verifyRecoveryOtp,
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
