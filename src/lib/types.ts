export type ProductSpecs = Record<string, string>;

/** Una medida vendible con su propio precio (ver src/lib/variants.ts). */
export type ProductVariant = {
  /** Identificador estable dentro del producto, ej "35x35". Viaja al carrito. */
  id: string;
  /** Texto que ve el cliente, ej "35 x 35 cm". */
  label: string;
  price: number;
  /** Oferta propia de esta medida; null = sin oferta. */
  salePrice: number | null;
  /** Stock propio; null = usa el stock del producto. */
  stock: number | null;
};

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
  variants: ProductVariant[] | null;
  dataSheet: string | null;
  videoUrl: string | null;
  rating: number | null;
  reviewCount: number;
  active: boolean;
  supplierId: string | null;
  supplierCost: number | null;
};

export type ShippingMode = "COORDINAR" | "PROVEEDOR_DIRECTO" | "RETIRO_SOLO";

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  paymentTerms: string | null;
  shippingMode: ShippingMode;
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
  /** Medida elegida, si el producto se vende por medida. */
  variantId?: string | null;
  variantLabel?: string | null;
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
  /** Medida elegida. Dos medidas del mismo producto son dos líneas distintas. */
  variantId?: string | null;
};

export type CheckoutItem = {
  productId: string;
  quantity: number;
  variantId?: string | null;
};
