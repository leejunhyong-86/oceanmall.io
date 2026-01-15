'use client';

/**
 * @file components/checkout/checkout-form.tsx
 * @description 결제 폼 컴포넌트 (배송 정보 + 토스페이먼츠 위젯)
 */

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CartWithProduct } from '@/types';

interface CheckoutFormProps {
  cartItems: CartWithProduct[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
}

interface ShippingInfo {
  name: string;
  phone: string;
  address: string; // 기본 주소 (우편번호 + 도로명/지번 주소)
  addressDetail: string; // 상세 주소
  memo: string;
}

export function CheckoutForm({
  cartItems,
  subtotal,
  shippingFee,
  totalAmount
}: CheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    phone: '',
    address: '',
    addressDetail: '',
    memo: '',
  });
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const paymentMethodsRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);
  const [isDaumScriptLoaded, setIsDaumScriptLoaded] = useState(false);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  // Daum 우편번호 서비스 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => {
      setIsDaumScriptLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거 (선택사항)
      const existingScript = document.querySelector('script[src*="postcode.v2.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // 카카오 주소 검색 팝업 열기
  const handleAddressSearch = () => {
    if (!isDaumScriptLoaded) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // Daum 우편번호 서비스는 전역 객체로 사용
    if (typeof window !== 'undefined' && (window as any).daum?.Postcode) {
      new (window as any).daum.Postcode({
        oncomplete: function (data: any) {
          // 주소 검색 결과 처리
          let addr = ''; // 주소 변수
          let extraAddr = ''; // 참고항목 변수

          // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
          if (data.userSelectedType === 'R') {
            // 사용자가 도로명 주소를 선택했을 경우
            addr = data.roadAddress;
          } else {
            // 사용자가 지번 주소를 선택했을 경우(J)
            addr = data.jibunAddress;
          }

          // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
          if (data.userSelectedType === 'R') {
            // 법정동명이 있을 경우 추가한다. (법정리는 제외)
            // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
            if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
              extraAddr += data.bname;
            }
            // 건물명이 있고, 공동주택일 경우 추가한다.
            if (data.buildingName !== '' && data.apartment === 'Y') {
              extraAddr += extraAddr !== '' ? ', ' + data.buildingName : data.buildingName;
            }
            // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
            if (extraAddr !== '') {
              extraAddr = ' (' + extraAddr + ')';
            }
          }

          // 우편번호와 주소 정보를 해당 필드에 넣는다.
          const fullAddress = `[${data.zonecode}] ${addr}${extraAddr}`;

          setShippingInfo(prev => ({
            ...prev,
            address: fullAddress,
            // 상세 주소는 초기화하지 않음 (사용자가 입력할 수 있도록)
          }));

          // 커서를 상세주소 필드로 이동한다.
          const addressDetailInput = document.getElementById('addressDetail') as HTMLInputElement;
          if (addressDetailInput) {
            addressDetailInput.focus();
          }
        },
        width: '100%',
        height: '100%',
        maxSuggestItems: 5,
      }).open({
        popupName: 'postcodePopup',
        left: window.screen.width / 2 - 250,
        top: window.screen.height / 2 - 300,
      });
    } else {
      alert('주소 검색 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
    }
  };

  // 토스페이먼츠 위젯 초기화
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      console.error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
      return;
    }

    // 키 앞뒤 공백 제거
    const trimmedKey = clientKey.trim();

    const initTossPayments = async () => {
      try {
        console.log('토스페이먼츠 SDK 로드 시작...');
        console.log('사용 중인 Client Key (앞 10자리):', trimmedKey.substring(0, 10) + '...');

        const tossPayments = await loadTossPayments(trimmedKey);
        console.log('토스페이먼츠 SDK 로드 완료');

        const customerKey = `customer_${Date.now()}`;
        console.log('위젯 인스턴스 생성 중...', { customerKey });

        const widgetsInstance = tossPayments.widgets({
          customerKey,
        });

        console.log('결제 금액 설정 중...', { totalAmount });
        // 결제 금액 설정
        await widgetsInstance.setAmount({
          currency: 'KRW',
          value: totalAmount,
        });

        console.log('위젯 인스턴스 설정 완료');
        setWidgets(widgetsInstance);
      } catch (error) {
        console.error('토스페이먼츠 초기화 오류:', error);
        console.error('에러 상세:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    };

    initTossPayments();
  }, [totalAmount]);

  // 위젯 렌더링
  useEffect(() => {
    if (!widgets) {
      return;
    }

    const renderWidgets = async () => {
      try {
        // DOM이 준비될 때까지 대기
        const checkDOM = () => {
          const paymentMethodsEl = document.getElementById('payment-methods');
          const agreementEl = document.getElementById('agreement');
          return paymentMethodsEl && agreementEl;
        };

        // DOM이 준비되지 않았다면 잠시 대기
        if (!checkDOM()) {
          setTimeout(() => {
            if (checkDOM()) {
              renderWidgets();
            }
          }, 100);
          return;
        }

        console.log('토스페이먼츠 위젯 렌더링 시작');

        // 결제 수단 위젯 렌더링
        await widgets.renderPaymentMethods({
          selector: '#payment-methods',
          variantKey: 'DEFAULT',
        });
        console.log('결제 수단 위젯 렌더링 완료');

        // 약관 동의 위젯 렌더링
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });
        console.log('약관 동의 위젯 렌더링 완료');

        setIsWidgetReady(true);
      } catch (error) {
        console.error('위젯 렌더링 오류:', error);
        alert('결제 수단을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
      }
    };

    // DOM이 준비될 때까지 약간의 지연
    const timer = setTimeout(() => {
      renderWidgets();
    }, 100);

    return () => clearTimeout(timer);
  }, [widgets]);

  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!shippingInfo.name.trim()) {
      alert('받는 분 이름을 입력해주세요.');
      return false;
    }
    if (!shippingInfo.phone.trim()) {
      alert('연락처를 입력해주세요.');
      return false;
    }
    if (!shippingInfo.address.trim()) {
      alert('배송 주소를 입력해주세요.');
      return false;
    }
    if (!shippingInfo.addressDetail.trim()) {
      alert('상세 주소를 입력해주세요.');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm() || !widgets || !isWidgetReady) return;

    setIsLoading(true);

    try {
      console.group('결제 프로세스 시작');
      console.log('주문 생성 요청:', {
        cartItemsCount: cartItems.length,
        totalAmount,
        shippingInfo: { ...shippingInfo, phone: '***' }, // 개인정보 마스킹
      });

      // 주문 생성 API 호출
      const orderResponse = await fetch('/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cartItems.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
          })),
          shippingInfo: {
            ...shippingInfo,
            // 주소와 상세 주소를 합쳐서 전송
            address: `${shippingInfo.address} ${shippingInfo.addressDetail}`.trim(),
          },
          totalAmount,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        console.error('주문 생성 실패:', error);

        // 사용자 친화적 에러 메시지
        let errorMessage = error.message || '주문 생성에 실패했습니다.';

        if (orderResponse.status === 400) {
          errorMessage = error.message || '주문 정보를 확인해주세요.';
        } else if (orderResponse.status === 401) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
        } else if (orderResponse.status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }

        throw new Error(errorMessage);
      }

      const { orderId, orderNumber } = await orderResponse.json();
      console.log('주문 생성 성공:', { orderId, orderNumber });

      // 토스페이먼츠 결제 요청
      console.log('토스페이먼츠 결제 요청 시작');
      await widgets.requestPayment({
        orderId: orderNumber,
        orderName: cartItems.length > 1
          ? `${cartItems[0].product?.title} 외 ${cartItems.length - 1}건`
          : cartItems[0].product?.title || '상품',
        successUrl: `${window.location.origin}/api/payments/confirm?orderId=${orderId}&paymentKey={paymentKey}&amount=${totalAmount}`,
        failUrl: `${window.location.origin}/checkout/fail?orderId=${orderId}&orderNumber=${encodeURIComponent(orderNumber)}`,
      });

      console.log('토스페이먼츠 결제 요청 완료');
      console.groupEnd();
    } catch (error) {
      console.groupEnd();
      console.error('결제 오류:', error);

      // 에러 타입별 처리
      let errorMessage = '결제 처리 중 오류가 발생했습니다.';

      if (error instanceof Error) {
        errorMessage = error.message;

        // 네트워크 오류
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
        }

        // 타임아웃 오류
        if (error.message.includes('timeout')) {
          errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
        }
      }

      // 사용자에게 에러 표시 (alert 대신 더 나은 UI로 개선 가능)
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* 왼쪽: 배송 정보 입력 */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4">배송 정보</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">받는 분 *</Label>
              <Input
                id="name"
                value={shippingInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div>
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                type="tel"
                value={shippingInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                배송 주소 *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="주소 검색 버튼을 클릭하세요"
                  readOnly
                  className="flex-1 bg-gray-50 cursor-pointer"
                  onClick={handleAddressSearch}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddressSearch}
                  className="whitespace-nowrap"
                  disabled={!isDaumScriptLoaded}
                >
                  <Search className="w-4 h-4 mr-1" />
                  주소 검색
                </Button>
              </div>
              {shippingInfo.address && (
                <Input
                  id="addressDetail"
                  value={shippingInfo.addressDetail}
                  onChange={(e) => handleInputChange('addressDetail', e.target.value)}
                  placeholder="상세 주소를 입력하세요 (예: 101동 101호)"
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Label htmlFor="memo">배송 메모</Label>
              <Textarea
                id="memo"
                value={shippingInfo.memo}
                onChange={(e) => handleInputChange('memo', e.target.value)}
                placeholder="배송 시 요청사항을 입력하세요 (선택)"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* 결제 수단 */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4">결제 수단</h2>
          {!isWidgetReady && (
            <div className="py-8 text-center text-gray-500">
              <p>결제 수단을 불러오는 중...</p>
            </div>
          )}
          <div
            id="payment-methods"
            ref={(el) => {
              paymentMethodsRef.current = el;
            }}
          />
        </div>

        {/* 약관 동의 */}
        <div className="bg-white rounded-xl border p-6">
          <div id="agreement" ref={agreementRef} />
        </div>
      </div>

      {/* 오른쪽: 주문 요약 */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6 sticky top-24">
          <h2 className="text-lg font-bold mb-4">주문 상품</h2>

          <div className="space-y-4 max-h-60 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {item.product?.thumbnail_url ? (
                    <Image
                      src={item.product.thumbnail_url}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xl opacity-30">📦</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{item.product?.title}</p>
                  <p className="text-sm text-gray-500">수량: {item.quantity}</p>
                  <p className="text-sm font-medium">
                    {formatPrice((item.product?.price_krw || 0) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">상품 금액</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">배송비</span>
              <span>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>총 결제 금액</span>
              <span className="text-purple-600">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <Button
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
            size="lg"
            onClick={handlePayment}
            disabled={isLoading || !isWidgetReady}
          >
            {isLoading ? '결제 처리 중...' : `${formatPrice(totalAmount)} 결제하기`}
          </Button>
        </div>
      </div>
    </div>
  );
}
