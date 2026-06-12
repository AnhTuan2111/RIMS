import type { PublicHomeContent } from '../types/home'

export async function getPublicHome(): Promise<PublicHomeContent> {
    const response = await fetch('/home-content.json')
    if (!response.ok) {
        throw new Error('Không thể tải nội dung trang chủ')
    }
    return response.json() as Promise<PublicHomeContent>
}
