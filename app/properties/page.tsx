'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Property {
  propertyId: string;
  title: string;
  type: string;
  status: string;
}

export default function PropertiesPage() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await api.get<Property[]>('/properties');
      return response.data;
    },
  });

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Properties</h1>

        {isLoading ? (
          <LoadingSpinner className="py-12" />
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.propertyId}>
                <CardHeader>
                  <CardTitle>{property.title}</CardTitle>
                  <CardDescription>
                    {property.type} - {property.status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/properties/${property.propertyId}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600">No properties found.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
