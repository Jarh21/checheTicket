import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateLicense, type License } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const updateLicenseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  company: z.string().max(255).optional(),
  phone: z.string().max(80).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  maxDevices: z.coerce.number().min(1).max(20).optional(),
});

type UpdateLicenseFormData = z.infer<typeof updateLicenseSchema>;

interface EditLicenseDialogProps {
  license: License | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditLicenseDialog({ license, open, onOpenChange, onSuccess }: EditLicenseDialogProps) {
  const { toast } = useToast();
  const updateLicense = useUpdateLicense();

  const form = useForm<UpdateLicenseFormData>({
    resolver: zodResolver(updateLicenseSchema),
    defaultValues: {
      name: '',
      company: '',
      phone: '',
      status: 'active',
      maxDevices: 5,
    },
  });

  useEffect(() => {
    if (license) {
      form.reset({
        name: license.name,
        company: license.company || '',
        phone: license.phone || '',
        status: license.status === 'expired' ? 'active' : license.status,
        maxDevices: license.maxDevices,
      });
    }
  }, [license, form]);

  const onSubmit = (data: UpdateLicenseFormData) => {
    if (!license) return;

    updateLicense.mutate(
      { licenseId: license.id, data },
      {
        onSuccess: () => {
          toast({
            title: 'Licencia actualizada',
            description: 'Los cambios han sido guardados exitosamente.',
          });
          onOpenChange(false);
          onSuccess();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo actualizar la licencia.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-edit-license">
        <DialogHeader>
          <DialogTitle>Editar Licencia</DialogTitle>
          <DialogDescription>
            Modificar datos y estado de la licencia
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-edit-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} data-testid="input-edit-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="suspended">Suspendida</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDevices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispositivos Máximos</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={20} {...field} data-testid="input-edit-max-devices" />
                    </FormControl>
                    <FormDescription>De 1 a 20 dispositivos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateLicense.isPending}
                data-testid="button-cancel-edit"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateLicense.isPending} data-testid="button-save-edit">
                {updateLicense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
