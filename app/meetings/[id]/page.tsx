'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth';
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
  const id = params.id as string;
  const { userId } = useAuthStore();

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
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600">
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

                <div className="pt-4 border-t">
                  <Link href={`/properties/${meeting.propertyId}`}>
                    <Button>{t('property.viewProperty')}</Button>
                  </Link>
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
      </div>
    </ProtectedRoute>
  );
}
