import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Client, Opportunity, Activity, Followup, InternalTask, TeamMember, BusinessSegment, User, CurrencyMode, FilterState, CRMDocument
} from '../types/crm';
import {
  INITIAL_CLIENTS, INITIAL_OPPORTUNITIES, INITIAL_ACTIVITIES, INITIAL_FOLLOWUPS,
  INITIAL_INTERNAL_TASKS, INITIAL_TEAM_MEMBERS, INITIAL_SEGMENTS, INITIAL_USERS, INITIAL_DOCUMENTS
} from '../utils/seedData';
import { exportOpportunitiesToCSV, exportClientsToCSV, exportFullJSONBackup } from '../utils/exportUtils';

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

  // Utilities & Reset
  resetToFactoryData: () => void;
  exportOpportunities: () => void;
  exportClients: () => void;
  exportBackup: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEY = 'CORPBD_CRM_REACT_V2';

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Persistence to localStorage
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

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_teamMembers`, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_segments`, JSON.stringify(segments));
  }, [segments]);

  const toggleCurrency = () => {
    setCurrency(prev => (prev === 'INR' ? 'USD' : 'INR'));
  };

  const openModal = (type: string, data?: any) => {
    setActiveModal({ type, data });
  };

  const closeModal = () => {
    setActiveModal({ type: null });
  };

  // ─── CRUD Methods ────────────────────────────────────────────────────────────

  const addClient = (newClient: Omit<Client, 'id' | 'code' | 'createdDate'>) => {
    const nextNum = clients.length + 1001;
    const client: Client = {
      ...newClient,
      id: `CLT-${nextNum}`,
      code: `CLT-${nextNum}`,
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setClients(prev => [client, ...prev]);
  };

  const importClients = (importedList: Client[], replaceExisting: boolean = false) => {
    if (replaceExisting) {
      setClients(importedList);
    } else {
      setClients(prev => {
        // Merge or append: if code exists update, otherwise append
        const existingCodes = new Set(prev.map(c => c.code || c.id));
        const newOnes = importedList.filter(c => !existingCodes.has(c.code || c.id));
        const updatedList = prev.map(existing => {
          const match = importedList.find(c => (c.code || c.id) === (existing.code || existing.id));
          return match ? { ...existing, ...match } : existing;
        });
        return [...newOnes, ...updatedList];
      });
    }
  };

  const updateClient = (id: string, updated: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addOpportunity = (newOpp: Omit<Opportunity, 'id' | 'code' | 'createdDate' | 'lastActivityDate'>) => {
    const nextNum = String(opportunities.length + 1).padStart(3, '0');
    const opp: Opportunity = {
      ...newOpp,
      id: `OPP-2026-${nextNum}`,
      code: `OPP-${nextNum}`,
      createdDate: new Date().toISOString().slice(0, 10),
      lastActivityDate: new Date().toISOString().slice(0, 10),
    };
    setOpportunities(prev => [opp, ...prev]);
  };

  const updateOpportunity = (id: string, updated: Partial<Opportunity>) => {
    setOpportunities(prev => prev.map(o => (o.id === id ? { ...o, ...updated, lastActivityDate: new Date().toISOString().slice(0, 10) } : o)));
  };

  const updateOpportunityStage = (id: string, stage: string, probability?: number) => {
    setOpportunities(prev => prev.map(o => {
      if (o.id === id) {
        let prob = probability !== undefined ? probability : o.probability;
        let status = o.status;
        if (stage === 'Won') {
          prob = 100;
          status = 'Won';
        } else if (stage === 'Lost') {
          prob = 0;
          status = 'Lost';
        } else if (stage === 'On Hold') {
          status = 'On Hold';
        } else {
          status = 'In Process';
        }
        return {
          ...o,
          stage,
          probability: prob,
          status,
          lastActivityDate: new Date().toISOString().slice(0, 10),
        };
      }
      return o;
    }));
  };

  const updateOpportunityDelegation = (
    id: string,
    delegation: Partial<Pick<Opportunity, 'delegatedDepartment' | 'delegatedOwner' | 'delegationStatus' | 'delegationMilestone' | 'slaDaysRemaining' | 'delegationRemarks'>>
  ) => {
    setOpportunities(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, ...delegation };

        // Also reflect delegation change by logging an internal workflow task
        if (delegation.delegatedDepartment && delegation.delegatedDepartment !== 'BD') {
          addInternalTask({
            department: delegation.delegatedDepartment as any,
            title: `[Delegation Matrix] ${delegation.delegationMilestone || 'Action Required'} for ${o.title}`,
            clientId: o.clientId,
            clientName: o.clientName,
            opportunityId: o.id,
            opportunityTitle: o.title,
            assignedTo: delegation.delegatedOwner || 'Department Lead',
            assignedBy: currentUser.name,
            dueDate: new Date(Date.now() + (delegation.slaDaysRemaining || 3) * 86400000).toISOString().slice(0, 10),
            priority: 'High',
            status: delegation.delegationStatus === 'Approved & Handed Off' || delegation.delegationStatus === 'Action Completed'
              ? 'Approved'
              : delegation.delegationStatus === 'Rejected'
              ? 'Rejected'
              : 'Pending',
            requestDetails: `Delegated action item milestone: ${delegation.delegationMilestone || 'Review & Action'}. Current Status: ${delegation.delegationStatus || 'Pending'}`,
            approvalRemarks: delegation.delegationRemarks,
          });
        }

        return updated;
      }
      return o;
    }));
  };

  const deleteOpportunity = (id: string) => {
    setOpportunities(prev => prev.filter(o => o.id !== id));
  };

  const addActivity = (newAct: Omit<Activity, 'id'>) => {
    const act: Activity = {
      ...newAct,
      id: `ACT-${Date.now().toString().slice(-4)}`,
    };
    setActivities(prev => [act, ...prev]);

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
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const addFollowup = (newFol: Omit<Followup, 'id'>) => {
    const fol: Followup = {
      ...newFol,
      id: `FOL-${Date.now().toString().slice(-4)}`,
    };
    setFollowups(prev => [fol, ...prev]);
  };

  const completeFollowup = (id: string, remarks?: string) => {
    setFollowups(prev => prev.map(f => (f.id === id ? {
      ...f,
      status: 'Completed',
      completedDate: new Date().toISOString().slice(0, 10),
      remarks: remarks || f.remarks,
    } : f)));
  };

  const deleteFollowup = (id: string) => {
    setFollowups(prev => prev.filter(f => f.id !== id));
  };

  const addInternalTask = (newTask: Omit<InternalTask, 'id'>) => {
    const task: InternalTask = {
      ...newTask,
      id: `INT-${Date.now().toString().slice(-4)}`,
    };
    setInternalTasks(prev => [task, ...prev]);
  };

  const updateTaskStatus = (id: string, status: InternalTask['status'], responseNotes?: string) => {
    setInternalTasks(prev => prev.map(t => (t.id === id ? {
      ...t,
      status,
      responseNotes: responseNotes || t.responseNotes,
      actionDate: new Date().toISOString().slice(0, 10),
    } : t)));
  };

  const deleteInternalTask = (id: string) => {
    setInternalTasks(prev => prev.filter(t => t.id !== id));
  };

  const addDocument = (newDoc: Omit<CRMDocument, 'id' | 'uploadedDate'>) => {
    const doc: CRMDocument = {
      ...newDoc,
      id: `DOC-${Date.now().toString().slice(-4)}`,
      uploadedDate: new Date().toISOString().slice(0, 10),
    };
    setDocuments(prev => [doc, ...prev]);
  };

  const updateDocument = (id: string, updated: Partial<CRMDocument>) => {
    setDocuments(prev => prev.map(d => (d.id === id ? { ...d, ...updated } : d)));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const addTeamMember = (newMember: Omit<TeamMember, 'id'>) => {
    const member: TeamMember = {
      ...newMember,
      id: `BD-${String(teamMembers.length + 1).padStart(2, '0')}`,
      avatarBg: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'][teamMembers.length % 6],
    };
    setTeamMembers(prev => [...prev, member]);
  };

  const updateTeamMember = (id: string, updated: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const addSegment = (newSeg: Omit<BusinessSegment, 'id'>) => {
    const seg: BusinessSegment = {
      ...newSeg,
      id: `SEG-${String(segments.length + 1).padStart(2, '0')}`,
    };
    setSegments(prev => [...prev, seg]);
  };

  const updateSegment = (id: string, updated: Partial<BusinessSegment>) => {
    setSegments(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteSegment = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    const user: User = {
      ...newUser,
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
    };
    setUsers(prev => [...prev, user]);
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updated }));
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const resetToFactoryData = () => {
    if (window.confirm('Are you sure you want to reset all CRM data to initial sample records? Any unsaved edits will be restored.')) {
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
    exportOpportunitiesToCSV(opportunities);
  };

  const exportClients = () => {
    exportClientsToCSV(clients);
  };

  const exportBackup = () => {
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
