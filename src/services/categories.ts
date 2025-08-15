import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
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
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};