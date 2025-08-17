import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import Categories from '../Categories'

// Mock the categories service
vi.mock('@/services/categories', () => ({
  categoriesService: {
    getCategories: vi.fn(() => Promise.resolve([
      { id: '1', name: 'Test Category', description: 'Test Description', parent_id: null, user_id: 'user1' }
    ])),
    deleteCategory: vi.fn(() => Promise.resolve())
  }
}))

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: [
      { id: '1', name: 'Test Category', description: 'Test Description', parent_id: null, user_id: 'user1' }
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false
  }))
}))

describe('Categories', () => {
  it('renders categories page title', () => {
    render(<Categories />)
    expect(screen.getByText('Categories')).toBeInTheDocument()
  })

  it('displays category list when data is loaded', () => {
    render(<Categories />)
    expect(screen.getByText('Test Category')).toBeInTheDocument()
  })

  it('shows create category button', () => {
    render(<Categories />)
    expect(screen.getByText('Create Category')).toBeInTheDocument()
  })
})