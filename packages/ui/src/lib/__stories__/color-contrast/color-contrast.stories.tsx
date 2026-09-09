import type { Meta, StoryObj } from "@storybook/react";

import { getSurfaceFromOklch, hexToRgb, rgbToOklch, toOklchCss } from "@/lib";
import { cn } from "@/lib/utils";

type SurfacePlaygroundArgs = {
  color: string;
};

const meta: Meta<SurfacePlaygroundArgs> = {
  title: "Foundation/Util/Color Contrast",
  parameters: {
    layout: "padded",
  },
  argTypes: {
    color: {
      control: { type: "color" },
      description: "Pick a color to analyze",
    },
  },
  args: {
    color: "#751818",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;


export const SurfacePlayground: Story = {
  render: (args) => {
    const rgb = hexToRgb(args.color);
    if (!rgb) {
      return (
        <div className="rounded-lg border border-divider bg-surface-primary p-4">
          <h3 className="text-sm font-semibold text-text-primary">Input Color</h3>
          <p className="mt-3 text-xs text-text-secondary">
            Hex: <code className="text-text-primary">{args.color.toUpperCase()}</code>
          </p>
          <p className="mt-2 text-xs text-text-secondary">Enter a valid hex color to analyze.</p>
        </div>
      );
    }
    const oklch = rgbToOklch(rgb);
    const surface = getSurfaceFromOklch(oklch);
    const previewBackground = args.color;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-divider bg-surface-primary p-4">
          <h3 className="text-sm font-semibold text-text-primary">Input Color</h3>
          <p className="mt-3 text-xs text-text-secondary">
            Hex: <code className="text-text-primary">{args.color.toUpperCase()}</code>
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            OKLCH: <code className="text-text-primary">{toOklchCss(oklch)}</code>
          </p>
          <div className="mt-4 space-y-2 text-xs">
            <p className="text-text-secondary">
              Surface recommendation: <strong className="text-text-primary">{surface}</strong>
            </p>
          </div>
        </div>

        <div
          className={cn("rounded-lg border p-4 border-divider")}
          data-surface={surface}
          style={{ backgroundColor: previewBackground }}
        >
          <h3 className="text-sm font-semibold text-text-primary">Preview</h3>
          <p className="mt-2 text-xs text-text-secondary">
            Recommended surface: <strong className="text-text-primary">{surface}</strong>
          </p>
          <hr className="mt-3 border-divider" />
          <p className="mt-2 text-xs text-text-secondary">
            Divider sample <code className="text-text-primary">border-divider</code>
          </p>
          <p className="mt-4 text-sm text-text-primary">text-text-primary sample</p>
          <p className="text-sm text-text-secondary">text-text-secondary sample</p>
          <p className="text-sm text-text-tertiary">text-text-tertiary sample</p>
          <p className="mt-3 text-xs text-text-inactive">text-text-inactive sample</p>
        </div>
      </div>
    );
  },
};

