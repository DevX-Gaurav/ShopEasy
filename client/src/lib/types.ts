export type Role = "customer" | "vendor" | "admin";

export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // demo only — plaintext in localStorage
  role: Role;
  status: UserStatus;
  shopName?: string;
  avatar?: string;
  address?: string;
  phone?: string;
  suspensionReason?: string;
  createdAt: string;
}

export type Category = "Electronics" | "Fashion" | "Footwear";

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  description: string;
  specifications: string;
  price: number;
  discount: number; // percent 0-100
  stock: number;
  category: Category;
  subCategory?: string;
  colors: string[];
  sizes: string[];
  images: string[]; // data URLs
  rating: number;
  ratingCount: number;
  createdAt: string;
}

export type OrderStatus =
  | "Placed"
  | "Dispatched"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "UPI" | "Card" | "Net Banking" | "Cash on Delivery";

export interface OrderItem {
  productId: string;
  vendorId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface ReturnRequest {
  id: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Refunded";
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  cancelReason?: string;
  cancelledBy?: "customer" | "vendor";
  returnRequest?: ReturnRequest;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type ComplaintFrom = "customer" | "vendor";
export interface Complaint {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromRole: ComplaintFrom;
  subject: string;
  message: string;
  status: "Open" | "Resolved";
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OtpRecord {
  email: string;
  code: string;
  purpose: "signup" | "login" | "reset";
  expiresAt: number;
}