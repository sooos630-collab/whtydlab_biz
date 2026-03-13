import { useEffect } from "react";
import { useRouter } from "next/router";

// /government 접근 시 첫 번째 서브탭으로 리다이렉트
export default function GovernmentIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/government/manage");
  }, [router]);
  return null;
}
