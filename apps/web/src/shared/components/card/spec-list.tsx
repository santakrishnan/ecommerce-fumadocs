import { cn } from "utils";

export interface Spec {
  label: string;
  value: string;
}

/**
 * Label-left / value-right divided rows used by the spec/list card family
 * (model, trim, comparison, recommendation). A semantic definition list.
 */
export function SpecList({ specs, className }: { specs: Spec[]; className?: string }) {
  return (
    <dl className={cn("flex flex-col", className)}>
      {specs.map((spec, index) => (
        <div
          className={cn(
            "flex items-center justify-between py-3.5",
            index < specs.length - 1 && "border-divider border-b"
          )}
          key={spec.label}
        >
          <dt className="font-normal text-text-primary text-xs leading-body tracking-tighter">
            {spec.label}
          </dt>
          <dd className="font-normal text-text-secondary text-xs leading-body tracking-tighter">
            {spec.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
