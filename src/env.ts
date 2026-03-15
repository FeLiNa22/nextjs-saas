import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
});

const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  },
  skipValidation: isBuildPhase,
});

export const env = { ...clientEnv, ...serverEnv };
