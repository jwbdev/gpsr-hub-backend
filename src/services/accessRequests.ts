import { supabase } from '@/integrations/supabase/client';

export interface AccessRequest {
  id: string;
  requester_user_id: string;
  owner_user_id: string;
  resource_type: 'category' | 'product';
  resource_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
  requester_name?: string;
  resource_name?: string;
}

export interface SharedAccess {
  id: string;
  user_id: string;
  owner_user_id: string;
  resource_type: 'category' | 'product';
  resource_id: string;
  granted_at: string;
}

export const accessRequestsService = {
  async createRequest(
    resourceType: 'category' | 'product',
    resourceId: string,
    ownerUserId: string,
    message?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('access_requests')
      .insert([{
        requester_user_id: user.id,
        owner_user_id: ownerUserId,
        resource_type: resourceType,
        resource_id: resourceId,
        message: message || `Please grant me access to this ${resourceType}`
      }]);

    if (error) throw error;
  },

  async getIncomingRequests(): Promise<AccessRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get requester names and resource names
    const requestsWithDetails = await Promise.all(
      (data || []).map(async (request: any) => {
        // Get requester name
        const { data: requesterName } = await supabase.rpc('get_owner_name', {
          owner_user_id: request.requester_user_id
        });

        // Get resource name
        let resourceName = 'Unknown';
        if (request.resource_type === 'category') {
          const { data: sharedCategories } = await supabase.rpc('get_shared_categories');
          const category = sharedCategories?.find((c: any) => c.id === request.resource_id);
          resourceName = category?.name || 'Unknown Category';
        } else {
          const { data: sharedProducts } = await supabase.rpc('get_shared_products');
          const product = sharedProducts?.find((p: any) => p.id === request.resource_id);
          resourceName = product?.gpsr_identification_details || 'Unknown Product';
        }

        return {
          ...request,
          requester_name: requesterName || 'Unknown User',
          resource_name: resourceName
        };
      })
    );

    return requestsWithDetails;
  },

  async updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the request details first
    const { data: request, error: requestError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    // Update request status
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({ status })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // If approved, create shared access entry
    if (status === 'approved') {
      const { error: accessError } = await supabase
        .from('shared_access')
        .insert([{
          user_id: request.requester_user_id,
          owner_user_id: user.id,
          resource_type: request.resource_type,
          resource_id: request.resource_id
        }]);

      if (accessError) throw accessError;
    }
  },

  async hasRequestedAccess(resourceType: 'category' | 'product', resourceId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('access_requests')
      .select('id')
      .eq('requester_user_id', user.id)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .eq('status', 'pending')
      .single();

    return !error && !!data;
  },

  async hasSharedAccess(resourceType: 'category' | 'product', resourceId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: hasAccess } = await supabase.rpc('user_has_access', {
      user_id_param: user.id,
      resource_type_param: resourceType,
      resource_id_param: resourceId
    });

    return hasAccess || false;
  }
};