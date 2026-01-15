'use client';

/**
 * @file components/orders/refund-button.tsx
 * @description 환불 버튼 컴포넌트
 *
 * 결제 완료된 주문에 대한 환불 처리를 위한 버튼과 다이얼로그를 제공합니다.
 * 전액 환불 및 부분 환불을 지원합니다.
 */

import { useState, useTransition } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import type { Order } from '@/types';

interface RefundButtonProps {
  order: Order;
  refundableAmount: number;
}

export function RefundButton({ order, refundableAmount }: RefundButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cancelAmount, setCancelAmount] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 결제 완료된 주문만 환불 가능
  if (order.status !== 'paid' || !order.payment_key) {
    return null;
  }

  // 환불 가능 금액이 없으면 버튼 숨김
  if (refundableAmount <= 0) {
    return null;
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  const handleRefund = () => {
    setError('');

    // 유효성 검증
    if (!cancelReason.trim()) {
      setError('취소 사유를 입력해주세요.');
      return;
    }

    const amount = cancelAmount ? parseInt(cancelAmount.replace(/,/g, '')) : refundableAmount;

    if (isNaN(amount) || amount <= 0) {
      setError('올바른 환불 금액을 입력해주세요.');
      return;
    }

    if (amount > refundableAmount) {
      setError(`환불 가능한 금액(${formatPrice(refundableAmount)})을 초과했습니다.`);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/payments/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            cancelAmount: amount,
            cancelReason: cancelReason.trim(),
          }),
        });

        const result = await response.json();

        if (result.success) {
          alert('환불 요청이 완료되었습니다.');
          setIsOpen(false);
          setCancelAmount('');
          setCancelReason('');
          router.refresh();
        } else {
          setError(result.error || '환불 처리에 실패했습니다.');
        }
      } catch (err) {
        console.error('환불 오류:', err);
        setError('환불 처리 중 오류가 발생했습니다.');
      }
    });
  };

  const handleFullRefund = () => {
    setCancelAmount(refundableAmount.toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          <RefreshCcw className="w-4 h-4 mr-1" />
          환불 요청
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>환불 요청</DialogTitle>
          <DialogDescription>
            주문 번호: {order.order_number}
            <br />
            환불 가능 금액: {formatPrice(refundableAmount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="cancelAmount">환불 금액</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFullRefund}
                className="text-xs"
              >
                전액 환불
              </Button>
            </div>
            <Input
              id="cancelAmount"
              type="text"
              placeholder={refundableAmount.toLocaleString()}
              value={cancelAmount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setCancelAmount(value);
              }}
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              최대 {formatPrice(refundableAmount)}까지 환불 가능합니다.
            </p>
          </div>

          <div>
            <Label htmlFor="cancelReason">취소 사유 *</Label>
            <Textarea
              id="cancelReason"
              placeholder="환불 사유를 입력해주세요"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleRefund}
            disabled={isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              '환불 요청'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
