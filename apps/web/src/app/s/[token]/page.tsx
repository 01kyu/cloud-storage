import type { Metadata } from "next";

import { PublicShareView } from "@views/public-share";

export const metadata: Metadata = {
  title: "Публичная ссылка",
  /** Ссылка одноразовая и не должна попадать в поиск. */
  robots: { index: false, follow: false },
};

type PublicSharePageProps = {
  params: Promise<{ token: string }>;
};

const PublicSharePage = async ({ params }: PublicSharePageProps) => {
  const { token } = await params;

  return <PublicShareView token={token} />;
};

export default PublicSharePage;
