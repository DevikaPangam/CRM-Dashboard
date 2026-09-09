import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Client, Opportunity, Activity, Followup, InternalTask, TeamMember, BusinessSegment, User, CurrencyMode, FilterState, CRMDocument
} from '../types/crm';
import {
  INITIAL_CLIENTS, INITIAL_OPPORTUNITIES, INITIAL_ACTIVITIES, INITIAL_FOLLOWUPS,
  INITIAL_INTERNAL_TASKS, INITIAL_TEAM_MEMBERS, INITIAL_SEGMENTS, INITIAL_USERS, INITIAL_DOCUMENTS
} from '../utils/seedData';
import { exportOpportunitiesToCSV, exportClientsToCSV, exportFullJSONBackup } from '../utils/exportUtils';
import { useAuth } from './AuthContext';
import { crmDataService } from '../services/crmDataService';
import { subscribeToCRMRealtime } from '../services/realtimeService';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { logExportEvent, logAuditEvent } from '../services/auditService';

interface ModalState {
  type: string | null;
  data?: any;
}

interface CRMContextType {
  // Navigation & View
  currentTab: string;
  setCurrentTab: (tab: string) => void;

  // Currency
  currency: CurrencyMode;
  toggleCurrency: () => void;

  // Auth & RBAC
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Filters & Search
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // CRM Entities
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'code' | 'createdDate'>) => void;
  importClients: (newClients: Client[], replaceExisting?: boolean) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  opportunities: Opportunity[];
  addOpportunity: (opp: Omit<Opportunity, 'id' | 'code' | 'createdDate' | 'lastActivityDate'>) => void;
  updateOpportunity: (id: string, opp: Partial<Opportunity>) => void;
  updateOpportunityStage: (id: string, stage: string, probability?: number) => void;
  updateOpportunityDelegation: (id: string, delegation: Partial<Pick<Opportunity, 'delegatedDepartment' | 'delegatedOwner' | 'delegationStatus' | 'delegationMilestone' | 'slaDaysRemaining' | 'delegationRemarks'>>) => void;
  deleteOpportunity: (id: string) => void;

  activities: Activity[];
  addActivity: (act: Omit<Activity, 'id'>) => void;
  deleteActivity: (id: string) => void;

  followups: Followup[];
  addFollowup: (fol: Omit<Followup, 'id'>) => void;
  completeFollowup: (id: string, remarks?: string) => void;
  deleteFollowup: (id: string) => void;

  internalTasks: InternalTask[];
  addInternalTask: (task: Omit<InternalTask, 'id'>) => void;
  updateTaskStatus: (id: string, status: InternalTask['status'], responseNotes?: string) => void;
  deleteInternalTask: (id: string) => void;

  documents: CRMDocument[];
  addDocument: (doc: Omit<CRMDocument, 'id' | 'uploadedDate'>) => void;
  updateDocument: (id: string, doc: Partial<CRMDocument>) => void;
  deleteDocument: (id: string) => void;

  teamMembers: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  segments: BusinessSegment[];
  addSegment: (seg: Omit<BusinessSegment, 'id'>) => void;
  updateSegment: (id: string, seg: Partial<BusinessSegment>) => void;
  deleteSegment: (id: string) => void;

  // Modals
  activeModal: ModalState;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;

  // Cloud Sync & Loading State
  isLoadingData: boolean;
  refreshCRMData: () => Promise<void>;

  // Utilities & Reset
  resetToFactoryData: () => void;
  exportOpportunities: () => void;
  exportClients: () => void;
  exportBackup: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEY = 'CORPBD_CRM_REACT_V3';

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, authUser } = useAuth();

  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const [currentTab, setCurrentTab] = useState<string>('tab-dashboard');
  const [currency, setCurrency] = useState<CurrencyMode>(() => loadStored<CurrencyMode>('currency', 'INR'));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [filters, setFilters] = useState<FilterState>({
    financialYear: 'FY2026-27',
    period: 'All',
    bdOwner: 'All',
    segment: 'All',
    region: 'All',
    searchQuery: '',
  });

  const [users, setUsers] = useState<User[]>(() => loadStored<User[]>('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = loadStored<User | null>('currentUser', null);
    return savedUser || INITIAL_USERS[0];
  });

  const [clients, setClients] = useState<Client[]>(() => loadStored<Client[]>('clients', INITIAL_CLIENTS));
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => loadStored<Opportunity[]>('opportunities', INITIAL_OPPORTUNITIES));
  const [activities, setActivities] = useState<Activity[]>(() => loadStored<Activity[]>('activities', INITIAL_ACTIVITIES));
  const [followups, setFollowups] = useState<Followup[]>(() => loadStored<Followup[]>('followups', INITIAL_FOLLOWUPS));
  const [internalTasks, setInternalTasks] = useState<InternalTask[]>(() => loadStored<InternalTask[]>('internalTasks', INITIAL_INTERNAL_TASKS));
  const [documents, setDocuments] = useState<CRMDocument[]>(() => loadStored<CRMDocument[]>('documents', INITIAL_DOCUMENTS));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadStored<TeamMember[]>('teamMembers', INITIAL_TEAM_MEMBERS));
  const [segments, setSegments] = useState<BusinessSegment[]>(() => loadStored<BusinessSegment[]>('segments', INITIAL_SEGMENTS));

  const [activeModal, setActiveModal] = useState<ModalState>({ type: null });

  const currentOrgId = profile?.organization_id || '00000000-0000-0000-0000-000000000001';

  // Synchronize authenticated user profile with currentUser
  useEffect(() => {
    if (profile) {
      let mappedRole: any = 'BD Executive';
      if (profile.role === 'super_admin') mappedRole = 'System Administrator';
      else if (profile.role === 'bd_director' || profile.role === 'bd_manager') mappedRole = 'BD Manager';
      else if (profile.role === 'management_viewer') mappedRole = 'Management Reviewer';

      setCurrentUser({
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: mappedRole,
        role_name: profile.role,
        status: profile.status === 'active' ? 'Active' : 'Inactive',
        allowed_tabs: ['tab-dashboard', 'tab-clients', 'tab-opportunities', 'tab-activities', 'tab-followups', 'tab-review'],
      });
    }
  }, [profile]);

  // Load live data from Supabase when profile/orgId is available
  const refreshCRMData = useCallback(async () => {
    if (!isSupabaseConfigured() || !currentOrgId) return;

    setIsLoadingData(true);
    try {
      const [dbClients, dbOpps, dbActs, dbFoll, dbDocs, dbUsers] = await Promise.all([
        crmDataService.fetchClients(currentOrgId),
        crmDataService.fetchOpportunities(currentOrgId),
        crmDataService.fetchActivities(currentOrgId),
        crmDataService.fetchFollowups(currentOrgId),
        crmDataService.fetchDocuments(currentOrgId),
        crmDataService.fetchProfiles(currentOrgId),
      ]);

      setClients(dbClients);
      setOpportunities(dbOpps);
      setActivities(dbActs);
      setFollowups(dbFoll);
      setDocuments(dbDocs);
      if (dbUsers.length > 0) setUsers(dbUsers);
    } catch (err) {
      console.warn('Failed to refresh data from Supabase:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    if (profile?.organization_id) {
      refreshCRMData();
    }
  }, [profile?.organization_id, refreshCRMData]);

  // Realtime collaborative pipeline subscription
  useEffect(() => {
    if (!profile?.organization_id || !authUser?.id) return;

    const unsubscribe = subscribeToCRMRealtime(profile.organization_id, authUser.id, {
      onOpportunityChange: ({ eventType, opportunity, id }) => {
        if (eventType === 'INSERT' && opportunity) {
          setOpportunities((prev) => (prev.some((o) => o.id === opportunity.id) ? prev : [opportunity, ...prev]));
        } else if (eventType === 'UPDATE' && opportunity) {
          setOpportunities((prev) => prev.map((o) => (o.id === opportunity.id ? opportunity : o)));
        } else if (eventType === 'DELETE') {
          setOpportunities((prev) => prev.filter((o) => o.id !== id));
        }
      },
      onActivityChange: ({ eventType, activity, id }) => {
        if (eventType === 'INSERT' && activity) {
          setActivities((prev) => (prev.some((a) => a.id === activity.id) ? prev : [activity, ...prev]));
        } else if (eventType === 'UPDATE' && activity) {
          setActivities((prev) => prev.map((a) => (a.id === activity.id ? activity : a)));
        } else if (eventType === 'DELETE') {
          setActivities((prev) => prev.filter((a) => a.id !== id));
        }
      },
      onFollowupChange: ({ eventType, followup, id }) => {
        if (eventType === 'INSERT' && followup) {
          setFollowups((prev) => (prev.some((f) => f.id === followup.id) ? prev : [followup, ...prev]));
        } else if (eventType === 'UPDATE' && followup) {
          setFollowups((prev) => prev.map((f) => (f.id === followup.id ? followup : f)));
        } else if (eventType === 'DELETE') {
          setFollowups((prev) => prev.filter((f) => f.id !== id));
        }
      },
      onDocumentChange: ({ eventType, document, id }) => {
        if (eventType === 'INSERT' && document) {
          setDocuments((prev) => (prev.some((d) => d.id === document.id) ? prev : [document, ...prev]));
        } else if (eventType === 'UPDATE' && document) {
          setDocuments((prev) => prev.map((d) => (d.id === document.id ? document : d)));
        } else if (eventType === 'DELETE') {
          setDocuments((prev) => prev.filter((d) => d.id !== id));
        }
      },
      onProfileChange: ({ status }) => {
        if (status === 'inactive' || status === 'suspended') {
          setCurrentUser((prev) => ({ ...prev, status: 'Inactive' }));
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.organization_id, authUser?.id]);

  // Local Storage synchronization
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_currency`, JSON.stringify(currency));
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_currentUser`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_opportunities`, JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_followups`, JSON.stringify(followups));
  }, [followups]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_internalTasks`, JSON.stringify(internalTasks));
  }, [internalTasks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_documents`, JSON.stringify(documents));
  }, [documents]);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'INR' ? 'USD' : 'INR'));
  };

  const openModal = (type: string, data?: any) => {
    setActiveModal({ type, data });
  };

  const closeModal = () => {
    setActiveModal({ type: null });
  };

  // ─── CRUD Methods with Supabase Sync & Optimistic Updates ────────────────────

  const addClient = async (newClient: Omit<Client, 'id' | 'code' | 'createdDate'>) => {
    const nextNum = clients.length + 1001;
    const tempId = `CLT-${nextNum}`;
    const optimisticClient: Client = {
      ...newClient,
      id: tempId,
      code: `CLT-${nextNum}`,
      createdDate: new Date().toISOString().slice(0, 10),
    };

    setClients((prev) => [optimisticClient, ...prev]);

    try {
      const created = await crmDataService.insertClient(newClient, currentOrgId, authUser?.id);
      if (created && created.id !== tempId) {
        setClients((prev) => prev.map((c) => (c.id === tempId ? created : c)));
      }
    } catch (err) {
      console.warn('Could not sync insertClient to Supabase:', err);
    }
  };

  const importClients = (importedList: Client[], replaceExisting: boolean = false) => {
    if (replaceExisting) {
      setClients(importedList);
    } else {
      setClients((prev) => {
        const existingCodes = new Set(prev.map((c) => c.code || c.id));
        const newOnes = importedList.filter((c) => !existingCodes.has(c.code || c.id));
        const updatedList = prev.map((existing) => {
          const match = importedList.find((c) => (c.code || c.id) === (existing.code || existing.id));
          return match ? { ...existing, ...match } : existing;
        });
        return [...newOnes, ...updatedList];
      });
    }
  };

  const updateClient = async (id: string, updated: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    try {
      await crmDataService.updateClient(id, updated, currentOrgId);
    } catch (err) {
      console.warn('Could not sync updateClient to Supabase:', err);
    }
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    try {
      await crmDataService.deleteClient(id, currentOrgId);
    } catch (err) {
      console.warn('Could not sync deleteClient to Supabase:', err);
    }
  };

  const addOpportunity = async (newOpp: Omit<Opportunity, 'id' | 'code' | 'createdDate' | 'lastActivityDate'>) => {
    const nextNum = String(opportunities.length + 1).padStart(3, '0');
    const tempId = `OPP-2026-${nextNum}`;
    const optimisticOpp: Opportunity = {
      ...newOpp,
      id: tempId,
      code: `OPP-${nextNum}`,
      createdDate: new Date().toISOString().slice(0, 10),
      lastActivityDate: new Date().toISOString().slice(0, 10),
    };

    setOpportunities((prev) => [optimisticOpp, ...prev]);

    try {
      const created = await crmDataService.insertOpportunity(newOpp, currentOrgId, authUser?.id);
      if (created && created.id !== tempId) {
        setOpportunities((prev) => prev.map((o) => (o.id === tempId ? created : o)));
      }
    } catch (err) {
      console.warn('Could not sync insertOpportunity to Supabase:', err);
    }
  };

  const updateOpportunity = async (id: string, updated: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updated, lastActivityDate: new Date().toISOString().slice(0, 10) } : o))
    );
    try {
      await crmDataService.updateOpportunity(id, updated, currentOrgId);
    } catch (err) {
      console.warn('Could not sync updateOpportunity to Supabase:', err);
    }
  };

  const updateOpportunityStage = (id: string, stage: string, probability?: number) => {
    let prob = probability;
    let status: any = 'In Process';
    if (stage === 'Won' || stage === 'Closed Won') {
      prob = 100;
      status = 'Won';
    } else if (stage === 'Lost' || stage === 'Closed Lost') {
      prob = 0;
      status = 'Lost';
    } else if (stage === 'On Hold') {
      status = 'On Hold';
    }

    updateOpportunity(id, {
      stage,
      probability: prob,
      status,
    });
  };

  const updateOpportunityDelegation = (
    id: string,
    delegation: Partial<Pick<Opportunity, 'delegatedDepartment' | 'delegatedOwner' | 'delegationStatus' | 'delegationMilestone' | 'slaDaysRemaining' | 'delegationRemarks'>>
  ) => {
    updateOpportunity(id, delegation);
  };

  const deleteOpportunity = async (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    try {
      await crmDataService.deleteOpportunity(id, currentOrgId);
    } catch (err) {
      console.warn('Could not sync deleteOpportunity to Supabase:', err);
    }
  };

  const addActivity = async (newAct: Omit<Activity, 'id'>) => {
    const tempId = `ACT-${Date.now().toString().slice(-4)}`;
    const optimisticAct: Activity = {
      ...newAct,
      id: tempId,
    };
    setActivities((prev) => [optimisticAct, ...prev]);

    if (newAct.opportunityId) {
      updateOpportunity(newAct.opportunityId, {
        lastActivityDate: newAct.date,
        nextFollowupDate: newAct.nextFollowupDate || undefined,
      });
    }

    if (newAct.nextFollowupDate) {
      addFollowup({
        clientId: newAct.clientId,
        clientName: newAct.clientName,
        clientType: newAct.clientType,
        opportunityId: newAct.opportunityId,
        opportunityTitle: newAct.opportunityTitle,
        dueDate: newAct.nextFollowupDate,
        assignedTo: newAct.conductedBy,
        type: newAct.type,
        priority: 'Medium',
        description: newAct.actionItems || `Follow up with ${newAct.contactPerson}`,
        status: 'Pending',
      });
    }

    try {
      const created = await crmDataService.insertActivity(newAct, currentOrgId, authUser?.id);
      if (created && created.id !== tempId) {
        setActivities((prev) => prev.map((a) => (a.id === tempId ? created : a)));
      }
    } catch (err) {
      console.warn('Could not sync insertActivity to Supabase:', err);
    }
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const addFollowup = async (newFol: Omit<Followup, 'id'>) => {
    const tempId = `FOL-${Date.now().toString().slice(-4)}`;
    const optimisticFol: Followup = {
      ...newFol,
      id: tempId,
    };
    setFollowups((prev) => [optimisticFol, ...prev]);

    try {
      const created = await crmDataService.insertFollowup(newFol, currentOrgId, authUser?.id);
      if (created && created.id !== tempId) {
        setFollowups((prev) => prev.map((f) => (f.id === tempId ? created : f)));
      }
    } catch (err) {
      console.warn('Could not sync insertFollowup to Supabase:', err);
    }
  };

  const completeFollowup = async (id: string, remarks?: string) => {
    const completedDate = new Date().toISOString().slice(0, 10);
    setFollowups((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'Completed', completedDate, remarks: remarks || f.remarks } : f))
    );
    try {
      await crmDataService.updateFollowup(id, { status: 'Completed', completedDate, remarks }, currentOrgId);
    } catch (err) {
      console.warn('Could not sync completeFollowup to Supabase:', err);
    }
  };

  const deleteFollowup = (id: string) => {
    setFollowups((prev) => prev.filter((f) => f.id !== id));
  };

  const addInternalTask = (newTask: Omit<InternalTask, 'id'>) => {
    const task: InternalTask = {
      ...newTask,
      id: `INT-${Date.now().toString().slice(-4)}`,
    };
    setInternalTasks((prev) => [task, ...prev]);
  };

  const updateTaskStatus = (id: string, status: InternalTask['status'], responseNotes?: string) => {
    setInternalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, responseNotes: responseNotes || t.responseNotes, actionDate: new Date().toISOString().slice(0, 10) } : t))
    );
  };

  const deleteInternalTask = (id: string) => {
    setInternalTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addDocument = (newDoc: Omit<CRMDocument, 'id' | 'uploadedDate'>) => {
    const doc: CRMDocument = {
      ...newDoc,
      id: `DOC-${Date.now().toString().slice(-4)}`,
      uploadedDate: new Date().toISOString().slice(0, 10),
    };
    setDocuments((prev) => [doc, ...prev]);
  };

  const updateDocument = (id: string, updated: Partial<CRMDocument>) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const addTeamMember = (newMember: Omit<TeamMember, 'id'>) => {
    const member: TeamMember = {
      ...newMember,
      id: `BD-${String(teamMembers.length + 1).padStart(2, '0')}`,
      avatarBg: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'][teamMembers.length % 6],
    };
    setTeamMembers((prev) => [...prev, member]);
  };

  const updateTeamMember = (id: string, updated: Partial<TeamMember>) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const addSegment = (newSeg: Omit<BusinessSegment, 'id'>) => {
    const seg: BusinessSegment = {
      ...newSeg,
      id: `SEG-${String(segments.length + 1).padStart(2, '0')}`,
    };
    setSegments((prev) => [...prev, seg]);
  };

  const updateSegment = (id: string, updated: Partial<BusinessSegment>) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteSegment = (id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    const user: User = {
      ...newUser,
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
    };
    setUsers((prev) => [...prev, user]);
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updated }));
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const resetToFactoryData = () => {
    if (window.confirm('Are you sure you want to reset all CRM data to initial sample records?')) {
      setClients(INITIAL_CLIENTS);
      setOpportunities(INITIAL_OPPORTUNITIES);
      setActivities(INITIAL_ACTIVITIES);
      setFollowups(INITIAL_FOLLOWUPS);
      setInternalTasks(INITIAL_INTERNAL_TASKS);
      setDocuments(INITIAL_DOCUMENTS);
      setTeamMembers(INITIAL_TEAM_MEMBERS);
      setSegments(INITIAL_SEGMENTS);
      setUsers(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]);
      localStorage.clear();
      alert('Data successfully restored to factory defaults!');
    }
  };

  const exportOpportunities = () => {
    logExportEvent('DATA_EXPORT_CSV', 'opportunities', opportunities.length, {
      id: profile?.id,
      name: profile?.full_name || currentUser.name,
      organizationId: profile?.organization_id,
    });
    exportOpportunitiesToCSV(opportunities);
  };

  const exportClients = () => {
    logExportEvent('DATA_EXPORT_CSV', 'clients', clients.length, {
      id: profile?.id,
      name: profile?.full_name || currentUser.name,
      organizationId: profile?.organization_id,
    });
    exportClientsToCSV(clients);
  };

  const exportBackup = () => {
    logExportEvent('DATA_EXPORT_JSON', 'full_crm_backup', clients.length + opportunities.length, {
      id: profile?.id,
      name: profile?.full_name || currentUser.name,
      organizationId: profile?.organization_id,
    });
    exportFullJSONBackup({
      clients,
      opportunities,
      activities,
      followups,
      internalTasks,
      teamMembers,
      segments,
      users,
    });
  };

  return (
    <CRMContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        currency,
        toggleCurrency,
        currentUser,
        setCurrentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        filters,
        setFilters,
        searchQuery,
        setSearchQuery,
        clients,
        addClient,
        importClients,
        updateClient,
        deleteClient,
        opportunities,
        addOpportunity,
        updateOpportunity,
        updateOpportunityStage,
        updateOpportunityDelegation,
        deleteOpportunity,
        activities,
        addActivity,
        deleteActivity,
        followups,
        addFollowup,
        completeFollowup,
        deleteFollowup,
        internalTasks,
        addInternalTask,
        updateTaskStatus,
        deleteInternalTask,
        documents,
        addDocument,
        updateDocument,
        deleteDocument,
        teamMembers,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        segments,
        addSegment,
        updateSegment,
        deleteSegment,
        activeModal,
        openModal,
        closeModal,
        isLoadingData,
        refreshCRMData,
        resetToFactoryData,
        exportOpportunities,
        exportClients,
        exportBackup,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
