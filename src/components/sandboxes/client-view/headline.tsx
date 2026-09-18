import { Fragment } from 'react'
import type { Sentence } from './client-view-copy'

/** The paragraph under the ribbon, with the numbers that matter picked out. */
export function Headline({ sentences }: { sentences: Sentence[] }) {
  if (!sentences.length) return null
  return (
    <p
      className="max-w-[70ch] text-[15px] leading-relaxed text-ink-2"
      data-testid="client-headline"
    >
      {sentences.map((sentence, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          {sentence.map((clause, j) =>
            clause.strong ? (
              <b key={j} className="font-semibold text-ink">
                {clause.text}
              </b>
            ) : (
              <Fragment key={j}>{clause.text}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </p>
  )
}
