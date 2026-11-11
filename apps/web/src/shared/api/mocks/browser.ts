import { setupWorker, type SetupWorker } from "msw/browser";

import { handlers } from "./handlers";

let worker: SetupWorker | null = null;

export const startMocking = async (): Promise<void> => {
  if (worker) {
    return;
  }

  worker = setupWorker(...handlers);
  await worker.start({
    onUnhandledFrame: "bypass",
    quiet: true,
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
};

export const stopMocking = (): void => {
  worker?.stop();
  worker = null;
};
