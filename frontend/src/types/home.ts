export interface BrandInfo {
    brandName: string
    tagline: string | null
    description: string | null
    heroImageUrl: string | null
}

export interface ContactInfo {
    address: string
    phone: string
    email: string | null
    openingHours: string
    mapUrl: string | null
}

export interface PublicHomeContent {
    brand: BrandInfo
    contact: ContactInfo
}
