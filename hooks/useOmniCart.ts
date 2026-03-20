"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { OmniCartItem } from "@/lib/omni-cart/types";
import { OMNI_CART_ADD_FEEDBACK } from "@/lib/omni-cart/types";
import {
  addManyToOmniCart,
  addToOmniCart,
  clearOmniCart,
  estimateOmniCartFloorKrw,
  readOmniCart,
  removeFromOmniCart,
  setOmniCartItems,
  subscribeOmniCart,
} from "@/lib/omni-cart/storage";

function notifyOmniCartAdded(added: number) {
  if (added <= 0 || typeof window === "undefined") return;
  toast.success(`매체 ${added}개가 옴니채널 카트에 추가됐습니다!`, {
    duration: 3000,
  });
  window.dispatchEvent(
    new CustomEvent(OMNI_CART_ADD_FEEDBACK, { detail: { added } }),
  );
}

export function useOmniCart() {
  const [items, setItems] = useState<OmniCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readOmniCart());
    setHydrated(true);
    return subscribeOmniCart(() => setItems(readOmniCart()));
  }, []);

  const add = useCallback((item: OmniCartItem) => {
    const before = readOmniCart().length;
    addToOmniCart(item);
    const after = readOmniCart().length;
    notifyOmniCartAdded(after - before);
    setItems(readOmniCart());
  }, []);

  const addMany = useCallback((list: OmniCartItem[]) => {
    const before = readOmniCart().length;
    addManyToOmniCart(list);
    const after = readOmniCart().length;
    notifyOmniCartAdded(after - before);
    setItems(readOmniCart());
  }, []);

  const remove = useCallback((mediaId: string) => {
    removeFromOmniCart(mediaId);
    setItems(readOmniCart());
  }, []);

  const clear = useCallback(() => {
    clearOmniCart();
    setItems([]);
  }, []);

  const setOrder = useCallback((next: OmniCartItem[]) => {
    setOmniCartItems(next);
    setItems(next);
  }, []);

  const estimatedFloorKrw = useMemo(
    () => estimateOmniCartFloorKrw(items),
    [items],
  );

  return {
    items,
    count: items.length,
    hydrated,
    add,
    addMany,
    remove,
    clear,
    setOrder,
    estimatedFloorKrw,
  };
}
