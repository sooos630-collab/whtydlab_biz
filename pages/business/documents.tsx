import Head from "next/head";
import DocumentManager from "@/components/DocumentManager";

export default function DocumentsPage() {
  return (
    <>
      <Head>
        <title>서류 보관함 - WHYDLAB BIZ</title>
      </Head>
      <DocumentManager />
    </>
  );
}
