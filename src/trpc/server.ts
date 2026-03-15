import { createCallerFactory } from "@/trpc/init";
import { appRouter } from "@/trpc/routers";
import { createTRPCContext } from "@/trpc/init";

const createCaller = createCallerFactory(appRouter);

export const createServerCaller = async () => {
  const ctx = await createTRPCContext();
  return createCaller(ctx);
};
