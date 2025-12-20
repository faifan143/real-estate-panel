'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const response = await api.get<MeetingDetail>(`/meetings/${id}`);
      return response.data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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
          <p className="text-zinc-600">Loading meeting details...</p>
        ) : meeting ? (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Meeting Details</CardTitle>
                <CardDescription>Meeting ID: {meeting.meetingId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Status</h3>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600">
                    {meeting.status}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Scheduled At</h3>
                  <p className="text-zinc-600">{formatDate(meeting.scheduledAt)}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Location</h3>
                  <p className="text-zinc-600">
                    Latitude: {meeting.latitude.toFixed(6)}
                  </p>
                  <p className="text-zinc-600">
                    Longitude: {meeting.longitude.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${meeting.latitude},${meeting.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Open in Google Maps →
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Participants</h3>
                  <p className="text-zinc-600 text-sm">Buyer ID: {meeting.buyerId}</p>
                  <p className="text-zinc-600 text-sm">Seller ID: {meeting.sellerId}</p>
                </div>

                <div className="pt-4 border-t">
                  <Link href={`/properties/${meeting.propertyId}`}>
                    <Button>View Property</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Link href="/my-meetings">
                <Button variant="ghost">← Back to My Meetings</Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-zinc-600">Meeting not found.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
