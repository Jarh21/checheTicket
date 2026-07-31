import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRenewLicense, type License } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const renewLicenseSchema = z.object({
  durationDays: z.coerce.number().min(1).max(3650),
});

type RenewLicenseFormData = z.infer<typeof renewLicenseSchema>;

interface RenewLicenseDialogProps {
  license: License | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RenewLicenseDialog({ license, open, onOpenChange, onSuccess }: RenewLicenseDialogProps) {
  const { toast } = useToast();
  const renewLicense = useRenewLicense();

  const form = useForm<RenewLicenseFormData>({
    resolver: zodResolver(renewLicenseSchema),
    defaultValues: {
      durationDays: 365,
    },
  });

  const onSubmit = (data: RenewLicenseFormData) => {
    if (!license) return;

    renewLicense.mutate(
      { licenseId: license.id, data },
      {
        onSuccess: () => {
          toast({
            title: 'Licencia renovada',
            description: `Se han agregado ${data.durationDays} días a la licencia.`,
          });
          form.reset();
          onOpenChange(false);
          onSuccess();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo renovar la licencia.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-renew-license">
        <DialogHeader>
          <DialogTitle>Renovar Licencia</DialogTitle>
          <DialogDescription>
            Extender la vigencia de la licencia de {license.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 px-4 bg-muted rounded-lg mb-4">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{license.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vence:</span>
              <span className="font-mono text-sm">
                {format(new Date(license.expiresAt), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="durationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Días a Agregar</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={3650} {...field} data-testid="input-renew-days" />
                  </FormControl>
                  <FormDescription>Agregar de 1 a 3650 días</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={renewLicense.isPending}
                data-testid="button-cancel-renew"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={renewLicense.isPending} data-testid="button-confirm-renew">
                {renewLicense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Renovar Licencia
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
