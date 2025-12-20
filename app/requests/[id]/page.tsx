'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

interface RequestDetail {
  requestId: string;
  propertyId: string;
  requesterId: string;
  type: 'BUY' | 'RENT';
  status: string;
  createdAt: string;
  decisionAt?: string;
}

interface Meeting {
  meetingId: string;
  propertyId: string;
  scheduledAt: string;
  latitude: number;
  longitude: number;
  roleInMeeting: 'BUYER' | 'SELLER';
}

interface PropertyDetail {
  propertyId: string;
  title: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { userId } = useAuthStore();

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const response = await api.get<RequestDetail>(`/requests/${id}`);
      return response.data;
    },
  });

  // Fetch property to get its title
  const { data: property } = useQuery({
    queryKey: ['property', request?.propertyId],
    queryFn: async () => {
      const response = await api.get<PropertyDetail>(`/properties/${request?.propertyId}`);
      return response.data;
    },
    enabled: !!request?.propertyId,
  });

  // Fetch meetings to find the one associated with this approved request
  const { data: meetings } = useQuery({
    queryKey: ['my-meetings'],
    queryFn: async () => {
      const response = await api.get<Meeting[]>('/me/meetings');
      return response.data;
    },
    enabled: !!request && request.status === 'APPROVED' && request.requesterId === userId,
  });

  // Find meeting for this property
  const meeting = meetings?.find((m: Meeting) => m.propertyId === request?.propertyId);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'APPROVED':
        return 'text-green-600 bg-green-50';
      case 'REJECTED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-zinc-600 bg-zinc-50';
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-8">
        {isLoading ? (
          <p className="text-zinc-600">Loading request details...</p>
        ) : request ? (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">
                      {property ? property.title : `${request.type} Request`}
                    </CardTitle>
                    <CardDescription>{request.type} Request</CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                <div>
                  <h3 className="font-semibold mb-1">Created At</h3>
                  <p className="text-zinc-600">{formatDate(request.createdAt)}</p>
                </div>

                {request.decisionAt && (
                  <div>
                    <h3 className="font-semibold mb-1">Decision At</h3>
                    <p className="text-zinc-600">{formatDate(request.decisionAt)}</p>
                  </div>
                )}

                <div className="pt-4 border-t flex gap-3">
                  <Link href={`/properties/${request.propertyId}`}>
                    <Button>View Property</Button>
                  </Link>
                  {request.status === 'APPROVED' && meeting && (
                    <Link href={`/meetings/${meeting.meetingId}`}>
                      <Button variant="outline">View Meeting</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Link href="/my-requests">
                <Button variant="ghost">← Back to My Requests</Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-zinc-600">Request not found.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
