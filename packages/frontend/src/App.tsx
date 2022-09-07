import React, { Suspense } from "react";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import { relayEnvironment } from "./relayEnvironment";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage/HomePage";
import { DelegatePage } from "./pages/DelegatePage/DelegatePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EditDelegatePage } from "./pages/EditDelegatePage/EditDelegatePage";
import { createClient, WagmiConfig } from "wagmi";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { PageContainer } from "./components/PageContainer";
import { PageHeader } from "./components/PageHeader";

const wagmiClient = createClient(
  getDefaultClient({
    appName: "Nouns Agora",
    alchemyId: process.env.REACT_APP_ALCHEMY_ID,
  })
);

function App() {
  const queryClient = new QueryClient();

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig client={wagmiClient}>
          <ConnectKitProvider>
            <RelayEnvironmentProvider environment={relayEnvironment}>
              <BrowserRouter>
                <PageContainer>
                  <PageHeader />

                  <Suspense fallback={null}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      {/* todo: delegateId should have a canonical url instead */}
                      <Route
                        path="/delegate/:delegateId"
                        element={<DelegatePage />}
                      />

                      <Route path="/create" element={<EditDelegatePage />} />
                    </Routes>
                  </Suspense>
                </PageContainer>
              </BrowserRouter>
            </RelayEnvironmentProvider>
          </ConnectKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
