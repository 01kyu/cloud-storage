import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import "@shared/styles";

import styles from "./layout.module.scss";
import { Providers } from "./providers";
import { ThemeScript } from "./providers/theme-script";

export const metadata: Metadata = {
  title: {
    default: "Cloud Storage",
    template: "%s · Cloud Storage",
  },
  description: "Облачное хранилище: файлы, папки, корзина и общий доступ",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="ru" suppressHydrationWarning>
    <head>
      <ThemeScript />
    </head>
    <body>
      <Providers>
        <main className={styles.main}>{children}</main>
      </Providers>
    </body>
  </html>
);

export default RootLayout;
