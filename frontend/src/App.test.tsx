import { render, screen } from '@testing-library/react'
import App from './App'
test('renders shell with nav', () => {
  render(<App />)
  expect(screen.getByText('⚡ APEX XI')).toBeInTheDocument()
})
