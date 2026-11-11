import type { Metadata } from "next";

import { UiKitView } from "@views/ui-kit";

export const metadata: Metadata = {
  title: "UI Kit",
  description: "Дизайн-система Cloud Storage: токены, темы и компоненты на Radix Primitives",
};

const UiKitPage = () => <UiKitView />;

export default UiKitPage;
