import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from 'coach-sidekick'
import {
  MoreHorizontal,
  FileText,
  Pencil,
  Trash2,
  ArrowUpDown,
} from 'lucide-react'

export const SessionActions = () => (
  <div className="flex justify-center pt-10">
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <MoreHorizontal className="h-4 w-4" />
          Session actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Session with Maya Chen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <FileText className="mr-2 h-4 w-4" />
          View transcript
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Pencil className="mr-2 h-4 w-4" />
          Edit session
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>
          Show completed commitments
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-vermillion focus:text-vermillion">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)

export const SortMenu = () => (
  <div className="flex justify-center pt-10">
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowUpDown className="h-4 w-4" />
          Sort clients
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value="recent">
          <DropdownMenuRadioItem value="recent">
            Most recent session
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name">
            Client name
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="commitments">
            Open commitments
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)
