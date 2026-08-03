import { useListDeviceAuthEvents, getListDeviceAuthEventsQueryKey } from '@workspace/api-client-react';
import type { DeviceAuthEvent } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Database, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TableSkeleton } from '@/components/table-skeleton';

export function DeviceAuthActivity() {
  const { data: events, isLoading, isError } = useListDeviceAuthEvents();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListDeviceAuthEventsQueryKey() });
  };

  return (
    <div className="bg-card border rounded-lg overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Actividad Móvil</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading && <div className="p-4"><TableSkeleton rows={5} /></div>}
        
        {isError && (
          <div className="p-8 text-center text-destructive">
            <XCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Error al cargar la actividad</p>
          </div>
        )}

        {!isLoading && !isError && (!events || events.length === 0) && (
          <div className="py-12 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No hay intentos de autenticación recientes</p>
          </div>
        )}

        {!isLoading && !isError && events && events.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event: DeviceAuthEvent) => (
                <TableRow key={event.id}>
                  <TableCell>
                    {event.outcome === 'success' ? (
                      <div className="flex items-center text-green-600 dark:text-green-500">
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        <span className="text-sm font-medium">{event.httpStatus}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 dark:text-red-500">
                        <XCircle className="h-4 w-4 mr-1.5" />
                        <span className="text-sm font-medium">{event.httpStatus}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{event.deviceName || 'Desconocido'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{event.deviceId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{event.email}</div>
                    <div className="text-xs text-muted-foreground">{event.reason}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.createdAt), "dd MMM HH:mm", { locale: es })}
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
