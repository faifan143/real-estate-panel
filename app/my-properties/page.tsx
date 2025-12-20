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

interface Property {
  propertyId: string;
  title: string;
  type: string;
  status: string;
  ownerId: string;
}

export default function MyPropertiesPage() {
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
      toast.success('Property deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Delete failed';
      toast.error(message);
    },
  });

  const handleDelete = (propertyId: string, status: string) => {
    if (status !== 'ACTIVE') {
      toast.error('Only ACTIVE properties can be deleted');
      return;
    }
    if (confirm('Are you sure you want to delete this property?')) {
      deleteMutation.mutate(propertyId);
    }
  };

  return (
    <ProtectedRoute requireRole="USER">
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Properties</h1>
          <Link href="/my-properties/create">
            <Button>Create Property</Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-zinc-600">Loading your properties...</p>
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
                <CardContent className="space-y-2">
                  <Link href={`/properties/${property.propertyId}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/properties/${property.propertyId}/edit`}>
                    <Button variant="outline" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDelete(property.propertyId, property.status)}
                    disabled={property.status !== 'ACTIVE'}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">You don't have any properties yet.</p>
            <Link href="/my-properties/create">
              <Button>Create Your First Property</Button>
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
