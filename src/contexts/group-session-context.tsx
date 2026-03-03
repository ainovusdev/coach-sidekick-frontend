'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface GroupSessionContextValue {
  /** Currently selected participant client_id for scoping notes/commitments */
  selectedParticipantId: string | null
  setSelectedParticipantId: (id: string | null) => void
  /** Whether we're in a group session context */
  isGroupSession: boolean
  /** The master session ID */
  masterSessionId: string | null
}

const GroupSessionContext = createContext<GroupSessionContextValue>({
  selectedParticipantId: null,
  setSelectedParticipantId: () => {},
  isGroupSession: false,
  masterSessionId: null,
})

export function GroupSessionProvider({
  children,
  masterSessionId,
}: {
  children: ReactNode
  masterSessionId: string
}) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null)

  return (
    <GroupSessionContext.Provider
      value={{
        selectedParticipantId,
        setSelectedParticipantId,
        isGroupSession: true,
        masterSessionId,
      }}
    >
      {children}
    </GroupSessionContext.Provider>
  )
}

export function useGroupSessionContext() {
  return useContext(GroupSessionContext)
}
