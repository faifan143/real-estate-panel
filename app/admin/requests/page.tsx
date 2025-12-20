'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';

interface AdminRequest {
  requestId: string;
  propertyId: string;
  requesterId: string;
  type: 'BUY' | 'RENT';
  createdAt: string;
}

export default function AdminRequestsPage() {
  const queryClient = useQueryClient();
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      const response = await api.get<AdminRequest[]>('/admin/requests?status=PENDING');
      return response.data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openApproveModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setApproveModalOpen(true);
  };

  const openRejectModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setRejectModalOpen(true);
  };

  return (
    <ProtectedRoute requireRole="ADMIN">
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Admin - Pending Requests</h1>

        {isLoading ? (
          <p className="text-zinc-600">Loading pending requests...</p>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request: AdminRequest) => (
              <Card key={request.requestId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {request.type} Request
                      </CardTitle>
                      <CardDescription>
                        Created on {formatDate(request.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-600">
                      PENDING
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-sm text-zinc-600">
                    <p>Request ID: {request.requestId}</p>
                    <p>Requester ID: {request.requesterId}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/properties/${request.propertyId}`}>
                      <Button variant="outline">View Property</Button>
                    </Link>
                    <Button onClick={() => openApproveModal(request)}>
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openRejectModal(request)}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600">No pending requests at the moment.</p>
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
              queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
              setApproveModalOpen(false);
            }}
          />
          <RejectModal
            open={rejectModalOpen}
            onOpenChange={setRejectModalOpen}
            request={selectedRequest}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
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
  const [scheduledAt, setScheduledAt] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const approveMutation = useMutation({
    mutationFn: async () => {
      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO string
      const scheduledAtISO = scheduledAt ? new Date(scheduledAt).toISOString() : '';
      const response = await api.post(`/admin/requests/${request.requestId}/approve`, {
        scheduledAt: scheduledAtISO,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Request approved successfully');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Approval failed';
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
          <DialogTitle>Approve Request</DialogTitle>
          <DialogDescription>
            Set meeting details for this {request.type} request
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="latitude">Latitude *</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              placeholder="e.g., 37.7749"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude *</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              placeholder="e.g., -122.4194"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={approveMutation.isPending}>
              {approveMutation.isPending ? 'Approving...' : 'Approve Request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
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
  const [reason, setReason] = useState('');

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/admin/requests/${request.requestId}/reject`, {
        reason: reason || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Request rejected');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Rejection failed';
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
          <DialogTitle>Reject Request</DialogTitle>
          <DialogDescription>
            Optionally provide a reason for rejecting this request
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter rejection reason..."
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
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
