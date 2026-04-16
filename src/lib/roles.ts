/**
 * Role helpers.
 *
 * The `trainee` role is a self-sufficient, coach-equivalent role — trainees
 * should appear and behave like coaches in admin UIs (dropdowns, stats,
 * delegation pickers, impersonation, etc.). Only the AI suggestions path
 * is explicitly suppressed for trainees during live meetings.
 *
 * Use `isCoachRole()` for any admin-side filter that asks "is this user a
 * coach?" so we don't drift back to raw `roles.includes('coach')` checks.
 */
export const isCoachRole = (roles: string[] | undefined | null): boolean => {
  if (!roles) return false
  return roles.includes('coach') || roles.includes('trainee')
}
