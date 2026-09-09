/**
 * Realtime Service — Supabase Realtime Collaborative Pipeline
 * Manages postgres_changes subscriptions for opportunities, activities, follow-ups, documents, and profile changes.
 * Enforces organization_id scoping and safe cleanup.
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import {
  transformOpportunityFromDB,
  transformActivityFromDB,
  transformFollowupFromDB,
  transformDocumentFromDB,
} from './crmDataService';
import { Opportunity, Activity, Followup, CRMDocument } from '../types/crm';

export interface RealtimeHandlers {
  onOpportunityChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; opportunity?: Opportunity; id: string }) => void;
  onActivityChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; activity?: Activity; id: string }) => void;
  onFollowupChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; followup?: Followup; id: string }) => void;
  onDocumentChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; document?: CRMDocument; id: string }) => void;
  onProfileChange?: (payload: { status: string; role: string }) => void;
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

  // 1. Opportunities Channel
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

  // 2. Activities Channel
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

  // 3. Follow-ups Channel
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

  // 4. Documents Channel
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

  // 5. User Profile Status Changes (Self)
  if (userId) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      (payload: any) => {
        if (payload.new) {
          handlers.onProfileChange?.({
            status: payload.new.status,
            role: payload.new.role,
          });
        }
      }
    );
  }

  channel.subscribe((status) => {
    handlers.onStatusChange?.(status as any);
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
