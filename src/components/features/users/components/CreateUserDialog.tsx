'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ROLES } from '../api/data';
import { useAuthStore } from '@/components/features/auth';
import type { CreateUserPayload } from '../api/mutations';

function getRoleTranslationKey(role: string): string {
  const roleMap: Record<string, string> = {
    CLIENT: 'common.roleClient',
    AGENT: 'common.roleAgent',
    MODERATOR: 'common.roleModerator',
    ADMIN: 'common.roleAdmin',
  };
  return roleMap[role] || role;
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (d: CreateUserPayload) => void;
  isPending: boolean;
}

export function CreateUserDialog({ open, onOpenChange, onSubmit, isPending }: CreateUserDialogProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const defaultRole = user?.role === 'MODERATOR' ? 'AGENT' : 'CLIENT';
  const [role, setRole] = useState<string>(defaultRole);

  useEffect(() => {
    if (open && user?.role === 'MODERATOR') setRole('AGENT');
  }, [open, user?.role]);

  // MODERATOR can only create AGENT (ADMIN_MODERATOR_ENDPOINTS)
  const availableRoles = user?.role === 'MODERATOR' ? (['AGENT'] as const) : ROLES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error(t('common.requiredFields'));
      return;
    }
    onSubmit({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      role: role || defaultRole,
      isActive: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.users.createTitle')}</DialogTitle>
          <DialogDescription>{t('dashboard.users.createDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>{t('common.email')} *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('common.firstName')} *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
            <div><Label>{t('common.lastName')} *</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
          </div>
          <div><Label>{t('common.phone')}</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Label>{t('common.role')}</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{availableRoles.map((r) => <SelectItem key={r} value={r}>{t(getRoleTranslationKey(r))}</SelectItem>)}</SelectContent></Select></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
