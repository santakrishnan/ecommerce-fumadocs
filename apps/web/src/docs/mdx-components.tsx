import { Callout } from "fumadocs-ui/components/callout";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentPreview } from "./components/component-preview";

/**
 * Tags available inside `content/docs/**.mdx`. Demos are referenced by name:
 * `<ComponentPreview name="otp-start" />` — see `src/docs/demos/index.ts`.
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Callout,
    Tabs,
    Tab,
    TypeTable,
    Steps,
    Step,
    ComponentPreview,
    ...components,
  } satisfies MDXComponents;
}
