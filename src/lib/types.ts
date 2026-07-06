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
  supplierId: string | null;
  supplierCost: number | null;
};

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  paymentTerms: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupplierOrderItem = {
  productId: string;
  name: string;
  quantity: number;
  supplierCost: number;
};

export type SupplierOrder = {
  id: string;
  orderId: string;
  supplierId: string;
  status: string;
  items: SupplierOrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  confirmToken: string;
  trackingNumber: string | null;
  carrier: string | null;
  supplierCost: number;
  adminNotes: string | null;
  notifiedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  order?: { id: string; customerName: string; total: number };
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
