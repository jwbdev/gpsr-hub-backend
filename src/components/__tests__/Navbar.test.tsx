import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { Navbar } from '../Navbar'

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@example.com' },
    signOut: vi.fn(),
    loading: false
  }))
}))

describe('Navbar', () => {
  it('renders navigation links when user is authenticated', () => {
    render(<Navbar />)
    
    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Suppliers')).toBeInTheDocument()
    expect(screen.getByText('Access Requests')).toBeInTheDocument()
  })

  it('displays user menu when authenticated', () => {
    render(<Navbar />)
    
    // The avatar/user menu should be present
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('does not render navigation when user is not authenticated', () => {
    const { useAuth } = require('@/hooks/useAuth')
    useAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
      loading: false
    })

    render(<Navbar />)
    
    expect(screen.queryByText('Categories')).not.toBeInTheDocument()
    expect(screen.queryByText('Products')).not.toBeInTheDocument()
  })
})