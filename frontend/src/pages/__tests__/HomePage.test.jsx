import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../HomePage'

describe('HomePage', () => {
    test('renders homepage content', () => {
        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        )

        expect(screen.getByRole('heading', { name: /hockeylån/i })).toBeInTheDocument()
        expect(screen.getByText(/hantera hockeyutrustning snabbt och enkelt/i)).toBeInTheDocument()
        expect(screen.getByText(/så fungerar det/i)).toBeInTheDocument()
    })

    test('renders navigation links', () => {
        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        )

        expect(screen.getByRole('link', { name: /skanna qr-kod/i })).toHaveAttribute('href', '/scan')
        expect(screen.getByRole('link', { name: /öppna admin-panel/i })).toHaveAttribute('href', '/admin')
    })
})