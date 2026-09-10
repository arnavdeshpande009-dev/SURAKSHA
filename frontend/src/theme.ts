// Shared design tokens — "Fleet" inspired: clean corporate logistics look
// (white/light-neutral chrome, confident navy type, single blue accent,
// soft shadows, generous radius). The map stays dark as the operational
// centerpiece; everything around it is light and card-based.

export const theme = {
  color: {
    bg: '#F5F7FA',          // page / shell background
    surface: '#FFFFFF',      // cards, panels
    surfaceAlt: '#F1F4F8',   // nested/inset surfaces
    border: '#E3E8EF',
    borderStrong: '#CBD3E1',

    navy: '#0B1B34',         // primary heading / header bar
    navySoft: '#13284A',

    textPrimary: '#0B1B34',
    textSecondary: '#5B6B82',
    textMuted: '#8794A6',
    onDark: '#F7F9FC',
    onDarkMuted: '#B9C4D6',

    accent: '#2954FF',       // Fleet blue
    accentSoft: 'rgba(41, 84, 255, 0.10)',
    accentBorder: 'rgba(41, 84, 255, 0.35)',

    success: '#15A05A',
    successSoft: 'rgba(21, 160, 90, 0.10)',
    warning: '#D97B0A',
    warningSoft: 'rgba(217, 123, 10, 0.12)',
    danger: '#E0362B',
    dangerSoft: 'rgba(224, 54, 43, 0.10)',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    pill: '999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(11, 27, 52, 0.06)',
    md: '0 4px 16px rgba(11, 27, 52, 0.08)',
    lg: '0 16px 40px rgba(11, 27, 52, 0.14)',
  },
  font: {
    family: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
} as const;

export default theme;
