import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, test } from 'vitest'
import ThankYou from '../ThankYou'

describe('ThankYou', () => {
    test('renders success message', () => {
        render(
            <MemoryRouter>
                <ThankYou />
            </MemoryRouter>
        )

        expect(screen.getByRole('heading', { name: /lån registrerat/i })).toBeInTheDocument()
        expect(screen.getByText(/utrustningen är nu utlånad/i)).toBeInTheDocument()
        expect(screen.getByText(/tack/i)).toBeInTheDocument()
    })

    test('renders link back to homepage', () => {
        render(
            <MemoryRouter>
                <ThankYou />
            </MemoryRouter>
        )

        expect(screen.getByRole('link', { name: /till startsidan/i })).toHaveAttribute('href', '/')
    })
})