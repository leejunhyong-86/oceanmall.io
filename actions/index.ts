/**
 * @file actions/index.ts
 * @description Server Actions 진입점
 */

// 상품 관련
export {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  incrementViewCount,
  getRelatedProducts,
} from './products';

// 카테고리 관련
export {
  getCategories,
  getCategoryBySlug,
  getCategoriesWithProductCount,
} from './categories';

// 리뷰 관련
export {
  getExternalReviews,
  getUserReviews,
  createUserReview,
  updateUserReview,
  deleteUserReview,
  voteReviewHelpful,
  getMyReviews,
} from './reviews';

// 위시리스트 관련
export {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  isInWishlist,
} from './wishlists';

