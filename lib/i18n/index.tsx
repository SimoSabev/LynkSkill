"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from './translations/en.json'
import bg from './translations/bg.json'

export type Locale = 'en' | 'bg'

type TranslationValue = string | { [key: string]: TranslationValue }
type Translations = { [key: string]: TranslationValue }

const translations: Record<Locale, Translations> = { en, bg }

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LOCALE_STORAGE_KEY = 'lynkskill-locale'

// Translation function that can be used outside of context
function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.')
  let value: TranslationValue = translations[locale]
  
  for (const k of keys) {
    if (typeof value === 'object' && value !== null && k in value) {
      value = value[k]
    } else {
      // Fallback to English if key not found in current locale
      value = translations['en']
      for (const fallbackKey of keys) {
        if (typeof value === 'object' && value !== null && fallbackKey in value) {
          value = value[fallbackKey]
        } else {
          return key // Return key if not found in any locale
        }
      }
      break
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  // Replace parameters in the string
  if (params) {
    let result = value
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
    }
    return result
  }

  return value
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'bg')) {
        setLocaleState(savedLocale)
      }
    }
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    }
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    return translate(locale, key, params)
  }, [locale])

  // During SSR or before hydration, provide default values
  const contextValue: I18nContextType = {
    locale: mounted ? locale : 'en',
    setLocale,
    t: mounted ? t : (key: string, params?: Record<string, string | number>) => translate('en', key, params)
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    // Return default values for SSR or when provider is missing
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => translate('en', key, params)
    }
  }
  return context
}

export function useLocale() {
  const { locale, setLocale } = useTranslation()
  return { locale, setLocale }
}
