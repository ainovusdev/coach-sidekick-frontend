'use client'

import React, { useRef, useCallback } from 'react'
import { formatDate } from '@/lib/date-utils'
import type {
  SessionInsights,
  CoachingAnalysis,
} from '@/services/analysis-service'

interface AnalysisPrintViewProps {
  insights?: SessionInsights
  coaching?: CoachingAnalysis
  sessionTitle?: string
  clientName?: string
  coachName?: string
  sessionDate?: string
}

type ScoreLevel = 'sophisticated' | 'effective' | 'developing' | 'ineffective'

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 9) return 'sophisticated'
  if (score >= 7) return 'effective'
  if (score >= 4) return 'developing'
  return 'ineffective'
}

function getScoreLevelLabel(level: ScoreLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function getLevelColor(level: ScoreLevel): string {
  switch (level) {
    case 'sophisticated':
      return '#059669'
    case 'effective':
      return '#2563eb'
    case 'developing':
      return '#d97706'
    case 'ineffective':
      return '#dc2626'
  }
}

function getLevelBg(level: ScoreLevel): string {
  switch (level) {
    case 'sophisticated':
      return '#ecfdf5'
    case 'effective':
      return '#eff6ff'
    case 'developing':
      return '#fffbeb'
    case 'ineffective':
      return '#fef2f2'
  }
}

const coachingMetrics = [
  {
    key: 'maximum_value',
    label: 'Maximum Value',
    description: 'Is max value established and does it drive the session?',
    levels: {
      ineffective: 'Max value is never established in the call.',
      developing: 'Max value is vaguely explored with little direction.',
      effective:
        'Max value is established with high participation; some drift may occur.',
      sophisticated:
        'Max value drives full participation from both coach and client. Client reports creating max value.',
    },
  },
  {
    key: 'intuitive_fence',
    label: 'Intuitive Fence',
    description:
      "Does the coach explore whether the client's vision is inside or outside their comfort zone?",
    levels: {
      ineffective: "Coach does not inquire about the client's Intuitive Fence.",
      developing:
        'Coach helps identify the gap and explore new occurrences to close it.',
      effective:
        "Coach's questions help the client discover what they are capable of.",
      sophisticated:
        'Questions create an encounter with new ways of being related to accomplishing max value.',
    },
  },
  {
    key: 'integrity',
    label: 'Integrity',
    description:
      'Are commitments specific, time-bound, and designed to grow — not just to keep?',
    levels: {
      ineffective:
        'Little to no clear commitment. Actionable insights are missed.',
      developing:
        'Commitments are mostly to keep; little coaching is done around them.',
      effective:
        'Specific, time-bound commitments toward achieving maximum value.',
      sophisticated:
        'Commitments designed not only to keep but to grow. Coach tests commitments before client gives their word.',
    },
  },
  {
    key: 'inquiry_vs_insight',
    label: 'Inquiry vs Insight',
    description:
      'Talk-time ratio, question quality, and effective use of silence.',
    levels: {
      ineffective: 'Coach does most of the talking during the session.',
      developing: 'Coach and client split the coaching time roughly 50/50.',
      effective:
        "Coach's speech is predominantly open-ended questions (>60%). Questions invite new occurrences.",
      sophisticated:
        "Powerful questions and silence are the coach's key tools. Client discovers insights leading to actions.",
    },
  },
  {
    key: 'listening',
    label: 'Listening',
    description:
      'Level 1, 2, or 3 listening — words, body language, intuition.',
    levels: {
      ineffective:
        "Coach appears inattentive to the client's words, tone, and body language. (Level 1)",
      developing:
        'Coach is listening to respond — thinking about the next thing to say. (Level 1)',
      effective:
        'Coach is focused on what the client is saying, noticing facial expressions and body language. (Level 2/3)',
      sophisticated:
        'Coach practices global listening: all verbal and non-verbal aspects of communication. (Level 3)',
    },
  },
  {
    key: 'reinvention',
    label: 'Reinvention',
    description:
      'Past-focused vs generative future. Ways of being vs things to do.',
    levels: {
      ineffective:
        'Conversation is focused on the past; coach does not move into generative future.',
      developing: 'Session focuses on things to do instead of ways to be.',
      effective:
        'Coach creates space to examine current mental frameworks, leading to new frameworks and results.',
      sophisticated:
        'Coach guides the conversation to explore new ways of being to accomplish maximum value.',
    },
  },
  {
    key: 'energy',
    label: 'Energy',
    description: 'Trust, natural flow, and intentional energy diversity.',
    levels: {
      ineffective:
        'Energies are "off" with a discernible experience of mistrust.',
      developing:
        'Coach shows up prepared and ready. The call might feel overly structured.',
      effective:
        'Inviting, neutral, and curious energy. Natural flow with transitions.',
      sophisticated:
        "Coach intentionally plays diverse energies to draw out client's full participation.",
    },
  },
  {
    key: 'disruption',
    label: 'Disruption',
    description:
      'Challenging narratives, stories, and excuses without bailing out.',
    levels: {
      ineffective:
        "Coach tolerates client's reasons, narratives, and excuses without leveraging them.",
      developing:
        'Coach points out potential disruption topics but does not hold the space.',
      effective:
        'Coach disrupts client narratives, stories, excuses, and occurrences directly.',
      sophisticated:
        'Coach strategically disrupts. Does not "bail out" — advocates for client to choose resourcefulness.',
    },
  },
]

const goliveValues = [
  { key: 'growth', label: 'Growth' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'love', label: 'Love' },
  { key: 'integrity', label: 'Integrity' },
  { key: 'vision', label: 'Vision' },
  { key: 'energy', label: 'Energy' },
]

export function AnalysisPrintView({
  insights,
  coaching,
  sessionTitle,
  clientName,
  coachName,
  sessionDate,
}: AnalysisPrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useCallback(() => {
    const content = printRef.current
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Session Analysis - ${sessionTitle || 'Coaching Session'}</title>
        <style>
          @page {
            margin: 0.6in 0.7in;
            size: A4;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1a1a1a;
            font-size: 11px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          ${content.querySelector('style')?.textContent || ''}
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    // Wait for styles to apply
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }, [sessionTitle])

  const overallScore = coaching?.coaching_scores
    ? coaching.coaching_scores.overall ||
      (() => {
        const vals = Object.values(coaching.coaching_scores).filter(
          (v): v is number => typeof v === 'number',
        )
        return vals.length > 0
          ? vals.reduce((sum, s) => sum + s, 0) / vals.length
          : 0
      })()
    : 0

  const overallLevel = getScoreLevel(overallScore)

  return (
    <>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-app-secondary border border-app-border rounded-lg hover:bg-app-surface transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
          />
        </svg>
        Print Analysis
      </button>

      {/* Hidden print content */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={printRef}>
          <style>{`
            .print-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
            .print-header h1 { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 4px; }
            .print-header .subtitle { font-size: 13px; color: #6b7280; }
            .print-header .meta { display: flex; justify-content: center; gap: 24px; margin-top: 8px; font-size: 11px; color: #6b7280; }
            .print-header .meta span { display: flex; align-items: center; gap: 4px; }

            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px; }

            .score-hero { display: flex; align-items: flex-start; gap: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; }
            .score-circle { text-align: center; min-width: 100px; }
            .score-circle .big-score { font-size: 36px; font-weight: 800; color: #111; line-height: 1; }
            .score-circle .big-score span { font-size: 18px; color: #9ca3af; font-weight: 400; }
            .score-circle .level-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-top: 6px; }
            .score-circle .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

            .score-details { flex: 1; }
            .score-details .quick-stats { display: flex; gap: 16px; margin-bottom: 12px; }
            .score-details .stat-box { padding: 6px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; text-align: center; }
            .score-details .stat-box .val { font-size: 12px; font-weight: 600; color: #111; }
            .score-details .stat-box .lbl { font-size: 9px; color: #9ca3af; text-transform: uppercase; }

            .assessment-text { font-size: 11.5px; line-height: 1.6; color: #374151; }

            .two-col { display: flex; gap: 16px; }
            .two-col > div { flex: 1; }

            .list-card { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; }
            .list-card .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
            .list-card ul { padding-left: 16px; }
            .list-card li { font-size: 11px; color: #374151; margin-bottom: 4px; line-height: 1.5; }

            .strengths-title { color: #059669; }
            .strengths-card { border-color: #d1fae5; background: #f0fdf4; }
            .growth-title { color: #d97706; }
            .growth-card { border-color: #fef3c7; background: #fffbeb; }
            .breakthrough-title { color: #7c3aed; }
            .breakthrough-card { border-color: #ede9fe; background: #f5f3ff; }

            .emotions-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
            .emotion-tag { display: inline-block; padding: 2px 8px; background: #f3f4f6; border-radius: 10px; font-size: 10px; color: #4b5563; }

            .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .metric-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; page-break-inside: avoid; }
            .metric-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
            .metric-name { font-size: 12px; font-weight: 700; color: #111; }
            .metric-score { font-size: 16px; font-weight: 800; color: #111; }
            .metric-desc { font-size: 10px; color: #6b7280; margin-bottom: 6px; }
            .metric-badge { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 9px; font-weight: 600; margin-left: 6px; }
            .metric-bar { height: 4px; background: #e5e7eb; border-radius: 2px; margin-bottom: 8px; }
            .metric-bar-fill { height: 100%; border-radius: 2px; }
            .metric-justification { padding: 8px 10px; border-radius: 6px; margin-bottom: 6px; border: 1px solid #e5e7eb; background: #f9fafb; }
            .metric-justification .j-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 3px; }
            .metric-justification .j-text { font-size: 10.5px; color: #374151; line-height: 1.5; }
            .metric-level { font-size: 10px; color: #6b7280; line-height: 1.4; }
            .metric-level strong { color: #374151; }

            .golive-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
            .golive-card { text-align: center; padding: 10px 6px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .golive-label { font-size: 10px; color: #6b7280; font-weight: 500; margin-bottom: 4px; }
            .golive-score { font-size: 18px; font-weight: 800; color: #111; }
            .golive-badge { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 8px; font-weight: 600; margin-top: 2px; }

            .suggestions-list { padding-left: 16px; }
            .suggestions-list li { font-size: 11px; color: #374151; margin-bottom: 6px; line-height: 1.5; }

            .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #9ca3af; }
          `}</style>

          {/* Header */}
          <div className="print-header">
            <h1>{sessionTitle || 'Coaching Session Analysis'}</h1>
            <div className="subtitle">
              Meta Performance Framework &amp; GO LIVE Methodology
            </div>
            <div className="meta">
              {clientName && (
                <span>
                  <strong>Client:</strong> {clientName}
                </span>
              )}
              {coachName && (
                <span>
                  <strong>Coach:</strong> {coachName}
                </span>
              )}
              {sessionDate && (
                <span>
                  <strong>Date:</strong> {formatDate(sessionDate)}
                </span>
              )}
            </div>
          </div>

          {/* Overall Score + Assessment */}
          {coaching && (
            <div className="score-hero avoid-break">
              <div className="score-circle">
                <div className="big-score">
                  {overallScore.toFixed(1)}
                  <span>/10</span>
                </div>
                <div
                  className="level-badge"
                  style={{
                    background: getLevelBg(overallLevel),
                    color: getLevelColor(overallLevel),
                  }}
                >
                  {getScoreLevelLabel(overallLevel)}
                </div>
                <div className="label">Overall Score</div>
              </div>
              <div className="score-details">
                <div className="quick-stats">
                  {coaching.sentiment && (
                    <>
                      <div className="stat-box">
                        <div className="val">{coaching.sentiment.overall}</div>
                        <div className="lbl">Sentiment</div>
                      </div>
                      <div className="stat-box">
                        <div className="val">
                          {coaching.sentiment.engagement}
                        </div>
                        <div className="lbl">Engagement</div>
                      </div>
                    </>
                  )}
                  {insights?.metadata?.word_count && (
                    <div className="stat-box">
                      <div className="val">
                        {insights.metadata.word_count.toLocaleString()}
                      </div>
                      <div className="lbl">Words</div>
                    </div>
                  )}
                </div>
                {coaching.overall_assessment && (
                  <div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.5px',
                        color: '#6b7280',
                        marginBottom: '4px',
                      }}
                    >
                      Session Assessment
                    </div>
                    <div className="assessment-text">
                      {coaching.overall_assessment}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Strengths + Areas for Growth */}
          {coaching &&
            ((coaching.key_strengths && coaching.key_strengths.length > 0) ||
              (coaching.areas_for_growth &&
                coaching.areas_for_growth.length > 0)) && (
              <div className="two-col section avoid-break">
                {coaching.key_strengths &&
                  coaching.key_strengths.length > 0 && (
                    <div>
                      <div className="list-card strengths-card">
                        <div className="card-title strengths-title">
                          Key Strengths
                        </div>
                        <ul>
                          {coaching.key_strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                {coaching.areas_for_growth &&
                  coaching.areas_for_growth.length > 0 && (
                    <div>
                      <div className="list-card growth-card">
                        <div className="card-title growth-title">
                          Areas for Growth
                        </div>
                        <ul>
                          {coaching.areas_for_growth.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
              </div>
            )}

          {/* Breakthrough Moments */}
          {coaching?.breakthrough_moments &&
            coaching.breakthrough_moments.length > 0 && (
              <div className="section avoid-break">
                <div className="list-card breakthrough-card">
                  <div className="card-title breakthrough-title">
                    Breakthrough Moments
                  </div>
                  <ul>
                    {coaching.breakthrough_moments.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          {/* Detected Emotions */}
          {coaching?.sentiment?.emotions &&
            coaching.sentiment.emotions.length > 0 && (
              <div className="section avoid-break">
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px',
                    color: '#6b7280',
                    marginBottom: '4px',
                  }}
                >
                  Detected Emotions
                </div>
                <div className="emotions-row">
                  {coaching.sentiment.emotions.map((e, i) => (
                    <span key={i} className="emotion-tag">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Meta Performance Criteria */}
          {coaching?.coaching_scores && (
            <div className="section">
              <div className="section-title">Meta Performance Criteria</div>
              <div className="metric-grid">
                {coachingMetrics.map(metric => {
                  const score =
                    (coaching.coaching_scores[
                      metric.key as keyof typeof coaching.coaching_scores
                    ] as number) ?? 0
                  const level = getScoreLevel(score)
                  const levelColor = getLevelColor(level)
                  const levelBg = getLevelBg(level)
                  const justification =
                    coaching.score_justifications?.[metric.key]
                  const currentLevelDesc =
                    metric.levels[level as keyof typeof metric.levels]

                  return (
                    <div
                      key={metric.key}
                      className="metric-card avoid-break"
                      style={{ borderColor: levelColor + '40' }}
                    >
                      <div className="metric-header">
                        <div>
                          <span className="metric-name">{metric.label}</span>
                          <span
                            className="metric-badge"
                            style={{ background: levelBg, color: levelColor }}
                          >
                            {getScoreLevelLabel(level)}
                          </span>
                        </div>
                        <span className="metric-score">{score.toFixed(1)}</span>
                      </div>
                      <div className="metric-desc">{metric.description}</div>
                      <div className="metric-bar">
                        <div
                          className="metric-bar-fill"
                          style={{
                            width: `${score * 10}%`,
                            background: levelColor,
                          }}
                        />
                      </div>
                      {justification && (
                        <div className="metric-justification">
                          <div className="j-title">Why this score</div>
                          <div className="j-text">{justification}</div>
                        </div>
                      )}
                      <div className="metric-level">
                        <strong>
                          Current Level: {getScoreLevelLabel(level)}
                        </strong>{' '}
                        — {currentLevelDesc}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* GO LIVE Values */}
          {coaching?.go_live_scores && (
            <div className="section avoid-break">
              <div className="section-title">GO LIVE Values</div>
              <div className="golive-grid">
                {goliveValues.map(value => {
                  const score =
                    coaching.go_live_scores[
                      value.key as keyof typeof coaching.go_live_scores
                    ] ?? 0
                  const level = getScoreLevel(score)
                  return (
                    <div
                      key={value.key}
                      className="golive-card"
                      style={{
                        background: getLevelBg(level),
                        borderColor: getLevelColor(level) + '40',
                      }}
                    >
                      <div className="golive-label">{value.label}</div>
                      <div className="golive-score">{score.toFixed(1)}</div>
                      <div
                        className="golive-badge"
                        style={{
                          background: getLevelColor(level) + '20',
                          color: getLevelColor(level),
                        }}
                      >
                        {getScoreLevelLabel(level)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Coaching Suggestions */}
          {coaching?.suggestions && coaching.suggestions.length > 0 && (
            <div className="section avoid-break">
              <div className="section-title">Coaching Suggestions</div>
              <ol className="suggestions-list">
                {coaching.suggestions.map((s, i) => (
                  <li key={i}>
                    {typeof s === 'string'
                      ? s
                      : (s as any).suggestion || (s as any).text || String(s)}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Session Insights */}
          {insights && (
            <>
              {insights.insights && insights.insights.length > 0 && (
                <div className="section avoid-break">
                  <div className="section-title">Key Insights</div>
                  <ol className="suggestions-list">
                    {insights.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ol>
                </div>
              )}

              {insights.recommendations?.next_session_focus &&
                insights.recommendations.next_session_focus.length > 0 && (
                  <div className="section avoid-break">
                    <div className="section-title">
                      Next Session Recommendations
                    </div>
                    <ul className="suggestions-list">
                      {insights.recommendations.next_session_focus.map(
                        (r, i) => (
                          <li key={i}>{r}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </>
          )}

          {/* Footer */}
          <div className="footer">
            Generated by Coach Sidekick &mdash; Meta Performance Framework &amp;
            GO LIVE Methodology
            {coaching?.analysis_version &&
              ` &mdash; v${coaching.analysis_version}`}
          </div>
        </div>
      </div>
    </>
  )
}
