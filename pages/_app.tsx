import { ClerkProvider } from '@clerk/nextjs'
import type { AppProps } from 'next/app'
import { I18nProvider } from '@/lib/i18n'
import { AIModeProvider } from '@/lib/ai-mode-context'
import { lynkSkillDarkTheme } from '@/lib/clerk'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      appearance={lynkSkillDarkTheme}
    >
      <I18nProvider>
        <AIModeProvider>
          <Component {...pageProps} />
        </AIModeProvider>
      </I18nProvider>
    </ClerkProvider>
  )
}
