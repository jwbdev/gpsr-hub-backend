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
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    // Get user's own products (full details)
    let ownQuery = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (categoryId) {
      ownQuery = ownQuery.eq('category_id', categoryId);
    }

    const { data: ownProducts, error: ownError } = await ownQuery;
    if (ownError) throw ownError;

    // Get shared products (basic info only) from all users
    const { data: sharedProducts, error: sharedError } = await supabase
      .rpc('get_shared_products', { category_filter: categoryId || null });
    
    if (sharedError) throw sharedError;

    // Merge own products (full details) with others (basic info)
    const productsWithOwners = (sharedProducts || []).map((shared: any) => {
      // If user owns this product, return full details
      if (user.id === shared.user_id) {
        const ownProduct = ownProducts?.find(prod => prod.id === shared.id);
        return {
          ...ownProduct,
          owner_name: shared.owner_name
        };
      }
      
      // For non-owned products, return only basic info
      return {
        id: shared.id,
        user_id: shared.user_id,
        category_id: shared.category_id,
        gpsr_identification_details: shared.gpsr_identification_details, // Product name
        created_at: shared.created_at,
        updated_at: shared.updated_at,
        owner_name: shared.owner_name,
        // Hide all sensitive GPSR fields for non-owned products
        gpsr_warning_phrases: null,
        gpsr_warning_text: null,
        gpsr_pictograms: null,
        gpsr_additional_safety_info: null,
        gpsr_statement_of_compliance: null,
        gpsr_online_instructions_url: null,
        gpsr_instructions_manual: null,
        gpsr_declarations_of_conformity: null,
        gpsr_certificates: null,
        gpsr_moderation_status: null,
        gpsr_moderation_comment: null,
        gpsr_last_submission_date: null,
        gpsr_last_moderation_date: null,
        gpsr_submitted_by_supplier_user: null
      };
    });

    return productsWithOwners;
  },

  async getProduct(id: string): Promise<Product> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    // Try to get product as owner first
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    // If user owns this product, return full details
    if (!error && data && user.id === data.user_id) {
      const { data: ownerName } = await supabase.rpc('get_owner_name', {
        owner_user_id: data.user_id
      });
      
      return {
        ...data,
        owner_name: ownerName || 'Unknown User'
      };
    }
    
    // If product doesn't exist in user's access or not owned, get shared version
    const { data: sharedProducts, error: sharedError } = await supabase
      .rpc('get_shared_products');
    
    if (sharedError) throw sharedError;
    
    const sharedProduct = sharedProducts?.find((p: any) => p.id === id);
    
    if (!sharedProduct) {
      throw new Error('Product not found');
    }
    
    // Return basic info for non-owned products
    return {
      id: sharedProduct.id,
      user_id: sharedProduct.user_id,
      category_id: sharedProduct.category_id,
      gpsr_identification_details: sharedProduct.gpsr_identification_details,
      created_at: sharedProduct.created_at,
      updated_at: sharedProduct.updated_at,
      owner_name: sharedProduct.owner_name,
      // Hide all sensitive GPSR fields
      gpsr_warning_phrases: null,
      gpsr_warning_text: null,
      gpsr_pictograms: null,
      gpsr_additional_safety_info: null,
      gpsr_statement_of_compliance: null,
      gpsr_online_instructions_url: null,
      gpsr_instructions_manual: null,
      gpsr_declarations_of_conformity: null,
      gpsr_certificates: null,
      gpsr_moderation_status: null,
      gpsr_moderation_comment: null,
      gpsr_last_submission_date: null,
      gpsr_last_moderation_date: null,
      gpsr_submitted_by_supplier_user: null
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