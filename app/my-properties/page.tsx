'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { MapPin, Home, Search, SlidersHorizontal, X, Bed, Maximize, Edit, Trash2, Eye, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface PropertyImage {
  imageId: string;
  fileName: string;
  url: string;
}

interface Property {
  propertyId: string;
  title: string;
  type: string;
  status: string;
  ownerId: string;
  price?: number;
  location?: string;
  area?: number;
  rooms?: number;
  images?: PropertyImage[];
}

export default function MyPropertiesPage() {
  const { t } = useTranslation();
  const { userId, token, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    propertyId: string | null;
    title: string;
  }>({ open: false, propertyId: null, title: '' });

  const { data: properties, isLoading, error: queryError } = useQuery({
    queryKey: ['my-properties', userId],
    queryFn: async () => {
      // Try /me/properties endpoint first (if it exists)
      try {
        const response = await api.get<Property[]>('/me/properties');
        return response.data;
      } catch (meError: any) {
        // If /me/properties doesn't exist (404), check if /properties includes ownerId
        if (meError.response?.status === 404) {
          const response = await api.get<any[]>('/properties');
          const allProperties = response.data;
          
          // Check if ownerId exists in the response (it might be present but not typed)
          if (allProperties.length > 0 && allProperties[0].ownerId !== undefined) {
            // ownerId exists, filter by it
            return allProperties.filter((p) => String(p.ownerId) === String(userId));
          }
          
          // If ownerId is not in list response, we need to fetch details
          // This is less efficient but necessary
          const propertiesWithOwner = await Promise.all(
            allProperties.slice(0, 50).map(async (p) => {
              try {
                const detailResponse = await api.get<Property>(`/properties/${p.propertyId}`);
                return detailResponse.data;
              } catch {
                return null;
              }
            })
          );
          
          return propertiesWithOwner.filter(
            (p): p is Property => p !== null && String(p.ownerId) === String(userId)
          );
        }
        throw meError;
      }
    },
    enabled: !!token && !!userId && isInitialized,
    staleTime: 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await api.delete(`/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-properties', userId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(t('property.propertyDeleted'));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('property.deleteFailed');
      toast.error(message);
    },
  });

  const handleDelete = (propertyId: string, status: string, title: string) => {
    if (status !== 'ACTIVE') {
      toast.error(t('property.onlyActiveCanDelete'));
      return;
    }
    setDeleteDialog({
      open: true,
      propertyId,
      title,
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.propertyId) {
      deleteMutation.mutate(deleteDialog.propertyId);
      setDeleteDialog({ open: false, propertyId: null, title: '' });
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

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    return properties.filter((property) => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = selectedType === 'all' || property.type === selectedType;

      // Status filter
      const matchesStatus = selectedStatus === 'all' || property.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [properties, searchQuery, selectedType, selectedStatus]);

  const propertyTypes = ['all', 'APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND'];
  const propertyStatuses = ['all', 'ACTIVE', 'RESERVED', 'CLOSED'];

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedType !== 'all' || selectedStatus !== 'all';

  return (
    <ProtectedRoute requireRole="USER">
      <Navbar />
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-6 lg:px-10 py-8">
        

          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="ابحث في عقاراتك..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-12 h-14 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <Button
                variant={showFilters ? "default" : "outline"}
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="md:w-auto h-14 gap-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>تصفية</span>
                {hasActiveFilters && (
                  <span className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {[selectedType !== 'all', selectedStatus !== 'all', searchQuery !== ''].filter(Boolean).length}
                  </span>
                )}
              </Button>
              <Link href="/my-properties/create">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                {t('property.createProperty')}
              </Button>
            </Link>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white rounded-2xl border-2 border-border p-6 space-y-6 animate-in slide-in-from-top-2 fade-in-0">
                {/* Type Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">نوع العقار</label>
                  <div className="flex flex-wrap gap-2">
                    {propertyTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedType === type
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        {type === 'all' ? 'الكل' : getTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">الحالة</label>
                  <div className="flex flex-wrap gap-2">
                    {propertyStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedStatus === status
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        {status === 'all' ? 'الكل' : getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="pt-4 border-t flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {filteredProperties.length} من {properties?.length || 0} عقار
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      مسح الفلاتر
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && !showFilters && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">التصفية النشطة:</span>
                {selectedType !== 'all' && (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    {getTypeLabel(selectedType)}
                    <button onClick={() => setSelectedType('all')}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    {getStatusLabel(selectedStatus)}
                    <button onClick={() => setSelectedStatus('all')}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  مسح الكل
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <LoadingSpinner className="py-12" />
          ) : queryError ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-10 h-10 text-destructive" />
              </div>
              <p className="text-destructive mb-4">{t('common.error')}: {queryError.message}</p>
            </div>
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredProperties.length} {filteredProperties.length === 1 ? 'عقار' : 'عقارات'}
                  {hasActiveFilters && ` من ${properties?.length || 0}`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProperties.map((property) => {
                  const firstImage = property.images && property.images.length > 0 ? property.images[0] : null;
                  
                  return (
                    <div key={property.propertyId} className="group">
                      <Card className="overflow-hidden border-0 p-0 hover:shadow-2xl transition-all duration-300">
                        {/* Property Image */}
                        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden rounded-t-2xl">
                          {firstImage ? (
                            <img
                              src={firstImage.url}
                              alt={property.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-muted to-muted/50">
                              <Home className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Type Badge */}
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                            {getTypeLabel(property.type)}
                          </div>
                          
                          {/* Status Badge */}
                          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${
                            property.status === 'ACTIVE' 
                              ? 'bg-green-500 text-white' 
                              : property.status === 'RESERVED'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {getStatusLabel(property.status)}
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="p-4 space-y-3 bg-white rounded-b-2xl">
                          {/* Location */}
                          {property.location && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{property.location}</span>
                            </div>
                          )}

                          {/* Title */}
                          <h3 className="font-semibold text-foreground text-lg line-clamp-2 leading-tight min-h-[3.5rem]">
                            {property.title}
                          </h3>

                          {/* Property Features */}
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {property.rooms && (
                              <div className="flex items-center gap-1">
                                <Bed className="w-4 h-4" />
                                <span className="font-medium">{property.rooms}</span>
                              </div>
                            )}
                            {property.area && (
                              <div className="flex items-center gap-1">
                                <Maximize className="w-4 h-4" />
                                <span className="font-medium">{property.area} قدم²</span>
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          {property.price !== undefined && property.price !== null && (
                            <div className="pt-3 border-t">
                              <div className="flex items-baseline gap-1">
                                <span className="font-bold text-foreground text-xl">
                                  ${property.price.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground text-sm font-medium">/ شهر</span>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-3 border-t space-y-2">
                            <Link href={`/properties/${property.propertyId}`} className="block">
                              <Button variant="outline" size="sm" className="w-full gap-2">
                                <Eye className="w-4 h-4" />
                                {t('property.viewDetails')}
                              </Button>
                            </Link>
                            <div className="grid grid-cols-2 gap-2">
                              <Link href={`/properties/${property.propertyId}/edit`} className="block">
                                <Button variant="secondary" size="sm" className="w-full gap-2">
                                  <Edit className="w-4 h-4" />
                                  {t('common.edit')}
                                </Button>
                              </Link>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleDelete(property.propertyId, property.status, property.title)}
                                disabled={property.status !== 'ACTIVE'}
                              >
                                <Trash2 className="w-4 h-4" />
                                {t('common.delete')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </>
          ) : properties && properties.length > 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-4">لم يتم العثور على عقارات مطابقة</p>
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-4">{t('property.noPropertiesYet')}</p>
              <Link href="/my-properties/create">
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  {t('property.createFirstProperty')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={t('property.deleteConfirm')}
        description={`هل أنت متأكد من حذف "${deleteDialog.title}"? هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={confirmDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </ProtectedRoute>
  );
}
