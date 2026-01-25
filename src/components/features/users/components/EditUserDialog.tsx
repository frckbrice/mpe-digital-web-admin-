'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { fetchUserDetail } from '../api/queries';
import { ROLES } from '../api/data';
import type { UpdateUserPayload } from '../api/mutations';

interface EditUserDialogProps {
  userId: string;
  onClose: () => void;
  onSave: (d: UpdateUserPayload) => void;
  isPending: boolean;
}

export function EditUserDialog({ userId, onClose, onSave, isPending }: EditUserDialogProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone || '');
      setRole(user.role);
      setIsActive(user.isActive);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ firstName, lastName, phone: phone || undefined, role: role || user?.role, isActive });
  };

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.users.editTitle')}</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('common.firstName')}</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
              <div><Label>{t('common.lastName')}</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
            </div>
            <div><Label>{t('common.phone')}</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>{t('common.role')}</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-input" />
              <Label htmlFor="edit-active">{t('common.active')}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.save')}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
