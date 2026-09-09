import type { Decorator, Preview } from "@storybook/react"

import { Card, CardContent } from "../src/components/card"
import { withNextThemes } from "./with-next-themes"
import "../src/styles.css"
import "./fonts.css"

/**
 * Surface decorator — wraps the story in a data-surface container to
 * demonstrate surface-aware component rendering (light/dark backgrounds).
 * This is an EXISTING control — unrelated to brand theming.
 */
const surfaceDecorator: Decorator = (Story, context) => {
  const surface = context.globals.surface

  if (!surface || surface === "none") {
    return <Story />
  }

  return (
    <div data-surface={surface}>
      <Card className={surface === "dark" ? "bg-neutral-900" : undefined}>
        <CardContent>
          <Story />
        </CardContent>
      </Card>
    </div>
  )
}

const preview: Preview = {
  decorators: [
    surfaceDecorator,
    withNextThemes({
      // Toolbar label → data-theme attribute value (brand slug).
      themes: {
        Default: "default",
        Acme: "acme",
      },
      defaultTheme: "Default",
      enableSystem: false,
      disableTransitionOnChange: true,
      storageKey: "storybook-brand",
    }),
  ],
  globalTypes: {
    surface: {
      description: "Surface context wrapping the component",
      toolbar: {
        title: "Surface",
        icon: "mirror",
        items: [
          { value: "none", title: "None" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    backgrounds: {
      options: {
        white: { name: "styling/white", value: "#FFFFFF" },
        lightGray: { name: "styling/light gray", value: "#E6E6E6" },
        darkCard: { name: "styling/dark card bg", value: "#000000B3" },
        black: { name: "styling/black", value: "#000000" },
      },
    },
    viewport: {
      options: {
        sm: { name: "SM (393px)", styles: { width: "393px", height: "900px" } },
        md: { name: "MD (768px)", styles: { width: "768px", height: "900px" } },
        lg: { name: "LG (1440px)", styles: { width: "1440px", height: "900px" } },
        xl: { name: "XL (1870px)", styles: { width: "1870px", height: "900px" } },
        wide: { name: "Wide (2560px)", styles: { width: "2560px", height: "1440px" } },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          "Foundation",
          ["Icons", "PageGrid", "Surface Colors", "Typography", "Util"],
          "Components",
          "Form",
          [
            "Field",
            [
              "Field",
              "FieldLabel",
              "FieldContent",
              "FieldDescription",
              "FieldError",
              "FieldTitle",
              "FieldGroup",
              "FieldSet",
              "FieldLegend",
              "FieldSeparator",
              "FloatingLabel",
              "Compositions",
            ],
          ],
        ],
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "lightGray" },
    surface: "none",
  },
}

export default preview
