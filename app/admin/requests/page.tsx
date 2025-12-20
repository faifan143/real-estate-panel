'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

// Dynamically import MapPicker to avoid SSR issues with Mapbox
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

interface AdminRequest {
  requestId: string;
  propertyId: string;
  requesterId: string;
  type: 'BUY' | 'RENT';
  createdAt: string;
}

interface Property {
  propertyId: string;
  title: string;
}

export default function AdminRequestsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      const response = await api.get<AdminRequest[]>('/admin/requests?status=PENDING');
      return response.data;
    },
  });

  // Fetch all properties to get titles
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await api.get<Property[]>('/properties');
      return response.data;
    },
    enabled: !!requests && requests.length > 0,
  });

  const getPropertyTitle = (propertyId: string) => {
    return properties?.find(p => p.propertyId === propertyId)?.title || t('property.title');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      BUY: t('request.types.buy'),
      RENT: t('request.types.rent'),
    };
    return typeMap[type] || type;
  };

  const openApproveModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setApproveModalOpen(true);
  };

  const openRejectModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setRejectModalOpen(true);
  };

  return (
    <ProtectedRoute requireRole="ADMIN">
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">{t('admin.adminRequests')}</h1>

        {isLoading ? (
          <p className="text-zinc-600">{t('admin.loadingPendingRequests')}</p>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request: AdminRequest) => (
              <Card key={request.requestId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {getPropertyTitle(request.propertyId)}
                      </CardTitle>
                      <CardDescription>
                        {getTypeLabel(request.type)} {t('request.request')} • {t('request.createdOn')} {formatDate(request.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-600">
                      {t('request.statuses.pending')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Link href={`/properties/${request.propertyId}`}>
                      <Button variant="outline">{t('property.viewProperty')}</Button>
                    </Link>
                    <Button onClick={() => openApproveModal(request)}>
                      {t('admin.approveRequest')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openRejectModal(request)}
                    >
                      {t('admin.rejectRequest')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600">{t('admin.noPendingRequests')}</p>
          </div>
        )}
      </div>

      {selectedRequest && (
        <>
          <ApproveModal
            open={approveModalOpen}
            onOpenChange={setApproveModalOpen}
            request={selectedRequest}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
              setApproveModalOpen(false);
            }}
          />
          <RejectModal
            open={rejectModalOpen}
            onOpenChange={setRejectModalOpen}
            request={selectedRequest}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
              setRejectModalOpen(false);
            }}
          />
        </>
      )}
    </ProtectedRoute>
  );
}

function ApproveModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AdminRequest;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [scheduledAt, setScheduledAt] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapKey, setMapKey] = useState(0);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setScheduledAt('');
      setLatitude(null);
      setLongitude(null);
      // Generate new key for map to force remount
      setMapKey(prev => prev + 1);
    }
  }, [open]);

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO string
      const scheduledAtISO = scheduledAt ? new Date(scheduledAt).toISOString() : '';
      if (latitude === null || longitude === null) {
        throw new Error(t('admin.pleaseSelectLocation'));
      }
      const response = await api.post(`/admin/requests/${request.requestId}/approve`, {
        scheduledAt: scheduledAtISO,
        latitude,
        longitude,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('admin.requestApproved'));
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('admin.approvalFailed');
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    approveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.approveRequest')}</DialogTitle>
          <DialogDescription>
            {t('admin.setMeetingDetails', { type: t(`request.types.${request.type.toLowerCase()}`) })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="scheduledAt">{t('admin.scheduledDateTime')} *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          {open && (
            <>
              <Label>{t('admin.meetingLocationRequired')}</Label>
              <DynamicMapPicker
                key={`map-picker-${request.requestId}-${mapKey}`}
                mapKey={`${request.requestId}-${mapKey}`}
                latitude={latitude}
                longitude={longitude}
                onLocationChange={handleLocationChange}
              />
            </>
          )}
      
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={approveMutation.isPending}>
              {approveMutation.isPending ? t('admin.approving') : t('admin.approveRequestButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AdminRequest;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/admin/requests/${request.requestId}/reject`, {
        reason: reason || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('admin.requestRejected'));
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('admin.rejectionFailed');
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rejectMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.rejectRequest')}</DialogTitle>
          <DialogDescription>
            {t('admin.rejectDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">{t('admin.rejectionReason')}</Label>
            <Textarea
              id="reason"
              placeholder={t('admin.enterRejectionReason')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="destructive"
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t('admin.rejecting') : t('admin.rejectRequestButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
