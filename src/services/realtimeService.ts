/**
 * Realtime Service — Supabase Realtime Collaborative Pipeline
 * Manages postgres_changes subscriptions for profiles, clients, opportunities,
 * activities, follow-ups, internal_tasks, segments, and documents.
 * Enforces organization_id scoping, safe reconnects, and cleanup.
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import {
  transformClientFromDB,
  transformOpportunityFromDB,
  transformActivityFromDB,
  transformFollowupFromDB,
  transformInternalTaskFromDB,
  transformSegmentFromDB,
  transformDocumentFromDB,
  transformProfileFromDB,
} from './crmDataService';
import {
  Client,
  Opportunity,
  Activity,
  Followup,
  InternalTask,
  BusinessSegment,
  CRMDocument,
  User,
} from '../types/crm';

export interface RealtimeHandlers {
  onClientChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; client?: Client; id: string }) => void;
  onOpportunityChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; opportunity?: Opportunity; id: string }) => void;
  onActivityChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; activity?: Activity; id: string }) => void;
  onFollowupChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; followup?: Followup; id: string }) => void;
  onInternalTaskChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; task?: InternalTask; id: string }) => void;
  onSegmentChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; segment?: BusinessSegment; id: string }) => void;
  onDocumentChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; document?: CRMDocument; id: string }) => void;
  onProfileChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; profile?: User; id: string; status?: string; role?: string }) => void;
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

/**
 * Subscribes to realtime changes for the authenticated organization & user.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToCRMRealtime(
  organizationId: string,
  userId: string,
  handlers: RealtimeHandlers
): () => void {
  if (!isSupabaseConfigured() || !organizationId) {
    return () => {};
  }

  const channelName = `crm_realtime_${organizationId.slice(0, 8)}_${Date.now()}`;
  const channel: RealtimeChannel = supabase.channel(channelName);

  // 1. Clients Channel
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'clients',
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const id = payload.new?.id || payload.old?.id || '';
      const client = payload.new ? transformClientFromDB(payload.new) : undefined;
      handlers.onClientChange?.({ eventType, client, id });
    }
  );

  // 2. Opportunities Channel
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'opportunities',
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const id = payload.new?.id || payload.old?.id || '';
      const opportunity = payload.new ? transformOpportunityFromDB(payload.new) : undefined;
      handlers.onOpportunityChange?.({ eventType, opportunity, id });
    }
  );

  // 3. Activities Channel
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'activities',
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const id = payload.new?.id || payload.old?.id || '';
      const activity = payload.new ? transformActivityFromDB(payload.new) : undefined;
      handlers.onActivityChange?.({ eventType, activity, id });
    }
  );

  // 4. Follow-ups Channel
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'followups',
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const id = payload.new?.id || payload.old?.id || '';
      const followup = payload.new ? transformFollowupFromDB(payload.new) : undefined;
      handlers.onFollowupChange?.({ eventType, followup, id });
    }
  );

  // 5. Internal Tasks Channel
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'internal_tasks',
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const id = payload.new?.id || payload.old?.id || '';
      const task = payload.new ? transformInternalTaskFromDB(payload.new) : undefined;
      handlers.onInternalTaskChange?.({ eventType, task, id });
    }
  );

  // 6. Segments Channel
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'segments',
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const id = payload.new?.id || payload.old?.id || payload.new?.segment_code || '';
      const segment = payload.new ? transformSegmentFromDB(payload.new) : undefined;
      handlers.onSegmentChange?.({ eventType, segment, id });
    }
  );

  // 7. Documents Channel
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'documents',
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const id = payload.new?.id || payload.old?.id || '';
      const document = payload.new ? transformDocumentFromDB(payload.new) : undefined;
      handlers.onDocumentChange?.({ eventType, document, id });
    }
  );

  // 8. Profiles Channel (Organization Roster & Role / Status Sync)
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'profiles',
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const id = payload.new?.id || payload.old?.id || '';
      const profile = payload.new ? transformProfileFromDB(payload.new) : undefined;

      handlers.onProfileChange?.({
        eventType,
        profile,
        id,
        status: payload.new?.status,
        role: payload.new?.role,
      });
    }
  );

  channel.subscribe((status) => {
    handlers.onStatusChange?.(status as any);
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
