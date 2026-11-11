import { MOCK_LATENCY_MS } from "./constants";

/** В тестах мгновенно, в браузере — как у реального API. */
export const mockLatency = (): number => (process.env.NODE_ENV === "test" ? 0 : MOCK_LATENCY_MS);
