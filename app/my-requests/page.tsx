'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search, SlidersHorizontal, X, FileText, Eye, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Home } from 'lucide-react';
import { useState, useMemo } from 'react';

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
  const { token, isInitialized } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await api.get<Request[]>('/me/requests');
      return response.data;
    },
    enabled: !!token && isInitialized,
    staleTime: 60 * 1000,
  });

  // Fetch all properties to get titles
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await api.get<Property[]>('/properties');
      return response.data;
    },
    enabled: !!token && isInitialized && !!requests && requests.length > 0,
    staleTime: 60 * 1000,
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
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
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

  // Filter and search requests
  const filteredRequests = useMemo(() => {
    if (!requests) return [];

    return requests.filter((request) => {
      const propertyTitle = getPropertyTitle(request.propertyId).toLowerCase();
      const matchesSearch = searchQuery === '' || propertyTitle.includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || request.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [requests, searchQuery, selectedType, selectedStatus]);

  const requestTypes = ['all', 'BUY', 'RENT'];
  const requestStatuses = ['all', 'PENDING', 'APPROVED', 'REJECTED'];

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
          {/* Header */}
     

          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="ابحث في طلباتك..."
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
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white rounded-2xl border-2 border-border p-6 space-y-6 animate-in slide-in-from-top-2 fade-in-0">
                {/* Type Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">نوع الطلب</label>
                  <div className="flex flex-wrap gap-2">
                    {requestTypes.map((type) => (
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
                    {requestStatuses.map((status) => (
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
                      {filteredRequests.length} من {requests?.length || 0} طلب
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
          ) : filteredRequests && filteredRequests.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredRequests.length} {filteredRequests.length === 1 ? 'طلب' : 'طلبات'}
                  {hasActiveFilters && ` من ${requests?.length || 0}`}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredRequests.map((request) => (
                  <Card key={request.requestId} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6 space-y-4">
                      {/* Header with Status */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                            <h3 className="font-semibold text-lg text-foreground truncate">
                              {getPropertyTitle(request.propertyId)}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            طلب {getTypeLabel(request.type)}
                          </p>
                        </div>
                        
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{getStatusLabel(request.status)}</span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t">
                        <Calendar className="w-4 h-4" />
                        <span>{t('request.createdOn')} {formatDate(request.createdAt)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Link href={`/properties/${request.propertyId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Eye className="w-4 h-4" />
                            عرض العقار
                          </Button>
                        </Link>
                    
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : requests && requests.length > 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-4">لم يتم العثور على طلبات مطابقة</p>
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-4">{t('request.noRequests')}</p>
              <Link href="/properties">
                <Button size="lg">{t('request.browseProperties')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
