"use client";

import { useEffect } from "react";

import { isMockingEnabled } from "@shared/config";

export const MockBootstrapper = () => {
  useEffect(() => {
    if (!isMockingEnabled) {
      return;
    }

    void (async () => {
      const { startMocking } = await import("@shared/api/mocks");
      await startMocking();
    })();
  }, []);

  return null;
};
