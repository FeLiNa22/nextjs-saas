import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/env";

export const { signIn, signUp, signOut, useSession, getSession } =
  createAuthClient({
    baseURL: env.NEXT_PUBLIC_BASE_URL,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [usernameClient(), nextCookies()],
  });
