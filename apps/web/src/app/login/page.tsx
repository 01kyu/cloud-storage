import type { Metadata } from "next";

import { LoginView } from "@views/login";

export const metadata: Metadata = {
  title: "Вход",
};

const LoginPage = () => <LoginView />;

export default LoginPage;
