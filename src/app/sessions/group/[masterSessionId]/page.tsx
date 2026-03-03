'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'

export default function GroupSessionRedirect({
  params,
}: {
  params: Promise<{ masterSessionId: string }>
}) {
  const { masterSessionId } = use(params)
  redirect(`/sessions/${masterSessionId}`)
}
