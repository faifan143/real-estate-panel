'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface MeetingDetail {
  meetingId: string;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  scheduledAt: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface PropertyDetail {
  propertyId: string;
  title: string;
}

export default function MeetingDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { userId, role } = useAuthStore();
  const queryClient = useQueryClient();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const isAdmin = role === 'ADMIN';

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const response = await api.get<MeetingDetail>(`/meetings/${id}`);
      return response.data;
    },
  });

  // Fetch property to get its title
  const { data: property } = useQuery({
    queryKey: ['property', meeting?.propertyId],
    queryFn: async () => {
      const response = await api.get<PropertyDetail>(`/properties/${meeting?.propertyId}`);
      return response.data;
    },
    enabled: !!meeting?.propertyId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Complete meeting mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/admin/meetings/${id}/complete`);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('meeting.meetingCompleted'));
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      queryClient.invalidateQueries({ queryKey: ['my-meetings'] });
      router.push('/my-meetings');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('meeting.completeFailed');
      toast.error(message);
    },
  });

  // Cancel meeting mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/admin/meetings/${id}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('meeting.meetingCancelled'));
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      queryClient.invalidateQueries({ queryKey: ['my-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('meeting.cancelFailed');
      toast.error(message);
    },
  });

  const handleComplete = () => {
    setCompleteDialogOpen(false);
    completeMutation.mutate();
  };

  const handleCancel = () => {
    setCancelDialogOpen(false);
    cancelMutation.mutate();
  };

  const getStatusBadgeColor = (status: string) => {
    const statusColors = {
      SCHEDULED: 'bg-blue-50 text-blue-600',
      COMPLETED: 'bg-green-50 text-green-600',
      CANCELLED: 'bg-red-50 text-red-600',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-50 text-gray-600';
  };

  const canModifyMeeting = isAdmin && meeting?.status === 'SCHEDULED';

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-8">
        {isLoading ? (
          <p className="text-zinc-600">{t('meeting.loadingMeetingDetails')}</p>
        ) : meeting ? (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t('meeting.meetingDetails')}</CardTitle>
                {property && (
                  <CardDescription>{property.title}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">{t('property.status')}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(meeting.status)}`}>
                    {t(`meeting.statuses.${meeting.status.toLowerCase()}`)}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">{t('meeting.scheduledAt')}</h3>
                  <p className="text-zinc-600">{formatDate(meeting.scheduledAt)}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('meeting.meetingLocation')}</h3>
                  <DynamicMapViewer
                    latitude={meeting.latitude}
                    longitude={meeting.longitude}
                    height="400px"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    {t('property.coordinates')}: {meeting.latitude.toFixed(6)}, {meeting.longitude.toFixed(6)}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">{t('meeting.participants')}</h3>
                  <p className="text-zinc-600 text-sm">
                    {meeting.buyerId === userId ? t('meeting.youBuyer') : t('meeting.buyer')}
                  </p>
                  <p className="text-zinc-600 text-sm">
                    {meeting.sellerId === userId ? t('meeting.youSeller') : t('meeting.seller')}
                  </p>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <Link href={`/properties/${meeting.propertyId}`}>
                    <Button className="w-full">{t('property.viewProperty')}</Button>
                  </Link>

                  {/* Admin Actions for Scheduled Meetings */}
                  {canModifyMeeting && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <Button
                        onClick={() => setCompleteDialogOpen(true)}
                        disabled={completeMutation.isPending}
                        className="gap-2"
                        variant="default"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {completeMutation.isPending ? t('meeting.completing') : t('meeting.completeMeeting')}
                      </Button>
                      <Button
                        onClick={() => setCancelDialogOpen(true)}
                        disabled={cancelMutation.isPending}
                        className="gap-2"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4" />
                        {cancelMutation.isPending ? t('meeting.cancelling') : t('meeting.cancelMeeting')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Link href="/my-meetings">
                <Button variant="ghost">← {t('meeting.backToMeetings')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-zinc-600">{t('meeting.meetingNotFound')}</p>
        )}

        {/* Complete Meeting Confirmation Dialog */}
        <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('meeting.completeMeeting')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('meeting.completeConfirmation')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleComplete}>
                {t('meeting.completeMeeting')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Meeting Confirmation Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('meeting.cancelMeeting')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('meeting.cancelConfirmation')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('meeting.cancelMeeting')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
