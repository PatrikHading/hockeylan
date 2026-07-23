import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import LoanForm from '../LoanForm'
import api from '../../api/api'

vi.mock('../../api/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}))

function renderLoanForm() {
    return render(
        <MemoryRouter initialEntries={['/loan/HELMET-001']}>
            <Routes>
                <Route path="/loan/:serialNumber" element={<LoanForm />} />
            </Routes>
        </MemoryRouter>
    )
}

describe('LoanForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('renders loading state first', () => {
        api.get.mockResolvedValueOnce({
            data: {
                id: 1,
                type: 'HELMET',
                serialNumber: 'HELMET-001',
                description: 'Bauer hjälm',
                available: true
            }
        })

        renderLoanForm()

        expect(screen.getByText(/hämtar utrustning/i)).toBeInTheDocument()
    })

    test('renders loan form when equipment is available', async () => {
        api.get.mockResolvedValueOnce({
            data: {
                id: 1,
                type: 'HELMET',
                serialNumber: 'HELMET-001',
                description: 'Bauer hjälm',
                available: true
            }
        })

        renderLoanForm()

        expect(await screen.findByRole('heading', { name: /låna utrustning/i })).toBeInTheDocument()
        expect(screen.getByText(/tillgänglig/i)).toBeInTheDocument()
        expect(screen.getByText(/HELMET-001/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/namn/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/e-post/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/telefonnummer/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /låna utrustning/i })).toBeEnabled()
    })

    test('shows error when equipment cannot be fetched', async () => {
        api.get.mockRejectedValueOnce({
            response: {
                data: {
                    message: 'Kunde inte hitta utrustning.'
                }
            }
        })

        renderLoanForm()

        await waitFor(() => {
            expect(screen.getByText(/kunde inte hitta utrustning/i)).toBeInTheDocument()
        })
    })
})