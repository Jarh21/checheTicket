import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getListLicenseDevicesQueryKey,
  useListLicenseDevices,
  type License,
} from '@workspace/api-client-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock3, Loader2, Smartphone, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DevicesDialogProps {
  license: License | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DevicesDialog({ license, open, onOpenChange }: DevicesDialogProps) {
  const { data: devices, isLoading, error } = useListLicenseDevices(
    license?.id || '',
    {
      query: {
        queryKey: getListLicenseDevicesQueryKey(license?.id || ''),
        enabled: Boolean(license?.id) && open,
      },
    },
  );

  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" data-testid="dialog-devices">
        <DialogHeader>
          <DialogTitle>Dispositivos Conectados</DialogTitle>
          <DialogDescription>
            Dispositivos registrados para {license.name} ({license.deviceCount} de {license.maxDevices})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Error al cargar dispositivos
            </div>
          )}

          {devices && devices.length === 0 && (
            <div className="py-12 text-center">
              <Smartphone className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No hay dispositivos registrados</p>
            </div>
          )}

          {devices && devices.length > 0 && (
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`device-item-${device.id}`}
                >
                  <div className="flex items-start gap-3">
                    {device.status === 'authenticated' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : device.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium">{device.deviceName}</div>
                      <div className="text-sm text-muted-foreground font-mono">{device.deviceId}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Última conexión: {format(new Date(device.lastSeenAt), 'dd MMM yyyy HH:mm', { locale: es })}
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-1">
                        <Clock3 className="h-3 w-3 text-muted-foreground" />
                        {device.lastAuthAt
                          ? `Último acceso: ${format(new Date(device.lastAuthAt), 'dd MMM yyyy HH:mm', { locale: es })}`
                          : 'Sin intento de autenticación'}
                      </div>
                      {device.lastAuthReason && (
                        <div className="text-xs text-muted-foreground mt-1">{device.lastAuthReason}</div>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      device.status === 'authenticated'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : device.status === 'failed' || device.status === 'revoked'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                    }
                  >
                    {device.status === 'authenticated'
                      ? 'Autenticado'
                      : device.status === 'failed'
                        ? 'Fallido'
                        : device.status === 'revoked'
                          ? 'Revocado'
                          : 'Pendiente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
