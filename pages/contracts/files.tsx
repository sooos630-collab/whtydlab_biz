import { useEffect } from "react";
import { useRouter } from "next/router";

// 계약서관리 페이지는 각 계약관리 페이지로 통합되었습니다.
export default function ContractFilesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/contracts/overview");
  }, [router]);
  return null;
}
