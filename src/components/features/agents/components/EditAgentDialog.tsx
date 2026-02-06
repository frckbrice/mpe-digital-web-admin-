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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { fetchAgentDetail } from '../api/queries';
import { AGENT_ROLES } from '../api/data';
import type { UpdateAgentPayload } from '../api/mutations';
import type { AgentRow } from '../api/types';

function getRoleTranslationKey(role: string): string {
  const roleMap: Record<string, string> = {
    CLIENT: 'common.roleClient',
    AGENT: 'common.roleAgent',
    MODERATOR: 'common.roleModerator',
    ADMIN: 'common.roleAdmin',
  };
  return roleMap[role] || role;
}

interface EditAgentFormProps {
  initial: AgentRow;
  onClose: () => void;
  onSave: (d: UpdateAgentPayload) => void;
  isPending: boolean;
}

function EditAgentForm({ initial, onClose, onSave, isPending }: EditAgentFormProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone || '');
  const [role, setRole] = useState<string>(initial.role);
  const [isActive, setIsActive] = useState(initial.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ firstName, lastName, phone: phone || undefined, role, isActive });
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
            {AGENT_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {t(getRoleTranslationKey(r))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {t('dashboard.agents.editRoleHint')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="edit-agent-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-input"
        />
        <Label htmlFor="edit-agent-active">{t('common.active')}</Label>
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

interface EditAgentDialogProps {
  userId: string;
  onClose: () => void;
  onSave: (d: UpdateAgentPayload) => void;
  isPending: boolean;
}

export function EditAgentDialog({ userId, onClose, onSave, isPending }: EditAgentDialogProps) {
  const { t } = useTranslation();
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: () => fetchAgentDetail(userId),
    enabled: !!userId,
  });

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.agents.editTitle')}</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {user && <EditAgentForm key={user.id} initial={user} onClose={onClose} onSave={onSave} isPending={isPending} />}
      </DialogContent>
    </Dialog>
  );
}
