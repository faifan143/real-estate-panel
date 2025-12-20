'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    return properties?.find(p => p.propertyId === propertyId)?.title || 'Property';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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

  return (
    <ProtectedRoute requireRole="USER">
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">My Meetings</h1>

        {isLoading ? (
          <p className="text-zinc-600">Loading your meetings...</p>
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
                        Scheduled for {formatDate(meeting.scheduledAt)} • You are the {meeting.roleInMeeting}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(meeting.roleInMeeting)}`}>
                      {meeting.roleInMeeting}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <Link href={`/properties/${meeting.propertyId}`}>
                      <Button variant="outline">View Property</Button>
                    </Link>
                    <Link href={`/meetings/${meeting.meetingId}`}>
                      <Button variant="outline">View Meeting Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">You don't have any scheduled meetings yet.</p>
            <Link href="/properties">
              <Button>Browse Properties</Button>
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
