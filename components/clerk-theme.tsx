/**
 * Clerk Theme Component
 * 
 * This component provides custom styling overrides for Clerk authentication components
 * to match the LynkSkill design system perfectly.
 */

'use client';

import { 
  ClerkProvider, 
  SignIn, 
  SignUp, 
  SignedIn, 
  SignedOut, 
  UserButton,
  UserProfile,
  useUser
} from '@clerk/nextjs';
import { getClerkTheme, clerkThemeConfig } from '@/lib/clerk';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Custom CSS for Clerk components that can't be styled via appearance API
const clerkCustomStyles = `
  /* ========================================
   * UserProfile Modal - Complete Styling Fix
   * ======================================== */
  
  /* Modal backdrop */
  .cl-modalBackdrop {
    background: rgba(0, 0, 0, 0.7) !important;
    backdrop-filter: blur(8px) !important;
  }
  
  /* Modal container - proper sizing */
  .cl-modalContent {
    max-width: 880px !important;
    width: 95vw !important;
    max-height: 85vh !important;
    margin: auto !important;
    border-radius: 1.25rem !important;
    overflow: hidden !important;
    background: #1a1425 !important;
    border: 1px solid rgba(168, 85, 247, 0.2) !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
  }
  
  /* Root container for UserProfile */
  .cl-userProfile-root {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    background: #1a1425 !important;
  }
  
  /* Card wrapper */
  .cl-card {
    background: #1a1425 !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    width: 100% !important;
  }
  
  /* Main layout container */
  .cl-main {
    display: flex !important;
    flex-direction: row !important;
    width: 100% !important;
    min-height: 500px !important;
  }
  
  /* ===== LEFT NAVBAR SECTION ===== */
  .cl-navbar {
    width: 220px !important;
    min-width: 220px !important;
    flex-shrink: 0 !important;
    background: rgba(15, 10, 26, 0.6) !important;
    border-right: 1px solid rgba(168, 85, 247, 0.15) !important;
    padding: 24px 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .cl-navbarButtons {
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
    padding: 0 12px !important;
  }
  
  .cl-navbarButton {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 12px 16px !important;
    border-radius: 0.75rem !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #a1a1aa !important;
    background: transparent !important;
    border: none !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    text-align: left !important;
    width: 100% !important;
  }
  
  .cl-navbarButton:hover {
    background: rgba(168, 85, 247, 0.1) !important;
    color: #ffffff !important;
  }
  
  .cl-navbarButton[data-active="true"],
  .cl-navbarButton--active {
    background: rgba(168, 85, 247, 0.15) !important;
    color: #a855f7 !important;
  }
  
  .cl-navbarButtonIcon {
    width: 20px !important;
    height: 20px !important;
    flex-shrink: 0 !important;
  }
  
  /* ===== RIGHT CONTENT SECTION ===== */
  .cl-pageScrollBox {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow-y: auto !important;
    padding: 0 !important;
    background: #1a1425 !important;
  }
  
  .cl-page {
    flex: 1 !important;
    padding: 0 !important;
  }
  
  /* ===== HEADER SECTION ===== */
  .cl-header {
    padding: 28px 32px 20px !important;
    border-bottom: 1px solid rgba(168, 85, 247, 0.15) !important;
    background: transparent !important;
  }
  
  .cl-headerTitle {
    font-size: 1.5rem !important;
    font-weight: 700 !important;
    color: #ffffff !important;
    margin: 0 0 6px 0 !important;
    line-height: 1.3 !important;
  }
  
  .cl-headerSubtitle {
    font-size: 14px !important;
    color: #a1a1aa !important;
    margin: 0 !important;
    line-height: 1.5 !important;
  }
  
  /* ===== PROFILE SECTIONS ===== */
  .cl-profileSection {
    padding: 24px 32px !important;
    border-bottom: 1px solid rgba(168, 85, 247, 0.1) !important;
  }
  
  .cl-profileSection:last-child {
    border-bottom: none !important;
  }
  
  .cl-profileSectionHeader {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 20px !important;
  }
  
  .cl-profileSectionTitle {
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.1em !important;
    color: #71717a !important;
    margin: 0 !important;
  }
  
  .cl-profileSectionTitleText {
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.1em !important;
    color: #71717a !important;
  }
  
  /* Profile section content */
  .cl-profileSectionContent {
    display: flex !important;
    flex-direction: column !important;
    gap: 20px !important;
  }
  
  /* Profile section items - Row layout */
  .cl-profileSectionItem {
    display: flex !important;
    align-items: flex-start !important;
    gap: 24px !important;
    padding: 0 !important;
  }
  
  .cl-profileSectionItemList {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
    width: 100% !important;
  }
  
  /* Item labels */
  .cl-profileSectionItemLabel {
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #a1a1aa !important;
    min-width: 120px !important;
    flex-shrink: 0 !important;
  }
  
  /* Item content/value */
  .cl-profileSectionItemContent,
  .cl-profileSectionItemValue {
    flex: 1 !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    min-width: 0 !important;
  }
  
  /* ===== USER PREVIEW (Profile row) ===== */
  .cl-userPreview {
    display: flex !important;
    align-items: center !important;
    gap: 14px !important;
    flex: 1 !important;
  }
  
  .cl-userPreviewAvatarBox {
    width: 44px !important;
    height: 44px !important;
    flex-shrink: 0 !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    border: 2px solid rgba(168, 85, 247, 0.3) !important;
  }
  
  .cl-userPreviewAvatarImage,
  .cl-avatarImage {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    border-radius: 50% !important;
  }
  
  .cl-userPreviewTextContainer {
    display: flex !important;
    flex-direction: column !important;
    gap: 3px !important;
    flex: 1 !important;
    min-width: 0 !important;
  }
  
  .cl-userPreviewMainIdentifier {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    line-height: 1.3 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  
  .cl-userPreviewSecondaryIdentifier {
    font-size: 13px !important;
    color: #71717a !important;
    line-height: 1.3 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  
  /* ===== ACTION BUTTONS ===== */
  .cl-profileSectionPrimaryButton {
    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%) !important;
    color: #ffffff !important;
    border: none !important;
    padding: 10px 18px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    border-radius: 0.625rem !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }
  
  .cl-profileSectionPrimaryButton:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 20px rgba(168, 85, 247, 0.35) !important;
  }
  
  /* Text action links */
  .cl-profileSectionActionButton,
  .cl-formButtonReset {
    color: #a855f7 !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    background: transparent !important;
    border: none !important;
    cursor: pointer !important;
    padding: 0 !important;
    transition: color 0.2s ease !important;
  }
  
  .cl-profileSectionActionButton:hover,
  .cl-formButtonReset:hover {
    color: #c084fc !important;
    text-decoration: underline !important;
  }
  
  /* ===== IDENTITY/EMAIL PREVIEW ===== */
  .cl-identityPreview {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    flex: 1 !important;
    min-width: 0 !important;
  }
  
  .cl-identityPreviewText {
    font-size: 14px !important;
    color: #ffffff !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  
  /* ===== BADGES ===== */
  .cl-badge {
    display: inline-flex !important;
    align-items: center !important;
    background: rgba(168, 85, 247, 0.15) !important;
    color: #a855f7 !important;
    padding: 4px 10px !important;
    border-radius: 9999px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
    flex-shrink: 0 !important;
  }
  
  /* ===== CONNECTED ACCOUNTS ===== */
  .cl-socialButtonsBlockButton {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 14px 16px !important;
    background: rgba(168, 85, 247, 0.06) !important;
    border: 1px solid rgba(168, 85, 247, 0.15) !important;
    border-radius: 0.75rem !important;
    width: 100% !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
  }
  
  .cl-socialButtonsBlockButton:hover {
    background: rgba(168, 85, 247, 0.12) !important;
    border-color: rgba(168, 85, 247, 0.25) !important;
  }
  
  .cl-socialButtonsBlockButtonText {
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #ffffff !important;
  }
  
  /* ===== CLOSE BUTTON ===== */
  .cl-modalCloseButton {
    position: absolute !important;
    top: 16px !important;
    right: 16px !important;
    width: 32px !important;
    height: 32px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    background: rgba(255, 255, 255, 0.05) !important;
    border: none !important;
    color: #a1a1aa !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    z-index: 10 !important;
  }
  
  .cl-modalCloseButton:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
  }
  
  /* ===== MENU DROPDOWN ===== */
  .cl-menuButton {
    color: #71717a !important;
    padding: 6px !important;
    border-radius: 0.5rem !important;
    transition: all 0.2s ease !important;
    background: transparent !important;
    border: none !important;
  }
  
  .cl-menuButton:hover {
    color: #a855f7 !important;
    background: rgba(168, 85, 247, 0.1) !important;
  }
  
  .cl-menuList {
    background: #1a1425 !important;
    border: 1px solid rgba(168, 85, 247, 0.2) !important;
    border-radius: 0.75rem !important;
    padding: 6px !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
    min-width: 160px !important;
  }
  
  .cl-menuItem {
    padding: 10px 14px !important;
    border-radius: 0.5rem !important;
    font-size: 14px !important;
    color: #ffffff !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
  }
  
  .cl-menuItem:hover {
    background: rgba(168, 85, 247, 0.1) !important;
  }
  
  .cl-menuItemDanger {
    color: #ef4444 !important;
  }
  
  .cl-menuItemDanger:hover {
    background: rgba(239, 68, 68, 0.1) !important;
  }
  
  /* ===== FORM ELEMENTS ===== */
  .cl-formFieldInput {
    background: rgba(15, 10, 26, 0.6) !important;
    border: 2px solid rgba(168, 85, 247, 0.2) !important;
    border-radius: 0.75rem !important;
    padding: 12px 16px !important;
    font-size: 14px !important;
    color: #ffffff !important;
    transition: all 0.2s ease !important;
  }
  
  .cl-formFieldInput:focus {
    border-color: #a855f7 !important;
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15) !important;
    outline: none !important;
  }
  
  .cl-formFieldLabel {
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #d4d4d8 !important;
    margin-bottom: 8px !important;
  }
  
  .cl-formButtonPrimary {
    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%) !important;
    color: #ffffff !important;
    border: none !important;
    padding: 12px 24px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    border-radius: 0.75rem !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
  }
  
  .cl-formButtonPrimary:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 10px 25px rgba(168, 85, 247, 0.35) !important;
  }
  
  /* ===== FOOTER ===== */
  .cl-footer {
    padding: 16px 32px !important;
    border-top: 1px solid rgba(168, 85, 247, 0.1) !important;
    background: rgba(15, 10, 26, 0.3) !important;
  }
  
  .cl-footerAction {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }
  
  .cl-footerActionText {
    font-size: 13px !important;
    color: #71717a !important;
  }
  
  .cl-footerActionLink {
    color: #a855f7 !important;
    font-weight: 500 !important;
    text-decoration: none !important;
    transition: color 0.2s ease !important;
  }
  
  .cl-footerActionLink:hover {
    color: #c084fc !important;
    text-decoration: underline !important;
  }
  
  /* ===== SCROLLBARS ===== */
  .cl-scrollBox,
  .cl-pageScrollBox {
    scrollbar-width: thin !important;
    scrollbar-color: rgba(168, 85, 247, 0.3) transparent !important;
  }
  
  .cl-scrollBox::-webkit-scrollbar,
  .cl-pageScrollBox::-webkit-scrollbar {
    width: 8px !important;
  }
  
  .cl-scrollBox::-webkit-scrollbar-track,
  .cl-pageScrollBox::-webkit-scrollbar-track {
    background: transparent !important;
  }
  
  .cl-scrollBox::-webkit-scrollbar-thumb,
  .cl-pageScrollBox::-webkit-scrollbar-thumb {
    background: rgba(168, 85, 247, 0.3) !important;
    border-radius: 4px !important;
  }
  
  .cl-scrollBox::-webkit-scrollbar-thumb:hover,
  .cl-pageScrollBox::-webkit-scrollbar-thumb:hover {
    background: rgba(168, 85, 247, 0.5) !important;
  }
  
  /* ===== ACCORDION ===== */
  .cl-accordionTriggerButton {
    padding: 14px 16px !important;
    border-radius: 0.75rem !important;
    transition: all 0.2s ease !important;
    width: 100% !important;
    background: transparent !important;
    border: none !important;
    cursor: pointer !important;
  }
  
  .cl-accordionTriggerButton:hover {
    background: rgba(168, 85, 247, 0.05) !important;
  }
  
  .cl-accordionContent {
    padding: 0 16px 16px !important;
  }
  
  /* ===== ALERTS ===== */
  .cl-alert {
    background: rgba(220, 38, 38, 0.1) !important;
    border: 1px solid rgba(220, 38, 38, 0.3) !important;
    border-radius: 0.75rem !important;
    padding: 14px 16px !important;
    color: #ef4444 !important;
  }
  
  .cl-alertText {
    font-size: 14px !important;
    color: #ef4444 !important;
  }
  
  /* ===== MOBILE RESPONSIVE ===== */
  @media (max-width: 768px) {
    .cl-modalContent {
      max-width: 100% !important;
      width: 100% !important;
      height: 100vh !important;
      max-height: 100vh !important;
      margin: 0 !important;
      border-radius: 0 !important;
    }
    
    .cl-main,
    .cl-userProfile-root {
      flex-direction: column !important;
    }
    
    .cl-navbar {
      width: 100% !important;
      min-width: 100% !important;
      border-right: none !important;
      border-bottom: 1px solid rgba(168, 85, 247, 0.15) !important;
      padding: 16px 0 !important;
    }
    
    .cl-navbarButtons {
      flex-direction: row !important;
      overflow-x: auto !important;
      gap: 8px !important;
      padding: 0 16px !important;
    }
    
    .cl-navbarButton {
      padding: 10px 14px !important;
      white-space: nowrap !important;
    }
    
    .cl-profileSection {
      padding: 20px !important;
    }
    
    .cl-profileSectionItem {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }
    
    .cl-profileSectionItemLabel {
      min-width: auto !important;
    }
    
    .cl-header {
      padding: 20px !important;
    }
    
    .cl-headerTitle {
      font-size: 1.25rem !important;
    }
  }
  
  /* ===== LIGHT MODE OVERRIDES ===== */
  .light .cl-modalContent,
  .light .cl-card,
  .light .cl-userProfile-root,
  .light .cl-pageScrollBox {
    background: #ffffff !important;
  }
  
  .light .cl-navbar {
    background: #f8f7f9 !important;
    border-color: rgba(168, 85, 247, 0.1) !important;
  }
  
  .light .cl-navbarButton {
    color: #6b7280 !important;
  }
  
  .light .cl-navbarButton:hover {
    color: #242424 !important;
  }
  
  .light .cl-navbarButton[data-active="true"],
  .light .cl-navbarButton--active {
    color: #a855f7 !important;
  }
  
  .light .cl-headerTitle,
  .light .cl-userPreviewMainIdentifier,
  .light .cl-identityPreviewText,
  .light .cl-socialButtonsBlockButtonText {
    color: #242424 !important;
  }
  
  .light .cl-headerSubtitle,
  .light .cl-profileSectionItemLabel,
  .light .cl-userPreviewSecondaryIdentifier {
    color: #6b7280 !important;
  }
  
  .light .cl-menuList {
    background: #ffffff !important;
    border-color: rgba(168, 85, 247, 0.15) !important;
  }
  
  .light .cl-menuItem {
    color: #242424 !important;
  }
  
  .light .cl-formFieldInput {
    background: #ffffff !important;
    border-color: rgba(168, 85, 247, 0.15) !important;
    color: #242424 !important;
  }
  
  .light .cl-footer {
    background: #f8f7f9 !important;
  }
`;

/**
 * LynkSkill Clerk Provider
 * Wraps the app with Clerk provider and applies custom theme
 */
export interface LynkSkillClerkProviderProps {
  children: React.ReactNode;
  signInFallbackRedirectUrl?: string;
  signUpFallbackRedirectUrl?: string;
}

export function LynkSkillClerkProvider({
  children,
  signInFallbackRedirectUrl,
  signUpFallbackRedirectUrl
}: LynkSkillClerkProviderProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <>{children}</>;
  }
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';
  const clerkTheme = getClerkTheme(isDarkMode);
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: clerkCustomStyles }} />
      <ClerkProvider
        appearance={clerkTheme}
        signInFallbackRedirectUrl={signInFallbackRedirectUrl}
        signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
      >
        {children}
      </ClerkProvider>
    </>
  );
}

/**
 * Custom SignIn component with LynkSkill styling
 */
export function LynkSkillSignIn() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';
  const clerkTheme = getClerkTheme(isDarkMode);
  
  return (
    <SignIn 
      appearance={clerkTheme}
      routing="path" 
      path="/sign-in"
      signUpUrl="/sign-up"
    />
  );
}

/**
 * Custom SignUp component with LynkSkill styling
 */
export function LynkSkillSignUp() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';
  const clerkTheme = getClerkTheme(isDarkMode);
  
  return (
    <SignUp 
      appearance={clerkTheme}
      routing="path" 
      path="/sign-up"
      signInUrl="/sign-in"
    />
  );
}

/**
 * Custom UserProfile component with LynkSkill styling
 */
export function LynkSkillUserProfile() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';
  const clerkTheme = getClerkTheme(isDarkMode);
  
  return (
    <UserProfile 
      appearance={clerkTheme}
      routing="path" 
      path="/user-profile"
    />
  );
}

/**
 * Custom UserButton with LynkSkill styling
 */
export function LynkSkillUserButton() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';
  const clerkTheme = getClerkTheme(isDarkMode);
  
  return (
    <UserButton 
      appearance={clerkTheme}
      afterSignOutUrl="/"
      userProfileMode="modal"
    />
  );
}

/**
 * Auth guard component - renders children only when signed in
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access this page</p>
            <a 
              href="/sign-in" 
              className="inline-flex items-center justify-center px-6 py-3 text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Sign In
            </a>
          </div>
        </div>
      </SignedOut>
    </>
  );
}

/**
 * User info display component
 */
export function UserInfo() {
  const { isLoaded, isSignedIn, user } = useUser();
  
  if (!isLoaded || !isSignedIn) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-3">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-medium">{user.fullName || user.emailAddresses[0]?.emailAddress}</p>
        <p className="text-xs text-muted-foreground">
          {user.publicMetadata.role as string || 'Student'}
        </p>
      </div>
      <LynkSkillUserButton />
    </div>
  );
}

/**
 * Export theme configuration for use in other components
 */
export { clerkThemeConfig, getClerkTheme };
