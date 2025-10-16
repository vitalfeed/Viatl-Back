export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'CHAT' | 'CHIEN';
  subCategory: 'ALIMENT' | 'COMPLEMENT' | 'TEST_RAPIDE';
  inStock: boolean;
  detailsUrl: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}
