/**
 * KPI Calculation Engine
 * Implements mathematical models and business rules for evaluating employee performance
 * across all departments (BD, Operations, Centralised Operations, Maintenance, Finance, Legal).
 *
 * Handles 8 distinct KPI behavior types:
 * - higher_is_better
 * - lower_is_better
 * - target_range
 * - percentage
 * - numeric
 * - currency
 * - count
 * - boolean_completion
 */

export type KPIType =
  | 'higher_is_better'
  | 'lower_is_better'
  | 'target_range'
  | 'percentage'
  | 'numeric'
  | 'currency'
  | 'count'
  | 'boolean_completion';

export type KPIStatus = 'Exceeded' | 'On Track' | 'Needs Improvement' | 'At Risk';

export interface KPICalculationInput {
  kpiType: KPIType;
  targetValue: number;
  actualValue: number;
  weightagePct: number;
  targetRangeMin?: number;
  targetRangeMax?: number;
  unit?: string;
}

export interface KPICalculationResult {
  achievementPct: number;
  score: number;
  status: KPIStatus;
  statusColor: string;
  statusBg: string;
  statusBorder: string;
  explanation: string;
}

/**
 * Calculates achievement percentage, weighted score, and status for a given KPI.
 */
export function calculateKPIAchievement(input: KPICalculationInput): KPICalculationResult {
  const { kpiType, targetValue, actualValue, weightagePct, targetRangeMin, targetRangeMax, unit = '' } = input;

  let achievementPct = 0;
  let explanation = '';

  switch (kpiType) {
    case 'lower_is_better': {
      // For metrics where lower values indicate superior performance (e.g. Turnaround Days, Breakdowns, Cost Overrun)
      if (targetValue <= 0) {
        achievementPct = actualValue === 0 ? 100 : 0;
      } else if (actualValue <= 0) {
        achievementPct = 150; // Flawless zero-incident performance
        explanation = `Zero incidents recorded (Target: ${targetValue} ${unit})`;
      } else if (actualValue <= targetValue) {
        // Outperformed target (e.g. Target 5 days, Actual 3 days)
        const savingsRatio = (targetValue - actualValue) / targetValue;
        achievementPct = Math.min(150, Math.round(100 + savingsRatio * 50));
        explanation = `Outperformed target by ${(savingsRatio * 100).toFixed(0)}% lower ${unit}`;
      } else {
        // Exceeded target (e.g. Target 5 days, Actual 10 days -> 50%)
        achievementPct = Math.max(0, Math.round((targetValue / actualValue) * 100));
        explanation = `Exceeded target threshold by ${(actualValue - targetValue).toFixed(1)} ${unit}`;
      }
      break;
    }

    case 'target_range': {
      const min = targetRangeMin ?? targetValue * 0.9;
      const max = targetRangeMax ?? targetValue * 1.1;

      if (actualValue >= min && actualValue <= max) {
        achievementPct = 100;
        explanation = `Value is optimal within target range (${min} - ${max} ${unit})`;
      } else if (actualValue < min) {
        achievementPct = min > 0 ? Math.max(0, Math.round((actualValue / min) * 100)) : 0;
        explanation = `Below target range threshold (${min} ${unit})`;
      } else {
        const excess = actualValue - max;
        achievementPct = max > 0 ? Math.max(0, Math.round(100 - (excess / max) * 50)) : 50;
        explanation = `Above optimal target range upper bound (${max} ${unit})`;
      }
      break;
    }

    case 'boolean_completion': {
      // 100% or 0% completion (e.g., ISO Audit Cleared, GST Zero Penalty)
      const threshold = targetValue > 0 ? targetValue : 1;
      achievementPct = actualValue >= threshold ? 100 : 0;
      explanation = actualValue >= threshold ? 'Mandatory milestone achieved' : 'Milestone pending completion';
      break;
    }

    case 'higher_is_better':
    case 'percentage':
    case 'numeric':
    case 'currency':
    case 'count':
    default: {
      // Standard Higher is Better ratio
      if (targetValue <= 0) {
        achievementPct = actualValue > 0 ? 100 : 0;
      } else {
        achievementPct = Math.min(150, Math.round((actualValue / targetValue) * 100));
      }
      explanation = `${actualValue} achieved vs ${targetValue} target ${unit}`;
      break;
    }
  }

  // Calculate weighted score: (achievementPct * weightagePct) / 100
  const score = Number(((achievementPct * weightagePct) / 100).toFixed(2));

  // Determine Status
  let status: KPIStatus = 'On Track';
  let statusColor = '#0369a1';
  let statusBg = '#e0f2fe';
  let statusBorder = '#bae6fd';

  if (achievementPct >= 95) {
    status = 'Exceeded';
    statusColor = '#166534';
    statusBg = '#dcfce7';
    statusBorder = '#bbf7d0';
  } else if (achievementPct >= 75) {
    status = 'On Track';
    statusColor = '#0369a1';
    statusBg = '#e0f2fe';
    statusBorder = '#bae6fd';
  } else if (achievementPct >= 50) {
    status = 'Needs Improvement';
    statusColor = '#b45309';
    statusBg = '#fef3c7';
    statusBorder = '#fde68a';
  } else {
    status = 'At Risk';
    statusColor = '#991b1b';
    statusBg = '#fee2e2';
    statusBorder = '#fecaca';
  }

  return {
    achievementPct,
    score,
    status,
    statusColor,
    statusBg,
    statusBorder,
    explanation,
  };
}

/**
 * Formats a KPI target or actual value for clean UI display with appropriate units.
 */
export function formatKPIValue(value: number, unit: string, type: KPIType): string {
  if (type === 'boolean_completion') {
    return value >= 1 ? 'Completed (Yes)' : 'Pending (No)';
  }
  if (unit === 'INR' || unit === '₹') {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (unit === '%') {
    return `${value}%`;
  }
  if (unit === 'Days' || unit === 'days') {
    return `${value} Days`;
  }
  if (unit === 'Hours' || unit === 'hrs') {
    return `${value} hrs`;
  }
  if (unit === 'Minutes' || unit === 'mins') {
    return `${value} mins`;
  }
  return `${value} ${unit}`.trim();
}
