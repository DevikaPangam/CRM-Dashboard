import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { AddClientModal } from './AddClientModal';
import { AddOpportunityModal } from './AddOpportunityModal';
import { AddActivityModal } from './AddActivityModal';
import { AddInternalModal } from './AddInternalModal';
import { AddTeamModal } from './AddTeamModal';
import { AddSegmentModal } from './AddSegmentModal';
import { EditSegmentModal } from './EditSegmentModal';
import { AddUserModal } from './AddUserModal';
import { EditUserModal } from './EditUserModal';
import { UploadDocModal } from './UploadDocModal';
import { EditDocModal } from './EditDocModal';
import { DelegationMatrixModal } from './DelegationMatrixModal';
import { EditTeamModal } from './EditTeamModal';
import { ApprovalModal } from './ApprovalModal';
import { DealInceptionModal } from './DealInceptionModal';
import { ImportClientsModal } from './ImportClientsModal';

export const GlobalModals: React.FC = () => {
  const { activeModal } = useCRM();

  if (!activeModal.type) return null;

  switch (activeModal.type) {
    case 'addClient':
      return <AddClientModal />;
    case 'importClients':
      return <ImportClientsModal />;
    case 'addOpportunity':
      return <AddOpportunityModal />;
    case 'addActivity':
      return <AddActivityModal />;
    case 'addInternal':
      return <AddInternalModal />;
    case 'addTeam':
      return <AddTeamModal />;
    case 'editTeam':
      return <EditTeamModal />;
    case 'addSegment':
      return <AddSegmentModal />;
    case 'editSegment':
      return <EditSegmentModal />;
    case 'addUser':
      return <AddUserModal />;
    case 'editUser':
      return <EditUserModal />;
    case 'uploadDoc':
      return <UploadDocModal />;
    case 'editDoc':
      return <EditDocModal />;
    case 'delegationMatrix':
      return <DelegationMatrixModal />;
    case 'approvalModal':
      return <ApprovalModal />;
    case 'dealInception':
      return <DealInceptionModal />;
    default:
      return null;
  }
};
