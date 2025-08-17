import { describe, it, expect, vi, beforeEach } from 'vitest'
import { categoriesService } from '../categories'
import { supabase } from '@/integrations/supabase/client'

// Mock the supabase client
vi.mock('@/integrations/supabase/client')

describe('categoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategories', () => {
    it('should fetch and merge user and shared categories', async () => {
      const mockUserCategories = [
        { id: '1', name: 'User Category', user_id: 'user1' }
      ]
      const mockSharedCategories = [
        { id: '2', name: 'Shared Category', user_id: 'user2' }
      ]

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user1', email: 'test@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2023-01-01' } },
        error: null
      })

      vi.mocked(supabase.from).mockImplementation((table) => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        }

        if (table === 'categories') {
          mockQuery.select.mockResolvedValueOnce({
            data: mockUserCategories,
            error: null
          })
        }

        if (table === 'shared_access') {
          mockQuery.select.mockResolvedValueOnce({
            data: mockSharedCategories,
            error: null
          })
        }

        return mockQuery
      })

      const result = await categoriesService.getCategories()
      
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('User Category')
      expect(result[1].name).toBe('Shared Category')
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('User not authenticated') as any
      })

      await expect(categoriesService.getCategories()).rejects.toThrow('User not authenticated')
    })
  })

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const newCategory = {
        name: 'New Category',
        description: 'Test description',
        parent_id: null
      }

      const createdCategory = {
        id: '1',
        ...newCategory,
        user_id: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user1', email: 'test@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2023-01-01' } },
        error: null
      })

      const mockInsert = vi.fn().mockResolvedValue({
        data: createdCategory,
        error: null
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdCategory,
          error: null
        })
      } as any)

      const result = await categoriesService.createCategory(newCategory)
      
      expect(result).toEqual(createdCategory)
      expect(mockInsert).toHaveBeenCalledWith({
        ...newCategory,
        user_id: 'user1'
      })
    })
  })
})