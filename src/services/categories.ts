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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Get all unique user IDs
    const userIds = [...new Set(data?.map(cat => cat.user_id) || [])];
    
    // Fetch profiles for these users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);
    
    // Create a map of user_id to profile
    const profileMap = new Map(profiles?.map(profile => [profile.user_id, profile]) || []);
    
    return data?.map((category: any) => {
      const profile = profileMap.get(category.user_id);
      return {
        ...category,
        owner_name: profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'
          : 'Unknown User'
      };
    }) || [];
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