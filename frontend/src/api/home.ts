import { apiClient } from './client'
import type { PublicHomeContent } from '../types/home'

export async function getPublicHome(): Promise<PublicHomeContent> {
    const { data } = await apiClient.get<PublicHomeContent>('/public/home')
    return data
}
