'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';

interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  accessToken?: string;
}

interface ProfileFormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { token, isInitialized, updateUserProfile } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch current user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get<UserProfile>('/auth/me');
      const profileData = response.data;
      
      // Update token if new one is provided (token refresh)
      if (profileData.accessToken) {
        const { setAuth, role } = useAuthStore.getState();
        if (role && profileData.userId) {
          setAuth(profileData.accessToken, role, profileData.userId, profileData.email);
        }
      }
      
      return profileData;
    },
    enabled: !!token && isInitialized,
    staleTime: 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.patch<UserProfile>('/auth/profile', data);
      return response.data;
    },
    onSuccess: (updatedProfile) => {
      // Update auth store with new profile data
      if (updateUserProfile) {
        updateUserProfile(updatedProfile);
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success(t('profile.updateSuccess') || 'Profile updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('common.error');
      toast.error(message);
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    // Only send fields that have values
    const updateData: ProfileFormData = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone) updateData.phone = data.phone;

    updateMutation.mutate(updateData);
  };

  if (!isInitialized || isLoading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="container mx-auto p-8">
          <LoadingSpinner className="py-12" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">{t('profile.title') || 'Profile'}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.updateProfile') || 'Update Profile'}</CardTitle>
            <CardDescription>
              {t('profile.updateDescription') || 'Update your personal information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                  <p className="text-sm text-zinc-500 mt-1">
                    {t('profile.emailCannotChange') || 'Email cannot be changed'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="firstName">
                    {t('profile.firstName') || 'First Name'} ({t('common.optional') || 'Optional'})
                  </Label>
                  <Input id="firstName" type="text" {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">
                    {t('profile.lastName') || 'Last Name'} ({t('common.optional') || 'Optional'})
                  </Label>
                  <Input id="lastName" type="text" {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">
                    {t('profile.phone') || 'Phone'} ({t('common.optional') || 'Optional'})
                  </Label>
                  <Input id="phone" type="tel" {...register('phone')} />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">{t('auth.role')}</Label>
                  <Input id="role" type="text" value={profile.role} disabled />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || updateMutation.isPending}>
                  {isSubmitting || updateMutation.isPending
                    ? t('common.loading')
                    : t('common.save')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

