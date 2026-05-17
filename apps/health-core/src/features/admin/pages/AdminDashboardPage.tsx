import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminUsers, useCreateAdminUser, useUpdateUserStatus } from '../hooks/useAdminUsers';
import type { Role } from '../types/admin.types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

export const AdminDashboardPage = () => {
  const { t } = useTranslation('admin');
  const { data: users, isLoading } = useAdminUsers();
  const createUserMutation = useCreateAdminUser();
  const updateStatusMutation = useUpdateUserStatus();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('NUTRITIONIST');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; enabled: boolean } | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await createUserMutation.mutateAsync({ email, password, role });
      setEmail('');
      setPassword('');
      setSuccess(t('successCreate'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const requestToggleStatus = (userId: string, currentStatus: boolean) => {
    setSelectedUser({ id: userId, enabled: currentStatus });
    setIsDialogOpen(true);
  };

  const confirmToggleStatus = () => {
    if (selectedUser) {
      updateStatusMutation.mutate({ userId: selectedUser.id, enabled: !selectedUser.enabled });
      setIsDialogOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground transition-colors duration-500 pb-12 relative">
      <SettingsBar />
      
      <div className="container mx-auto p-6 space-y-8 pt-16 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('createUserTitle')}</CardTitle>
            <CardDescription>{t('createUserDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4 max-w-sm">
              {error && <div className="text-destructive text-sm font-medium p-2 bg-destructive/10 rounded">{error}</div>}
              {success && <div className="text-green-600 text-sm font-medium p-2 bg-green-100 dark:bg-green-900/30 rounded">{success}</div>}
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="doctor@healthcore.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="StrongPass123!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('role')}</Label>
                <select
                  id="role"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="NUTRITIONIST">{t('roleNutritionist')}</option>
                  <option value="PATIENT">{t('rolePatient')}</option>
                </select>
              </div>

              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? t('buttonCreating') : t('buttonCreate')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('manageTitle')}</CardTitle>
            <CardDescription>{t('manageDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">{t('loading')}</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('colEmail')}</TableHead>
                      <TableHead>{t('colRole')}</TableHead>
                      <TableHead>{t('colProvider')}</TableHead>
                      <TableHead>{t('colStatus')}</TableHead>
                      <TableHead className="text-right">{t('colActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.role === 'NUTRITIONIST' ? t('roleNutritionist') : user.role === 'PATIENT' ? t('rolePatient') : user.role}</TableCell>
                        <TableCell>{user.provider}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              user.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {user.enabled ? t('statusActive') : t('statusDisabled')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={user.enabled ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => requestToggleStatus(user.id, user.enabled)}
                            disabled={updateStatusMutation.isPending || user.role === 'ADMIN'}
                          >
                            {user.enabled ? t('btnDisable') : t('btnEnable')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!users?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {t('noUsers')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.enabled ? t('btnDisable') : t('btnEnable')}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.enabled ? t('confirmDisable') : t('confirmEnable')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('cancelBtn')}
            </Button>
            <Button variant={selectedUser?.enabled ? "destructive" : "default"} onClick={confirmToggleStatus}>
              {t('confirmBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
