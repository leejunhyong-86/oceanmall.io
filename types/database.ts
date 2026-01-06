/**
 * @file database.ts
 * @description Supabase 데이터베이스 타입 정의
 *
 * 이 파일은 데이터베이스 테이블에 대응하는 TypeScript 타입을 정의합니다.
 * Supabase CLI의 generate types 명령으로 자동 생성할 수도 있지만,
 * 수동으로 관리하여 더 세밀한 타입 제어를 합니다.
 */

// ============================================
// 기본 타입
// ============================================

export type UUID = string;
export type Timestamp = string;

// ============================================
// Categories
// ============================================

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: UUID | null;
  sort_order: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CategoryInsert {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: UUID | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: UUID | null;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================
// Products
// ============================================

export type SourcePlatform = 'amazon' | 'aliexpress' | 'iherb' | 'ebay' | 'other';
export type Currency = 'USD' | 'CNY' | 'JPY' | 'EUR' | 'KRW';

export interface Product {
  id: UUID;
  title: string;
  slug: string;
  description: string | null;
  
  // 미디어
  thumbnail_url: string | null;
  video_url: string | null;
  images: string[];
  detail_images: string[];
  
  // 가격
  original_price: number | null;
  currency: Currency;
  price_krw: number | null;
  
  // 출처
  source_platform: string;
  source_url: string;
  source_product_id: string | null;
  
  // 평점
  external_rating: number | null;
  external_review_count: number;
  internal_rating: number | null;
  internal_review_count: number;
  
  // 분류
  category_id: UUID | null;
  tags: string[];
  
  // 메타
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  
  // 할인 및 구매 정보
  discount_rate: number;
  purchase_count: number;
  
  // 타임스탬프
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProductInsert {
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  images?: string[];
  detail_images?: string[];
  original_price?: number | null;
  currency?: Currency;
  price_krw?: number | null;
  source_platform: string;
  source_url: string;
  source_product_id?: string | null;
  external_rating?: number | null;
  external_review_count?: number;
  category_id?: UUID | null;
  tags?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  discount_rate?: number;
  purchase_count?: number;
}

export interface ProductUpdate {
  title?: string;
  slug?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  images?: string[];
  detail_images?: string[];
  original_price?: number | null;
  currency?: Currency;
  price_krw?: number | null;
  source_platform?: string;
  source_url?: string;
  source_product_id?: string | null;
  external_rating?: number | null;
  external_review_count?: number;
  internal_rating?: number | null;
  internal_review_count?: number;
  category_id?: UUID | null;
  tags?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  view_count?: number;
  discount_rate?: number;
  purchase_count?: number;
}

// 확장된 상품 타입 (조인 결과)
export interface ProductWithCategory extends Product {
  category: Category | null;
}

// ============================================
// External Reviews
// ============================================

export interface ExternalReview {
  id: UUID;
  product_id: UUID;
  content: string;
  translated_content: string | null;
  reviewer_name: string | null;
  reviewer_country: string | null;
  rating: number | null;
  source_language: string;
  source_platform: string | null;
  source_review_id: string | null;
  review_date: string | null;
  helpful_count: number;
  is_verified_purchase: boolean;
  is_translated: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ExternalReviewInsert {
  product_id: UUID;
  content: string;
  translated_content?: string | null;
  reviewer_name?: string | null;
  reviewer_country?: string | null;
  rating?: number | null;
  source_language?: string;
  source_platform?: string | null;
  source_review_id?: string | null;
  review_date?: string | null;
  helpful_count?: number;
  is_verified_purchase?: boolean;
  is_translated?: boolean;
}

// ============================================
// User Reviews
// ============================================

export interface UserReview {
  id: UUID;
  product_id: UUID;
  user_id: UUID;
  title: string | null;
  content: string;
  rating: number;
  images: string[];
  purchase_platform: string | null;
  purchase_date: string | null;
  helpful_count: number;
  is_verified: boolean;
  is_visible: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserReviewInsert {
  product_id: UUID;
  user_id: UUID;
  title?: string | null;
  content: string;
  rating: number;
  images?: string[];
  purchase_platform?: string | null;
  purchase_date?: string | null;
}

export interface UserReviewUpdate {
  title?: string | null;
  content?: string;
  rating?: number;
  images?: string[];
  purchase_platform?: string | null;
  purchase_date?: string | null;
  is_visible?: boolean;
}

// 확장된 리뷰 타입 (조인 결과)
export interface UserReviewWithUser extends UserReview {
  user: {
    id: UUID;
    name: string;
    clerk_id: string;
  };
}

// ============================================
// AI Summaries
// ============================================

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'mock';

export interface AISummary {
  id: UUID;
  product_id: UUID;
  summary: string;
  positive_points: string[];
  negative_points: string[];
  recommendation: string | null;
  overall_rating: number | null;
  sentiment_score: number | null;
  ai_provider: AIProvider | null;
  ai_model: string | null;
  review_count: number | null;
  is_outdated: boolean;
  generated_at: Timestamp;
  expires_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AISummaryInsert {
  product_id: UUID;
  summary: string;
  positive_points?: string[];
  negative_points?: string[];
  recommendation?: string | null;
  overall_rating?: number | null;
  sentiment_score?: number | null;
  ai_provider?: AIProvider | null;
  ai_model?: string | null;
  review_count?: number | null;
  expires_at?: Timestamp | null;
}

// ============================================
// Wishlists
// ============================================

export interface Wishlist {
  id: UUID;
  user_id: UUID;
  product_id: UUID;
  note: string | null;
  saved_price: number | null;
  created_at: Timestamp;
}

export interface WishlistInsert {
  user_id: UUID;
  product_id: UUID;
  note?: string | null;
  saved_price?: number | null;
}

// 확장된 위시리스트 타입
export interface WishlistWithProduct extends Wishlist {
  product: Product;
}

// ============================================
// Recent Views
// ============================================

export interface RecentView {
  id: UUID;
  user_id: UUID;
  product_id: UUID;
  viewed_at: Timestamp;
}

export interface RecentViewWithProduct extends RecentView {
  product: Product;
}

// ============================================
// Review Votes
// ============================================

export type VoteType = 'helpful' | 'not_helpful';

export interface ReviewVote {
  id: UUID;
  review_id: UUID;
  user_id: UUID;
  vote_type: VoteType;
  created_at: Timestamp;
}

// ============================================
// Users (기존 테이블)
// ============================================

export interface User {
  id: UUID;
  clerk_id: string;
  name: string;
  created_at: Timestamp;
}

// ============================================
// Lucky Draw Events
// ============================================

export interface LuckyDrawEvent {
  id: UUID;
  title: string;
  description: string | null;
  product_image_url: string | null;
  end_time: Timestamp;
  target_url: string;
  is_active: boolean;
  created_at: Timestamp;
}

export interface LuckyDrawEventInsert {
  title: string;
  description?: string | null;
  product_image_url?: string | null;
  end_time: string;
  target_url?: string;
  is_active?: boolean;
}

export interface LuckyDrawEventUpdate {
  title?: string;
  description?: string | null;
  product_image_url?: string | null;
  end_time?: string;
  target_url?: string;
  is_active?: boolean;
}

// ============================================
// Carts (장바구니)
// ============================================

export interface Cart {
  id: UUID;
  user_id: UUID;
  product_id: UUID;
  quantity: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CartInsert {
  user_id: UUID;
  product_id: UUID;
  quantity?: number;
}

export interface CartUpdate {
  quantity?: number;
}

// 확장된 장바구니 타입 (상품 정보 포함)
export interface CartWithProduct extends Cart {
  product: Product;
}

// ============================================
// Orders (주문)
// ============================================

export type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled';

export interface Order {
  id: UUID;
  user_id: UUID;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  
  // 배송 정보
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_memo: string | null;
  
  // 결제 정보
  payment_key: string | null;
  payment_method: string | null;
  paid_at: Timestamp | null;
  
  // 타임스탬프
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface OrderInsert {
  user_id: UUID;
  order_number: string;
  total_amount: number;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_memo?: string | null;
}

export interface OrderUpdate {
  status?: OrderStatus;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_memo?: string | null;
  payment_key?: string | null;
  payment_method?: string | null;
  paid_at?: Timestamp | null;
}

// ============================================
// Order Items (주문 상품)
// ============================================

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  product_id: UUID;
  product_title: string;
  product_thumbnail: string | null;
  price: number;
  quantity: number;
  created_at: Timestamp;
}

export interface OrderItemInsert {
  order_id: UUID;
  product_id: UUID;
  product_title: string;
  product_thumbnail?: string | null;
  price: number;
  quantity?: number;
}

// 확장된 주문 타입 (주문 상품 포함)
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

