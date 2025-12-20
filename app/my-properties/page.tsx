'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Property {
  propertyId: string;
  title: string;
  type: string;
  status: string;
  ownerId: string;
}

export default function MyPropertiesPage() {
  const { t } = useTranslation();
  const { userId } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await api.get<Property[]>('/properties');
      return response.data.filter((p) => p.ownerId === userId);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await api.delete(`/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(t('property.propertyDeleted'));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('property.deleteFailed');
      toast.error(message);
    },
  });

  const handleDelete = (propertyId: string, status: string) => {
    if (status !== 'ACTIVE') {
      toast.error(t('property.onlyActiveCanDelete'));
      return;
    }
    if (confirm(t('property.deleteConfirm'))) {
      deleteMutation.mutate(propertyId);
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
    <ProtectedRoute requireRole="USER">
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('nav.myProperties')}</h1>
          <Link href="/my-properties/create">
            <Button>{t('property.createProperty')}</Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-zinc-600">{t('property.loadingProperties')}</p>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.propertyId}>
                <CardHeader>
                  <CardTitle>{property.title}</CardTitle>
                  <CardDescription>
                    {getTypeLabel(property.type)} - {getStatusLabel(property.status)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/properties/${property.propertyId}`}>
                    <Button variant="outline" className="w-full">
                      {t('property.viewDetails')}
                    </Button>
                  </Link>
                  <Link href={`/properties/${property.propertyId}/edit`}>
                    <Button variant="outline" className="w-full">
                      {t('common.edit')}
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDelete(property.propertyId, property.status)}
                    disabled={property.status !== 'ACTIVE'}
                  >
                    {t('common.delete')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">{t('property.noPropertiesYet')}</p>
            <Link href="/my-properties/create">
              <Button>{t('property.createFirstProperty')}</Button>
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
