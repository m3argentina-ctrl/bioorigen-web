export type ProductSpecs = Record<string, string>;

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  category: string;
  linea: string | null;
  featured: boolean;
  images: string[];
  specs: ProductSpecs | null;
  dataSheet: string | null;
  videoUrl: string | null;
  rating: number | null;
  reviewCount: number;
};

export type Recipe = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  category: string;
  difficulty: string;
  time: string;
  temperature: string;
  ingredients: string[];
  equipment: string[];
  steps: string[];
  variations: string[];
  uses: string[];
  image: string;
  images: string[];
  featured: boolean;
  season: string | null;
};

// Snapshot de un ítem dentro de Order.items (campo Json, sin relación).
export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  mercadoPagoId: string | null;
  paymentStatus: string | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type CheckoutItem = {
  productId: string;
  quantity: number;
};
