'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PeopleSkeleton } from '@/components/sandboxes/skeletons'

/**
 * People used to be a page of its own. It is the sandbox's Team tab now, so
 * older links — a bookmark, an email, a notification — land there instead.
 */
export default function MemberSandboxPeopleRedirect() {
  const params = useParams<{ sandboxId: string }>()
  const router = useRouter()
  const sandboxId = params?.sandboxId

  useEffect(() => {
    if (sandboxId) router.replace(`/sandboxes/${sandboxId}?tab=team`)
  }, [router, sandboxId])

  return <PeopleSkeleton />
}
