'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Request {
  requestId: string;
  propertyId: string;
  type: 'BUY' | 'RENT';
  status: string;
  createdAt: string;
}

interface Property {
  propertyId: string;
  title: string;
}

export default function MyRequestsPage() {
  const { t, i18n } = useTranslation();
  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await api.get<Request[]>('/me/requests');
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

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: t('request.statuses.pending'),
      APPROVED: t('request.statuses.approved'),
      REJECTED: t('request.statuses.rejected'),
    };
    return statusMap[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      BUY: t('request.types.buy'),
      RENT: t('request.types.rent'),
    };
    return typeMap[type] || type;
  };

  return (
    <ProtectedRoute requireRole="USER">
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">{t('request.myRequests')}</h1>

        {isLoading ? (
          <p className="text-zinc-600">{t('request.loadingRequests')}</p>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
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
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Link href={`/properties/${request.propertyId}`}>
                    <Button variant="outline">{t('property.viewProperty')}</Button>
                  </Link>
                  <Link href={`/requests/${request.requestId}`}>
                    <Button variant="outline">{t('property.viewDetails')}</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">{t('request.noRequests')}</p>
            <Link href="/properties">
              <Button>{t('request.browseProperties')}</Button>
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
