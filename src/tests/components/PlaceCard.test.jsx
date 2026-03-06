import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PlaceCard from '../../components/PlaceCard'

const mockPlace = {
  id: 1,
  name: 'Green Lake Park',
  type: 'Park',
  address: '7201 E Green Lake Dr N, Seattle',
  description: 'Beautiful lake loop with wide paved paths and playgrounds.',
  stages: ['toddler', 'preschool'],
  accessibility: ['wheelchair'],
  tags: ['Pram Accessible', 'Free Entry'],
  rating: 4.7,
  submitted_by: 'Sarah M.',
}

describe('PlaceCard', () => {
  it('renders the place name', () => {
    render(<PlaceCard place={mockPlace} />)
    expect(screen.getByText('Green Lake Park')).toBeInTheDocument()
  })

  it('renders the place type', () => {
    render(<PlaceCard place={mockPlace} />)
    expect(screen.getByText('PARK')).toBeInTheDocument()
  })

  it('renders the address', () => {
    render(<PlaceCard place={mockPlace} />)
    expect(screen.getByText(/7201 E Green Lake/)).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<PlaceCard place={mockPlace} />)
    expect(screen.getByText(/Beautiful lake loop/)).toBeInTheDocument()
  })

  it('renders stage tags', () => {
    render(<PlaceCard place={mockPlace} />)
    expect(screen.getByText('🧒 Toddler')).toBeInTheDocument()
    expect(screen.getByText('🎨 Preschool')).toBeInTheDocument()
  })

  it('renders accessibility tags', () => {
    render(<PlaceCard place={mockPlace} />)
    expect(screen.getByText('♿ Wheelchair Accessible')).toBeInTheDocument()
  })

  it('renders submitted_by when present', () => {
    render(<PlaceCard place={mockPlace} />)
    expect(screen.getByText('Added by Sarah M.')).toBeInTheDocument()
  })

  it('does not render submitted_by when absent', () => {
    const place = { ...mockPlace, submitted_by: null }
    render(<PlaceCard place={place} />)
    expect(screen.queryByText(/Added by/)).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<PlaceCard place={mockPlace} onClick={handleClick} />)
    fireEvent.click(screen.getByTestId('place-card'))
    expect(handleClick).toHaveBeenCalledWith(mockPlace)
  })

  it('calls onClick on Enter key press', () => {
    const handleClick = vi.fn()
    render(<PlaceCard place={mockPlace} onClick={handleClick} />)
    fireEvent.keyDown(screen.getByTestId('place-card'), { key: 'Enter' })
    expect(handleClick).toHaveBeenCalledWith(mockPlace)
  })

  it('does not crash when onClick is not provided', () => {
    render(<PlaceCard place={mockPlace} />)
    expect(() => fireEvent.click(screen.getByTestId('place-card'))).not.toThrow()
  })

  it('does not render rating when rating is 0', () => {
    const place = { ...mockPlace, rating: 0 }
    render(<PlaceCard place={place} />)
    expect(screen.queryByText('★')).not.toBeInTheDocument()
  })
})
