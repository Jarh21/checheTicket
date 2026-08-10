import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Save, Eye, EyeOff, CheckCircle2, Settings2 } from 'lucide-react';
import { getEmailConfig, saveEmailConfig } from '@/lib/admin-api';
import { useToast } from '@/hooks/use-toast';

export function EmailConfigSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['email-config'],
    queryFn: getEmailConfig,
    refetchOnWindowFocus: false,
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: saveEmailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] });
      toast({ title: 'Configuración guardada', description: 'El correo de envío fue actualizado.' });
      setGmailAppPassword('');
      setEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  function handleEdit() {
    setGmailUser(data?.gmailUser ?? '');
    setGmailAppPassword('');
    setEditing(true);
  }

  function handleSave() {
    if (!gmailUser.trim() || !gmailAppPassword.trim()) {
      toast({ title: 'Campos requeridos', description: 'Ingresa el correo y la contraseña de aplicación.', variant: 'destructive' });
      return;
    }
    save({ gmailUser: gmailUser.trim(), gmailAppPassword: gmailAppPassword.trim() });
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Correo de recuperación</h2>
        </div>
        {data?.hasConfig && !editing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            Editar
          </Button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {isLoading && (
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
        )}

        {!isLoading && data?.hasConfig && !editing && (
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Configurado</p>
              <p className="text-sm text-muted-foreground mt-0.5">{data.gmailUser}</p>
            </div>
          </div>
        )}

        {(!data?.hasConfig || editing) && !isLoading && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configura una cuenta Gmail con{' '}
              <strong>contraseña de aplicación</strong> para enviar correos de recuperación.
              Ve a <em>Cuenta de Google → Seguridad → Contraseñas de aplicaciones</em>.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="gmail-user">Correo Gmail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="gmail-user"
                  type="email"
                  placeholder="tuempresa@gmail.com"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gmail-password">Contraseña de aplicación</Label>
              <div className="relative">
                <Input
                  id="gmail-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {editing && (
                <Button variant="outline" onClick={() => setEditing(false)} disabled={isPending}>
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
