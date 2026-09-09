"use client";

import type { ComponentPropsWithoutRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "utils";

export interface MarkdownRendererProps {
  /** Additional class names applied to the wrapper element. */
  className?: string;
  /** The markdown string to render. */
  content: string;
}

/**
 * Renders markdown content using react-markdown with GFM support.
 *
 * Used for agent search response summaries that may contain formatted text,
 * lists, bold, links, tables, etc. Styled with Tailwind utility classes
 * that match the existing body-xl text style of the search response area.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn("markdown-response body-xl text-text-primary", className)}
      data-testid="markdown-renderer"
    >
      <Markdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  );
}

// ─── Custom component overrides ──────────────────────────────────────────────

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;
type AnchorProps = ComponentPropsWithoutRef<"a">;
type ListProps = ComponentPropsWithoutRef<"ul">;
type ListItemProps = ComponentPropsWithoutRef<"li">;
type BlockquoteProps = ComponentPropsWithoutRef<"blockquote">;
type CodeProps = ComponentPropsWithoutRef<"code">;
type PreProps = ComponentPropsWithoutRef<"pre">;
type TableProps = ComponentPropsWithoutRef<"table">;
type ThProps = ComponentPropsWithoutRef<"th">;
type TdProps = ComponentPropsWithoutRef<"td">;
type HrProps = ComponentPropsWithoutRef<"hr">;
type StrongProps = ComponentPropsWithoutRef<"strong">;
type EmProps = ComponentPropsWithoutRef<"em">;

const markdownComponents = {
  h1: ({ children, ...props }: HeadingProps) => (
    <h1 className="mt-6 mb-4 font-bold text-2xl text-text-primary first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: HeadingProps) => (
    <h2 className="mt-5 mb-3 font-bold text-text-primary text-xl first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: HeadingProps) => (
    <h3 className="mt-4 mb-2 font-semibold text-lg text-text-primary first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: HeadingProps) => (
    <h4 className="mt-3 mb-2 font-semibold text-base text-text-primary first:mt-0" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: ParagraphProps) => (
    <p className="mb-4 last:mb-0" {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, ...props }: AnchorProps) => (
    <a
      className="font-medium text-text-link underline underline-offset-2 hover:text-text-link-hover"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }: ListProps) => (
    <ul
      className="body-lg mb-4 list-disc space-y-1 pl-6 marker:text-text-secondary last:mb-0"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ListProps) => (
    <ol
      className="body-lg mb-4 list-decimal space-y-1 pl-6 marker:text-text-secondary last:mb-0"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ListItemProps) => (
    <li className="pl-1" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: BlockquoteProps) => (
    <blockquote
      className="my-4 border-border-primary border-l-4 pl-4 text-text-secondary italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className: codeClassName, ...props }: CodeProps) => {
    // Inline code vs code block detection: code blocks are wrapped in <pre>
    // by react-markdown, so bare <code> is always inline.
    const isInline = !codeClassName;
    if (isInline) {
      return (
        <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={cn("font-mono text-sm", codeClassName)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: PreProps) => (
    <pre
      className="my-4 overflow-x-auto rounded-lg bg-surface-secondary p-4 font-mono text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }: TableProps) => (
    <div className="my-4 overflow-hidden rounded-xl bg-surface-dark/30 p-2">
      <table className="body-md w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: ThProps) => (
    <th
      className="border-r border-r-border/50 border-b border-b-border/80 px-3 py-2 text-left font-semibold last:border-r-0"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: TdProps) => (
    <td
      className="border-r border-r-border/30 border-b border-b-border/30 px-3 py-2 last:border-r-0 [tr:last-child_&]:border-b-0"
      {...props}
    >
      {children}
    </td>
  ),
  hr: (props: HrProps) => <hr className="my-6 border-border-primary border-t" {...props} />,
  strong: ({ children, ...props }: StrongProps) => (
    <strong className="font-bold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: EmProps) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
};
