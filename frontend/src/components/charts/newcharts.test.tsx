import { render, screen } from '@testing-library/react'
import Donut from './Donut'
import Bars from './Bars'

test('Donut renders a legend value per segment', () => {
  render(<Donut segments={[{ label: 'Goals', value: 3, color: '#28c76f' }, { label: 'Saved', value: 5, color: '#2f7fe0' }]} />)
  expect(screen.getByText('Goals')).toBeInTheDocument()
  expect(screen.getByText('Saved')).toBeInTheDocument()
})

test('Bars renders one labelled row per item', () => {
  render(<Bars items={[{ label: 'xG/90', value: 80 }, { label: 'Passes', value: 60 }]} />)
  expect(screen.getByText('xG/90')).toBeInTheDocument()
  expect(screen.getByText('Passes')).toBeInTheDocument()
})
