'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

// Dynamically import MapPicker to avoid SSR issues
const DynamicMapPicker = dynamic(
  () => import('@/components/ui/map-picker').then((mod) => ({ default: mod.MapPicker })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-zinc-100 rounded-lg flex items-center justify-center">
        <p className="text-zinc-600">Loading map...</p>
      </div>
    ),
  }
);

const propertySchema = yup.object({
  title: yup.string().required('Title is required'),
  type: yup.string().required('Type is required'),
  address: yup.string().optional(),
  description: yup.string().optional(),
  price: yup.number().min(0, 'Price must be positive').optional().nullable(),
  location: yup.string().optional(),
  latitude: yup.number().optional().nullable(),
  longitude: yup.number().optional().nullable(),
  area: yup.number().min(0, 'Area must be positive').integer('Area must be an integer').optional().nullable(),
  rooms: yup.number().min(0, 'Rooms must be positive').integer('Rooms must be an integer').optional().nullable(),
  floor: yup.number().integer('Floor must be an integer').optional().nullable(),
});

type PropertyFormData = yup.InferType<typeof propertySchema>;

export default function CreatePropertyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mapKey, setMapKey] = useState(0);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: yupResolver(propertySchema) as any,
  });

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const onSubmit = async (data: PropertyFormData) => {
    try {
      const response = await api.post('/properties', data);
      toast.success(t('property.propertyCreated'));
      router.push(`/properties/${response.data.propertyId}`);
    } catch (error: any) {
      const message = error.response?.data?.message || t('property.creationFailed');
      toast.error(message);
    }
  };

  return (
    <ProtectedRoute requireRole="USER">
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t('property.createProperty')}</CardTitle>
              <CardDescription>{t('property.addNewProperty')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">{t('property.title')} *</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="type">{t('property.type')} *</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('property.selectType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APARTMENT">{t('property.types.apartment')}</SelectItem>
                          <SelectItem value="HOUSE">{t('property.types.house')}</SelectItem>
                          <SelectItem value="COMMERCIAL">{t('property.types.commercial')}</SelectItem>
                          <SelectItem value="LAND">{t('property.types.land')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>}
                </div>

                <div>
                  <Label htmlFor="address">{t('property.address')}</Label>
                  <Input id="address" {...register('address')} />
                </div>

                <div>
                  <Label htmlFor="description">{t('property.description')}</Label>
                  <Textarea id="description" {...register('description')} rows={4} />
                </div>

                <div>
                  <Label htmlFor="price">{t('property.price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
                </div>

                <div>
                  <Label htmlFor="location">{t('property.location')}</Label>
                  <Input id="location" {...register('location')} />
                </div>

                <div>
                  <Label>{t('property.propertyLocationOnMap')}</Label>
                  <DynamicMapPicker
                    key={`map-picker-create-${mapKey}`}
                    mapKey={`create-${mapKey}`}
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={handleLocationChange}
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    {t('property.clickMapToSetLocation')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="area">{t('property.areaSqFt')}</Label>
                    <Input
                      id="area"
                      type="number"
                      min="0"
                      {...register('area', { valueAsNumber: true })}
                    />
                    {errors.area && <p className="text-sm text-red-500 mt-1">{errors.area.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="rooms">{t('property.rooms')}</Label>
                    <Input
                      id="rooms"
                      type="number"
                      min="0"
                      {...register('rooms', { valueAsNumber: true })}
                    />
                    {errors.rooms && <p className="text-sm text-red-500 mt-1">{errors.rooms.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="floor">{t('property.floor')}</Label>
                    <Input
                      id="floor"
                      type="number"
                      {...register('floor', { valueAsNumber: true })}
                    />
                    {errors.floor && <p className="text-sm text-red-500 mt-1">{errors.floor.message}</p>}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('property.creating') : t('property.createProperty')}
                  </Button>
                  <Link href="/my-properties">
                    <Button variant="outline" type="button">
                      {t('common.cancel')}
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
