import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-ink-on-dark [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        live: 'bg-forest-bg text-forest border-forest/20',
        completed: 'bg-surface-2 text-ink-2 border-line',
        processing: 'bg-amber-token-bg text-amber-token border-amber-token/20',
        scheduled: 'bg-indigo-bg text-indigo border-indigo/20',
        error: 'bg-vermillion-bg text-vermillion border-vermillion/20',
        success: 'bg-forest-bg text-forest border-forest/20',
        warning: 'bg-amber-token-bg text-amber-token border-amber-token/20',
        info: 'bg-ds-accent-bg text-ds-accent border-ds-accent/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
