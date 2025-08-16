import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  user_id: string;
  category_id?: string;
  gpsr_identification_details?: string;
  gpsr_warning_phrases?: string[];
  gpsr_warning_text?: string;
  gpsr_pictograms?: string[];
  gpsr_additional_safety_info?: string;
  gpsr_statement_of_compliance?: boolean;
  gpsr_online_instructions_url?: string;
  gpsr_instructions_manual?: string;
  gpsr_declarations_of_conformity?: string;
  gpsr_certificates?: string;
  gpsr_moderation_status?: string;
  gpsr_moderation_comment?: string;
  gpsr_last_submission_date?: string;
  gpsr_last_moderation_date?: string;
  gpsr_submitted_by_supplier_user?: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

export const productsService = {
  async getProducts(categoryId?: string): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Get owner names using the secure function
    const productsWithOwners = await Promise.all(
      (data || []).map(async (product: any) => {
        const { data: ownerName } = await supabase.rpc('get_owner_name', {
          owner_user_id: product.user_id
        });
        
        return {
          ...product,
          owner_name: ownerName || 'Unknown User'
        };
      })
    );
    
    return productsWithOwners;
  },

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Get owner name using the secure function
    const { data: ownerName } = await supabase.rpc('get_owner_name', {
      owner_user_id: data.user_id
    });
    
    return {
      ...data,
      owner_name: ownerName || 'Unknown User'
    };
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Product> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>>): Promise<Product> {
    // First check if the product exists and user owns it
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) throw new Error('Product not found');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || existingProduct.user_id !== user.id) {
      throw new Error('You can only edit products you own');
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    // First check if the product exists and user owns it
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) throw new Error('Product not found');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || existingProduct.user_id !== user.id) {
      throw new Error('You can only delete products you own');
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async uploadFile(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('product-files')
      .upload(fileName, file);
    
    if (error) throw error;
    
    return fileName;
  },

  async getFileUrl(fileName: string): Promise<string> {
    const { data } = supabase.storage
      .from('product-files')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }
};