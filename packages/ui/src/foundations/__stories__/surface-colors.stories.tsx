import type { Meta, StoryObj } from "@storybook/react"

/* ─── Swatch ─── */
function Swatch({
  label,
  token,
  className,
}: {
  label: string
  token: string
  className: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm font-semibold leading-body ${className}`}>
        {label}
      </span>
      <code className="text-2xs text-text-tertiary">{token}</code>
    </div>
  )
}

/* ─── Surface Panel ─── */
function SurfacePanel({ surface }: { surface: "light" | "dark" }) {
  const bg = surface === "dark" ? "bg-neutral-900" : "bg-white"

  return (
    <div data-surface={surface} className={`${bg} rounded-lg p-6`}>
      <p className="mb-4 text-xs font-bold uppercase tracking-wide text-text-tertiary">
        data-surface=&quot;{surface}&quot;
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <h3 className="text-2xl font-bold leading-heading tracking-tightest text-text-primary">
          Heading
        </h3>
        <p className="text-base leading-body tracking-tighter text-text-secondary">
          Body text on a {surface} surface uses secondary for comfortable
          reading contrast.
        </p>
        <p className="text-xs leading-body tracking-tighter text-text-tertiary">
          Caption — tertiary for supplemental info.
        </p>
        <hr className="mt-2 border-t border-divider" />
        <p className="mt-1 text-xs leading-body text-text-inactive">
          Inactive / disabled label
        </p>
      </div>
    </div>
  )
}

/* ─── Storybook Meta ─── */
const meta = {
  title: "Foundation/Surface Colors",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * Use the global Surface toolbar (mirror icon) to toggle between
 * light/dark and see the tokens adapt in real time.
 */
export const Playground: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Switch the <strong>Surface</strong> toolbar above (mirror icon) between
        Light and Dark to see tokens respond.
      </p>
      <div className="flex flex-col gap-3">
        <Swatch
          label="Primary"
          token="--color-text-primary"
          className="text-text-primary"
        />
        <Swatch
          label="Secondary"
          token="--color-text-secondary"
          className="text-text-secondary"
        />
        <Swatch
          label="Tertiary"
          token="--color-text-tertiary"
          className="text-text-tertiary"
        />
        <Swatch
          label="Inactive"
          token="--color-text-inactive"
          className="text-text-inactive"
        />
      </div>
      <hr className="border-t border-divider" />
      <code className="text-2xs text-text-tertiary">--color-divider</code>
      <div className="mt-4 flex flex-col gap-2">
        <h3 className="text-2xl font-bold leading-heading tracking-tightest text-text-primary">
          Heading sample
        </h3>
        <p className="text-base leading-body tracking-tighter text-text-secondary">
          Body text adapts when you switch the Surface toolbar.
        </p>
        <p className="text-xs leading-body tracking-tighter text-text-tertiary">
          Caption / tertiary text.
        </p>
      </div>
    </div>
  ),
}

/**
 * Both surfaces rendered side by side for direct comparison.
 */
export const SideBySide: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <SurfacePanel surface="light" />
      <SurfacePanel surface="dark" />
    </div>
  ),
}

/**
 * Typography colors shown as swatches on both surfaces.
 */
export const TypographyColors: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div data-surface="light" className="rounded-lg bg-white p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-text-tertiary">
          data-surface=&quot;light&quot;
        </p>
        <div className="flex flex-col gap-3">
          <Swatch label="Primary" token="--color-text-primary" className="text-text-primary" />
          <Swatch label="Secondary" token="--color-text-secondary" className="text-text-secondary" />
          <Swatch label="Tertiary" token="--color-text-tertiary" className="text-text-tertiary" />
          <Swatch label="Inactive" token="--color-text-inactive" className="text-text-inactive" />
        </div>
      </div>
      <div data-surface="dark" className="rounded-lg bg-neutral-900 p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-text-tertiary">
          data-surface=&quot;dark&quot;
        </p>
        <div className="flex flex-col gap-3">
          <Swatch label="Primary" token="--color-text-primary" className="text-text-primary" />
          <Swatch label="Secondary" token="--color-text-secondary" className="text-text-secondary" />
          <Swatch label="Tertiary" token="--color-text-tertiary" className="text-text-tertiary" />
          <Swatch label="Inactive" token="--color-text-inactive" className="text-text-inactive" />
        </div>
      </div>
    </div>
  ),
}

/**
 * Divider appearance on both surfaces.
 */
export const Divider: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div data-surface="light" className="rounded-lg bg-white p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">Light</p>
        <hr className="border-t border-divider" />
        <code className="mt-2 block text-2xs text-text-tertiary">--color-divider</code>
      </div>
      <div data-surface="dark" className="rounded-lg bg-neutral-900 p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">Dark</p>
        <hr className="border-t border-divider" />
        <code className="mt-2 block text-2xs text-text-tertiary">--color-divider</code>
      </div>
    </div>
  ),
}
