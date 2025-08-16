import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    // Get user's own categories (full details)
    const { data: ownCategories, error: ownError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (ownError) throw ownError;

    // Get shared categories (basic info only) from all users  
    const { data: sharedCategories, error: sharedError } = await supabase
      .rpc('get_shared_categories');
    
    if (sharedError) throw sharedError;

    // Merge own categories (full details) with others (basic info)
    const categoriesWithOwners = (sharedCategories || []).map((shared: any) => {
      // If user owns this category, return full details
      if (user.id === shared.user_id) {
        const ownCategory = ownCategories?.find(cat => cat.id === shared.id);
        return {
          ...ownCategory,
          owner_name: shared.owner_name
        };
      }
      
      // For non-owned categories, return only basic info (no description)
      return {
        id: shared.id,
        name: shared.name,
        parent_id: shared.parent_id,
        user_id: shared.user_id,
        created_at: shared.created_at,
        updated_at: shared.updated_at,
        owner_name: shared.owner_name,
        description: null // Hide description for non-owned categories
      };
    });

    return categoriesWithOwners;
  },

  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'description' | 'parent_id'>>): Promise<Category> {
    // First check if the category exists and user owns it
    const { data: existingCategory, error: fetchError } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) throw new Error('Category not found');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || existingCategory.user_id !== user.id) {
      throw new Error('You can only edit categories you own');
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    // First check if the category exists and user owns it
    const { data: existingCategory, error: fetchError } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) throw new Error('Category not found');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || existingCategory.user_id !== user.id) {
      throw new Error('You can only delete categories you own');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};