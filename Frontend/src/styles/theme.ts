// Design tokens for QuizAI dark theme

export const colors = {
  // Backgrounds
  bg: {
    primary: 'bg-slate-900',
    surface: 'bg-slate-800',
    surfaceHover: 'bg-slate-700',
    elevated: 'bg-slate-800/80',
  },

  // Borders
  border: {
    default: 'border-slate-600',
    subtle: 'border-slate-700',
    focus: 'border-indigo-500',
  },

  // Text
  text: {
    primary: 'text-slate-100',
    secondary: 'text-slate-400',
    disabled: 'text-slate-500',
    inverse: 'text-slate-900',
  },

  // Primary (Indigo)
  primary: {
    base: 'bg-indigo-500',
    hover: 'hover:bg-indigo-400',
    active: 'active:bg-indigo-600',
    text: 'text-indigo-400',
    border: 'border-indigo-500',
    ring: 'ring-indigo-500',
  },

  // Status colors
  success: {
    base: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500',
    glow: 'shadow-emerald-500/50',
  },

  error: {
    base: 'bg-rose-500',
    text: 'text-rose-400',
    border: 'border-rose-500',
    glow: 'shadow-rose-500/50',
  },

  warning: {
    base: 'bg-amber-500',
    text: 'text-amber-400',
  },
};

export const shadows = {
  sm: 'shadow-sm shadow-black/20',
  md: 'shadow-md shadow-black/30',
  lg: 'shadow-lg shadow-black/40',
  glow: 'shadow-lg shadow-indigo-500/20',
};

export const transitions = {
  fast: 'transition-all duration-150 ease-in-out',
  normal: 'transition-all duration-200 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
};

export const effects = {
  hoverLift: 'hover:-translate-y-0.5',
  hoverScale: 'hover:scale-[1.02]',
  activeScale: 'active:scale-[0.98]',
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900',
};

// Composite styles
export const styles = {
  // Cards
  card: `${colors.bg.surface} ${colors.border.subtle} border rounded-xl ${shadows.md} ${transitions.normal}`,
  cardHover: `${colors.bg.surface} ${colors.border.subtle} border rounded-xl ${shadows.md} ${transitions.normal} hover:${colors.bg.surfaceHover} ${effects.hoverLift} hover:shadow-lg`,

  // Buttons
  buttonPrimary: `${colors.primary.base} ${colors.primary.hover} ${colors.primary.active} ${colors.text.primary} font-medium rounded-lg px-4 py-2 ${transitions.fast} ${effects.activeScale} ${effects.focusRing}`,
  buttonSecondary: `${colors.bg.surfaceHover} hover:bg-slate-600 active:bg-slate-700 ${colors.text.primary} font-medium rounded-lg px-4 py-2 ${transitions.fast} ${effects.activeScale}`,
  buttonGhost: `bg-transparent hover:bg-slate-700/50 ${colors.text.secondary} hover:text-slate-100 rounded-lg px-4 py-2 ${transitions.fast}`,

  // Inputs
  input: `${colors.bg.surface} ${colors.border.default} border rounded-lg px-4 py-2 ${colors.text.primary} placeholder-slate-500 ${transitions.fast} focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`,
  textarea: `${colors.bg.surface} ${colors.border.default} border rounded-lg px-4 py-3 ${colors.text.primary} placeholder-slate-500 ${transitions.fast} focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none`,

  // Navigation
  navLink: `px-3 py-2 rounded-lg ${colors.text.secondary} hover:text-slate-100 hover:bg-slate-700/50 ${transitions.fast}`,
  navLinkActive: `px-3 py-2 rounded-lg ${colors.text.primary} bg-slate-700/70`,

  // Layout
  container: 'max-w-4xl mx-auto px-4',
  pageWrapper: `min-h-screen ${colors.bg.primary} ${colors.text.primary}`,
};
