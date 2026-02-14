export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  images: string[];
  inStock: boolean;
  rating?: number;
  reviews?: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  link?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  productCount: number;
}
