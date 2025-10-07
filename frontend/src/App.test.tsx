import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

test('renders login title', () => {
  render(<App />)
  expect(screen.getByText(/radiko\s*ログイン/i)).toBeInTheDocument()
})
