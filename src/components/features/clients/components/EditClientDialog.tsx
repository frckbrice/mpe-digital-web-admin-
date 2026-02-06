'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { fetchClientDetail } from '../api/queries';
import type { UpdateClientPayload } from '../api/mutations';
import type { ClientRow } from '../api/types';

interface EditClientFormProps {
  initial: ClientRow;
  onClose: () => void;
  onSave: (d: UpdateClientPayload) => void;
  isPending: boolean;
}

function EditClientForm({ initial, onClose, onSave, isPending }: EditClientFormProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone || '');
  const [isActive, setIsActive] = useState(initial.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ firstName, lastName, phone: phone || undefined, isActive });
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

interface EditClientDialogProps {
  userId: string;
  onClose: () => void;
  onSave: (d: UpdateClientPayload) => void;
  isPending: boolean;
}

export function EditClientDialog({ userId, onClose, onSave, isPending }: EditClientDialogProps) {
  const { t } = useTranslation();
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: () => fetchClientDetail(userId),
    enabled: !!userId,
  });

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.clients.editTitle')}</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {user && <EditClientForm key={user.id} initial={user} onClose={onClose} onSave={onSave} isPending={isPending} />}
      </DialogContent>
    </Dialog>
  );
}
