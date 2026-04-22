import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FilterBar from '../../components/FilterBar'

describe('FilterBar', () => {
  const defaultProps = {
    selectedStages: [],
    selectedAccess: [],
    selectedTypes: [],
    onStageToggle: vi.fn(),
    onAccessToggle: vi.fn(),
    onTypeToggle: vi.fn(),
  }

  it('renders all stage filters', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByTestId('stage-filter-baby')).toBeInTheDocument()
    expect(screen.getByTestId('stage-filter-toddler')).toBeInTheDocument()
    expect(screen.getByTestId('stage-filter-preschool')).toBeInTheDocument()
    expect(screen.getByTestId('stage-filter-bigkids')).toBeInTheDocument()
    expect(screen.getByTestId('stage-filter-tweens')).toBeInTheDocument()
  })

  it('renders all feature filter chips', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByTestId('feature-filter-stroller-friendly')).toBeInTheDocument()
    expect(screen.getByTestId('feature-filter-high-chairs')).toBeInTheDocument()
    expect(screen.getByTestId('feature-filter-hands-on-exhibits')).toBeInTheDocument()
    expect(screen.getByTestId('feature-filter-storytime')).toBeInTheDocument()
    expect(screen.getByTestId('feature-filter-free-entry')).toBeInTheDocument()
  })

  it('calls onStageToggle when a stage is clicked', () => {
    const onStageToggle = vi.fn()
    render(<FilterBar {...defaultProps} onStageToggle={onStageToggle} />)
    fireEvent.click(screen.getByTestId('stage-filter-toddler'))
    expect(onStageToggle).toHaveBeenCalledWith('toddler')
  })

  it('calls onAccessToggle when a feature chip is clicked', () => {
    const onAccessToggle = vi.fn()
    render(<FilterBar {...defaultProps} onAccessToggle={onAccessToggle} />)
    fireEvent.click(screen.getByTestId('feature-filter-stroller-friendly'))
    expect(onAccessToggle).toHaveBeenCalledWith('stroller-friendly')
  })

  it('shows active state for selected stages', () => {
    render(<FilterBar {...defaultProps} selectedStages={['toddler']} />)
    expect(screen.getByTestId('stage-filter-toddler').dataset.active).toBe('true')
  })

  it('shows active state for selected feature chips', () => {
    render(<FilterBar {...defaultProps} selectedAccess={['free-entry']} />)
    expect(screen.getByTestId('feature-filter-free-entry').dataset.active).toBe('true')
  })

  it('does not render type chips', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.queryByText('Park')).not.toBeInTheDocument()
    expect(screen.queryByText('Café')).not.toBeInTheDocument()
  })
})
