'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { fetchUserDetail } from '../api/queries';
import { ROLES } from '../api/data';
import type { UpdateUserPayload } from '../api/mutations';
import type { UserRow } from '../api/types';
import { useAuthStore } from '@/components/features/auth';

function getRoleTranslationKey(role: string): string {
  const roleMap: Record<string, string> = {
    CLIENT: 'common.roleClient',
    AGENT: 'common.roleAgent',
    MODERATOR: 'common.roleModerator',
    ADMIN: 'common.roleAdmin',
  };
  return roleMap[role] || role;
}

interface EditUserFormProps {
  initial: UserRow;
  isModerator: boolean;
  onClose: () => void;
  onSave: (d: UpdateUserPayload) => void;
  isPending: boolean;
}

function EditUserForm({ initial, isModerator, onClose, onSave, isPending }: EditUserFormProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone || '');
  const [role, setRole] = useState<string>(initial.role);
  const [isActive, setIsActive] = useState(initial.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const restricted = role === 'ADMIN' || role === 'MODERATOR';
    const finalRole = isModerator && restricted ? initial.role : role || initial.role;
    const payload: UpdateUserPayload = {
      firstName,
      lastName,
      phone: phone || undefined,
      role: finalRole,
    };
    if (!isModerator) payload.isActive = isActive;
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('common.firstName')}</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div>
          <Label>{t('common.lastName')}</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label>{t('common.phone')}</Label>
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label>{t('common.role')}</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(isModerator
              ? ROLES.filter((r) => r !== 'ADMIN' && r !== 'MODERATOR')
              : ROLES
            ).map((r) => (
              <SelectItem key={r} value={r}>
                {t(getRoleTranslationKey(r))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!isModerator && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-input"
          />
          <Label htmlFor="edit-active">{t('common.active')}</Label>
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface EditUserDialogProps {
  userId: string;
  onClose: () => void;
  onSave: (d: UpdateUserPayload) => void;
  isPending: boolean;
}

export function EditUserDialog({ userId, onClose, onSave, isPending }: EditUserDialogProps) {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const isModerator = currentUser?.role === 'MODERATOR';
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (user && isModerator && (user.role === 'ADMIN' || user.role === 'MODERATOR')) {
      onClose();
    }
  }, [user, isModerator, onClose]);

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
          <EditUserForm
            key={user.id}
            initial={user}
            isModerator={isModerator}
            onClose={onClose}
            onSave={onSave}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
