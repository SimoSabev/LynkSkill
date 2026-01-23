// lib/clerk.ts
import { createClerkClient } from "@clerk/backend";
import { dark } from "@clerk/themes";

/**
 * LynkSkill Design System Color Palette
 * Primary Brand: #a855f7 (Purple-500) and #6366f1 (Indigo-500)
 * Background: #0f0a1a (dark purple) for dark mode, #F8F7F9 for light mode
 * Text: #ffffff (dark mode), #242424 (light mode)
 */

// Base color constants
export const CLERK_COLORS = {
  // Primary brand colors
  primary: '#a855f7',
  primaryHover: '#9333ea',
  primaryLight: '#c084fc',
  
  // Secondary accent
  secondary: '#6366f1',
  secondaryHover: '#4f46e5',
  secondaryLight: '#818cf8',
  
  // Background colors
  backgroundDark: '#0f0a1a',
  backgroundLight: '#F8F7F9',
  
  // Card colors
  cardDark: '#1a1425',
  cardLight: '#ffffff',
  
  // Input colors
  inputBackgroundDark: '#1a1425',
  inputBackgroundLight: '#ffffff',
  
  // Text colors
  textDark: '#ffffff',
  textLight: '#242424',
  textSecondaryDark: '#a1a1aa',
  textSecondaryLight: '#6b7280',
  
  // Status colors
  success: '#22c55e',
  warning: '#EAB308',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  
  // Border colors
  borderDark: 'rgba(168, 85, 247, 0.2)',
  borderLight: 'rgba(168, 85, 247, 0.15)',
  
  // Focus ring
  focusRing: 'rgba(168, 85, 247, 0.4)',
} as const;

// Typography settings
export const CLERK_TYPOGRAPHY = {
  fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
  fontSize: '14px',
  fontWeight: '400',
} as const;

// Spacing and border radius
export const CLERK_SPACING = {
  baseUnit: '4px',
  borderRadius: '0.75rem',
  cardRadius: '1.5rem',
  inputRadius: '0.75rem',
  buttonRadius: '0.75rem',
} as const;

// Shadow system
export const CLERK_SHADOWS = {
  focusRing: '0 0 0 3px rgba(168, 85, 247, 0.1)',
  card: '0 25px 50px -12px rgba(168, 85, 247, 0.15)',
  cardLight: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
  button: '0 10px 25px -5px rgba(168, 85, 247, 0.3)',
  buttonLight: '0 4px 12px rgba(0, 0, 0, 0.1)',
} as const;

// Responsive breakpoints
export const CLERK_BREAKPOINTS = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
} as const;

/**
 * Dark theme configuration for Clerk components
 */
export const lynkSkillDarkTheme = {
  baseTheme: dark,
  variables: {
    colorPrimary: CLERK_COLORS.primary,
    colorPrimaryHover: CLERK_COLORS.primaryHover,
    colorPrimaryLight: CLERK_COLORS.primaryLight,
    colorText: CLERK_COLORS.textDark,
    colorTextSecondary: CLERK_COLORS.textSecondaryDark,
    colorBackground: CLERK_COLORS.backgroundDark,
    colorInputBackground: CLERK_COLORS.inputBackgroundDark,
    colorInputText: CLERK_COLORS.textDark,
    colorDanger: CLERK_COLORS.danger,
    colorDangerHover: CLERK_COLORS.dangerLight,
    colorSuccess: CLERK_COLORS.success,
    colorWarning: CLERK_COLORS.warning,
    colorMuted: CLERK_COLORS.textSecondaryDark,
    colorMutedForeground: CLERK_COLORS.textSecondaryDark,
    fontFamily: CLERK_TYPOGRAPHY.fontFamily,
    fontSize: CLERK_TYPOGRAPHY.fontSize,
    borderRadius: CLERK_SPACING.borderRadius,
    spacingUnit: CLERK_SPACING.baseUnit,
  },
  elements: {
    // Card styling
    card: {
      backgroundColor: CLERK_COLORS.cardDark,
      borderRadius: CLERK_SPACING.cardRadius,
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      boxShadow: CLERK_SHADOWS.card,
    },
    
    // Header styling
    headerTitle: {
      color: CLERK_COLORS.textDark,
      fontSize: '1.5rem',
      fontWeight: '700',
    },
    headerSubtitle: {
      color: CLERK_COLORS.textSecondaryDark,
      fontSize: '0.875rem',
    },
    
    // Form field styling
    formFieldLabel: {
      color: CLERK_COLORS.textDark,
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    formFieldInput: {
      backgroundColor: CLERK_COLORS.inputBackgroundDark,
      borderRadius: CLERK_SPACING.inputRadius,
      border: `2px solid ${CLERK_COLORS.borderDark}`,
      color: CLERK_COLORS.textDark,
      fontSize: '14px',
      padding: '12px 16px',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: CLERK_COLORS.primary,
        boxShadow: CLERK_SHADOWS.focusRing,
      },
      '&:hover': {
        borderColor: 'rgba(168, 85, 247, 0.4)',
      },
    },
    formFieldInputShowPasswordButton: {
      color: CLERK_COLORS.textSecondaryDark,
      '&:hover': {
        color: CLERK_COLORS.primary,
      },
    },
    
    // Button styling
    formButtonPrimary: {
      background: `linear-gradient(135deg, ${CLERK_COLORS.primary} 0%, ${CLERK_COLORS.secondary} 100%)`,
      borderRadius: CLERK_SPACING.buttonRadius,
      fontWeight: '600',
      fontSize: '14px',
      padding: '12px 24px',
      boxShadow: CLERK_SHADOWS.button,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 15px 35px -5px rgba(168, 85, 247, 0.4)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
      '&:focus-visible': {
        boxShadow: `${CLERK_SHADOWS.focusRing}, 0 10px 25px -5px rgba(168, 85, 247, 0.3)`,
      },
    },
    formButtonSecondary: {
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      borderRadius: CLERK_SPACING.buttonRadius,
      fontWeight: '600',
      fontSize: '14px',
      padding: '12px 24px',
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      color: CLERK_COLORS.textDark,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: CLERK_COLORS.primary,
      },
    },
    
    // Social buttons
    socialButtonsBlockButton: {
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      borderRadius: CLERK_SPACING.buttonRadius,
      color: CLERK_COLORS.textDark,
      fontWeight: '500',
      fontSize: '14px',
      padding: '12px 16px',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: CLERK_COLORS.primary,
        transform: 'translateY(-1px)',
      },
    },
    socialButtonsBlockButtonText: {
      fontSize: '14px',
      fontWeight: '500',
    },
    
    // Footer links
    footer: {
      color: CLERK_COLORS.textSecondaryDark,
      fontSize: '0.875rem',
    },
    footerActionLink: {
      color: CLERK_COLORS.primary,
      fontWeight: '500',
      transition: 'color 0.2s ease',
      '&:hover': {
        color: CLERK_COLORS.primaryLight,
        textDecoration: 'underline',
      },
    },
    
    // Divider
    dividerLine: {
      backgroundColor: CLERK_COLORS.borderDark,
    },
    dividerText: {
      color: CLERK_COLORS.textSecondaryDark,
      fontSize: '0.875rem',
    },
    
    // Alert and error messages
    alert: {
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      border: `1px solid ${CLERK_COLORS.danger}`,
      borderRadius: CLERK_SPACING.borderRadius,
      color: CLERK_COLORS.dangerLight,
    },
    alertText: {
      fontSize: '0.875rem',
    },
    
    // Loading states
    spinner: {
      color: CLERK_COLORS.primary,
    },
    
    // OTP inputs
    otpInputField: {
      backgroundColor: CLERK_COLORS.inputBackgroundDark,
      border: `2px solid ${CLERK_COLORS.borderDark}`,
      borderRadius: '0.5rem',
      color: CLERK_COLORS.textDark,
      fontSize: '1.25rem',
      fontWeight: '600',
      '&:focus': {
        borderColor: CLERK_COLORS.primary,
        boxShadow: CLERK_SHADOWS.focusRing,
      },
    },
    
    // User profile
    userProfilePage: {
      backgroundColor: CLERK_COLORS.backgroundDark,
    },
    userProfileButton: {
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      borderRadius: CLERK_SPACING.buttonRadius,
      color: CLERK_COLORS.textDark,
    },
    
    // Navigation
    navbar: {
      backgroundColor: CLERK_COLORS.backgroundDark,
      borderBottom: `1px solid ${CLERK_COLORS.borderDark}`,
    },
    navbarButton: {
      color: CLERK_COLORS.textDark,
      '&:hover': {
        color: CLERK_COLORS.primary,
      },
    },
    
    // Modal
    modal: {
      backgroundColor: CLERK_COLORS.cardDark,
      borderRadius: CLERK_SPACING.cardRadius,
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      boxShadow: CLERK_SHADOWS.card,
    },
    modalBackdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
    },
    modalContent: {
      width: '100%',
      maxWidth: '480px',
      padding: '0',
    },
    
    // User Profile Modal specific styles
    userButtonPopoverCard: {
      backgroundColor: CLERK_COLORS.cardDark,
      borderRadius: CLERK_SPACING.cardRadius,
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      boxShadow: CLERK_SHADOWS.card,
      padding: '0',
      minWidth: '300px',
    },
    userButtonPopoverMain: {
      padding: '16px',
    },
    userButtonPopoverActions: {
      borderTop: `1px solid ${CLERK_COLORS.borderDark}`,
      padding: '8px',
    },
    userButtonPopoverActionButton: {
      borderRadius: CLERK_SPACING.buttonRadius,
      padding: '10px 14px',
      fontSize: '14px',
      color: CLERK_COLORS.textDark,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
      },
    },
    userButtonPopoverFooter: {
      borderTop: `1px solid ${CLERK_COLORS.borderDark}`,
      padding: '8px 16px',
    },
    
    // Profile page sections
    profileSection: {
      padding: '20px 24px',
      borderBottom: `1px solid ${CLERK_COLORS.borderDark}`,
    },
    profileSectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: CLERK_COLORS.textSecondaryDark,
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    profileSectionTitleText: {
      color: CLERK_COLORS.textSecondaryDark,
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    profileSectionContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    profileSectionPrimaryButton: {
      background: `linear-gradient(135deg, ${CLERK_COLORS.primary} 0%, ${CLERK_COLORS.secondary} 100%)`,
      borderRadius: CLERK_SPACING.buttonRadius,
      color: '#ffffff',
      fontWeight: '500',
      padding: '8px 16px',
      fontSize: '13px',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: CLERK_SHADOWS.button,
      },
    },
    
    // Profile page layout
    profilePage: {
      backgroundColor: CLERK_COLORS.backgroundDark,
      minHeight: '400px',
    },
    page: {
      padding: '0',
      gap: '0',
    },
    pageScrollBox: {
      padding: '0',
    },
    scrollBox: {
      padding: '0',
    },

    // Root box and main content  
    rootBox: {
      width: '100%',
    },
    main: {
      gap: '0',
    },

    // Form containers
    formContainer: {
      padding: '24px',
    },
    form: {
      gap: '16px',
    },
    
    // Profile header
    userPreviewMainIdentifier: {
      fontSize: '16px',
      fontWeight: '600',
      color: CLERK_COLORS.textDark,
    },
    userPreviewSecondaryIdentifier: {
      fontSize: '14px',
      color: CLERK_COLORS.textSecondaryDark,
    },
    userPreview: {
      gap: '12px',
      padding: '16px',
    },
    userPreviewAvatarBox: {
      width: '48px',
      height: '48px',
    },
    userPreviewTextContainer: {
      gap: '4px',
    },
    
    // Avatar styling
    avatarBox: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: `2px solid ${CLERK_COLORS.primary}`,
    },
    avatarImage: {
      borderRadius: '50%',
    },
    
    // Badges
    badge: {
      backgroundColor: 'rgba(168, 85, 247, 0.15)',
      color: CLERK_COLORS.primary,
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
    },
    
    // Active devices and sessions
    activeDeviceListItem: {
      padding: '12px 16px',
      borderRadius: CLERK_SPACING.borderRadius,
      backgroundColor: 'rgba(168, 85, 247, 0.05)',
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      marginBottom: '8px',
    },

    // Account page items
    accordionTriggerButton: {
      padding: '16px',
      borderRadius: CLERK_SPACING.borderRadius,
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
      },
    },
    accordionContent: {
      padding: '0 16px 16px',
    },
    
    // Navigation menu
    navbarMobileMenuButton: {
      color: CLERK_COLORS.textDark,
    },
    
    // Menu items
    menuButton: {
      padding: '10px 14px',
      borderRadius: CLERK_SPACING.borderRadius,
      color: CLERK_COLORS.textDark,
      fontSize: '14px',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        color: CLERK_COLORS.primary,
      },
    },
    menuList: {
      backgroundColor: CLERK_COLORS.cardDark,
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      borderRadius: CLERK_SPACING.borderRadius,
      padding: '4px',
      boxShadow: CLERK_SHADOWS.card,
    },
    menuItem: {
      padding: '10px 14px',
      borderRadius: CLERK_SPACING.borderRadius,
      fontSize: '14px',
      color: CLERK_COLORS.textDark,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
      },
    },
    
    // Tabs
    tabsList: {
      backgroundColor: 'rgba(168, 85, 247, 0.05)',
      border: `1px solid ${CLERK_COLORS.borderDark}`,
      borderRadius: CLERK_SPACING.borderRadius,
    },
    tabsTab: {
      color: CLERK_COLORS.textSecondaryDark,
      '&:hover': {
        color: CLERK_COLORS.textDark,
      },
      '&[data-state="active"]': {
        color: CLERK_COLORS.primary,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
      },
    },
  },
  layout: {
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
    termsPageUrl: '/terms',
    privacyPageUrl: '/privacy',
  },
} as const;

/**
 * Light theme configuration for Clerk components
 */
export const lynkSkillLightTheme = {
  baseTheme: dark,
  variables: {
    colorPrimary: CLERK_COLORS.primary,
    colorPrimaryHover: CLERK_COLORS.primaryHover,
    colorPrimaryLight: CLERK_COLORS.primaryLight,
    colorText: CLERK_COLORS.textLight,
    colorTextSecondary: CLERK_COLORS.textSecondaryLight,
    colorBackground: CLERK_COLORS.backgroundLight,
    colorInputBackground: CLERK_COLORS.inputBackgroundLight,
    colorInputText: CLERK_COLORS.textLight,
    colorDanger: CLERK_COLORS.danger,
    colorDangerHover: CLERK_COLORS.dangerLight,
    colorSuccess: CLERK_COLORS.success,
    colorWarning: CLERK_COLORS.warning,
    colorMuted: CLERK_COLORS.textSecondaryLight,
    colorMutedForeground: CLERK_COLORS.textSecondaryLight,
    fontFamily: CLERK_TYPOGRAPHY.fontFamily,
    fontSize: CLERK_TYPOGRAPHY.fontSize,
    borderRadius: CLERK_SPACING.borderRadius,
    spacingUnit: CLERK_SPACING.baseUnit,
  },
  elements: {
    // Card styling
    card: {
      backgroundColor: CLERK_COLORS.cardLight,
      borderRadius: CLERK_SPACING.cardRadius,
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      boxShadow: CLERK_SHADOWS.cardLight,
    },
    
    // Header styling
    headerTitle: {
      color: CLERK_COLORS.textLight,
      fontSize: '1.5rem',
      fontWeight: '700',
    },
    headerSubtitle: {
      color: CLERK_COLORS.textSecondaryLight,
      fontSize: '0.875rem',
    },
    
    // Form field styling
    formFieldLabel: {
      color: CLERK_COLORS.textLight,
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    formFieldInput: {
      backgroundColor: CLERK_COLORS.inputBackgroundLight,
      borderRadius: CLERK_SPACING.inputRadius,
      border: `2px solid ${CLERK_COLORS.borderLight}`,
      color: CLERK_COLORS.textLight,
      fontSize: '14px',
      padding: '12px 16px',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: CLERK_COLORS.primary,
        boxShadow: CLERK_SHADOWS.focusRing,
      },
      '&:hover': {
        borderColor: 'rgba(168, 85, 247, 0.3)',
      },
    },
    formFieldInputShowPasswordButton: {
      color: CLERK_COLORS.textSecondaryLight,
      '&:hover': {
        color: CLERK_COLORS.primary,
      },
    },
    
    // Button styling
    formButtonPrimary: {
      background: `linear-gradient(135deg, ${CLERK_COLORS.primary} 0%, ${CLERK_COLORS.secondary} 100%)`,
      borderRadius: CLERK_SPACING.buttonRadius,
      fontWeight: '600',
      fontSize: '14px',
      padding: '12px 24px',
      boxShadow: CLERK_SHADOWS.buttonLight,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 20px rgba(168, 85, 247, 0.25)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
      '&:focus-visible': {
        boxShadow: `${CLERK_SHADOWS.focusRing}, 0 4px 12px rgba(0, 0, 0, 0.1)`,
      },
    },
    formButtonSecondary: {
      backgroundColor: 'rgba(168, 85, 247, 0.05)',
      borderRadius: CLERK_SPACING.buttonRadius,
      fontWeight: '600',
      fontSize: '14px',
      padding: '12px 24px',
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      color: CLERK_COLORS.textLight,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: CLERK_COLORS.primary,
      },
    },
    
    // Social buttons
    socialButtonsBlockButton: {
      backgroundColor: 'rgba(168, 85, 247, 0.05)',
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      borderRadius: CLERK_SPACING.buttonRadius,
      color: CLERK_COLORS.textLight,
      fontWeight: '500',
      fontSize: '14px',
      padding: '12px 16px',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: CLERK_COLORS.primary,
        transform: 'translateY(-1px)',
      },
    },
    socialButtonsBlockButtonText: {
      fontSize: '14px',
      fontWeight: '500',
    },
    
    // Footer links
    footer: {
      color: CLERK_COLORS.textSecondaryLight,
      fontSize: '0.875rem',
    },
    footerActionLink: {
      color: CLERK_COLORS.primary,
      fontWeight: '500',
      transition: 'color 0.2s ease',
      '&:hover': {
        color: CLERK_COLORS.primaryHover,
        textDecoration: 'underline',
      },
    },
    
    // Divider
    dividerLine: {
      backgroundColor: CLERK_COLORS.borderLight,
    },
    dividerText: {
      color: CLERK_COLORS.textSecondaryLight,
      fontSize: '0.875rem',
    },
    
    // Alert and error messages
    alert: {
      backgroundColor: 'rgba(220, 38, 38, 0.05)',
      border: `1px solid ${CLERK_COLORS.danger}`,
      borderRadius: CLERK_SPACING.borderRadius,
      color: CLERK_COLORS.danger,
    },
    alertText: {
      fontSize: '0.875rem',
    },
    
    // Loading states
    spinner: {
      color: CLERK_COLORS.primary,
    },
    
    // OTP inputs
    otpInputField: {
      backgroundColor: CLERK_COLORS.inputBackgroundLight,
      border: `2px solid ${CLERK_COLORS.borderLight}`,
      borderRadius: '0.5rem',
      color: CLERK_COLORS.textLight,
      fontSize: '1.25rem',
      fontWeight: '600',
      '&:focus': {
        borderColor: CLERK_COLORS.primary,
        boxShadow: CLERK_SHADOWS.focusRing,
      },
    },
    
    // User profile
    userProfilePage: {
      backgroundColor: CLERK_COLORS.backgroundLight,
    },
    userProfileButton: {
      backgroundColor: 'rgba(168, 85, 247, 0.05)',
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      borderRadius: CLERK_SPACING.buttonRadius,
      color: CLERK_COLORS.textLight,
    },
    
    // Navigation
    navbar: {
      backgroundColor: CLERK_COLORS.cardLight,
      borderBottom: `1px solid ${CLERK_COLORS.borderLight}`,
    },
    navbarButton: {
      color: CLERK_COLORS.textLight,
      '&:hover': {
        color: CLERK_COLORS.primary,
      },
    },
    
    // Modal
    modal: {
      backgroundColor: CLERK_COLORS.cardLight,
      borderRadius: CLERK_SPACING.cardRadius,
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      boxShadow: CLERK_SHADOWS.cardLight,
    },
    modalBackdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
    },
    modalContent: {
      width: '100%',
      maxWidth: '480px',
      padding: '0',
    },
    
    // User Profile Modal specific styles
    userButtonPopoverCard: {
      backgroundColor: CLERK_COLORS.cardLight,
      borderRadius: CLERK_SPACING.cardRadius,
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      boxShadow: CLERK_SHADOWS.cardLight,
      padding: '0',
      minWidth: '300px',
    },
    userButtonPopoverMain: {
      padding: '16px',
    },
    userButtonPopoverActions: {
      borderTop: `1px solid ${CLERK_COLORS.borderLight}`,
      padding: '8px',
    },
    userButtonPopoverActionButton: {
      borderRadius: CLERK_SPACING.buttonRadius,
      padding: '10px 14px',
      fontSize: '14px',
      color: CLERK_COLORS.textLight,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
      },
    },
    userButtonPopoverFooter: {
      borderTop: `1px solid ${CLERK_COLORS.borderLight}`,
      padding: '8px 16px',
    },
    
    // Profile page sections
    profileSection: {
      padding: '20px 24px',
      borderBottom: `1px solid ${CLERK_COLORS.borderLight}`,
    },
    profileSectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: CLERK_COLORS.textSecondaryLight,
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    profileSectionTitleText: {
      color: CLERK_COLORS.textSecondaryLight,
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    profileSectionContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    profileSectionPrimaryButton: {
      background: `linear-gradient(135deg, ${CLERK_COLORS.primary} 0%, ${CLERK_COLORS.secondary} 100%)`,
      borderRadius: CLERK_SPACING.buttonRadius,
      color: '#ffffff',
      fontWeight: '500',
      padding: '8px 16px',
      fontSize: '13px',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: CLERK_SHADOWS.buttonLight,
      },
    },
    
    // Profile page layout
    profilePage: {
      backgroundColor: CLERK_COLORS.backgroundLight,
      minHeight: '400px',
    },
    page: {
      padding: '0',
      gap: '0',
    },
    pageScrollBox: {
      padding: '0',
    },
    scrollBox: {
      padding: '0',
    },

    // Root box and main content  
    rootBox: {
      width: '100%',
    },
    main: {
      gap: '0',
    },

    // Form containers
    formContainer: {
      padding: '24px',
    },
    form: {
      gap: '16px',
    },
    
    // Profile header
    userPreviewMainIdentifier: {
      fontSize: '16px',
      fontWeight: '600',
      color: CLERK_COLORS.textLight,
    },
    userPreviewSecondaryIdentifier: {
      fontSize: '14px',
      color: CLERK_COLORS.textSecondaryLight,
    },
    userPreview: {
      gap: '12px',
      padding: '16px',
    },
    userPreviewAvatarBox: {
      width: '48px',
      height: '48px',
    },
    userPreviewTextContainer: {
      gap: '4px',
    },
    
    // Avatar styling
    avatarBox: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: `2px solid ${CLERK_COLORS.primary}`,
    },
    avatarImage: {
      borderRadius: '50%',
    },
    
    // Badges
    badge: {
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      color: CLERK_COLORS.primary,
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
    },
    
    // Active devices and sessions
    activeDeviceListItem: {
      padding: '12px 16px',
      borderRadius: CLERK_SPACING.borderRadius,
      backgroundColor: 'rgba(168, 85, 247, 0.03)',
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      marginBottom: '8px',
    },

    // Account page items
    accordionTriggerButton: {
      padding: '16px',
      borderRadius: CLERK_SPACING.borderRadius,
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.03)',
      },
    },
    accordionContent: {
      padding: '0 16px 16px',
    },
    
    // Navigation menu
    navbarMobileMenuButton: {
      color: CLERK_COLORS.textLight,
    },
    
    // Menu items
    menuButton: {
      padding: '10px 14px',
      borderRadius: CLERK_SPACING.borderRadius,
      color: CLERK_COLORS.textLight,
      fontSize: '14px',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        color: CLERK_COLORS.primary,
      },
    },
    menuList: {
      backgroundColor: CLERK_COLORS.cardLight,
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      borderRadius: CLERK_SPACING.borderRadius,
      padding: '4px',
      boxShadow: CLERK_SHADOWS.cardLight,
    },
    menuItem: {
      padding: '10px 14px',
      borderRadius: CLERK_SPACING.borderRadius,
      fontSize: '14px',
      color: CLERK_COLORS.textLight,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
      },
    },
    
    // Tabs
    tabsList: {
      backgroundColor: 'rgba(168, 85, 247, 0.03)',
      border: `1px solid ${CLERK_COLORS.borderLight}`,
      borderRadius: CLERK_SPACING.borderRadius,
    },
    tabsTab: {
      color: CLERK_COLORS.textSecondaryLight,
      '&:hover': {
        color: CLERK_COLORS.textLight,
      },
      '&[data-state="active"]': {
        color: CLERK_COLORS.primary,
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
      },
    },
  },
  layout: {
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
    termsPageUrl: '/terms',
    privacyPageUrl: '/privacy',
  },
} as const;

/**
 * Get the appropriate Clerk theme based on the current theme
 */
export const getClerkTheme = (isDarkMode: boolean = true) => {
  return isDarkMode ? lynkSkillDarkTheme : lynkSkillLightTheme;
};

/**
 * Export the clerk client for backend operations
 */
export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * Export all Clerk theme configuration for use in components
 */
export const clerkThemeConfig = {
  dark: lynkSkillDarkTheme,
  light: lynkSkillLightTheme,
  colors: CLERK_COLORS,
  typography: CLERK_TYPOGRAPHY,
  spacing: CLERK_SPACING,
  shadows: CLERK_SHADOWS,
  breakpoints: CLERK_BREAKPOINTS,
} as const;
