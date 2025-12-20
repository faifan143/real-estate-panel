'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Meeting {
  meetingId: string;
  propertyId: string;
  scheduledAt: string;
  latitude: number;
  longitude: number;
  roleInMeeting: 'BUYER' | 'SELLER';
}

interface Property {
  propertyId: string;
  title: string;
}

export default function MyMeetingsPage() {
  const { t, i18n } = useTranslation();
  const { data: meetings, isLoading } = useQuery({
    queryKey: ['my-meetings'],
    queryFn: async () => {
      const response = await api.get<Meeting[]>('/me/meetings');
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
    enabled: !!meetings && meetings.length > 0,
  });

  const getPropertyTitle = (propertyId: string) => {
    return properties?.find(p => p.propertyId === propertyId)?.title || t('property.title');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'BUYER' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50';
  };

  const getRoleLabel = (role: string) => {
    return role === 'BUYER' ? t('meeting.buyer') : t('meeting.seller');
  };

  return (
    <ProtectedRoute requireRole="USER">
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">{t('meeting.myMeetings')}</h1>

        {isLoading ? (
          <p className="text-zinc-600">{t('meeting.loadingMeetings')}</p>
        ) : meetings && meetings.length > 0 ? (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Card key={meeting.meetingId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {getPropertyTitle(meeting.propertyId)}
                      </CardTitle>
                      <CardDescription>
                        {t('meeting.scheduledFor')} {formatDate(meeting.scheduledAt)} • {t('meeting.youAre')} {getRoleLabel(meeting.roleInMeeting)}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(meeting.roleInMeeting)}`}>
                      {getRoleLabel(meeting.roleInMeeting)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <Link href={`/properties/${meeting.propertyId}`}>
                      <Button variant="outline">{t('property.viewProperty')}</Button>
                    </Link>
                    <Link href={`/meetings/${meeting.meetingId}`}>
                      <Button variant="outline">{t('meeting.meetingDetails')}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">{t('meeting.noMeetings')}</p>
            <Link href="/properties">
              <Button>{t('request.browseProperties')}</Button>
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
