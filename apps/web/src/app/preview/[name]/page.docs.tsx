import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewShell } from "~/docs/components/preview-shell";
import { demoNames, demos, isDemoName } from "~/docs/demos";

interface PreviewPageProps {
  params: Promise<{ name: string }>;
}

/**
 * Standalone render of one demo, without docs chrome. Embedded in an iframe by
 * `<ComponentPreview>` so the demo gets a real viewport; also useful on its own
 * for screenshots and visual regression.
 */
export default async function PreviewPage(props: PreviewPageProps) {
  const { name } = await props.params;
  if (!isDemoName(name)) {
    notFound();
  }
  const Demo = demos[name];

  return (
    <PreviewShell name={name}>
      <Demo />
    </PreviewShell>
  );
}

export function generateStaticParams() {
  return demoNames.map((name) => ({ name }));
}

export async function generateMetadata(props: PreviewPageProps): Promise<Metadata> {
  const { name } = await props.params;
  return { title: `Preview · ${name}`, robots: { index: false } };
}
