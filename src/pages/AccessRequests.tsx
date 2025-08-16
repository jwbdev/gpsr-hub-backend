import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { accessRequestsService, AccessRequest } from '@/services/accessRequests';
import { Check, X, Share, Package, FolderTree } from 'lucide-react';

export default function AccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await accessRequestsService.getIncomingRequests();
      setRequests(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load access requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await accessRequestsService.updateRequestStatus(requestId, status);
      toast({
        title: "Request updated",
        description: `Access request ${status} successfully`,
      });
      loadRequests(); // Reload to update the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Access Requests</h1>
        <Badge variant="secondary" className="text-sm">
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Share className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No pending requests</h3>
            <p className="text-muted-foreground">
              When other users request access to your categories or products, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {request.resource_type === 'category' ? (
                      <FolderTree className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Package className="h-5 w-5 text-green-500" />
                    )}
                    <CardTitle className="text-lg">
                      Access Request for {request.resource_type}
                    </CardTitle>
                  </div>
                  <Badge variant="outline">
                    {formatDate(request.created_at)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Requested by:</p>
                    <p className="font-semibold">{request.requester_name}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Resource:</p>
                    <p className="font-semibold">{request.resource_name}</p>
                  </div>

                  {request.message && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Message:</p>
                      <p className="text-sm bg-muted p-3 rounded">{request.message}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestAction(request.id, 'rejected')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRequestAction(request.id, 'approved')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}