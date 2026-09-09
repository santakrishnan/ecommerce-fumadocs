import type { Meta, StoryObj } from "@storybook/react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs"
import * as BrandIcons from "@/icons"

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Tab navigation built on [Base UI Tabs](https://base-ui.com/react/components/tabs). " +
          "Supports horizontal and vertical orientations with two sizes (sm, lg). " +
          "Colors are surface-aware — wrap in `data-surface=\"dark\"` to adapt to dark backgrounds. " +
          "\n\n**Breaking change from previous version:** `tabsListVariants` and the `variant` prop (`line` / `default`) have been removed. " +
          "There is now a single default appearance. If you were importing `tabsListVariants` directly, remove that import.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
    },
    surface: {
      control: "select",
      options: ["light", "dark"],
    },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

// ─── Horizontal (default) ───────────────────────────────────────────────────

export const Horizontal: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="specs">Specifications</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="offers">Offers</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-text-secondary">Overview content goes here.</p>
      </TabsContent>
      <TabsContent value="specs">
        <p className="text-sm text-text-secondary">Specifications content goes here.</p>
      </TabsContent>
      <TabsContent value="gallery">
        <p className="text-sm text-text-secondary">Gallery content goes here.</p>
      </TabsContent>
      <TabsContent value="offers">
        <p className="text-sm text-text-secondary">Offers content goes here.</p>
      </TabsContent>
    </Tabs>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Horizontal layout (default). Active tab shows a 1px bottom border in `text-primary` with 12px bottom padding. Gap between triggers is 16px.",
      },
    },
  },
}

// ─── Vertical ───────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="overview" className="min-h-48">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="specs">Specifications</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="offers">Offers</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-text-secondary">Overview content goes here.</p>
      </TabsContent>
      <TabsContent value="specs">
        <p className="text-sm text-text-secondary">Specifications content goes here.</p>
      </TabsContent>
      <TabsContent value="gallery">
        <p className="text-sm text-text-secondary">Gallery content goes here.</p>
      </TabsContent>
      <TabsContent value="offers">
        <p className="text-sm text-text-secondary">Offers content goes here.</p>
      </TabsContent>
    </Tabs>
  ),
  args: {
    orientation: "vertical",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Vertical layout. Triggers are left-aligned and stacked with 20px gap. " +
          "Note: the active border indicator is horizontal-only per the design spec — " +
          "vertical active state uses color change only (text-primary).",
      },
    },
  },
}

// ─── Sizes ──────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-xs font-bold text-text-secondary mb-4 uppercase tracking-wider">Large (default) — 14px uppercase</p>
        <Tabs defaultValue="tab1" orientation="horizontal">
          <TabsList>
            <TabsTrigger size="lg" value="tab1">Overview</TabsTrigger>
            <TabsTrigger size="lg" value="tab2">Specifications</TabsTrigger>
            <TabsTrigger size="lg" value="tab3">Gallery</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1"><p className="text-sm text-text-secondary">Content A</p></TabsContent>
          <TabsContent value="tab2"><p className="text-sm text-text-secondary">Content B</p></TabsContent>
          <TabsContent value="tab3"><p className="text-sm text-text-secondary">Content C</p></TabsContent>
        </Tabs>
      </div>

      <div>
        <p className="text-xs font-bold text-text-secondary mb-4 uppercase tracking-wider">Small — 12px no transform</p>
        <Tabs defaultValue="tab1" orientation="horizontal">
          <TabsList>
            <TabsTrigger size="sm" value="tab1">Overview</TabsTrigger>
            <TabsTrigger size="sm" value="tab2">Specifications</TabsTrigger>
            <TabsTrigger size="sm" value="tab3">Gallery</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1"><p className="text-sm text-text-secondary">Content A</p></TabsContent>
          <TabsContent value="tab2"><p className="text-sm text-text-secondary">Content B</p></TabsContent>
          <TabsContent value="tab3"><p className="text-sm text-text-secondary">Content C</p></TabsContent>
        </Tabs>
      </div>
    </div>
  ),
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "`size=\"lg\"` (default): 14px font, uppercase. `size=\"sm\"`: 12px font, no text-transform. Both use the same font-weight, line-height, and letter-spacing.",
      },
    },
  },
}

// ─── With Icons ─────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">
          <BrandIcons.IconHome />
          Overview
        </TabsTrigger>
        <TabsTrigger value="specs">
          <BrandIcons.IconPreferences />
          Specifications
        </TabsTrigger>
        <TabsTrigger value="gallery">
          <BrandIcons.IconCamera />
          Gallery
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-text-secondary">Overview content goes here.</p>
      </TabsContent>
      <TabsContent value="specs">
        <p className="text-sm text-text-secondary">Specifications content goes here.</p>
      </TabsContent>
      <TabsContent value="gallery">
        <p className="text-sm text-text-secondary">Gallery content goes here.</p>
      </TabsContent>
    </Tabs>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Icon children sit in the same row as the label with a 4px gap (gap-1). " +
          "Icons are sized via `[&_svg:not([class*='size-'])]:size-4` and inherit `currentColor`.",
      },
    },
  },
}

// ─── Disabled ───────────────────────────────────────────────────────────────

export const WithDisabled: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="specs" disabled>Specifications</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-text-secondary">Overview content goes here.</p>
      </TabsContent>
      <TabsContent value="specs">
        <p className="text-sm text-text-secondary">Specifications content (disabled).</p>
      </TabsContent>
      <TabsContent value="gallery">
        <p className="text-sm text-text-secondary">Gallery content goes here.</p>
      </TabsContent>
    </Tabs>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Disabled triggers receive `pointer-events-none` and `text-text-inactive`. Both `disabled` and `aria-disabled` are handled.",
      },
    },
  },
}

// ─── Surface-Aware (Dark) ───────────────────────────────────────────────────

export const SurfaceDark: Story = {
  render: (args) => (
    <div data-surface="dark" className="bg-neutral-800 p-8 rounded-xl">
      <Tabs {...args} defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <p className="text-sm text-text-secondary">Overview content goes here.</p>
        </TabsContent>
        <TabsContent value="specs">
          <p className="text-sm text-text-secondary">Specifications content goes here.</p>
        </TabsContent>
        <TabsContent value="gallery">
          <p className="text-sm text-text-secondary">Gallery content goes here.</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    docs: {
      description: {
        story:
          "On a dark surface (`data-surface=\"dark\"` ancestor), `text-primary` and `text-tertiary` " +
          "resolve to their dark-surface values — white and `Neutral/300` respectively — " +
          "without any prop changes on the Tabs component itself.",
      },
    },
  },
}

// ─── Matrix ─────────────────────────────────────────────────────────────────

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-12">
      {/* Horizontal × sizes */}
      <section>
        <h3 className="text-sm font-bold text-text-primary mb-6 uppercase tracking-wider">Horizontal</h3>
        <div className="flex flex-col gap-8">
          {(["lg", "sm"] as const).map((size) => (
            <div key={size}>
              <p className="text-xs text-text-secondary mb-3">size="{size}"</p>
              <Tabs defaultValue="a" orientation="horizontal">
                <TabsList>
                  <TabsTrigger size={size} value="a">Overview</TabsTrigger>
                  <TabsTrigger size={size} value="b">Specifications</TabsTrigger>
                  <TabsTrigger size={size} value="c">Gallery</TabsTrigger>
                  <TabsTrigger size={size} value="d" disabled>Disabled</TabsTrigger>
                </TabsList>
                <TabsContent value="a"><p className="text-sm text-text-secondary">Content A</p></TabsContent>
                <TabsContent value="b"><p className="text-sm text-text-secondary">Content B</p></TabsContent>
                <TabsContent value="c"><p className="text-sm text-text-secondary">Content C</p></TabsContent>
                <TabsContent value="d"><p className="text-sm text-text-secondary">Content D</p></TabsContent>
              </Tabs>
            </div>
          ))}
        </div>
      </section>

      {/* Vertical × sizes */}
      <section>
        <h3 className="text-sm font-bold text-text-primary mb-6 uppercase tracking-wider">Vertical</h3>
        <div className="flex gap-12">
          {(["lg", "sm"] as const).map((size) => (
            <div key={size} className="min-w-48">
              <p className="text-xs text-text-secondary mb-3">size="{size}"</p>
              <Tabs defaultValue="a" orientation="vertical">
                <TabsList>
                  <TabsTrigger size={size} value="a">Overview</TabsTrigger>
                  <TabsTrigger size={size} value="b">Specifications</TabsTrigger>
                  <TabsTrigger size={size} value="c">Gallery</TabsTrigger>
                  <TabsTrigger size={size} value="d" disabled>Disabled</TabsTrigger>
                </TabsList>
                <TabsContent value="a"><p className="text-sm text-text-secondary">Content A</p></TabsContent>
                <TabsContent value="b"><p className="text-sm text-text-secondary">Content B</p></TabsContent>
                <TabsContent value="c"><p className="text-sm text-text-secondary">Content C</p></TabsContent>
                <TabsContent value="d"><p className="text-sm text-text-secondary">Content D</p></TabsContent>
              </Tabs>
            </div>
          ))}
        </div>
      </section>

      {/* Dark surface */}
      <section>
        <h3 className="text-sm font-bold text-text-primary mb-6 uppercase tracking-wider">Dark Surface</h3>
        <div data-surface="dark" className="bg-neutral-800 p-8 rounded-xl">
          <Tabs defaultValue="a" orientation="horizontal">
            <TabsList>
              <TabsTrigger value="a">Overview</TabsTrigger>
              <TabsTrigger value="b">Specifications</TabsTrigger>
              <TabsTrigger value="c">Gallery</TabsTrigger>
              <TabsTrigger value="d" disabled>Disabled</TabsTrigger>
            </TabsList>
            <TabsContent value="a"><p className="text-sm text-text-secondary">Content A</p></TabsContent>
            <TabsContent value="b"><p className="text-sm text-text-secondary">Content B</p></TabsContent>
            <TabsContent value="c"><p className="text-sm text-text-secondary">Content C</p></TabsContent>
            <TabsContent value="d"><p className="text-sm text-text-secondary">Content D</p></TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  ),
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: "Full matrix of orientations, sizes, states, and surface contexts.",
      },
    },
  },
}

export const PillBaseline: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="overview">
      <TabsList variant="pill">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="specs">Specifications</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="offers">Offers</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-text-secondary">Overview content goes here.</p>
      </TabsContent>
      <TabsContent value="specs">
        <p className="text-sm text-text-secondary">Specifications content goes here.</p>
      </TabsContent>
      <TabsContent value="gallery">
        <p className="text-sm text-text-secondary">Gallery content goes here.</p>
      </TabsContent>
      <TabsContent value="offers">
        <p className="text-sm text-text-secondary">Offers content goes here.</p>
      </TabsContent>
    </Tabs>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pill variant set on `TabsList`. All child triggers inherit pill styling automatically via `data-variant=\"pill\"` on the list. No per-trigger `variant` prop needed.",
      },
    },
  },
}

export const PillVariantFromList: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs text-text-secondary mb-3">variant set on TabsList only — triggers have no variant prop</p>
        <Tabs {...args} defaultValue="a">
          <TabsList variant="pill">
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b">Specifications</TabsTrigger>
            <TabsTrigger value="c">Gallery</TabsTrigger>
            <TabsTrigger value="d" disabled>Disabled</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><p className="text-sm text-text-secondary">Content A</p></TabsContent>
          <TabsContent value="b"><p className="text-sm text-text-secondary">Content B</p></TabsContent>
          <TabsContent value="c"><p className="text-sm text-text-secondary">Content C</p></TabsContent>
          <TabsContent value="d"><p className="text-sm text-text-secondary">Content D</p></TabsContent>
        </Tabs>
      </div>
    </div>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Demonstrates that setting `variant=\"pill\"` on `TabsList` is sufficient — child `TabsTrigger` components receive pill styling without any per-trigger configuration.",
      },
    },
  },
}

export const PillWithIcons: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs text-text-secondary mb-3">icon at start (default children order)</p>
        <Tabs {...args} defaultValue="overview">
          <TabsList variant="pill">
            <TabsTrigger value="overview">
              <BrandIcons.IconHome />
              Overview
            </TabsTrigger>
            <TabsTrigger value="specs">
              <BrandIcons.IconPreferences />
              Specifications
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <BrandIcons.IconCamera />
              Gallery
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><p className="text-sm text-text-secondary">Overview content.</p></TabsContent>
          <TabsContent value="specs"><p className="text-sm text-text-secondary">Specifications content.</p></TabsContent>
          <TabsContent value="gallery"><p className="text-sm text-text-secondary">Gallery content.</p></TabsContent>
        </Tabs>
      </div>
      <div>
        <p className="text-xs text-text-secondary mb-3">icon at end</p>
        <Tabs {...args} defaultValue="overview">
          <TabsList variant="pill">
            <TabsTrigger value="overview">
              Overview
              <BrandIcons.IconHome />
            </TabsTrigger>
            <TabsTrigger value="specs">
              Specifications
              <BrandIcons.IconPreferences />
            </TabsTrigger>
            <TabsTrigger value="gallery">
              Gallery
              <BrandIcons.IconCamera />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><p className="text-sm text-text-secondary">Overview content.</p></TabsContent>
          <TabsContent value="specs"><p className="text-sm text-text-secondary">Specifications content.</p></TabsContent>
          <TabsContent value="gallery"><p className="text-sm text-text-secondary">Gallery content.</p></TabsContent>
        </Tabs>
      </div>
    </div>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Pill triggers with icons at start and end positions. Gap between icon and label is `gap-2` (8px) per Figma spec.",
      },
    },
  },
}

export const PillSurfaceDark: Story = {
  render: (args) => (
    <div data-surface="dark" className="bg-neutral-800 p-8 rounded-xl">
      <Tabs {...args} defaultValue="overview">
        <TabsList variant="pill">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="offers" disabled>Offers</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <p className="text-sm text-text-secondary">Overview content goes here.</p>
        </TabsContent>
        <TabsContent value="specs">
          <p className="text-sm text-text-secondary">Specifications content goes here.</p>
        </TabsContent>
        <TabsContent value="gallery">
          <p className="text-sm text-text-secondary">Gallery content goes here.</p>
        </TabsContent>
        <TabsContent value="offers">
          <p className="text-sm text-text-secondary">Offers content (disabled).</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pill variant on a dark surface. Selected trigger shows white background with black text. Unselected triggers show transparent background with white text. Wrap in `data-surface=\"dark\"` to activate dark surface tokens.",
      },
    },
  },
}

export const PillResponsive: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-secondary">Resize the viewport below 640px to see mobile padding (px-4 / 16px). Above 640px uses desktop padding (px-5 / 20px). Height is always 48px.</p>
      <Tabs {...args} defaultValue="overview">
        <TabsList variant="pill">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><p className="text-sm text-text-secondary">Overview content.</p></TabsContent>
        <TabsContent value="specs"><p className="text-sm text-text-secondary">Specifications content.</p></TabsContent>
        <TabsContent value="gallery"><p className="text-sm text-text-secondary">Gallery content.</p></TabsContent>
      </Tabs>
    </div>
  ),
  args: {
    orientation: "horizontal",
  },
  parameters: {
    docs: {
        story:
          "Mobile-first responsive horizontal padding: `px-4` (16px) on mobile, `px-5` (20px) on desktop (≥640px). Trigger uses `min-h-12` (48px) to maintain pill height.",
    },
  },
}

export const PillOnImage: Story = {
  render: (args) => (
    <div className="relative w-full overflow-hidden rounded-xl">
      {/* biome-ignore lint/a11y/useAltText: decorative story image */}
      <img src="/images/mock-car-image.jpg" alt="Mock car" className="block h-auto w-full" />
      <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
        <Tabs {...args} defaultValue="overview">
          <TabsList variant="pill">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
  args: {
    orientation: "horizontal",
    surface: "dark",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pill tabs overlaid on `/images/mock-car-image.jpg`. Use the `surface` control (`light`/`dark`) to switch token resolution for the tabs and the overlay scrim.",
      },
    },
  },
}

