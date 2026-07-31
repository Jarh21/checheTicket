import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLoginAdmin } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { setAdminToken } from '@/lib/auth';
import { Loader2, Shield } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginAdmin = useLoginAdmin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginAdmin.mutate(
      { data },
      {
        onSuccess: (response) => {
          setAdminToken(response.token);
          setLocation('/');
        },
        onError: (error) => {
          toast({
            title: 'Error de autenticación',
            description: error.message || 'Credenciales inválidas',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg" data-testid="card-login">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-2">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Panel de Administración</CardTitle>
          <CardDescription>Gestión de licencias HotSpot</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@ejemplo.com"
                        autoComplete="email"
                        {...field}
                        data-testid="input-login-email"
                      />
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                        data-testid="input-login-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginAdmin.isPending}
                data-testid="button-login-submit"
              >
                {loginAdmin.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
