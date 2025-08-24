export function calculateSessionStats(sessions: any[]) {
  const totalSessions = sessions.length
  
  const completedSessions = sessions.filter(
    s => s.status === 'completed',
  ).length
  
  const inProgressSessions = sessions.filter(
    s => s.status === 'in_progress' || s.status === 'recording',
  ).length
  
  const avgScore = (() => {
    const sessionsWithScores = sessions.filter(
      s => s.meeting_summaries?.final_overall_score,
    )
    if (sessionsWithScores.length === 0) return 0
    const total = sessionsWithScores.reduce(
      (acc, s) => acc + (s.meeting_summaries?.final_overall_score || 0),
      0,
    )
    return Math.round((total / sessionsWithScores.length) * 10) / 10
  })()

  return {
    totalSessions,
    completedSessions,
    inProgressSessions,
    avgScore,
  }
}