import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { QuoteProvider } from "@/contexts/QuoteContext";
import { CustomerProvider } from "@/contexts/CustomerContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CustomerProvider>
      <ProjectProvider>
        <QuoteProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </QuoteProvider>
      </ProjectProvider>
    </CustomerProvider>
  );
}
