import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/table-skeleton';
import { RefreshCw, ShieldCheck, Smartphone, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { listPasswordChangeLogs } from '@/lib/admin-api';
import { useQueryClient } from '@tanstack/react-query';

export function PasswordChangeLogs() {
  const queryClient = useQueryClient();

  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ['password-change-logs'],
    queryFn: listPasswordChangeLogs,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['password-change-logs'] });
  };

  return (
    <div className="bg-card border rounded-lg overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Cambios de contraseña</h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="p-4">
            <TableSkeleton rows={4} />
          </div>
        )}

        {isError && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No se pudieron cargar los registros.
          </div>
        )}

        {!isLoading && !isError && logs && logs.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Ningún usuario ha cambiado su contraseña todavía.
          </div>
        )}

        {!isLoading && logs && logs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Correo</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium max-w-[180px] truncate">
                    {log.email}
                  </TableCell>
                  <TableCell>
                    {log.deviceName ? (
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate max-w-[120px]">{log.deviceName}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.ipAddress ? (
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-mono">{log.ipAddress}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
