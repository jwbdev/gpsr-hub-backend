import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { RequestAccessButton } from '../RequestAccessButton'

// Mock the access requests service
vi.mock('@/services/accessRequests', () => ({
  accessRequestsService: {
    hasRequestedAccess: vi.fn(),
    hasSharedAccess: vi.fn(),
    createRequest: vi.fn()
  }
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('RequestAccessButton', () => {
  const defaultProps = {
    resourceType: 'category' as const,
    resourceId: '1',
    ownerUserId: 'owner1',
    ownerName: 'Test Owner',
    resourceName: 'Test Category'
  }

  it('renders request access button when no access exists', () => {
    render(<RequestAccessButton {...defaultProps} />)
    expect(screen.getByText('Request Access')).toBeInTheDocument()
  })

  it('shows pending status when access is requested', () => {
    render(<RequestAccessButton {...defaultProps} hasRequested={true} />)
    expect(screen.getByText('Request Sent')).toBeInTheDocument()
  })

  it('does not render when access is granted', () => {
    const { container } = render(<RequestAccessButton {...defaultProps} hasAccess={true} />)
    expect(container.firstChild).toBeNull()
  })

  it('opens dialog when request access button is clicked', async () => {
    const user = userEvent.setup()
    render(<RequestAccessButton {...defaultProps} />)

    expect(screen.getByText('Request Access')).toBeInTheDocument()
    await user.click(screen.getByText('Request Access'))

    expect(screen.getByText('Request Access to category')).toBeInTheDocument()
  })
})