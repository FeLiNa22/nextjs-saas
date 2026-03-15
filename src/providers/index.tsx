import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { TRPCProvider } from "@/trpc/client";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <NextTopLoader easing="ease" showSpinner={false} color="var(--primary)" />
      {children}
      <Toaster position="top-center" />
    </TRPCProvider>
  );
}
