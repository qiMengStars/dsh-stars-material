/**
 * Role order shared by the palette generator and the runtime.
 *
 * The first 36 entries are read straight off a `DynamicScheme` instance (they
 * are the ARGB getters MaterialDynamicColors derives for every M3 scheme).
 * `surfaceTint` is not a DynamicScheme getter, so the generator reads it from
 * `MaterialDynamicColors.surfaceTint`.
 *
 * The last 8 entries are the semantic pairs Material 3 does not define but a
 * chat application needs (success / warning). They come from fixed tonal
 * palettes so they stay recognisably green / amber through every seed colour.
 */
export const ROLE_ORDER = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'background',
  'onBackground',
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'shadow',
  'scrim',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
];

/** Roles that come from fixed tonal palettes rather than from the seed. */
export const FIXED_ROLE_ORDER = [
  'success',
  'onSuccess',
  'successContainer',
  'onSuccessContainer',
  'warning',
  'onWarning',
  'warningContainer',
  'onWarningContainer',
];

/** The 36 roles a DynamicScheme exposes directly. */
export const SCHEME_ROLE_ORDER = ROLE_ORDER;

/** Curated seeds shown in the settings page. `id` is stable, `hex` is the M3 seed. */
export const SEEDS = [
  { id: 'deepseek', hex: '#4176e6' },
  { id: 'indigo', hex: '#4f5bd5' },
  { id: 'violet', hex: '#7c3aed' },
  { id: 'purple', hex: '#6750a4' },
  { id: 'pink', hex: '#b90063' },
  { id: 'red', hex: '#b3261e' },
  { id: 'orange', hex: '#8b5000' },
  { id: 'amber', hex: '#7c5800' },
  { id: 'green', hex: '#2e6b30' },
  { id: 'teal', hex: '#00696d' },
  { id: 'cyan', hex: '#00658f' },
  { id: 'graphite', hex: '#5c5f62' },
];

/**
 * M3 scheme variants this plugin ships. `mc` is the material-color-utilities
 * class name; the ids are the ones the settings page and the stored config use.
 */
export const VARIANTS = [
  { id: 'tonalSpot', mc: 'SchemeTonalSpot', label: 'Tonal spot (Material 3 default)' },
  { id: 'expressive', mc: 'SchemeExpressive', label: 'Expressive (Material 3 Expressive)' },
  { id: 'vibrant', mc: 'SchemeVibrant', label: 'Vibrant' },
  { id: 'content', mc: 'SchemeContent', label: 'Content' },
  { id: 'fidelity', mc: 'SchemeFidelity', label: 'Fidelity' },
  { id: 'neutral', mc: 'SchemeNeutral', label: 'Neutral' },
  { id: 'monochrome', mc: 'SchemeMonochrome', label: 'Monochrome' },
  { id: 'rainbow', mc: 'SchemeRainbow', label: 'Rainbow' },
  { id: 'fruitSalad', mc: 'SchemeFruitSalad', label: 'Fruit salad' },
];
