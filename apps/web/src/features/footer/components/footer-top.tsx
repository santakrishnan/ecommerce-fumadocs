import { IconArrowRight } from "@ucmp/ui/icons";

interface FooterTopProps {
  brandName: string;
  tagline: string;
}

/**
 * FooterTop - Brand section with heading and tagline
 * Server Component — static brand section displaying brand content.
 */
export function FooterTop({ brandName, tagline }: FooterTopProps) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="subhead-sm text-text-primary">{brandName}</h2>
      <p className="body-xl flex items-center justify-between text-text-primary lg:inline">
        <span className="lg:inline">{tagline}</span>
        <IconArrowRight
          aria-hidden="true"
          className="size-5 shrink-0 lg:ml-2 lg:inline-block lg:align-middle"
        />
      </p>
    </div>
  );
}
