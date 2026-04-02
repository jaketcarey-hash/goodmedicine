/**
 * Central registry of all localStorage keys.
 * Import from here instead of hardcoding strings.
 *
 * IMPORTANT: Changing a value here will orphan existing user data
 * under the old key. Only change values during a migration.
 */

export const STORAGE_KEYS = {
  WELLNESS_CHECKINS: 'gm_checkins',
  LEARNING_PROGRESS: 'gm_learning',
  SAVINGS_GOALS: 'gm_savings',
  BUDGET_DATA: 'gm_budgets',
  CALENDAR_PROFILE: 'gm_calendar_profile',
  DEBT_PLAN: 'gm_debt_plan',
  NETWORTH_SNAPSHOTS: 'gm_networth_snapshots',
  NETWORTH_WORKING: 'gm_networth_working',
  SECTION87_RESULT: 'gm_section87_result',
  BENEFITS_RESULTS: 'gm-benefits-results',
  DISTRIBUTION_PLAN: 'gm-distribution-plan',
  WELCOME_COMPLETE: 'gm_welcome_complete',
  WELCOME_INTERESTS: 'gm_welcome_interests',
  LAST_VISITED: 'gm_last_visited',
} as const;
