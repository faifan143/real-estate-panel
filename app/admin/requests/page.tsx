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
import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Search,
  ShoppingBag,
  Home as HomeIcon,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

// Dynamically import MapPicker to avoid SSR issues with Mapbox
const DynamicMapPicker = dynamic(
  () =>
    import("@/components/ui/map-picker").then((mod) => ({
      default: mod.MapPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-zinc-100 rounded-lg flex items-center justify-center">
        <p className="text-zinc-600">Loading map...</p>
      </div>
    ),
  },
);

interface AdminRequest {
  requestId: string;
  propertyId: string;
  requesterId: string;
  type: "BUY" | "RENT";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface Property {
  propertyId: string;
  title: string;
}

export default function AdminRequestsPage() {
  const { t, i18n } = useTranslation();
  const { token, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const response = await api.get<AdminRequest[]>("/admin/requests");
      return response.data;
    },
    enabled: !!token && isInitialized,
    staleTime: 60 * 1000,
  });

  // Fetch all properties to get titles
  const { data: properties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await api.get<Property[]>("/properties");
      return response.data;
    },
    enabled: !!token && isInitialized && !!requests && requests.length > 0,
    staleTime: 60 * 1000,
  });

  const getPropertyTitle = (propertyId: string) => {
    return (
      properties?.find((p) => p.propertyId === propertyId)?.title ||
      t("property.title")
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      i18n.language === "ar" ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      BUY: t("request.types.buy"),
      RENT: t("request.types.rent"),
    };
    return typeMap[type] || type;
  };

  const openApproveModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setApproveModalOpen(true);
  };

  const openRejectModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setRejectModalOpen(true);
  };

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    if (!requests) return [];

    return requests.filter((request) => {
      const propertyTitle = getPropertyTitle(request.propertyId);
      const matchesSearch = searchQuery
        ? propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.requestId.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesType =
        selectedType === "all" || request.type === selectedType;

      const matchesStatus =
        selectedStatus === "all" || request.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [requests, searchQuery, selectedType, selectedStatus, properties]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedStatus("all");
  };

  const hasActiveFilters =
    searchQuery || selectedType !== "all" || selectedStatus !== "all";

  const getTypeIcon = (type: string) => {
    return type === "BUY" ? ShoppingBag : HomeIcon;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        label: t("request.statuses.pending"),
        className: "bg-yellow-50 text-yellow-600",
      },
      APPROVED: {
        label: t("request.statuses.approved"),
        className: "bg-green-50 text-green-600",
      },
      REJECTED: {
        label: t("request.statuses.rejected"),
        className: "bg-red-50 text-red-600",
      },
    };
    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    );
  };

  return (
    <ProtectedRoute requireRole="ADMIN">
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">{t("admin.adminRequests")}</h1>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t("admin.searchRequests")}
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
                  {
                    [
                      selectedType !== "all",
                      selectedStatus !== "all",
                      searchQuery !== "",
                    ].filter(Boolean).length
                  }
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
                  {t("request.status")}
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
                    onClick={() => setSelectedStatus("PENDING")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedStatus === "PENDING"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t("request.statuses.pending")}
                  </button>
                  <button
                    onClick={() => setSelectedStatus("APPROVED")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedStatus === "APPROVED"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t("request.statuses.approved")}
                  </button>
                  <button
                    onClick={() => setSelectedStatus("REJECTED")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedStatus === "REJECTED"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {t("request.statuses.rejected")}
                  </button>
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-900">
                  {t("property.type")}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedType === "all"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    {t("common.all")}
                  </button>
                  <button
                    onClick={() => setSelectedType("BUY")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedType === "BUY"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {t("request.types.buy")}
                  </button>
                  <button
                    onClick={() => setSelectedType("RENT")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedType === "RENT"
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <HomeIcon className="w-3.5 h-3.5" />
                    {t("request.types.rent")}
                  </button>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-zinc-600">
                    {filteredRequests.length} {t("request.request")}
                    {filteredRequests.length !== 1 && "s"}
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
                  {t(`request.statuses.${selectedStatus.toLowerCase()}`)}
                  <button onClick={() => setSelectedStatus("all")}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedType !== "all" && (
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  {t(`request.types.${selectedType.toLowerCase()}`)}
                  <button onClick={() => setSelectedType("all")}>
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
          <p className="text-zinc-600">{t("admin.loadingPendingRequests")}</p>
        ) : filteredRequests && filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((request: AdminRequest) => {
              const statusBadge = getStatusBadge(request.status);
              const isPending = request.status === "PENDING";

              return (
                <Card key={request.requestId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          {getPropertyTitle(request.propertyId)}
                        </CardTitle>
                        <CardDescription>
                          {getTypeLabel(request.type)} {t("request.request")} •{" "}
                          {t("request.createdOn")}{" "}
                          {formatDate(request.createdAt)}
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
                    <div className="flex gap-3">
                      <Link href={`/properties/${request.propertyId}`}>
                        <Button variant="outline">
                          {t("property.viewProperty")}
                        </Button>
                      </Link>
                      <Button
                        onClick={() => openApproveModal(request)}
                        disabled={!isPending}
                      >
                        {t("admin.approveRequest")}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => openRejectModal(request)}
                        disabled={!isPending}
                      >
                        {t("admin.rejectRequest")}
                      </Button>
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
                ? t("admin.noRequestsMatchFilters")
                : t("admin.noPendingRequests")}
            </p>
          </div>
        )}
      </div>

      {selectedRequest && (
        <>
          <ApproveModal
            open={approveModalOpen}
            onOpenChange={setApproveModalOpen}
            request={selectedRequest}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
              setApproveModalOpen(false);
            }}
          />
          <RejectModal
            open={rejectModalOpen}
            onOpenChange={setRejectModalOpen}
            request={selectedRequest}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
              setRejectModalOpen(false);
            }}
          />
        </>
      )}
    </ProtectedRoute>
  );
}

function ApproveModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AdminRequest;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [scheduledAt, setScheduledAt] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapKey, setMapKey] = useState(0);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setScheduledAt("");
      setLatitude(null);
      setLongitude(null);
      // Generate new key for map to force remount
      setMapKey((prev) => prev + 1);
    }
  }, [open]);

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO string
      const scheduledAtISO = scheduledAt
        ? new Date(scheduledAt).toISOString()
        : "";
      if (latitude === null || longitude === null) {
        throw new Error(t("admin.pleaseSelectLocation"));
      }
      const response = await api.post(
        `/admin/requests/${request.requestId}/approve`,
        {
          scheduledAt: scheduledAtISO,
          latitude,
          longitude,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("admin.requestApproved"));
      onSuccess();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || t("admin.approvalFailed");
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    approveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.approveRequest")}</DialogTitle>
          <DialogDescription>
            {t("admin.setMeetingDetails", {
              type: t(`request.types.${request.type.toLowerCase()}`),
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="scheduledAt">
              {t("admin.scheduledDateTime")} *
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          {open && (
            <>
              <Label>{t("admin.meetingLocationRequired")}</Label>
              <DynamicMapPicker
                key={`map-picker-${request.requestId}-${mapKey}`}
                mapKey={`${request.requestId}-${mapKey}`}
                latitude={latitude}
                longitude={longitude}
                onLocationChange={handleLocationChange}
              />
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={approveMutation.isPending}>
              {approveMutation.isPending
                ? t("admin.approving")
                : t("admin.approveRequestButton")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AdminRequest;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/admin/requests/${request.requestId}/reject`,
        {
          reason: reason || undefined,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("admin.requestRejected"));
      onSuccess();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || t("admin.rejectionFailed");
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rejectMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.rejectRequest")}</DialogTitle>
          <DialogDescription>{t("admin.rejectDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">{t("admin.rejectionReason")}</Label>
            <Textarea
              id="reason"
              placeholder={t("admin.enterRejectionReason")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="destructive"
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending
                ? t("admin.rejecting")
                : t("admin.rejectRequestButton")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
