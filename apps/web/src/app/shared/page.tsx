import type { Metadata } from "next";

import { SharedLinksView } from "@views/shared-links";

export const metadata: Metadata = {
  title: "Общий доступ",
};

const SharedPage = () => <SharedLinksView />;

export default SharedPage;
