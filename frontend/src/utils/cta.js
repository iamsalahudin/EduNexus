export const getCtaColor = (palette, mode) => {
  if (palette.cta) return palette.cta;

  // Auto CTA fallback
  return mode === 'dark'
    ? palette.secondary
    : palette.primary;
};
