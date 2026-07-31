import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-28" /></TableHead>
          <TableHead className="text-center"><Skeleton className="h-4 w-24 mx-auto" /></TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(rows)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Skeleton className="h-4 w-12 mx-auto" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
