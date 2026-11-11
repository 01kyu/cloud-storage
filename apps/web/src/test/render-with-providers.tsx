import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";

import { makeStore, type AppStore } from "@app/store";
import { ToastProvider, ToastViewport, TooltipProvider } from "@shared/ui";

type TestProvidersProps = {
  children: ReactNode;
  store: AppStore;
};

/** Провайдеры для тестов: свой стор на рендер, без MSW-браузера и Next-обвязки. */
const TestProviders = ({ children, store }: TestProvidersProps) => (
  <Provider store={store}>
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <ToastProvider duration={0}>
        {children}
        <ToastViewport />
      </ToastProvider>
    </TooltipProvider>
  </Provider>
);

export type RenderWithProvidersResult = ReturnType<typeof render> & {
  store: AppStore;
};

export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  store?: AppStore;
};

export const renderWithProviders = (
  ui: ReactElement,
  { store = makeStore(), ...renderOptions }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult => ({
  store,
  ...render(ui, {
    wrapper: ({ children }) => <TestProviders store={store}>{children}</TestProviders>,
    ...renderOptions,
  }),
});
