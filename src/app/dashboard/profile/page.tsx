'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/components/features/auth';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Edit2, Save, X, Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
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
      const res = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'Failed to update profile');
      }
      const j = await res.json();
      if (!j.user) throw new Error((j as { message?: string }).message || 'Failed to update profile');
      setUser(j.user);
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update profile');
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">View and edit your admin profile</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="text-center pb-3">
            <div className="flex justify-center mb-3">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <AvatarFallback className="text-xl text-primary-foreground bg-primary">{getInitials()}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <CardTitle className="text-base">{user.firstName} {user.lastName}</CardTitle>
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
                <ProfileStatusBadge label="Status" value={user.isActive ? 'Active' : 'Inactive'} isActive={user.isActive} />
                <ProfileStatusBadge label="Verified" value={user.isVerified ? 'Yes' : 'No'} isActive={user.isVerified} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal info
            </CardTitle>
            <CardDescription>{isEditing ? 'Edit your details below.' : 'Your profile information.'}</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
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
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <ProfileField icon={User} label="First name" value={user.firstName} />
                <ProfileField icon={User} label="Last name" value={user.lastName} />
                <ProfileField icon={Mail} label="Email" value={user.email} />
                <ProfileField icon={Phone} label="Phone" value={user.phone ?? 'Not provided'} />
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

function ProfileStatusBadge({ label, value, isActive }: { label: string; value: string; isActive?: boolean }) {
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

