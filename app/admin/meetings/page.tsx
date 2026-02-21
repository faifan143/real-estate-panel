"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Navbar } from "@/components/navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import {
  Search,
  SlidersHorizontal,
  X,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  User,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Meeting {
  meetingId: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  scheduledAt: string;
  latitude: number;
  longitude: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export default function AdminMeetingsPage() {
  const { t, i18n } = useTranslation();
  const { token, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["admin-meetings"],
    queryFn: async () => {
      const response = await api.get<Meeting[]>("/admin/meetings");
      return response.data;
    },
    enabled: !!token && isInitialized,
    staleTime: 60 * 1000,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(
      i18n.language === "ar" ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: {
        label: t("meeting.statuses.scheduled"),
        className: "bg-blue-50 text-blue-600",
      },
      COMPLETED: {
        label: t("meeting.statuses.completed"),
        className: "bg-green-50 text-green-600",
      },
      CANCELLED: {
        label: t("meeting.statuses.cancelled"),
        className: "bg-red-50 text-red-600",
      },
    };
    return (
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.SCHEDULED
    );
  };

  // Filter and search logic
  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];

    return meetings.filter((meeting) => {
      const matchesSearch = searchQuery
        ? meeting.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          meeting.propertyLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          meeting.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          meeting.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          meeting.meetingId.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesStatus =
        selectedStatus === "all" || meeting.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchQuery, selectedStatus]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
  };

  const hasActiveFilters = searchQuery || selectedStatus !== "all";

  // Complete meeting mutation
  const completeMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const response = await api.post(`/admin/meetings/${meetingId}/complete`);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("meeting.meetingCompleted"));
      queryClient.invalidateQueries({ queryKey: ["admin-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setCompleteDialogOpen(false);
      setSelectedMeeting(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || t("meeting.completeFailed");
      toast.error(message);
    },
  });

  // Cancel meeting mutation
  const cancelMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const response = await api.post(`/admin/meetings/${meetingId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("meeting.meetingCancelled"));
      queryClient.invalidateQueries({ queryKey: ["admin-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setCancelDialogOpen(false);
      setSelectedMeeting(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || t("meeting.cancelFailed");
      toast.error(message);
    },
  });

  const handleComplete = () => {
    if (selectedMeeting) {
      completeMutation.mutate(selectedMeeting.meetingId);
    }
  };

  const handleCancel = () => {
    if (selectedMeeting) {
      cancelMutation.mutate(selectedMeeting.meetingId);
    }
  };

  const openCompleteDialog = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setCompleteDialogOpen(true);
  };

  const openCancelDialog = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setCancelDialogOpen(true);
  };

  return (
    <ProtectedRoute requireRole="ADMIN">
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">{t("admin.adminMeetings")}</h1>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t("admin.searchMeetings")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-14 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-900"
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
              <span>{t("common.filter")}</span>
              {hasActiveFilters && (
                <span className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {[selectedStatus !== "all", searchQuery !== ""].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border-2 border-zinc-200 p-6 space-y-6 animate-in slide-in-from-top-2 fade-in-0">
              {/* Status Filter */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-900">
                  {t("meeting.status")}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedStatus("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedStatus === "all"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    {t("common.all")}
                  </button>
                  <button
                    onClick={() => setSelectedStatus("SCHEDULED")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedStatus === "SCHEDULED"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t("meeting.statuses.scheduled")}
                  </button>
                  <button
                    onClick={() => setSelectedStatus("COMPLETED")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedStatus === "COMPLETED"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t("meeting.statuses.completed")}
                  </button>
                  <button
                    onClick={() => setSelectedStatus("CANCELLED")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedStatus === "CANCELLED"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {t("meeting.statuses.cancelled")}
                  </button>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-zinc-600">
                    {filteredMeetings.length} {t("meeting.meeting")}
                    {filteredMeetings.length !== 1 && "s"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    {t("common.clearFilters")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && !showFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-zinc-600">
                {t("common.activeFilters")}:
              </span>
              {selectedStatus !== "all" && (
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  {t(`meeting.statuses.${selectedStatus.toLowerCase()}`)}
                  <button onClick={() => setSelectedStatus("all")}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-zinc-600 hover:text-zinc-900 underline"
              >
                {t("common.clearAll")}
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="text-zinc-600">{t("meeting.loadingMeetings")}</p>
        ) : filteredMeetings && filteredMeetings.length > 0 ? (
          <div className="space-y-4">
            {filteredMeetings.map((meeting: Meeting) => {
              const statusBadge = getStatusBadge(meeting.status);
              const isScheduled = meeting.status === "SCHEDULED";

              return (
                <Card key={meeting.meetingId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          {meeting.propertyTitle}
                        </CardTitle>
                        <CardDescription className="space-y-1 mt-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{meeting.propertyLocation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            <span>
                              {t("meeting.buyer")}: {meeting.buyerName} • {t("meeting.seller")}: {meeting.sellerName}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-zinc-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(meeting.scheduledAt)}</span>
                      </div>
                      {meeting.propertyPrice && (
                        <div className="flex items-center gap-2 font-semibold text-zinc-900">
                          <span className="text-lg">
                            {meeting.propertyPrice.toLocaleString()} {t("property.currency")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <Link href={`/properties/${meeting.propertyId}`}>
                        <Button variant="outline" size="sm">
                          {t("property.viewProperty")}
                        </Button>
                      </Link>
                      <Link href={`/meetings/${meeting.meetingId}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          {t("meeting.viewDetails")}
                        </Button>
                      </Link>
                      {isScheduled && (
                        <>
                          <Button
                            onClick={() => openCompleteDialog(meeting)}
                            disabled={completeMutation.isPending}
                            size="sm"
                            className="gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {t("meeting.completeMeeting")}
                          </Button>
                          <Button
                            onClick={() => openCancelDialog(meeting)}
                            disabled={cancelMutation.isPending}
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            {t("meeting.cancelMeeting")}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600">
              {hasActiveFilters
                ? t("admin.noMeetingsMatchFilters")
                : t("admin.noMeetings")}
            </p>
          </div>
        )}

        {/* Complete Meeting Confirmation Dialog */}
        <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("meeting.completeMeeting")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("meeting.completeConfirmation")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleComplete}>
                {t("meeting.completeMeeting")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Meeting Confirmation Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("meeting.cancelMeeting")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("meeting.cancelConfirmation")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("meeting.cancelMeeting")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
