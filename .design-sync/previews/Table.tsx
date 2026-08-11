import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'coach-sidekick'

export const SessionRoster = () => (
  <div className="w-full max-w-xl">
    <Table>
      <TableCaption>
        Recent coaching sessions across active clients.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Maya Chen</TableCell>
          <TableCell>Jul 15, 2026</TableCell>
          <TableCell>52 min</TableCell>
          <TableCell className="text-right">
            <Badge variant="completed">Completed</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Marcus Bell</TableCell>
          <TableCell>Jul 17, 2026</TableCell>
          <TableCell>47 min</TableCell>
          <TableCell className="text-right">
            <Badge variant="processing">Processing</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Priya Sharma</TableCell>
          <TableCell>Jul 18, 2026</TableCell>
          <TableCell>38 min</TableCell>
          <TableCell className="text-right">
            <Badge variant="live">In session</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Nadia Osei</TableCell>
          <TableCell>Jul 22, 2026</TableCell>
          <TableCell>—</TableCell>
          <TableCell className="text-right">
            <Badge variant="scheduled">Scheduled</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
)

export const GoLiveScores = () => (
  <div className="w-full max-w-sm">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>GO LIVE dimension</TableHead>
          <TableHead className="text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Growth</TableCell>
          <TableCell className="text-right tabular-nums">8.5</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Ownership</TableCell>
          <TableCell className="text-right tabular-nums">7.0</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Love</TableCell>
          <TableCell className="text-right tabular-nums">9.0</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Integrity</TableCell>
          <TableCell className="text-right tabular-nums">8.0</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Vision</TableCell>
          <TableCell className="text-right tabular-nums">7.5</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Energy</TableCell>
          <TableCell className="text-right tabular-nums">8.5</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Average</TableCell>
          <TableCell className="text-right tabular-nums">8.1</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  </div>
)
