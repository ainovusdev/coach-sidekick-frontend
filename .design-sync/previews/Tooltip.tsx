import { Tooltip, TooltipTrigger, TooltipContent, Button } from 'coach-sidekick'
import { Link, Video, Download, Share2, Trash2 } from 'lucide-react'

export const CopyLinkTooltip = () => (
  <div className="flex min-h-[300px] items-center justify-center">
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Copy transcript link">
          <Link />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy transcript link</TooltipContent>
    </Tooltip>
  </div>
)

export const BottomSideTooltip = () => (
  <div className="flex min-h-[300px] items-center justify-center">
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button>
          <Video /> Start bot
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        The bot joins your meeting and records the transcript
      </TooltipContent>
    </Tooltip>
  </div>
)

export const IconRowTooltip = () => (
  <div className="flex min-h-[300px] items-center justify-center gap-1">
    <Button variant="ghost" size="icon" aria-label="Download notes">
      <Download />
    </Button>
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Share recap">
          <Share2 />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Share recap</TooltipContent>
    </Tooltip>
    <Button variant="ghost" size="icon" aria-label="Delete session">
      <Trash2 />
    </Button>
  </div>
)
