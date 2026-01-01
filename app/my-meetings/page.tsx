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
import { Search, SlidersHorizontal, X, Calendar, MapPin, Eye, User, UserCheck, Clock, Home } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Meeting {
  meetingId: string;
  propertyId: string;
  scheduledAt: string;
  latitude: number;
  longitude: number;
  roleInMeeting: 'BUYER' | 'SELLER';
}

interface Property {
  propertyId: string;
  title: string;
}

export default function MyMeetingsPage() {
  const { t, i18n } = useTranslation();
  const { token, isInitialized } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['my-meetings'],
    queryFn: async () => {
      const response = await api.get<Meeting[]>('/me/meetings');
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
    enabled: !!token && isInitialized && !!meetings && meetings.length > 0,
    staleTime: 60 * 1000,
  });

  const getPropertyTitle = (propertyId: string) => {
    return properties?.find(p => p.propertyId === propertyId)?.title || t('property.title');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'BUYER' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200';
  };

  const getRoleIcon = (role: string) => {
    return role === 'BUYER' ? <User className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />;
  };

  const getRoleLabel = (role: string) => {
    return role === 'BUYER' ? t('meeting.buyer') : t('meeting.seller');
  };

  // Filter and search meetings
  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];

    return meetings.filter((meeting) => {
      const propertyTitle = getPropertyTitle(meeting.propertyId).toLowerCase();
      const matchesSearch = searchQuery === '' || propertyTitle.includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'all' || meeting.roleInMeeting === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [meetings, searchQuery, selectedRole]);

  const meetingRoles = ['all', 'BUYER', 'SELLER'];

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRole('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedRole !== 'all';

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
                  placeholder="ابحث في اجتماعاتك..."
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
                    {[selectedRole !== 'all', searchQuery !== ''].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white rounded-2xl border-2 border-border p-6 space-y-6 animate-in slide-in-from-top-2 fade-in-0">
                {/* Role Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">دورك في الاجتماع</label>
                  <div className="flex flex-wrap gap-2">
                    {meetingRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedRole === role
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        {role === 'all' ? 'الكل' : getRoleLabel(role)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="pt-4 border-t flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {filteredMeetings.length} من {meetings?.length || 0} اجتماع
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
                {selectedRole !== 'all' && (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    {getRoleLabel(selectedRole)}
                    <button onClick={() => setSelectedRole('all')}>
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
          ) : filteredMeetings && filteredMeetings.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredMeetings.length} {filteredMeetings.length === 1 ? 'اجتماع' : 'اجتماعات'}
                  {hasActiveFilters && ` من ${meetings?.length || 0}`}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredMeetings.map((meeting) => (
                  <Card key={meeting.meetingId} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6 space-y-4">
                      {/* Header with Role Badge */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Home className="w-5 h-5 text-primary flex-shrink-0" />
                            <h3 className="font-semibold text-lg text-foreground truncate">
                              {getPropertyTitle(meeting.propertyId)}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            اجتماع عقاري
                          </p>
                        </div>
                        
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(meeting.roleInMeeting)}`}>
                          {getRoleIcon(meeting.roleInMeeting)}
                          <span>{getRoleLabel(meeting.roleInMeeting)}</span>
                        </div>
                      </div>

                      {/* Meeting Details */}
                      <div className="space-y-2 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDate(meeting.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>الإحداثيات: {meeting.latitude.toFixed(4)}, {meeting.longitude.toFixed(4)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Link href={`/properties/${meeting.propertyId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Eye className="w-4 h-4" />
                            عرض العقار
                          </Button>
                        </Link>
                        <Link href={`/meetings/${meeting.meetingId}`} className="flex-1">
                          <Button size="sm" className="w-full gap-2">
                            <MapPin className="w-4 h-4" />
                            التفاصيل
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : meetings && meetings.length > 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-4">لم يتم العثور على اجتماعات مطابقة</p>
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-4">{t('meeting.noMeetings')}</p>
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
