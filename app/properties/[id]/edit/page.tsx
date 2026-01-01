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
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';
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
  latitude: yup.number().optional().nullable(),
  longitude: yup.number().optional().nullable(),
  area: yup.number().min(0, 'Area must be positive').integer('Area must be an integer').optional().nullable(),
  rooms: yup.number().min(0, 'Rooms must be positive').integer('Rooms must be an integer').optional().nullable(),
  floor: yup.number().integer('Floor must be an integer').optional().nullable(),
  status: yup.string().optional(),
});

type PropertyFormData = yup.InferType<typeof propertySchema>;

interface PropertyDetail {
  propertyId: string;
  ownerId: string;
  title: string;
  type: string;
  address?: string;
  description?: string;
  price?: number;
  latitude?: number;
  longitude?: number;
  area?: number;
  rooms?: number;
  floor?: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  images?: Array<{
    imageId: string;
    fileName: string;
    url: string;
  }>;
}

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { userId, role } = useAuthStore();
  const [mapKey, setMapKey] = useState(0);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get<PropertyDetail>(`/properties/${id}`);
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: yupResolver(propertySchema) as any,
    defaultValues: {
      title: '',
      type: '',
      address: '',
      description: '',
      price: undefined,
      latitude: null,
      longitude: null,
      area: undefined,
      rooms: undefined,
      floor: undefined,
      status: '',
    },
  });

  useEffect(() => {
    if (property) {
      const lat = property.latitude ?? null;
      const lng = property.longitude ?? null;
      setLatitude(lat);
      setLongitude(lng);
      setMapKey(prev => prev + 1); // Force map remount with new coordinates
      
      // Use reset with all values - this should properly update Select components
      const formData = {
        title: property.title || '',
        type: property.type || '',
        address: property.address || '',
        description: property.description || '',
        price: property.price ?? undefined,
        latitude: lat,
        longitude: lng,
        area: property.area ?? undefined,
        rooms: property.rooms ?? undefined,
        floor: property.floor ?? undefined,
        status: property.status || '',
      };
      
      reset(formData);
      
      // Explicitly set Select values after a small delay to ensure they update
      setTimeout(() => {
        if (property.type) {
          setValue('type', property.type, { shouldValidate: false });
        }
        if (property.status) {
          setValue('status', property.status, { shouldValidate: false });
        }
      }, 0);
    }
  }, [property, reset, setValue]);

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const isOwner = property && userId === property.ownerId;
  const canEdit = role === 'ADMIN' || isOwner;

  const onSubmit = async (data: PropertyFormData) => {
    try {
      await api.patch(`/properties/${id}`, data);
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully!');
      router.push(`/properties/${id}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="container mx-auto p-8">
          <p className="text-zinc-600">Loading property...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!canEdit) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="container mx-auto p-8">
          <p className="text-red-600">You don't have permission to edit this property.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Property</CardTitle>
              <CardDescription>Update property details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" key={property?.propertyId}>
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                {property && (
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || property.type || undefined}
                        >
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
                )}

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
                  <Label>Property Location on Map</Label>
                  <DynamicMapPicker
                    key={`map-picker-${id}-${mapKey}`}
                    mapKey={`${id}-${mapKey}`}
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

                {property && (
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || property.status || undefined}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="RESERVED">Reserved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Property'}
                  </Button>
                  <Link href={`/properties/${id}`}>
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
