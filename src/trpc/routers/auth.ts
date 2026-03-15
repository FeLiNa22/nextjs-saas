import { cookies, headers } from "next/headers";
import { TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth/server";
import { SignInSchema } from "@/app/(routes)/(auth)/signin/validate";
import { SignUpSchema } from "@/app/(routes)/(auth)/signup/validate";
import { publicProcedure, protectedProcedure, router } from "@/trpc/init";

async function forwardAuthCookies(response: Response) {
  const cookieStore = await cookies();
  const setCookies: string[] =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : (() => {
          const raw = response.headers.get("set-cookie");
          return raw !== null ? [raw] : [];
        })();

  for (const setCookie of setCookies) {
    const [nameValue, ...attrParts] = setCookie
      .split(";")
      .map((p) => p.trim());
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx === -1) continue;
    const name = nameValue.substring(0, eqIdx);
    const value = nameValue.substring(eqIdx + 1);

    const opts: {
      path?: string;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
      maxAge?: number;
      expires?: Date;
    } = {};

    for (const attr of attrParts) {
      const [rawKey, ...rest] = attr.split("=");
      const key = rawKey.trim().toLowerCase();
      const val = rest.join("=").trim();
      if (key === "httponly") opts.httpOnly = true;
      else if (key === "secure") opts.secure = true;
      else if (key === "path") opts.path = val;
      else if (key === "samesite") {
        if (val === "strict" || val === "lax" || val === "none")
          opts.sameSite = val;
      } else if (key === "max-age") {
        opts.maxAge = parseInt(val, 10);
      } else if (key === "expires") {
        opts.expires = new Date(val);
      }
    }

    cookieStore.set(name, value, opts);
  }
}

export const authRouter = router({
  signIn: publicProcedure.input(SignInSchema).mutation(async ({ input }) => {
    const reqHeaders = await headers();
    const response = await auth.api.signInUsername({
      body: { username: input.username, password: input.password },
      headers: reqHeaders,
      asResponse: true,
    });

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: error.message ?? "Invalid credentials",
      });
    }

    await forwardAuthCookies(response);
    return { success: true };
  }),

  signUp: publicProcedure.input(SignUpSchema).mutation(async ({ input }) => {
    const reqHeaders = await headers();
    const response = await auth.api.signUpEmail({
      body: {
        email: input.email,
        name: input.name,
        username: input.username,
        password: input.password,
        gender: input.gender,
      },
      headers: reqHeaders,
      asResponse: true,
    });

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error.message ?? "Sign up failed",
      });
    }

    await forwardAuthCookies(response);
    return { success: true };
  }),

  signOut: protectedProcedure.mutation(async () => {
    const reqHeaders = await headers();
    const response = await auth.api.signOut({
      headers: reqHeaders,
      asResponse: true,
    });

    if (!response.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Sign out failed",
      });
    }

    await forwardAuthCookies(response);
    return { success: true };
  }),

  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),
});
