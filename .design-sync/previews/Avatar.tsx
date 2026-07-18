import { Avatar, AvatarFallback, AvatarImage } from 'coach-sidekick'

export const Sizes = () => (
  <div className="flex items-end gap-4">
    <Avatar>
      <AvatarFallback className="text-xs font-medium">MC</AvatarFallback>
    </Avatar>
    <Avatar className="h-10 w-10">
      <AvatarFallback className="bg-ink text-ink-on-dark text-sm font-bold">
        MC
      </AvatarFallback>
    </Avatar>
    <Avatar className="h-14 w-14">
      <AvatarFallback className="bg-ink text-ink-on-dark text-base font-bold">
        MC
      </AvatarFallback>
    </Avatar>
  </div>
)

export const ParticipantRow = () => (
  <div className="flex items-center">
    <div className="flex -space-x-2">
      <Avatar className="h-9 w-9 border-2 border-paper">
        <AvatarFallback className="bg-ink text-ink-on-dark text-xs font-bold">
          MC
        </AvatarFallback>
      </Avatar>
      <Avatar className="h-9 w-9 border-2 border-paper">
        <AvatarFallback className="bg-surface-3 text-ink text-xs font-bold">
          MW
        </AvatarFallback>
      </Avatar>
      <Avatar className="h-9 w-9 border-2 border-paper">
        <AvatarFallback className="bg-ink text-ink-on-dark text-xs font-bold">
          PS
        </AvatarFallback>
      </Avatar>
      <Avatar className="h-9 w-9 border-2 border-paper">
        <AvatarFallback className="bg-surface-3 text-ink text-xs font-bold">
          +4
        </AvatarFallback>
      </Avatar>
    </div>
    <span className="ml-3 text-sm text-ink-3">
      Pod session · 7 participants
    </span>
  </div>
)

export const ImageFallback = () => (
  <div className="flex items-center gap-3">
    <Avatar className="h-10 w-10">
      <AvatarImage src="/avatars/maya-chen.png" alt="Maya Chen" />
      <AvatarFallback className="bg-ink text-ink-on-dark text-sm font-bold">
        MC
      </AvatarFallback>
    </Avatar>
    <div>
      <p className="text-sm font-medium text-ink">Maya Chen</p>
      <p className="text-xs text-ink-3">
        Falls back to initials when the photo is unavailable
      </p>
    </div>
  </div>
)
