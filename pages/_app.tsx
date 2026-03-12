import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { ProjectProvider } from "@/contexts/ProjectContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ProjectProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ProjectProvider>
  );
}
