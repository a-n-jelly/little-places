import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AgentPanel from '../../components/AgentPanel'

const mockSendMessage = vi.hoisted(() => vi.fn())
const mockStartChat = vi.hoisted(() => vi.fn(() => ({ sendMessage: mockSendMessage })))
const mockGetGenerativeModel = vi.hoisted(() => vi.fn(() => ({ startChat: mockStartChat })))
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(function () {
    return { getGenerativeModel: mockGetGenerativeModel }
  }),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

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
  response: {
    functionCalls: () => [],
    text: () => text,
  },
})

const toolUse = (name = 'search_places', args = {}) => ({
  response: {
    functionCalls: () => [{ name, args }],
    text: () => '',
  },
})

describe('AgentPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submitting a query calls sendMessage with the user message', async () => {
    mockSendMessage.mockResolvedValueOnce(endTurn())

    render(<AgentPanel onBrowse={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'indoor for a toddler' } })
    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1))
    expect(mockSendMessage).toHaveBeenCalledWith('indoor for a toddler')
  })

  it('function call triggers runTool and continues the agentic loop', async () => {
    mockFrom.mockReturnValue(
      makeMockQuery({ data: [{ id: '1', name: 'Green Lake', type: 'park' }], error: null })
    )
    mockSendMessage
      .mockResolvedValueOnce(toolUse('search_places', { keyword: 'toddler' }))
      .mockResolvedValueOnce(endTurn('Try Green Lake!'))

    render(<AgentPanel onBrowse={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'indoor for a toddler' } })
    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    await waitFor(() => screen.getByText('Try Green Lake!'))
    expect(mockFrom).toHaveBeenCalledWith('places')
    expect(mockSendMessage).toHaveBeenCalledTimes(2)
  })

  it('empty search results — loop continues and reaches final response without crashing', async () => {
    mockFrom.mockReturnValue(makeMockQuery({ data: [], error: null }))
    mockSendMessage
      .mockResolvedValueOnce(toolUse('search_places', { keyword: 'toddler' }))
      .mockResolvedValueOnce(endTurn('Nothing matched, but here are some ideas.'))

    render(<AgentPanel onBrowse={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'toddler' } })
    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    await waitFor(() => screen.getByText(/Nothing matched/))
    expect(mockSendMessage).toHaveBeenCalledTimes(2)
  })

  it('sendMessage throwing sets the error state', async () => {
    mockSendMessage.mockRejectedValueOnce(new Error('API key invalid'))

    render(<AgentPanel onBrowse={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'parks' } })
    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    await waitFor(() => screen.getByText('API key invalid'))
  })
})
