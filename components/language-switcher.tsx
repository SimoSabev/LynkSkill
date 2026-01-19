"use client"

import { useLocale, Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"

const languages: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  
  const _currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl transition-all duration-300 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-110 active:scale-95"
        >
          <Languages className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="min-w-[150px] bg-background/95 backdrop-blur-xl border-purple-500/20"
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              locale === language.code 
                ? 'bg-purple-500/20 text-foreground' 
                : 'hover:bg-purple-500/10'
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
            {locale === language.code && (
              <span className="ml-auto text-purple-400">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
