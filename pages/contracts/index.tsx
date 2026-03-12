import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ContractsIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/contracts/overview");
  }, [router]);
  return null;
}
