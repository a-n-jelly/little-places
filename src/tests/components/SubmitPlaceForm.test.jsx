import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubmitPlaceForm from '../../components/SubmitPlaceForm'

const mockSubmitPlace = vi.hoisted(() => vi.fn())

vi.mock('../../lib/places', () => ({
  submitPlace: mockSubmitPlace,
}))

// Nominatim fetch — not needed for submit tests, silence it
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  json: async () => [],
}))

const newPlace = { id: 'abc', name: 'Woodland Park Zoo', type: 'Park', address: '5500 Phinney Ave N' }

function fillRequired(nameValue = 'Test Place') {
  // Name field is the venue search input
  fireEvent.change(screen.getByPlaceholderText(/search for a venue/i), {
    target: { value: nameValue },
  })
  // Type select
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Park' } })
}

describe('SubmitPlaceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls onSuccess with the returned place on successful submit', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)
    const onSuccess = vi.fn()

    render(<SubmitPlaceForm onSuccess={onSuccess} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(newPlace))
  })

  it('resets the form after successful submit', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    fillRequired('Some Place')
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(mockSubmitPlace).toHaveBeenCalledTimes(1))

    // Name input should be cleared
    expect(screen.getByPlaceholderText(/search for a venue/i).value).toBe('')
    // Type select should be reset
    expect(screen.getByRole('combobox').value).toBe('')
  })

  it('shows an error message when submitPlace throws', async () => {
    mockSubmitPlace.mockRejectedValueOnce(new Error('Supabase is down'))

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => screen.getByText('Supabase is down'))
  })

  it('does not call onSuccess when submitPlace throws', async () => {
    mockSubmitPlace.mockRejectedValueOnce(new Error('Network error'))
    const onSuccess = vi.fn()

    render(<SubmitPlaceForm onSuccess={onSuccess} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => screen.getByText('Network error'))
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
