import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AgentPanel from '../../components/AgentPanel'

const mockCreate = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create: mockCreate } }
  }),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

// Returns a thenable chain — await query resolves to result
const makeMockQuery = (result = { data: [], error: null }) => ({
  select: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  overlaps: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
})

const endTurn = (text = 'Here is a recommendation.') => ({
  stop_reason: 'end_turn',
  content: [{ type: 'text', text }],
})

const toolUse = (name = 'search_places', input = {}) => ({
  stop_reason: 'tool_use',
  content: [{ type: 'tool_use', id: 'tool_1', name, input }],
})

describe('AgentPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submitting a query calls messages.create with the user message', async () => {
    mockCreate.mockResolvedValueOnce(endTurn())

    render(<AgentPanel onBrowse={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'indoor for a toddler' } })
    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    const args = mockCreate.mock.calls[0][0]
    expect(args.model).toBe('claude-haiku-4-5-20251001')
    expect(args.messages[0]).toEqual({ role: 'user', content: 'indoor for a toddler' })
  })

  it('tool_use stop reason triggers runTool and continues the agentic loop', async () => {
    mockFrom.mockReturnValue(
      makeMockQuery({ data: [{ id: '1', name: 'Green Lake', type: 'park' }], error: null })
    )
    mockCreate
      .mockResolvedValueOnce(toolUse('search_places', { keyword: 'toddler' }))
      .mockResolvedValueOnce(endTurn('Try Green Lake!'))

    render(<AgentPanel onBrowse={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'indoor for a toddler' } })
    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    await waitFor(() => screen.getByText('Try Green Lake!'))
    expect(mockFrom).toHaveBeenCalledWith('places')
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('empty search results — loop continues and reaches end_turn without crashing', async () => {
    mockFrom.mockReturnValue(makeMockQuery({ data: [], error: null }))
    mockCreate
      .mockResolvedValueOnce(toolUse('search_places', { keyword: 'toddler' }))
      .mockResolvedValueOnce(endTurn("Nothing matched, but here are some ideas."))

    render(<AgentPanel onBrowse={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'toddler' } })
    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    await waitFor(() => screen.getByText(/Nothing matched/))
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('messages.create throwing sets the error state', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API key invalid'))

    render(<AgentPanel onBrowse={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'parks' } })
    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    await waitFor(() => screen.getByText('API key invalid'))
  })
})
