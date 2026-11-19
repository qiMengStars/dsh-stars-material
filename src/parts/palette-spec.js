/**
 * Role order shared by the palette generator, the Host palette engine and the
 * runtime.
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

/**
 * The single harmony this plugin ships.
 *
 * Material 3 has nine scheme variants; offering all of them turned the settings
 * page into a colour picker and made the palette impossible to describe. Tonal
 * spot is the Material 3 default (the scheme the design system documents first),
 * so it is the only one left. The variant id stays in the data shape because the
 * stored preference and the generated table still key on it.
 */
export const VARIANT_ID = 'tonalSpot';

/** material-color-utilities class that implements {@link VARIANT_ID}. */
export const VARIANT_CLASS = 'SchemeTonalSpot';

/**
 * The eight Material 3 presets offered in manual mode.
 *
 * Seeds are the tones Material 3 publishes for its own baseline palettes, so a
 * preset lands on the documented `#6750A4` role table rather than on an
 * approximation of it. Automatic mode does not use this list at all — it derives
 * the palette from the operating system accent colour at runtime.
 */
export const PRESETS = [
  { id: 'baseline', hex: '#6750a4', label: 'Material baseline' },
  { id: 'blue', hex: '#00639b', label: 'Blue' },
  { id: 'green', hex: '#006e1c', label: 'Green' },
  { id: 'teal', hex: '#006a6a', label: 'Teal' },
  { id: 'orange', hex: '#8e4e00', label: 'Orange' },
  { id: 'pink', hex: '#984061', label: 'Pink' },
  { id: 'red', hex: '#b3261e', label: 'Red' },
  { id: 'blueGrey', hex: '#525e7d', label: 'Blue grey' },
];

/** Preset used whenever the operating system colour cannot be read. */
export const DEFAULT_PRESET = 'baseline';

/**
 * Colours the stylesheet needs that are not DSH tokens.
 *
 * The runtime publishes the resolved role of each entry as a `--dsh-m3-*`
 * custom property on `:root`, and the stylesheet references only those
 * properties. Keeping the list here means the generator, the Host engine and the
 * Client all agree on which roles cross the bridge.
 */
export const BRIDGE_ROLES = [
  { variable: '--dsh-m3-surface', role: 'surface' },
  { variable: '--dsh-m3-surface-container-lowest', role: 'surfaceContainerLowest' },
  { variable: '--dsh-m3-surface-container-low', role: 'surfaceContainerLow' },
  { variable: '--dsh-m3-surface-container', role: 'surfaceContainer' },
  { variable: '--dsh-m3-surface-container-high', role: 'surfaceContainerHigh' },
  { variable: '--dsh-m3-surface-container-highest', role: 'surfaceContainerHighest' },
  { variable: '--dsh-m3-on-surface', role: 'onSurface' },
  { variable: '--dsh-m3-on-surface-variant', role: 'onSurfaceVariant' },
  { variable: '--dsh-m3-outline', role: 'outline' },
  { variable: '--dsh-m3-outline-variant', role: 'outlineVariant' },
  { variable: '--dsh-m3-primary', role: 'primary' },
  { variable: '--dsh-m3-on-primary', role: 'onPrimary' },
  { variable: '--dsh-m3-primary-container', role: 'primaryContainer' },
  { variable: '--dsh-m3-error', role: 'error' },
  { variable: '--dsh-m3-on-error', role: 'onError' },
  { variable: '--dsh-m3-success', role: 'success' },
  { variable: '--dsh-m3-warning', role: 'warning' },
];
