'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken, role } = response.data;

      const meResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { userId, email, firstName, lastName, phone, accessToken: newAccessToken } = meResponse.data;

      // Use the new accessToken from /auth/me if provided, otherwise use the one from login
      const finalToken = newAccessToken || accessToken;
      setAuth(finalToken, role, userId, email);
      
      // Update profile if available
      const { updateUserProfile } = useAuthStore.getState();
      if (meResponse.data && updateUserProfile) {
        updateUserProfile(meResponse.data);
      }
      toast.success(t('auth.loginSuccess'));

      if (role === 'ADMIN') {
        router.push('/admin/requests');
      } else {
        router.push('/properties');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t('common.error');
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              ع
            </div>
            <span className="font-bold text-2xl text-foreground">
              لوحة العقارات
            </span>
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{t('auth.login')}</h1>
            <p className="text-muted-foreground text-base">{t('auth.loginDescription')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                {t('auth.email')}
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="example@domain.com"
                {...register('email')} 
                className="h-12"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                {t('auth.password')}
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                {...register('password')} 
                className="h-12"
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.loading') : t('auth.login')}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">أو</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
        <div className="max-w-lg text-center space-y-6">
          <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl">
              ع
            </div>
          </div>
          <h2 className="text-4xl font-bold text-foreground">
            مرحباً بك مجدداً
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            قم بتسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك واستكشاف أفضل العقارات
          </p>
        </div>
      </div>
    </div>
  );
}
