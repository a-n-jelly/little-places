import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FilterBar from '../../components/FilterBar'

describe('FilterBar', () => {
  const defaultProps = {
    selectedStages: [],
    selectedAccess: [],
    onStageToggle: vi.fn(),
    onAccessToggle: vi.fn(),
  }

  it('renders all stage filters', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByTestId('stage-filter-baby')).toBeInTheDocument()
    expect(screen.getByTestId('stage-filter-toddler')).toBeInTheDocument()
    expect(screen.getByTestId('stage-filter-preschool')).toBeInTheDocument()
    expect(screen.getByTestId('stage-filter-bigkids')).toBeInTheDocument()
    expect(screen.getByTestId('stage-filter-tweens')).toBeInTheDocument()
  })

  it('renders all accessibility filters', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByTestId('access-filter-wheelchair')).toBeInTheDocument()
    expect(screen.getByTestId('access-filter-changing_places')).toBeInTheDocument()
    expect(screen.getByTestId('access-filter-sensory_friendly')).toBeInTheDocument()
    expect(screen.getByTestId('access-filter-autism_friendly')).toBeInTheDocument()
  })

  it('calls onStageToggle when a stage is clicked', () => {
    const onStageToggle = vi.fn()
    render(<FilterBar {...defaultProps} onStageToggle={onStageToggle} />)
    fireEvent.click(screen.getByTestId('stage-filter-toddler'))
    expect(onStageToggle).toHaveBeenCalledWith('toddler')
  })

  it('calls onAccessToggle when an access filter is clicked', () => {
    const onAccessToggle = vi.fn()
    render(<FilterBar {...defaultProps} onAccessToggle={onAccessToggle} />)
    fireEvent.click(screen.getByTestId('access-filter-wheelchair'))
    expect(onAccessToggle).toHaveBeenCalledWith('wheelchair')
  })

  it('shows active state for selected stages', () => {
    render(<FilterBar {...defaultProps} selectedStages={['toddler']} />)
    const btn = screen.getByTestId('stage-filter-toddler')
    expect(btn.className).toContain('bg-green-50')
  })

  it('shows active state for selected access filters', () => {
    render(<FilterBar {...defaultProps} selectedAccess={['wheelchair']} />)
    const btn = screen.getByTestId('access-filter-wheelchair')
    expect(btn.className).toContain('bg-blue-50')
  })
})
