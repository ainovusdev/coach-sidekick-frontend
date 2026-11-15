export function calculateSessionStats(sessions: any[]) {
  const totalSessions = sessions.length

  const completedSessions = sessions.filter(
    s => s.status === 'completed',
  ).length

  const inProgressSessions = sessions.filter(
    s => s.status === 'in_progress' || s.status === 'recording',
  ).length

  return {
    totalSessions,
    completedSessions,
    inProgressSessions,
  }
}
