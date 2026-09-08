import { CurrencyMode } from '../types/crm';

export const USD_EXCHANGE_RATE = 84.0; // 1 USD = 84 INR

/**
 * Format currency amount based on selected mode (INR / USD)
 */
export function formatCurrency(amountINR: number | undefined | null, mode: CurrencyMode = 'INR', compact: boolean = true): string {
  if (amountINR === undefined || amountINR === null || isNaN(amountINR)) return mode === 'INR' ? '₹0' : '$0';

  if (mode === 'USD') {
    const valUSD = amountINR / USD_EXCHANGE_RATE;
    if (compact) {
      if (Math.abs(valUSD) >= 1_000_000) {
        return `$${(valUSD / 1_000_000).toFixed(2)}M`;
      } else if (Math.abs(valUSD) >= 1_000) {
        return `$${(valUSD / 1_000).toFixed(1)}K`;
      }
      return `$${Math.round(valUSD).toLocaleString()}`;
    }
    return `$${Math.round(valUSD).toLocaleString()}`;
  }

  // INR Mode
  if (compact) {
    if (Math.abs(amountINR) >= 10_000_000) { // 1 Crore = 100 Lakhs = 10,000,000
      return `₹${(amountINR / 10_000_000).toFixed(2)} Cr`;
    } else if (Math.abs(amountINR) >= 100_000) { // 1 Lakh = 100,000
      return `₹${(amountINR / 100_000).toFixed(1)} L`;
    } else if (Math.abs(amountINR) >= 1_000) {
      return `₹${(amountINR / 1_000).toFixed(0)}K`;
    }
    return `₹${Math.round(amountINR).toLocaleString('en-IN')}`;
  }

  return `₹${Math.round(amountINR).toLocaleString('en-IN')}`;
}

/**
 * Format date string to display format (e.g. 15 Sep 2026)
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Stage badge color mappings
 */
export function getStageBadgeClass(stage: string): { bg: string; text: string; border: string } {
  const s = stage?.toLowerCase() || '';
  if (s.includes('won')) return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
  if (s.includes('lost')) return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
  if (s.includes('hold')) return { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' };
  if (s.includes('negotiation') || s.includes('commercial')) return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
  if (s.includes('proposal')) return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
  if (s.includes('review')) return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
  if (s.includes('meeting') || s.includes('discussion')) return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
  return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
}

/**
 * Priority badge color mappings
 */
export function getPriorityBadgeClass(priority: string): { bg: string; text: string } {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return { bg: '#fef2f2', text: '#dc2626' };
    case 'high':
      return { bg: '#fff1f2', text: '#e11d48' };
    case 'medium':
      return { bg: '#fefce8', text: '#ca8a04' };
    case 'low':
      return { bg: '#f0fdf4', text: '#16a34a' };
    default:
      return { bg: '#f1f5f9', text: '#64748b' };
  }
}

/**
 * Delegation status badge color mappings
 */
export function getDelegationStatusBadge(status?: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'Approved & Handed Off':
    case 'Action Completed':
      return { bg: '#dcfce7', text: '#16a34a', border: '#a7f3d0' };
    case 'In Review':
      return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    case 'Escalated':
      return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
    case 'Rejected':
      return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
    default:
      return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
  }
}
