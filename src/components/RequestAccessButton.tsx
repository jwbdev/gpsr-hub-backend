import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { accessRequestsService } from '@/services/accessRequests';
import { Share } from 'lucide-react';

interface RequestAccessButtonProps {
  resourceType: 'category' | 'product';
  resourceId: string;
  resourceName: string;
  ownerUserId: string;
  ownerName: string;
  hasRequested?: boolean;
  hasAccess?: boolean;
}

export function RequestAccessButton({
  resourceType,
  resourceId,
  resourceName,
  ownerUserId,
  ownerName,
  hasRequested = false,
  hasAccess = false
}: RequestAccessButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Don't show button if user already has access
  if (hasAccess) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await accessRequestsService.createRequest(
        resourceType,
        resourceId,
        ownerUserId,
        message || `Hi ${ownerName}, I would like to request access to your ${resourceType} "${resourceName}". Thank you!`
      );

      toast({
        title: "Request sent",
        description: `Your access request has been sent to ${ownerName}`,
      });

      setIsOpen(false);
      setMessage('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send access request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (hasRequested) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Share className="h-4 w-4 mr-2" />
        Request Sent
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share className="h-4 w-4 mr-2" />
          Request Access
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Access to {resourceType}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Requesting access to <strong>"{resourceName}"</strong> owned by <strong>{ownerName}</strong>
            </p>
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${ownerName}, I would like to request access to your ${resourceType} "${resourceName}". Thank you!`}
              rows={4}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}