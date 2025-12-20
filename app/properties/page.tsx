'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from 'react-i18next';

interface Property {
  propertyId: string;
  title: string;
  type: string;
  status: string;
}

export default function PropertiesPage() {
  const { t } = useTranslation();
  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await api.get<Property[]>('/properties');
      return response.data;
    },
  });

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
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">{t('nav.properties')}</h1>

        {isLoading ? (
          <LoadingSpinner className="py-12" />
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
                <CardContent>
                  <Link href={`/properties/${property.propertyId}`}>
                    <Button variant="outline" className="w-full">
                      {t('property.viewDetails')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600">{t('property.noProperties')}</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
