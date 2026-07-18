'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMarkdownProps {
  content: string
}

/**
 * Markdown renderer for chat/AI output (react-markdown + GFM) with DS typography.
 *
 * @category data-display
 */
export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-ink mb-2 mt-3 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-ink mb-1.5 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-ink-2 mb-1 mt-2.5 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-ink-2 mb-1 mt-2 first:mt-0">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-0.5 text-ink-2 ">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-0.5 text-ink-2 ">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">{children}</li>
          ),

          // Inline formatting
          strong: ({ children }) => (
            <strong className="font-semibold text-ink ">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-ink-2 ">{children}</em>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ds-accent hover:text-ds-accent underline underline-offset-2"
            >
              {children}
            </a>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-line-strong pl-3 my-2 text-ink-3 italic">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-3 border-line " />,

          // Code
          code: ({ className, children }: any) => {
            const isBlock = className?.includes('language-')
            return isBlock ? (
              <code className="block bg-paper text-ink-2 p-3 rounded-md text-xs font-mono overflow-x-auto my-2 border border-line ">
                {children}
              </code>
            ) : (
              <code className="bg-surface-3 text-ink-2 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto">{children}</pre>
          ),

          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-line ">
              <table className="min-w-full divide-y divide-line text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-paper ">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-line bg-surface-1 ">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold text-ink-2 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-ink-2 whitespace-nowrap">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
