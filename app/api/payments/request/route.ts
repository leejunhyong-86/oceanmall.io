/**
 * @file app/api/payments/request/route.ts
 * @description 결제 요청 API - 주문 생성
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

interface CartItem {
  productId: string;
  quantity: number;
}

interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  memo: string;
}

interface RequestBody {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  totalAmount: number;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body: RequestBody = await request.json();
    const { cartItems, shippingInfo, totalAmount } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { message: '주문할 상품이 없습니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 확인
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { message: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상품 정보 조회 (가격 검증용)
    const productIds = cartItems.map(item => item.productId);
    const { data: products } = await supabase
      .from('products')
      .select('id, title, thumbnail_url, price_krw, is_active')
      .in('id', productIds);

    if (!products) {
      return NextResponse.json(
        { message: '상품 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    // 상품 유효성 검증
    const productMap = new Map(products.map(p => [p.id, p]));
    let calculatedTotal = 0;

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { message: '일부 상품을 찾을 수 없습니다.' },
          { status: 400 }
        );
      }
      if (!product.is_active) {
        return NextResponse.json(
          { message: `${product.title} 상품은 현재 판매 중지 상태입니다.` },
          { status: 400 }
        );
      }
      if (!product.price_krw) {
        return NextResponse.json(
          { message: `${product.title} 상품은 직접 구매가 불가능합니다.` },
          { status: 400 }
        );
      }
      calculatedTotal += product.price_krw * item.quantity;
    }

    // 배송비 계산
    const shippingFee = calculatedTotal >= 50000 ? 0 : 3000;
    calculatedTotal += shippingFee;

    // 금액 검증
    if (calculatedTotal !== totalAmount) {
      return NextResponse.json(
        { message: '결제 금액이 일치하지 않습니다. 페이지를 새로고침 해주세요.' },
        { status: 400 }
      );
    }

    // 주문 번호 생성
    const orderNumber = `ORD-${Date.now()}-${nanoid(6).toUpperCase()}`;

    // 주문 생성
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userData.id,
        order_number: orderNumber,
        status: 'pending',
        total_amount: totalAmount,
        balance_amount: totalAmount, // 초기 잔액 = 총 결제 금액
        cancelled_amount: 0, // 초기 취소 금액 = 0
        shipping_name: shippingInfo.name,
        shipping_phone: shippingInfo.phone,
        shipping_address: shippingInfo.address,
        shipping_memo: shippingInfo.memo || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('주문 생성 오류:', orderError);
      return NextResponse.json(
        { message: '주문 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 주문 상품 생성
    const orderItems = cartItems.map(item => {
      const product = productMap.get(item.productId)!;
      return {
        order_id: order.id,
        product_id: item.productId,
        product_title: product.title,
        product_thumbnail: product.thumbnail_url,
        price: product.price_krw!,
        quantity: item.quantity,
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('주문 상품 생성 오류:', itemsError);
      // 주문 롤백
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { message: '주문 상품 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error('결제 요청 오류:', error);
    return NextResponse.json(
      { message: '결제 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
