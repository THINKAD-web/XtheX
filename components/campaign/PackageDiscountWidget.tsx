"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplicableDiscountRate } from "@/lib/config/discount-rules";

type Props = {
  selectedMedias: { id: string; price: number }[];
};

export function PackageDiscountWidget({ selectedMedias }: Props) {
  const { totalPrice, discountRate, discountedTotal, savings } = React.useMemo(() => {
    if (!selectedMedias.length) {
      return { totalPrice: 0, discountRate: 0, discountedTotal: 0, savings: 0 };
    }
    const total = selectedMedias.reduce((s, m) => s + (m.price ?? 0), 0);
    const rate = getApplicableDiscountRate(selectedMedias.length);
    const discounted = Math.round(total * (1 - rate));
    return {
      totalPrice: total,
      discountRate: rate,
      discountedTotal: discounted,
      savings: total - discounted,
    };
  }, [selectedMedias]);

  if (selectedMedias.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">패키지 할인</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm text-zinc-500">
          목록에서 매체를 선택하면 할인 견적이 표시됩니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">
          패키지 할인 적용 중 {Math.round(discountRate * 100)}% ({selectedMedias.length}개)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4 pt-0 text-sm">
        <div className="text-zinc-500 line-through">
          원가 {totalPrice.toLocaleString()}원
        </div>
        <div className="font-semibold text-emerald-400">
          최종 {discountedTotal.toLocaleString()}원
        </div>
        <div className="text-xs text-emerald-500">
          절감액 {savings.toLocaleString()}원
        </div>
      </CardContent>
    </Card>
  );
}
