import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { ProtectedRoute } from '../ProtectedRoute'

// Mock the useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth
}))

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to auth when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})