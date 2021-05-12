export interface User {
  email: string;
  name: string;
  location: string;
  balance: number;
}

export interface PastOrderProduct {
  name: string;
  imageUrl: string;
  price: number;
  ordered: number;
}

export interface ProductOrder extends PastOrderProduct {
  id: string;
  available: number;
}
