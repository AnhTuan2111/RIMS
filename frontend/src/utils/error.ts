import axios from 'axios'
import type { ApiErrorResponse } from '../types/api-error'

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'status' in value &&
        'message' in value &&
        'error' in value
    )
}

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error) && isApiErrorResponse(error.response?.data)) {
        return error.response.data.message
    }
    if (error instanceof Error) {
        return error.message
    }
    return 'Unknown error'
}
