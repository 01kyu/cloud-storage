import type { Metadata } from "next";

import { TrashView } from "@views/trash";

export const metadata: Metadata = {
  title: "Корзина",
};

const TrashPage = () => <TrashView />;

export default TrashPage;
