export interface User {
  email: string;
  name: string;
  location: string;
  balance: number;
}

export interface ProductOrder {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  available: number;
  ordered: number;
}
