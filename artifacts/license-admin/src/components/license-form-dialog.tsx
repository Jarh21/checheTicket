import { useState } from 'react';
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
import { useCreateLicense } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const createLicenseSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  company: z.string().max(255).optional(),
  phone: z.string().max(80).optional(),
  durationDays: z.coerce.number().min(1).max(3650),
  maxDevices: z.coerce.number().min(1).max(20).optional(),
});

type CreateLicenseFormData = z.infer<typeof createLicenseSchema>;

interface LicenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LicenseFormDialog({ open, onOpenChange, onSuccess }: LicenseFormDialogProps) {
  const { toast } = useToast();
  const createLicense = useCreateLicense();

  const form = useForm<CreateLicenseFormData>({
    resolver: zodResolver(createLicenseSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      company: '',
      phone: '',
      durationDays: 365,
      maxDevices: 5,
    },
  });

  const onSubmit = (data: CreateLicenseFormData) => {
    createLicense.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: 'Licencia creada',
            description: 'La nueva licencia ha sido creada exitosamente.',
          });
          form.reset();
          onOpenChange(false);
          onSuccess();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo crear la licencia.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-license">
        <DialogHeader>
          <DialogTitle>Nueva Licencia</DialogTitle>
          <DialogDescription>
            Crear una nueva cuenta de cliente con licencia de acceso
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="cliente@ejemplo.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del cliente" {...field} data-testid="input-name" />
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
                      <Input placeholder="Nombre de la empresa" {...field} data-testid="input-company" />
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
                      <Input type="tel" placeholder="+1234567890" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (Días)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={3650} {...field} data-testid="input-duration" />
                    </FormControl>
                    <FormDescription>De 1 a 3650 días</FormDescription>
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
                      <Input type="number" min={1} max={20} {...field} data-testid="input-max-devices" />
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
                disabled={createLicense.isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createLicense.isPending} data-testid="button-submit">
                {createLicense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Licencia
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
