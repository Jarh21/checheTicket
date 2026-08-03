import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  useGetAdminDashboard,
  useListLicenses,
  getGetAdminDashboardQueryKey,
  getListLicensesQueryKey,
  type License,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { LicenseFormDialog } from '@/components/license-form-dialog';
import { EditLicenseDialog } from '@/components/edit-license-dialog';
import { RenewLicenseDialog } from '@/components/renew-license-dialog';
import { DevicesDialog } from '@/components/devices-dialog';
import { TableSkeleton } from '@/components/table-skeleton';
import { clearAdminToken } from '@/lib/auth';
import { DeviceAuthActivity } from '@/components/device-auth-activity';
import { AdminUsersList } from '@/components/admin-users-list';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  LogOut,
  MoreVertical,
  Pause,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  UserCog,
  XCircle,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [devicesDialogOpen, setDevicesDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const { data: dashboard, isLoading: dashboardLoading } = useGetAdminDashboard();
  const { data: licenses, isLoading: licensesLoading } = useListLicenses();

  const filteredLicenses = useMemo(() => {
    if (!licenses) return [];
    if (!searchQuery.trim()) return licenses;

    const query = searchQuery.toLowerCase();
    return licenses.filter(
      (license) =>
        license.name.toLowerCase().includes(query) ||
        license.email.toLowerCase().includes(query) ||
        license.company?.toLowerCase().includes(query) ||
        license.id.toLowerCase().includes(query)
    );
  }, [licenses, searchQuery]);

  const handleLogout = () => {
    clearAdminToken();
    setLocation('/');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListLicensesQueryKey() });
  };

  const handleEdit = (license: License) => {
    setSelectedLicense(license);
    setEditDialogOpen(true);
  };

  const handleRenew = (license: License) => {
    setSelectedLicense(license);
    setRenewDialogOpen(true);
  };

  const handleViewDevices = (license: License) => {
    setSelectedLicense(license);
    setDevicesDialogOpen(true);
  };

  const onMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListLicensesQueryKey() });
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    return differenceInDays(new Date(expiresAt), new Date());
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Control de Licencias</h1>
                <p className="text-sm text-muted-foreground">Panel administrativo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Stats */}
        {dashboardLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in">
            <StatCard title="Total" value={dashboard.total} icon={Database} variant="default" />
            <StatCard title="Activas" value={dashboard.active} icon={CheckCircle2} variant="success" />
            <StatCard title="Por Vencer" value={dashboard.expiringSoon} icon={Clock} variant="warning" />
            <StatCard title="Vencidas" value={dashboard.expired} icon={XCircle} variant="danger" />
            <StatCard title="Suspendidas" value={dashboard.suspended} icon={Pause} variant="muted" />
            <StatCard title="Dispositivos" value={dashboard.devices} icon={Smartphone} variant="default" />
          </div>
        )}

        {/* Licenses Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Licencias Registradas</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-80"
                  data-testid="input-search-licenses"
                />
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-license">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Licencia
              </Button>
            </div>
          </div>

          {licensesLoading && (
            <div className="overflow-x-auto">
              <TableSkeleton rows={8} />
            </div>
          )}

          {!licensesLoading && filteredLicenses.length === 0 && (
            <div className="py-12 text-center">
              <Database className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No se encontraron licencias' : 'No hay licencias registradas'}
              </p>
            </div>
          )}

          {!licensesLoading && filteredLicenses.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-center">Dispositivos</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((license) => {
                    const daysUntilExpiry = getDaysUntilExpiry(license.expiresAt);
                    const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

                    return (
                      <TableRow key={license.id} data-testid={`row-license-${license.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{license.name}</div>
                            <div className="text-sm text-muted-foreground">{license.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {license.company || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={license.status} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className={`text-sm font-mono ${isExpiringSoon ? 'text-amber-700 dark:text-amber-400 font-medium' : ''}`}>
                              {format(new Date(license.expiresAt), 'dd MMM yyyy', { locale: es })}
                            </div>
                            {daysUntilExpiry >= 0 && (
                              <div className={`text-xs ${isExpiringSoon ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}>
                                {daysUntilExpiry === 0 ? 'Vence hoy' : `${daysUntilExpiry} días restantes`}
                              </div>
                            )}
                            {daysUntilExpiry < 0 && (
                              <div className="text-xs text-red-600 dark:text-red-500">
                                Vencida hace {Math.abs(daysUntilExpiry)} días
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleViewDevices(license)}
                            className="font-mono text-sm hover:text-primary transition-colors"
                            data-testid={`button-devices-${license.id}`}
                          >
                            {license.deviceCount} / {license.maxDevices}
                          </button>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-actions-${license.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(license)} data-testid="action-edit">
                                <UserCog className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRenew(license)} data-testid="action-renew">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Renovar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDevices(license)} data-testid="action-devices">
                                <Smartphone className="h-4 w-4 mr-2" />
                                Ver Dispositivos
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* New Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeviceAuthActivity />
          <AdminUsersList />
        </div>
      </main>

      {/* Dialogs */}
      <LicenseFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={onMutationSuccess}
      />
      <EditLicenseDialog
        license={selectedLicense}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onMutationSuccess}
      />
      <RenewLicenseDialog
        license={selectedLicense}
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        onSuccess={onMutationSuccess}
      />
      <DevicesDialog
        license={selectedLicense}
        open={devicesDialogOpen}
        onOpenChange={setDevicesDialogOpen}
      />
    </div>
  );
}
