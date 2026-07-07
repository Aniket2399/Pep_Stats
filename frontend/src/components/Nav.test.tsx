import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav'

test('shows brand and links', () => {
  render(<MemoryRouter><Nav /></MemoryRouter>)
  expect(screen.getByText(/APEX XI/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /historic/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /live/i })).toBeInTheDocument()
})
