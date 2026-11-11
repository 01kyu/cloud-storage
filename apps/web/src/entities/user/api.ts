import { API_ROUTES, type AuthResponse, type LoginPayload, type User } from "@cs/shared";
import { rootApi } from "@shared/api";

export const userApi = rootApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => ({ url: API_ROUTES.auth.me }),
      providesTags: ["User"],
    }),
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({ url: API_ROUTES.auth.login, method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    /**
     * После выхода данные предыдущей сессии не должны дожить до следующего
     * входа, поэтому чистим весь кэш RTK Query, а не отдельные теги.
     */
    logout: builder.mutation<void, void>({
      query: () => ({ url: API_ROUTES.auth.logout, method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        dispatch(rootApi.util.resetApiState());
      },
    }),
  }),
});

export const { useGetMeQuery, useLoginMutation, useLogoutMutation } = userApi;
