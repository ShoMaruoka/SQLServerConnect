// 注文の型定義
export interface Order {
  orderId: number;
  orderDate: string;
}

// 商品の型定義
export interface Product {
  productCode: string;
  productName: string;
  price: number;
}

// 注文明細の型定義
export interface OrderDetail {
  orderId: number;
  detailId: number;
  productCode: string;
  productName: string;
  price: number;
  quantity: number;
  salesPrice: number;
  isModified: boolean;
}

// 価格更新リクエストの型定義
export interface UpdatePriceRequest {
  orderId: number;
  detailId: number;
  newPrice: number;
}

// API レスポンスの共通型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 