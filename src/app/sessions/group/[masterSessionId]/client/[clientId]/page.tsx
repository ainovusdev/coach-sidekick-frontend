'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'

export default function ClientGroupSessionRedirect({
  params,
}: {
  params: Promise<{ masterSessionId: string; clientId: string }>
}) {
  const { masterSessionId } = use(params)
  redirect(`/sessions/${masterSessionId}`)
}
