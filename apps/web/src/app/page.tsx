import { redirect } from "next/navigation";

import { ROUTES } from "@shared/config";

const HomePage = () => redirect(ROUTES.files);

export default HomePage;
