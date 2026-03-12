import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>WHYDLAB BIZ - 대시보드</title>
        <meta name="description" content="사업자관리 시스템" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          전체현황 대시보드
        </h1>
        <p style={{ color: "#7e8299" }}>
          사업자관리 시스템에 오신 것을 환영합니다.
        </p>
      </div>
    </>
  );
}
