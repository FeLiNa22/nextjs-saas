"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export default function SignOutButton() {
  const router = useRouter();

  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: () => router.push("/"),
    onError: (error) => toast.error(error.message),
  });

  return (
    <Button
      disabled={signOutMutation.isPending}
      onClick={() => signOutMutation.mutate()}
      variant={"destructive"}
    >
      Logout
    </Button>
  );
}
