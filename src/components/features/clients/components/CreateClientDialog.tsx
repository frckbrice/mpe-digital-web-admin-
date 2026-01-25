'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateClientPayload } from '../api/mutations';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (d: CreateClientPayload) => void;
  isPending: boolean;
}

export function CreateClientDialog({ open, onOpenChange, onSubmit, isPending }: CreateClientDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error(t('common.requiredFields'));
      return;
    }
    onSubmit({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.clients.createTitle')}</DialogTitle>
          <DialogDescription>{t('dashboard.clients.createDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('common.email')} *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('common.firstName')} *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
            <div><Label>{t('common.lastName')} *</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
          </div>
          <div><Label>{t('common.phone')}</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
