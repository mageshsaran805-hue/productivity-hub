"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True after the component has mounted on the client (false during SSR/hydration). */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}