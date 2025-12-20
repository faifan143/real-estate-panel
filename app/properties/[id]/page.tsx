'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

// Dynamically import MapViewer to avoid SSR issues
const DynamicMapViewer = dynamic(
  () => import('@/components/ui/map-viewer').then((mod) => ({ default: mod.MapViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-zinc-100 rounded-lg flex items-center justify-center">
        <p className="text-zinc-600">Loading map...</p>
      </div>
    ),
  }
);

interface PropertyImage {
  imageId: string;
  fileName: string;
  url: string;
}

interface PropertyDetail {
  propertyId: string;
  ownerId: string;
  title: string;
  type: string;
  address?: string;
  description?: string;
  price?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  rooms?: number;
  floor?: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  images: PropertyImage[];
}

export default function PropertyDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = params.id as string;
  const { userId, role } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get<PropertyDetail>(`/properties/${id}`);
      return response.data;
    },
  });

  // Fetch user's requests to check for existing PENDING/APPROVED requests for this property
  interface UserRequest {
    requestId: string;
    propertyId: string;
    status: string;
  }
  
  const { data: userRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await api.get<UserRequest[]>('/me/requests');
      return response.data;
    },
    enabled: role === 'USER' && !!property && property.status === 'ACTIVE' && property.ownerId !== userId,
  });

  const isOwner = property && userId === property.ownerId;
  const canEdit = role === 'ADMIN' || isOwner;
  
  // Check if user has existing PENDING or APPROVED request for this property
  const hasExistingRequest = userRequests?.some(
    (req: UserRequest) => req.propertyId === id && (req.status === 'PENDING' || req.status === 'APPROVED')
  );
  
  // Show request buttons only if: USER role, not owner, property is ACTIVE, and no existing PENDING/APPROVED request
  const canCreateRequest = role === 'USER' && !isOwner && property?.status === 'ACTIVE' && !hasExistingRequest;

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`/properties/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success(t('property.uploadImage'));
      setSelectedFile(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('common.error');
      toast.error(message);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await api.delete(`/properties/${id}/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success(t('common.success'));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('common.error');
      toast.error(message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadImageMutation.mutate(selectedFile);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    if (confirm(t('common.confirm'))) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      APARTMENT: t('property.types.apartment'),
      HOUSE: t('property.types.house'),
      COMMERCIAL: t('property.types.commercial'),
      LAND: t('property.types.land'),
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: t('property.statuses.active'),
      RESERVED: t('property.statuses.reserved'),
      CLOSED: t('property.statuses.closed'),
    };
    return statusMap[status] || status;
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-8">
        {isLoading ? (
          <p className="text-zinc-600">{t('property.loadingPropertyDetails')}</p>
        ) : property ? (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl">{property.title}</CardTitle>
                    <CardDescription className="text-lg mt-2">
                      {getTypeLabel(property.type)} - {getStatusLabel(property.status)}
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Link href={`/properties/${id}/edit`}>
                      <Button variant="outline">{t('property.editProperty')}</Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.address && (
                  <div>
                    <h3 className="font-semibold mb-1">{t('property.address')}</h3>
                    <p className="text-zinc-600">{property.address}</p>
                  </div>
                )}

                {property.description && (
                  <div>
                    <h3 className="font-semibold mb-1">{t('property.description')}</h3>
                    <p className="text-zinc-600">{property.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.price !== undefined && property.price !== null && (
                    <div>
                      <h3 className="font-semibold mb-1 text-sm text-zinc-500">{t('property.price')}</h3>
                      <p className="text-zinc-900 font-medium">${property.price.toLocaleString()}</p>
                    </div>
                  )}
                  {property.area !== undefined && property.area !== null && (
                    <div>
                      <h3 className="font-semibold mb-1 text-sm text-zinc-500">{t('property.area')}</h3>
                      <p className="text-zinc-900 font-medium">{property.area} sq ft</p>
                    </div>
                  )}
                  {property.rooms !== undefined && property.rooms !== null && (
                    <div>
                      <h3 className="font-semibold mb-1 text-sm text-zinc-500">{t('property.rooms')}</h3>
                      <p className="text-zinc-900 font-medium">{property.rooms}</p>
                    </div>
                  )}
                  {property.floor !== undefined && property.floor !== null && (
                    <div>
                      <h3 className="font-semibold mb-1 text-sm text-zinc-500">{t('property.floor')}</h3>
                      <p className="text-zinc-900 font-medium">{property.floor}</p>
                    </div>
                  )}
                  {property.location && (
                    <div>
                      <h3 className="font-semibold mb-1 text-sm text-zinc-500">{t('property.location')}</h3>
                      <p className="text-zinc-900 font-medium">{property.location}</p>
                    </div>
                  )}
                </div>

                {(property.latitude !== undefined && property.latitude !== null) &&
                (property.longitude !== undefined && property.longitude !== null) ? (
                  <div>
                    <h3 className="font-semibold mb-2">{t('property.locationOnMap')}</h3>
                    <DynamicMapViewer
                      latitude={property.latitude}
                      longitude={property.longitude}
                      height="400px"
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      {t('property.coordinates')}: {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                    </p>
                  </div>
                ) : null}

                <div>
                  <h3 className="font-semibold mb-2">{t('property.images')}</h3>
                  {property.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.images.map((image: PropertyImage) => (
                        <div key={image.imageId} className="relative aspect-video bg-zinc-100 rounded group">
                          <img
                            src={image.url}
                            alt={image.fileName}
                            className="w-full h-full object-cover rounded"
                          />
                          {canEdit && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteImage(image.imageId)}
                              >
                                {t('common.delete')}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm">{t('property.noImages')}</p>
                  )}

                  {canEdit && (
                    <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">{t('property.uploadImage')}</h4>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleUpload}
                          disabled={!selectedFile || uploadImageMutation.isPending}
                        >
                          {uploadImageMutation.isPending ? t('property.uploading') : t('property.upload')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {canCreateRequest && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">{t('request.request')} {t('property.title')}</h3>
                    <div className="flex gap-3">
                      <CreateRequestButton propertyId={id} type="BUY" />
                      <CreateRequestButton propertyId={id} type="RENT" variant="outline" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
              <Link href="/properties">
                <Button variant="ghost">← {t('common.back')} {t('nav.properties')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-zinc-600">{t('property.propertyNotFound')}</p>
        )}
      </div>
    </ProtectedRoute>
  );
}

function CreateRequestButton({
  propertyId,
  type,
  variant = 'default'
}: {
  propertyId: string;
  type: 'BUY' | 'RENT';
  variant?: 'default' | 'outline';
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/properties/${propertyId}/requests`, { type });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success(t('request.request') + ' ' + t('common.success'));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('common.error');
      toast.error(message);
    },
  });

  return (
    <Button
      variant={variant}
      onClick={() => createRequestMutation.mutate()}
      disabled={createRequestMutation.isPending}
    >
      {createRequestMutation.isPending ? t('common.loading') : `${t('request.request')} ${type === 'BUY' ? t('request.types.buy') : t('request.types.rent')}`}
    </Button>
  );
}
