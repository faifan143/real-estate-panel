'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

interface PropertyImage {
  imageId: string;
  fileName: string;
  url: string;
}

interface PropertyDetail {
  propertyId: string;
  ownerId: string;
  title: string;
  type: string;
  address?: string;
  description?: string;
  status: string;
  images: PropertyImage[];
}

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { userId, role } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get<PropertyDetail>(`/properties/${id}`);
      return response.data;
    },
  });

  // Fetch user's requests to check for existing PENDING/APPROVED requests for this property
  interface UserRequest {
    requestId: string;
    propertyId: string;
    status: string;
  }
  
  const { data: userRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await api.get<UserRequest[]>('/me/requests');
      return response.data;
    },
    enabled: role === 'USER' && !!property && property.status === 'ACTIVE' && property.ownerId !== userId,
  });

  const isOwner = property && userId === property.ownerId;
  const canEdit = role === 'ADMIN' || isOwner;
  
  // Check if user has existing PENDING or APPROVED request for this property
  const hasExistingRequest = userRequests?.some(
    (req: UserRequest) => req.propertyId === id && (req.status === 'PENDING' || req.status === 'APPROVED')
  );
  
  // Show request buttons only if: USER role, not owner, property is ACTIVE, and no existing PENDING/APPROVED request
  const canCreateRequest = role === 'USER' && !isOwner && property?.status === 'ACTIVE' && !hasExistingRequest;

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`/properties/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Image uploaded successfully');
      setSelectedFile(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await api.delete(`/properties/${id}/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Image deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Delete failed';
      toast.error(message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadImageMutation.mutate(selectedFile);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-8">
        {isLoading ? (
          <p className="text-zinc-600">Loading property...</p>
        ) : property ? (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl">{property.title}</CardTitle>
                    <CardDescription className="text-lg mt-2">
                      {property.type} - {property.status}
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Link href={`/properties/${id}/edit`}>
                      <Button variant="outline">Edit Property</Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.address && (
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-zinc-600">{property.address}</p>
                  </div>
                )}

                {property.description && (
                  <div>
                    <h3 className="font-semibold mb-1">Description</h3>
                    <p className="text-zinc-600">{property.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Images</h3>
                  {property.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.images.map((image: PropertyImage) => (
                        <div key={image.imageId} className="relative aspect-video bg-zinc-100 rounded group">
                          <img
                            src={image.url}
                            alt={image.fileName}
                            className="w-full h-full object-cover rounded"
                          />
                          {canEdit && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteImage(image.imageId)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm">No images uploaded yet.</p>
                  )}

                  {canEdit && (
                    <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">Upload Image</h4>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleUpload}
                          disabled={!selectedFile || uploadImageMutation.isPending}
                        >
                          {uploadImageMutation.isPending ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {canCreateRequest && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">Request Property</h3>
                    <div className="flex gap-3">
                      <CreateRequestButton propertyId={id} type="BUY" />
                      <CreateRequestButton propertyId={id} type="RENT" variant="outline" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
              <Link href="/properties">
                <Button variant="ghost">← Back to Properties</Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-zinc-600">Property not found.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}

function CreateRequestButton({
  propertyId,
  type,
  variant = 'default'
}: {
  propertyId: string;
  type: 'BUY' | 'RENT';
  variant?: 'default' | 'outline';
}) {
  const queryClient = useQueryClient();

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/properties/${propertyId}/requests`, { type });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success(`Request to ${type.toLowerCase()} created successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Request creation failed';
      toast.error(message);
    },
  });

  return (
    <Button
      variant={variant}
      onClick={() => createRequestMutation.mutate()}
      disabled={createRequestMutation.isPending}
    >
      {createRequestMutation.isPending ? 'Creating...' : `Request to ${type === 'BUY' ? 'Buy' : 'Rent'}`}
    </Button>
  );
}
