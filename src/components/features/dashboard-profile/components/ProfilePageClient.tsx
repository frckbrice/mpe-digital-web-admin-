'use client';

/**
 * Component: ProfilePageClient
 *
 * User profile page component that allows users to view and edit their profile information.
 *
 * Features:
 * - Displays user profile information (name, email, phone, role)
 * - Edit mode for updating profile details
 * - Avatar display with initials fallback
 * - Role badge display
 * - Account status indicator (active/inactive)
 * - Form validation
 * - Loading states during save
 * - Toast notifications for success/error
 *
 * State Management:
 * - Uses authStore for user data
 * - Local state for edit mode and form data
 * - Syncs form data with user data from authStore
 *
 * Data Flow:
 * - Reads user data from authStore
 * - Updates profile via /api/auth/profile endpoint
 * - Updates authStore after successful update
 *
 * Editable Fields:
 * - First name
 * - Last name
 * - Phone number (optional)
 *
 * Read-only Fields:
 * - Email (managed by authentication system)
 * - Role (managed by administrators)
 * - Account status
 */

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/components/features/auth';
import { updateProfile } from '../api/mutations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Profile Page Component
 *
 * Renders a user profile page with editable profile information and account details.
 * Supports edit mode for updating user information.
 */
export function ProfilePageClient() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });

  useEffect(() => {
    setFormData({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    });
  }, [user?.firstName, user?.lastName, user?.phone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
      });
      if (res.user)
        setUser({ ...res.user, phone: res.user.phone ?? undefined } as Parameters<
          typeof setUser
        >[0]);
      toast.success(t('dashboard.profile.profileUpdated'));
      setIsEditing(false);
    } catch (e) {
      toast.error(
        e instanceof Error && e.message ? e.message : t('dashboard.profile.failedUpdateProfile')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    if (!user) return '??';
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  };

  const getRoleBadgeColor = () => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      AGENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      CLIENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return colors[user?.role ?? ''] ?? '';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t('dashboard.profile.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('dashboard.profile.subtitle')}</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            {t('dashboard.profile.editProfile')}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="text-center pb-3">
            <div className="flex justify-center mb-3">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                {user.profilePicture ? (
                  <AvatarImage
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                ) : (
                  <AvatarFallback className="text-xl text-primary-foreground bg-primary">
                    {getInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <CardTitle className="text-base">
              {user.firstName} {user.lastName}
            </CardTitle>
            <CardDescription className="flex items-center justify-center mt-1 text-sm gap-1">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-center">
                <Badge className={cn('px-3 py-1', getRoleBadgeColor())}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ProfileStatusBadge
                  label={t('common.status')}
                  value={user.isActive ? t('common.active') : t('common.inactive')}
                  isActive={user.isActive}
                />
                <ProfileStatusBadge
                  label={t('dashboard.profile.verified')}
                  value={user.isVerified ? t('dashboard.profile.yes') : t('dashboard.profile.no')}
                  isActive={user.isVerified}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('dashboard.profile.personalInfo')}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? t('dashboard.profile.editDetails')
                : t('dashboard.profile.yourProfileInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('common.firstName')}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('common.lastName')}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('common.phone')}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {t('common.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <ProfileField icon={User} label={t('common.firstName')} value={user.firstName} />
                <ProfileField icon={User} label={t('common.lastName')} value={user.lastName} />
                <ProfileField icon={Mail} label={t('common.email')} value={user.email} />
                <ProfileField
                  icon={Phone}
                  label={t('common.phone')}
                  value={user.phone ?? t('common.notProvided')}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ProfileStatusBadge({
  label,
  value,
  isActive,
}: {
  label: string;
  value: string;
  isActive?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge variant="secondary" className="text-xs">
        {isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
        {value}
      </Badge>
    </div>
  );
}
