import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SearchBar from '../../components/SearchBar'

describe('SearchBar', () => {
  it('renders the search input', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: /search places/i })).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<SearchBar value="soft play" onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('soft play')).toBeInTheDocument()
  })

  it('calls onChange when user types', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'park' } })
    expect(onChange).toHaveBeenCalledWith('park')
  })

  it('shows placeholder text', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText(/Search places/)).toBeInTheDocument()
  })
})
