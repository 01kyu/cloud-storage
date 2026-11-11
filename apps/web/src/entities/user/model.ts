import type { User } from "@cs/shared";

import { useGetMeQuery } from "./api";

type CurrentUserState = {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
};

export const useCurrentUser = (): CurrentUserState => {
  const { data, isLoading, isError } = useGetMeQuery();

  return { user: data ?? null, isLoading, isError };
};
