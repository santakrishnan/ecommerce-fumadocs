import type { Meta, StoryObj } from "@storybook/react"

const meta = {
  title: "Foundation/Glass",
  parameters: {
    layout: "padded",
    backgrounds: { value: "black" },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * Repeating color-block pattern used as a backdrop to make the blur obvious.
 */
function ColorBlocks() {
  return (
    <div className="absolute inset-0 grid grid-cols-4 grid-rows-3">
      <div className="bg-red-500" />
      <div className="bg-blue-600" />
      <div className="bg-yellow-400" />
      <div className="bg-emerald-500" />
      <div className="bg-purple-600" />
      <div className="bg-orange-500" />
      <div className="bg-cyan-400" />
      <div className="bg-pink-500" />
      <div className="bg-lime-400" />
      <div className="bg-indigo-600" />
      <div className="bg-amber-400" />
      <div className="bg-teal-500" />
    </div>
  )
}

/**
 * The raw `glass` class over stark color blocks.
 * No background color on the panel — just the blur and saturation effect.
 */
export const BasicBlur: Story = {
  render: () => (
    <div className="relative overflow-hidden rounded-xl" style={{ minHeight: 240 }}>
      <ColorBlocks />
      <div className="relative flex items-center justify-center p-8" style={{ minHeight: 240 }}>
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary">Pure blur</h3>
          <p className="mt-1 text-sm text-text-secondary">
            The <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">glass</code> class
            with no background — only backdrop-filter.
          </p>
        </div>
      </div>
    </div>
  ),
}

/**
 * Combines the `glass` effect with semi-transparent backgrounds
 * to create different frosted tints.
 */
export const WithTint: Story = {
  render: () => (
    <div className="relative overflow-hidden rounded-xl" style={{ minHeight: 320 }}>
      <ColorBlocks />
      <div className="relative flex items-stretch gap-6 p-8" style={{ minHeight: 320 }}>
        <div className="glass flex flex-1 flex-col justify-end rounded-lg bg-white/20 p-6">
          <p className="text-sm font-semibold text-text-primary">bg-white/20</p>
          <p className="mt-1 text-xs text-text-secondary">Light tint</p>
        </div>
        <div className="glass flex flex-1 flex-col justify-end rounded-lg bg-black/30 p-6">
          <p className="text-sm font-semibold text-text-primary">bg-black/30</p>
          <p className="mt-1 text-xs text-text-secondary">Dark tint</p>
        </div>
        <div className="glass flex flex-1 flex-col justify-end rounded-lg bg-white/50 p-6">
          <p className="text-sm font-semibold text-text-primary">bg-white/50</p>
          <p className="mt-1 text-xs text-text-secondary">Heavy tint</p>
        </div>
      </div>
    </div>
  ),
}

/**
 * Side-by-side comparison: same panel with and without the `glass` class.
 */
export const Comparison: Story = {
  render: () => (
    <div className="relative overflow-hidden rounded-xl" style={{ minHeight: 240 }}>
      <ColorBlocks />
      <div className="relative grid grid-cols-2 gap-6 p-8" style={{ minHeight: 240 }}>
        <div className="rounded-lg bg-white/20 p-5">
          <p className="text-sm font-semibold text-text-primary">Without glass</p>
          <p className="mt-1 text-xs text-text-secondary">
            bg-white/20 only — color blocks show through clearly.
          </p>
        </div>
        <div className="glass rounded-lg bg-white/20 p-5">
          <p className="text-sm font-semibold text-text-primary">With glass</p>
          <p className="mt-1 text-xs text-text-secondary">
            bg-white/20 + glass — color blocks are frosted and blended.
          </p>
        </div>
      </div>
    </div>
  ),
}
