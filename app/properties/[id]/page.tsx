'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { predictPrice } from '@/lib/price-prediction';
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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

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
  const [deleteImageDialog, setDeleteImageDialog] = useState<{
    open: boolean;
    imageId: string | null;
    fileName: string;
  }>({ open: false, imageId: null, fileName: '' });
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateResult, setEstimateResult] = useState<{
    buyPrice: number;
    monthlyRent?: number;
  } | null>(null);

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

  const isOwner = property && userId && String(property.ownerId) === String(userId);
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
    if (!canEdit) {
      toast.error('ليس لديك صلاحية لرفع الصور على هذا العقار');
      return;
    }
    if (selectedFile) {
      uploadImageMutation.mutate(selectedFile);
    }
  };

  const handleDeleteImage = (imageId: string, fileName: string) => {
    if (!canEdit) {
      toast.error('ليس لديك صلاحية لحذف الصور من هذا العقار');
      return;
    }
    setDeleteImageDialog({
      open: true,
      imageId,
      fileName,
    });
  };

  const confirmDeleteImage = () => {
    if (deleteImageDialog.imageId) {
      deleteImageMutation.mutate(deleteImageDialog.imageId);
      setDeleteImageDialog({ open: false, imageId: null, fileName: '' });
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

  const canShowEstimate =
    property &&
    (property.type === 'HOUSE' || property.type === 'APARTMENT') &&
    typeof property.address === 'string' &&
    property.address.trim().length > 0 &&
    typeof property.area === 'number' &&
    !Number.isNaN(property.area) &&
    property.area > 0 &&
    typeof property.rooms === 'number' &&
    !Number.isNaN(property.rooms) &&
    property.rooms >= 0;

  const handleGetAiEstimate = async () => {
    if (!property || !canShowEstimate) return;
    setEstimateLoading(true);
    setEstimateResult(null);
    try {
      const result = await predictPrice({
        type: property.type as 'HOUSE' | 'APARTMENT',
        location: property.address!.trim(),
        area: property.area!,
        rooms: property.rooms!,
        ...(property.floor !== undefined && property.floor !== null && !Number.isNaN(property.floor)
          ? { floor: property.floor }
          : {}),
        ...(property.description ? { description: property.description } : {}),
        propertyId: parseInt(property.propertyId, 10),
      });
      const buyPrice = result.estimatedBuyPrice ?? result.estimatedPrice;
      setEstimateResult({
        buyPrice,
        monthlyRent: result.estimatedMonthlyRent,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || t('property.aiEstimationUnavailable');
      toast.error(msg);
    } finally {
      setEstimateLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="bg-background min-h-screen">
        {isLoading ? (
          <div className="container mx-auto px-6 lg:px-10 py-12">
            <p className="text-muted-foreground text-center">{t('property.loadingPropertyDetails')}</p>
          </div>
        ) : property ? (
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
            {/* Property Images Gallery */}
            <div className="mb-8">
              {property.images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 h-[500px] rounded-2xl overflow-hidden">
                  <div className="col-span-2 row-span-2">
                    <img
                      src={property.images[0].url}
                      alt={property.title}
                      className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
                    />
                  </div>
                  {property.images.slice(1, 5).map((image, idx) => (
                    <div key={image.imageId} className={idx >= 2 ? "col-span-1" : "col-span-1 row-span-1"}>
                      <img
                        src={image.url}
                        alt={`${property.title} ${idx + 2}`}
                        className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-[500px] bg-muted rounded-2xl flex items-center justify-center">
                  <p className="text-muted-foreground">{t('property.noImages')}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div className="space-y-4 pb-8 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-3xl font-semibold text-foreground mb-2">
                        {property.title}
                      </h1>
                      <div className="flex items-center gap-3 text-base text-muted-foreground">
                        <span>{getTypeLabel(property.type)}</span>
                        <span>·</span>
                        <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                          {getStatusLabel(property.status)}
                        </span>
                        {isOwner && (
                          <>
                            <span>·</span>
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                              عقارك
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <Link href={`/properties/${id}/edit`}>
                        <Button variant="outline" size="sm">{t('property.editProperty')}</Button>
                      </Link>
                    )}
                  </div>
                  
                  {/* Property Stats */}
                  <div className="flex items-center gap-4 text-base">
                    {property.rooms && (
                      <span className="font-medium">{property.rooms} غرف</span>
                    )}
                    {property.area && (
                      <>
                        {property.rooms && <span className="text-muted-foreground">·</span>}
                        <span className="font-medium">{property.area} قدم مربع</span>
                      </>
                    )}
                    {property.floor !== undefined && property.floor !== null && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium">الطابق {property.floor}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {property.description && (
                  <div className="space-y-3 pb-8 border-b">
                    <h2 className="text-xl font-semibold">{t('property.description')}</h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Address */}
                {property.address && (
                  <div className="space-y-3 pb-8 border-b">
                    <h2 className="text-xl font-semibold">{t('property.address')}</h2>
                    <p className="text-base text-muted-foreground">{property.address}</p>
                  </div>
                )}

                {/* Map */}
                {(property.latitude !== undefined && property.latitude !== null) &&
                (property.longitude !== undefined && property.longitude !== null) && (
                  <div className="space-y-3 pb-8 border-b">
                    <h2 className="text-xl font-semibold">{t('property.locationOnMap')}</h2>
                    <div className="rounded-2xl overflow-hidden">
                      <DynamicMapViewer
                        latitude={property.latitude}
                        longitude={property.longitude}
                        height="400px"
                      />
                    </div>
                  </div>
                )}

                {/* Image Management for Owner/Admin */}
                {canEdit && (
                  <div className="space-y-4 pb-8 border-b">
                    <h2 className="text-xl font-semibold">{t('property.images')}</h2>
                    
                    {property.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {property.images.map((image: PropertyImage) => (
                          <div key={image.imageId} className="relative aspect-square bg-muted rounded-xl group overflow-hidden">
                            <img
                              src={image.url}
                              alt={image.fileName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteImage(image.imageId, image.fileName)}
                              >
                                {t('common.delete')}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-2xl p-6 space-y-3">
                      <h3 className="font-semibold">{t('property.uploadImage')}</h3>
                      <div className="flex gap-3">
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
                  </div>
                )}
              </div>

              {/* Sticky Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 p-6 shadow-xl border-2">
                  <div className="space-y-6">
                    {/* Price */}
                    {property.price !== undefined && property.price !== null && (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-semibold text-foreground">
                            ${property.price.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">/ شهر</span>
                        </div>
                      </div>
                    )}

                    {/* AI price estimate (for browse) */}
                    {canShowEstimate && (
                      <div className="space-y-2 pt-2 border-t">
                        {estimateResult !== null ? (
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                {t('property.estimatedBuyPrice')}
                              </p>
                              <p className="text-xl font-semibold text-foreground">
                                ${estimateResult.buyPrice.toLocaleString()}
                              </p>
                            </div>
                            {estimateResult.monthlyRent != null && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  {t('property.estimatedMonthlyRent')}
                                </p>
                                <p className="text-lg font-semibold text-foreground">
                                  ${estimateResult.monthlyRent.toLocaleString()} / {t('property.perMonth')}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={estimateLoading}
                            onClick={handleGetAiEstimate}
                          >
                            {estimateLoading ? t('property.estimatingPrice') : t('property.getAiPriceEstimate')}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Request Buttons */}
                    {canCreateRequest && (
                      <div className="space-y-3 pt-4 border-t">
                        <CreateRequestButton propertyId={id} type="BUY" />
                        <CreateRequestButton propertyId={id} type="RENT" variant="outline" />
                      </div>
                    )}

                    {/* Property Details Grid */}
                    <div className="pt-6 border-t space-y-4">
                      <h3 className="font-semibold text-base">تفاصيل العقار</h3>
                      <div className="space-y-3">
                        {property.type && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">النوع</span>
                            <span className="font-medium">{getTypeLabel(property.type)}</span>
                          </div>
                        )}
                        {property.rooms !== undefined && property.rooms !== null && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">عدد الغرف</span>
                            <span className="font-medium">{property.rooms}</span>
                          </div>
                        )}
                        {property.area !== undefined && property.area !== null && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">المساحة</span>
                            <span className="font-medium">{property.area} قدم²</span>
                          </div>
                        )}
                        {property.floor !== undefined && property.floor !== null && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">الطابق</span>
                            <span className="font-medium">{property.floor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-12 pb-12">
              <Link href="/properties">
                <Button variant="ghost" size="lg" className="gap-2">
                  ← {t('common.back')} إلى {t('nav.properties')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-6 lg:px-10 py-12">
            <p className="text-muted-foreground text-center">{t('property.propertyNotFound')}</p>
          </div>
        )}
      </div>

      {/* Delete Image Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteImageDialog.open}
        onOpenChange={(open) => setDeleteImageDialog({ ...deleteImageDialog, open })}
        title="حذف الصورة"
        description={`هل أنت متأكد من حذف "${deleteImageDialog.fileName}"? هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={confirmDeleteImage}
        variant="destructive"
        loading={deleteImageMutation.isPending}
      />
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
      className="w-full"
    >
      {createRequestMutation.isPending ? t('common.loading') : `${t('request.request')} ${type === 'BUY' ? t('request.types.buy') : t('request.types.rent')}`}
    </Button>
  );
}
