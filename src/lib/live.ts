"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getStoreVersion, startLiveSync, subscribeStore } from "./store";

export function useLive() {
  useEffect(() => {
    startLiveSync();
  }, []);
  return useSyncExternalStore(subscribeStore, getStoreVersion, () => 0);
}
