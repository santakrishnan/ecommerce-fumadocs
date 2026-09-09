/**
 * Storybook Brand Theme Decorator (next-themes)
 *
 * Wires the `@storybook/addon-themes` toolbar into a `next-themes`
 * `ThemeProvider`, following the recommended pattern from next-themes issue #63:
 * - https://github.com/pacocoursey/next-themes/issues/63#issuecomment-2457190283
 * - https://github.com/pacocoursey/next-themes/issues/63#issuecomment-2565817515
 *
 * The toolbar selection is synced into next-themes via `setTheme()` (so the
 * story root gets `<html data-theme="...">`), and wrapping every story in
 * `ThemeProvider` means components that call `useTheme()` (e.g. `Toaster`,
 * `ThemeToggle`) render without a missing-context error.
 *
 * TOKENS — SINGLE SOURCE OF TRUTH: brand tokens live only in
 * `@ucmp/ui-theme/themes/<brand>`. Because Tailwind v4's `@theme` always emits
 * to `:root`, two full brand themes cannot coexist and be switched by an
 * attribute alone. So each non-default brand ships as a compiled stylesheet
 * (a thin entry that only re-exports the theme — no token values) and this
 * decorator enables exactly one at a time. The default brand is the baseline
 * loaded via `styles.css`.
 */
import { DecoratorHelpers } from "@storybook/addon-themes"
import type { Decorator } from "@storybook/react"
import { ThemeProvider, type ThemeProviderProps, useTheme } from "next-themes"
import { type PropsWithChildren, useEffect } from "react"

// Compiled brand stylesheets (?url = emitted as an asset, not auto-injected).
// Each file only `@import`s from @ucmp/ui-theme — the single source of truth.
// @ts-ignore
import brandAcmeUrl from "./brand-acme.css?url"

const { initializeThemeState, pluckThemeFromContext } = DecoratorHelpers

/** Non-default brand slug → its compiled stylesheet URL. */
const BRAND_STYLESHEETS: Record<string, string> = {
  acme: brandAcmeUrl,
}

const linkId = (slug: string) => `sb-brand-${slug}`

/**
 * Enables the active brand's stylesheet and disables the others. The default
 * brand needs no stylesheet — it is the `:root` baseline from `styles.css`.
 */
function activateBrandStylesheet(activeSlug: string) {
  for (const [slug, href] of Object.entries(BRAND_STYLESHEETS)) {
    const id = linkId(slug)
    const existing = document.getElementById(id) as HTMLLinkElement | null

    if (slug === activeSlug) {
      if (existing) {
        existing.disabled = false
      } else {
        const link = document.createElement("link")
        link.id = id
        link.rel = "stylesheet"
        link.href = href
        document.head.appendChild(link)
      }
    } else if (existing) {
      existing.disabled = true
    }
  }
}

type ThemeSwitcherProps = PropsWithChildren<{
  /** next-themes theme name (the toolbar label). */
  theme: string
  /** `data-theme` attribute value / brand slug. */
  slug: string
}>

/**
 * Pushes the toolbar selection into next-themes and activates the matching
 * brand stylesheet. Runs inside the preview iframe.
 */
const ThemeSwitcher = ({ theme, slug, children }: ThemeSwitcherProps) => {
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme(theme)
    activateBrandStylesheet(slug)
  }, [setTheme, theme, slug])

  return children
}

type NextThemesDecorator = Omit<ThemeProviderProps, "defaultTheme" | "themes" | "value"> & {
  /** Map of toolbar label → `data-theme` attribute value (brand slug). */
  themes: Record<string, string>
  /** The toolbar label selected by default. Must be a key of `themes`. */
  defaultTheme: string
}

/**
 * Builds a decorator that registers the brand toolbar control and wraps every
 * story in a next-themes `ThemeProvider`.
 */
export const withNextThemes = ({
  themes,
  defaultTheme,
  ...props
}: NextThemesDecorator): Decorator => {
  const themeNames = Object.keys(themes)

  // Registers the addon-themes toolbar control (labels + default selection).
  initializeThemeState(themeNames, defaultTheme)

  return (Story, context) => {
    const { themeOverride } = context.parameters.themes ?? {}
    const label = themeOverride ?? pluckThemeFromContext(context) ?? defaultTheme
    const slug = themes[label] ?? themes[defaultTheme] ?? defaultTheme

    return (
      <ThemeProvider
        attribute="data-theme"
        defaultTheme={defaultTheme}
        themes={themeNames}
        value={themes}
        {...props}
      >
        <ThemeSwitcher slug={slug} theme={label}>
          <Story />
        </ThemeSwitcher>
      </ThemeProvider>
    )
  }
}
