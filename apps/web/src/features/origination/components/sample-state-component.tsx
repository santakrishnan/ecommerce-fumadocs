import type { ReactNode } from "react";

interface SampleStateComponentProps {
  text: ReactNode;
}
export function SampleStateComponent({ text }: SampleStateComponentProps) {
  return <p>{text}</p>;
}
