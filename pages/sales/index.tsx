import { useEffect } from "react";
import { useRouter } from "next/router";

export default function SalesIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sales/inquiry");
  }, [router]);
  return null;
}
