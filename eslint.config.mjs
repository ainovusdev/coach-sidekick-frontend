import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

// Design-system guardrail: ban raw Tailwind palette utilities and gradient
// utilities. All color must flow through the DS tokens (ink/paper/surface/line
// + forest/vermillion/amber-token/indigo/ds-accent). See globals.css.
const DS_PALETTE_REGEX =
  String.raw`\b(?:bg|text|border|ring|from|to|via|divide|outline|placeholder|fill|stroke|caret|accent|decoration)-(?:gray|neutral|zinc|slate|stone|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b`
const DS_GRADIENT_REGEX = String.raw`\bbg-gradient-to-[a-z]+\b`

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${DS_PALETTE_REGEX}/]`,
          message:
            'Use a DS token (bg-ink, text-ink-3, bg-forest, bg-forest-bg, etc.) instead of a raw Tailwind palette utility. See src/app/globals.css.',
        },
        {
          selector: `TemplateElement[value.raw=/${DS_PALETTE_REGEX}/]`,
          message:
            'Use a DS token (bg-ink, text-ink-3, bg-forest, bg-forest-bg, etc.) instead of a raw Tailwind palette utility. See src/app/globals.css.',
        },
        {
          selector: `Literal[value=/${DS_GRADIENT_REGEX}/]`,
          message:
            'Gradients are forbidden by the design system. Replace with a solid surface + colored dot/icon.',
        },
      ],
    },
  },
]

export default eslintConfig
