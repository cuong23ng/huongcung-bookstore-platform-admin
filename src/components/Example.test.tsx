import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Example component for testing
const ExampleComponent = ({ title }: { title: string }) => {
  return <div data-testid="example-component">{title}</div>
}

describe('Example Component Test', () => {
  it('renders component with props', () => {
    render(<ExampleComponent title="Test Title" />)
    expect(screen.getByTestId('example-component')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders different titles correctly', () => {
    const { rerender } = render(<ExampleComponent title="First Title" />)
    expect(screen.getByText('First Title')).toBeInTheDocument()

    rerender(<ExampleComponent title="Second Title" />)
    expect(screen.getByText('Second Title')).toBeInTheDocument()
    expect(screen.queryByText('First Title')).not.toBeInTheDocument()
  })
})

