import { ClerkProvider } from '@clerk/nextjs'
import type { AppProps } from 'next/app'
import { I18nProvider } from '@/lib/i18n'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <I18nProvider>
        <Component {...pageProps} />
      </I18nProvider>
    </ClerkProvider>
  )
}
