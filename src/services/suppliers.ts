import { supabase } from '@/integrations/supabase/client';

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const suppliersService = {
  async getSuppliers(): Promise<Supplier[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('suppliers' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as Supplier[];
  },

  async getSupplier(id: string): Promise<Supplier> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('suppliers' as any)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data as unknown as Supplier;
  },

  async createSupplier(supplier: Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('suppliers' as any)
      .insert({
        ...supplier,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Supplier;
  },

  async updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Supplier> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('suppliers' as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Supplier;
  },

  async deleteSupplier(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('suppliers' as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },
};