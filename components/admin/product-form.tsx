'use client';

/**
 * @file components/admin/product-form.tsx
 * @description 상품 등록/수정 폼 컴포넌트
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createProduct, updateProduct } from '@/actions/products';
import type { Product, Category, Currency } from '@/types';

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  mode: 'create' | 'edit';
}

const PLATFORMS = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'aliexpress', label: 'AliExpress' },
  { value: 'iherb', label: 'iHerb' },
  { value: 'ebay', label: 'eBay' },
  { value: 'other', label: '기타' },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'KRW', label: 'KRW (₩)' },
];

export function ProductForm({ product, categories, mode }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 폼 상태
  const [formData, setFormData] = useState({
    title: product?.title || '',
    slug: product?.slug || '',
    description: product?.description || '',
    thumbnail_url: product?.thumbnail_url || '',
    video_url: product?.video_url || '',
    images: product?.images?.join('\n') || '',
    detail_images: product?.detail_images?.join('\n') || '',
    original_price: product?.original_price?.toString() || '',
    currency: product?.currency || 'USD' as Currency,
    price_krw: product?.price_krw?.toString() || '',
    source_platform: product?.source_platform || 'amazon',
    source_url: product?.source_url || '',
    source_product_id: product?.source_product_id || '',
    external_rating: product?.external_rating?.toString() || '',
    external_review_count: product?.external_review_count?.toString() || '0',
    category_id: product?.category_id || '',
    tags: product?.tags?.join(', ') || '',
    discount_rate: product?.discount_rate?.toString() || '0',
    purchase_count: product?.purchase_count?.toString() || '0',
    is_featured: product?.is_featured || false,
    is_active: product?.is_active ?? true,
  });

  const handleChange = (
    field: string,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 제목에서 자동 slug 생성
    if (field === 'title' && mode === 'create') {
      const slug = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 100);
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.title.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }
    if (!formData.slug.trim()) {
      alert('URL 슬러그를 입력해주세요.');
      return;
    }
    if (!formData.source_url.trim()) {
      alert('구매 링크를 입력해주세요.');
      return;
    }

    startTransition(async () => {
      const productData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        thumbnail_url: formData.thumbnail_url.trim() || null,
        video_url: formData.video_url.trim() || null,
        images: formData.images.split('\n').map(s => s.trim()).filter(Boolean),
        detail_images: formData.detail_images.split('\n').map(s => s.trim()).filter(Boolean),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        currency: formData.currency,
        price_krw: formData.price_krw ? parseInt(formData.price_krw) : null,
        source_platform: formData.source_platform,
        source_url: formData.source_url.trim(),
        source_product_id: formData.source_product_id.trim() || null,
        external_rating: formData.external_rating ? parseFloat(formData.external_rating) : null,
        external_review_count: parseInt(formData.external_review_count) || 0,
        category_id: formData.category_id || null,
        tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
        discount_rate: parseInt(formData.discount_rate) || 0,
        purchase_count: parseInt(formData.purchase_count) || 0,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      let result;
      if (mode === 'create') {
        result = await createProduct(productData);
      } else if (product) {
        result = await updateProduct(product.id, productData);
      }

      if (result?.success) {
        alert(mode === 'create' ? '상품이 등록되었습니다.' : '상품이 수정되었습니다.');
        router.push('/admin/products');
      } else {
        alert(result?.error || '저장에 실패했습니다.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">기본 정보</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="title">상품명 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="상품명을 입력하세요"
            />
          </div>
          <div>
            <Label htmlFor="slug">URL 슬러그 *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="url-friendly-slug"
            />
            <p className="text-xs text-gray-500 mt-1">
              상품 URL에 사용됩니다: /products/{formData.slug || 'slug'}
            </p>
          </div>
          <div>
            <Label htmlFor="description">상품 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="상품에 대한 설명을 입력하세요"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* 미디어 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">미디어</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="thumbnail_url">썸네일 URL</Label>
            <Input
              id="thumbnail_url"
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => handleChange('thumbnail_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label htmlFor="video_url">비디오 URL</Label>
            <Input
              id="video_url"
              type="url"
              value={formData.video_url}
              onChange={(e) => handleChange('video_url', e.target.value)}
              placeholder="https://example.com/video.mp4"
            />
          </div>
          <div>
            <Label htmlFor="images">추가 이미지 URL (줄바꿈으로 구분)</Label>
            <Textarea
              id="images"
              value={formData.images}
              onChange={(e) => handleChange('images', e.target.value)}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="detail_images">상품 상세 이미지 URL (줄바꿈으로 구분)</Label>
            <Textarea
              id="detail_images"
              value={formData.detail_images}
              onChange={(e) => handleChange('detail_images', e.target.value)}
              placeholder="https://example.com/detail1.jpg&#10;https://example.com/detail2.jpg"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              상품 상세 페이지 하단에 표시되는 이미지입니다. 로고, 아이콘 등은 자동으로 필터링됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 가격 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">가격</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="original_price">원가 (외화)</Label>
            <Input
              id="original_price"
              type="number"
              step="0.01"
              value={formData.original_price}
              onChange={(e) => handleChange('original_price', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="currency">통화</Label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full h-10 px-3 border rounded-md"
            >
              {CURRENCIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="price_krw">한화 가격 (원)</Label>
            <Input
              id="price_krw"
              type="number"
              value={formData.price_krw}
              onChange={(e) => handleChange('price_krw', e.target.value)}
              placeholder="직접 구매가 가능하면 입력"
            />
            <p className="text-xs text-gray-500 mt-1">
              입력하면 직접 구매 가능 상품으로 표시됩니다.
            </p>
          </div>
          <div>
            <Label htmlFor="discount_rate">할인율 (%)</Label>
            <Input
              id="discount_rate"
              type="number"
              min="0"
              max="100"
              value={formData.discount_rate}
              onChange={(e) => handleChange('discount_rate', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* 출처 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">출처 정보</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="source_platform">플랫폼</Label>
            <select
              id="source_platform"
              value={formData.source_platform}
              onChange={(e) => handleChange('source_platform', e.target.value)}
              className="w-full h-10 px-3 border rounded-md"
            >
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="source_product_id">상품 ID</Label>
            <Input
              id="source_product_id"
              value={formData.source_product_id}
              onChange={(e) => handleChange('source_product_id', e.target.value)}
              placeholder="원본 사이트의 상품 ID"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="source_url">구매 링크 *</Label>
            <Input
              id="source_url"
              type="url"
              value={formData.source_url}
              onChange={(e) => handleChange('source_url', e.target.value)}
              placeholder="https://amazon.com/dp/..."
            />
          </div>
        </div>
      </div>

      {/* 분류 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">분류</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category_id">카테고리</Label>
            <select
              id="category_id"
              value={formData.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              className="w-full h-10 px-3 border rounded-md"
            >
              <option value="">카테고리 선택</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="태그1, 태그2, 태그3"
            />
          </div>
        </div>
      </div>

      {/* 평점 및 리뷰 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">외부 평점/리뷰</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="external_rating">외부 평점 (0~5)</Label>
            <Input
              id="external_rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={formData.external_rating}
              onChange={(e) => handleChange('external_rating', e.target.value)}
              placeholder="4.5"
            />
          </div>
          <div>
            <Label htmlFor="external_review_count">외부 리뷰 수</Label>
            <Input
              id="external_review_count"
              type="number"
              min="0"
              value={formData.external_review_count}
              onChange={(e) => handleChange('external_review_count', e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="purchase_count">구매자 수</Label>
            <Input
              id="purchase_count"
              type="number"
              min="0"
              value={formData.purchase_count}
              onChange={(e) => handleChange('purchase_count', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* 상태 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">상태</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="w-4 h-4"
            />
            <span>활성 상태 (사용자에게 표시)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => handleChange('is_featured', e.target.checked)}
              className="w-4 h-4"
            />
            <span>추천 상품</span>
          </label>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex items-center justify-between">
        <Link href="/admin/products">
          <Button type="button" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? '상품 등록' : '상품 수정'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
