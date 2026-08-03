import { useState } from 'react';
import { useListAdminUsers } from '@workspace/api-client-react';
import type { AdminUser } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TableSkeleton } from '@/components/table-skeleton';
import { Plus, Database, UserCog } from 'lucide-react';
import { CreateAdminDialog } from './create-admin-dialog';

export function AdminUsersList() {
  const { data: users, isLoading } = useListAdminUsers();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="bg-card border rounded-lg overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Administradores</h2>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading && <div className="p-4"><TableSkeleton rows={3} /></div>}
        
        {!isLoading && (!users || users.length === 0) && (
          <div className="py-12 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No hay usuarios registrados</p>
          </div>
        )}

        {!isLoading && users && users.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: AdminUser) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(user.createdAt), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateAdminDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
