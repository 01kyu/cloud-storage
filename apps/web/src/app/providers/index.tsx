"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { ToastProvider, ToastViewport, TooltipProvider } from "@shared/ui";

import { StoreProvider } from "./store-provider";

const MockBootstrapper = dynamic(
  () => import("./mock-bootstrapper").then((mod) => mod.MockBootstrapper),
  { ssr: false },
);

type ProvidersProps = {
  children: ReactNode;
};

/**
 * MSW монтируется только на клиенте (`ssr: false`), поэтому `msw/browser`
 * не попадает в серверный бандл.
 */
export const Providers = ({ children }: ProvidersProps) => (
  <StoreProvider>
    <TooltipProvider delayDuration={400} skipDelayDuration={150}>
      <ToastProvider duration={5000} swipeDirection="right">
        <MockBootstrapper />
        {children}
        <ToastViewport />
      </ToastProvider>
    </TooltipProvider>
  </StoreProvider>
);
