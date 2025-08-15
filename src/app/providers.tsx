"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode } from "react"
import createConfig from "@/rainbowKitConfig"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, type Theme } from "@rainbow-me/rainbowkit"
import { useState } from "react"
import "@rainbow-me/rainbowkit/styles.css"
import { FormProvider } from "@/contexts/FormContext"
import ClientOnly from "@/components/ClientOnly"

export function Providers(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    // Custom theme configuration with proper typing
    const customTheme = {
        colors: {
            accentColor: '#F6E7C1',
            accentColorForeground: '#000000',
            connectButtonBackground: '#F6E7C1',
            connectButtonBackgroundError: '#ff4444',
            connectButtonInnerBackground: '#F6E7C1',
            connectButtonText: '#000000',
            connectButtonTextError: '#ffffff',
            modalBackground: '#ffffff',
            modalBackdrop: 'rgba(0, 0, 0, 0.5)',
            modalBorder: '#e1e5e9',
            modalText: '#000000',
            modalTextSecondary: '#6b7280',
            profileAction: '#f4f4f5',
            profileActionHover: '#e4e4e7',
            profileForeground: '#fafafa',
            selectedOptionBorder: '#F6E7C1',
        },
        fonts: {
            body: 'system-ui, sans-serif',
        },
        radii: {
            actionButton: '8px',
            connectButton: '8px',
            menuButton: '8px',
            modal: '12px',
            modalMobile: '12px',
        },
        shadows: {
            connectButton: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            dialog: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            profileDetailsAction: '0px 2px 6px rgba(0, 0, 0, 0.12)',
            selectedOption: '0px 2px 6px rgba(0, 0, 0, 0.12)',
        },
    }

    return (
        <ClientOnly>
            <Web3Providers queryClient={queryClient} customTheme={customTheme}>
                {props.children}
            </Web3Providers>
        </ClientOnly>
    );
}

function Web3Providers({ 
    children, 
    queryClient, 
    customTheme 
}: { 
    children: ReactNode; 
    queryClient: QueryClient; 
    customTheme: any; 
}) {
    const config = createConfig();
    
    if (!config) {
        return (
            <QueryClientProvider client={queryClient}>
                <FormProvider>
                    {children}
                </FormProvider>
            </QueryClientProvider>
        );
    }
    
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={customTheme}>
                    <FormProvider>
                        {children}
                    </FormProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
