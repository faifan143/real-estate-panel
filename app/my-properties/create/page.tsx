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
      toast.success('Property created successfully!');
      router.push(`/properties/${response.data.propertyId}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Creation failed';
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
              <CardTitle>Create Property</CardTitle>
              <CardDescription>Add a new property to your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APARTMENT">Apartment</SelectItem>
                          <SelectItem value="HOUSE">House</SelectItem>
                          <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                          <SelectItem value="LAND">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>}
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...register('address')} />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register('description')} rows={4} />
                </div>

                <div>
                  <Label htmlFor="price">Price</Label>
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
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...register('location')} />
                </div>

                <div>
                  <Label>Property Location on Map</Label>
                  <DynamicMapPicker
                    key={`map-picker-create-${mapKey}`}
                    mapKey={`create-${mapKey}`}
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={handleLocationChange}
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Click on the map to set the property location
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="area">Area (sq ft)</Label>
                    <Input
                      id="area"
                      type="number"
                      min="0"
                      {...register('area', { valueAsNumber: true })}
                    />
                    {errors.area && <p className="text-sm text-red-500 mt-1">{errors.area.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="rooms">Rooms</Label>
                    <Input
                      id="rooms"
                      type="number"
                      min="0"
                      {...register('rooms', { valueAsNumber: true })}
                    />
                    {errors.rooms && <p className="text-sm text-red-500 mt-1">{errors.rooms.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="floor">Floor</Label>
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
                    {isSubmitting ? 'Creating...' : 'Create Property'}
                  </Button>
                  <Link href="/my-properties">
                    <Button variant="outline" type="button">
                      Cancel
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
