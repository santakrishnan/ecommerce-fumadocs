"use client";

import { useFuseSearch } from "@ucmp/shared";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTopBar,
  DialogTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ucmp/ui";
import { IconClose, IconSearch } from "@ucmp/ui/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "utils";
import { withVdpViewTransition } from "../../lib/vdp-view-transition";
import type {
  CategorizedModalProps,
  Category,
  CategoryItem,
  Package,
} from "../../types/categorized-modal";
import type { SearchAlias } from "../../types/search-aliases";

// ─── Fuse corpus helpers ──────────────────────────────────────────────────────

const WHITESPACE_RE = /\s+/;
const SCROLL_ANIMATION_DURATION = 600; // milliseconds

interface FuseItem {
  acceptedTerms: string[];
  /** Acronym derived from first letters of each word (e.g., "ACC" for "Adaptive Cruise Control"). */
  acronym: string;
  categoryId: string;
  categoryTitle: string;
  label: string;
  value?: string;
}

function buildAcronym(text: string): string {
  return text
    .split(WHITESPACE_RE)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * Build a searchable corpus from categories and optional search aliases.
 *
 * For each category item, we include:
 * 1. The item label
 * 2. The item value (if present)
 * 3. The item's acronym
 * 4. All accepted terms from matching search aliases
 *
 * This allows fuzzy matching against any variation a user might type.
 */
function buildCorpus(
  categories: Category[],
  searchAliases?: SearchAlias[],
  packages?: Package
): FuseItem[] {
  const categoryItems = categories.flatMap((cat) =>
    cat.items.map((item) => {
      // Find matching alias for this item (primary name match on label)
      const matchingAlias = searchAliases?.find(
        (alias) => alias.primaryName.toLowerCase() === item.label.toLowerCase()
      );

      return {
        acronym: buildAcronym(item.label),
        categoryId: cat.id,
        categoryTitle: cat.title,
        label: item.label,
        value: item.value,
        // Store accepted terms from the alias (will be indexed by Fuse)
        acceptedTerms: matchingAlias?.acceptedTerms ?? [],
      };
    })
  );

  const packageItems: FuseItem[] =
    packages?.items.flatMap((pkg) =>
      pkg.items.map((item) => ({
        acronym: buildAcronym(item.label),
        categoryId: "package",
        categoryTitle: packages.items.length > 1 ? "Packages" : "Package",
        label: item.label,
        value: item.value,
        acceptedTerms: [],
      }))
    ) ?? [];

  return [...categoryItems, ...packageItems];
}

function groupResultsByCategory(results: FuseItem[]): Category[] {
  const grouped = new Map<string, { title: string; items: CategoryItem[] }>();

  for (const result of results) {
    const existing = grouped.get(result.categoryId);
    const item: CategoryItem = { label: result.label, value: result.value };

    if (existing) {
      existing.items.push(item);
    } else {
      grouped.set(result.categoryId, { title: result.categoryTitle, items: [item] });
    }
  }

  return Array.from(grouped.entries()).map(([id, data]) => ({
    id,
    title: data.title,
    items: data.items,
  }));
}

// ─── Scroll-spy helpers ───────────────────────────────────────────────────────

const SCROLL_THRESHOLD_PX = 24;

/**
 * Scan the scroll container and return the id of the section currently at the top.
 * The last section whose top edge is at or above `SCROLL_THRESHOLD_PX` wins.
 */
function scanVisibleSectionFromDOM(
  container: HTMLElement,
  cats: Category[],
  pkg: Package | undefined
): string | null {
  const containerTop = container.getBoundingClientRect().top;
  let activeId = cats[0]?.id ?? null;

  for (const cat of cats) {
    const el = container.querySelector<HTMLElement>(`#category-${cat.id}`);
    if (!el) {
      continue;
    }
    const top = el.getBoundingClientRect().top - containerTop;
    if (top <= SCROLL_THRESHOLD_PX) {
      activeId = cat.id;
    }
  }

  if (pkg && pkg.items.length > 0) {
    const el = container.querySelector<HTMLElement>("#category-package");
    if (el) {
      const top = el.getBoundingClientRect().top - containerTop;
      if (top <= SCROLL_THRESHOLD_PX) {
        activeId = "package";
      }
    }
  }

  return activeId;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModalSearch({
  className,
  onClear,
  onChange,
  placeholder,
  query,
}: {
  className?: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  query: string;
}) {
  return (
    <div className={className}>
      <InputGroup
        className={cn(
          "h-auto min-h-14 rounded-full border-0 bg-surface-primary shadow-none",
          "has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
        )}
      >
        <InputGroupInput
          aria-label={placeholder}
          className="py-4 pl-8 placeholder:text-text-tertiary"
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type="text"
          value={query}
        />
        <InputGroupAddon align="inline-end" className="pr-6">
          {query.length > 0 ? (
            <Button
              aria-label="Clear search"
              className="text-text-secondary hover:text-text-primary"
              onClick={onClear}
              size="icon-sm"
              variant="text"
            >
              <IconClose className="size-5" />
            </Button>
          ) : (
            <InputGroupText>
              <IconSearch aria-hidden className="size-5 text-text-primary" />
            </InputGroupText>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CategoryTabs({
  activeId,
  categories,
  onSelect,
  packages,
}: {
  activeId: string;
  categories: Category[];
  onSelect: (id: string) => void;
  packages?: Package;
}) {
  return (
    <Tabs
      className="overflow-x-auto [&::-webkit-scrollbar]:hidden"
      onValueChange={(value) => onSelect(value as string)}
      value={activeId}
    >
      <TabsList aria-label="Categories" className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => (
          <TabsTrigger key={cat.id} value={cat.id}>
            {cat.title}
          </TabsTrigger>
        ))}
        {packages && packages.items.length > 0 && (
          <TabsTrigger value="package">
            {packages.items.length > 1 ? "Packages" : "Package"}
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}

function CategorySection({
  category,
  isFirst = false,
  itemGap = "8",
}: {
  category: Category;
  isFirst?: boolean;
  itemGap?: "6" | "8";
}) {
  return (
    <>
      {!isFirst && <Separator aria-hidden />}
      <section className="flex flex-col" id={`category-${category.id}`}>
        <h3 className="subhead-lg mb-6 text-text-primary">{category.title}</h3>
        <div className={cn("flex flex-col", itemGap === "6" ? "gap-6" : "gap-8")}>
          {category.items.map((item) => (
            <div
              className="flex items-baseline justify-between gap-4"
              key={`${category.id}-${item.label}`}
            >
              <span className="body-md flex-1 text-text-primary">{item.label}</span>
              {item.value !== undefined && (
                <span className="body-md basis-1/2 text-right text-text-secondary">
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PackageSection({ packages }: { packages: Package }) {
  return (
    <>
      <Separator aria-hidden />
      <section className="flex flex-col" id="category-package">
        <h3 className="subhead-lg mb-6 text-text-primary">
          {packages.items.length > 1 ? "Packages" : "Package"}
        </h3>
        <div className="flex flex-col gap-10">
          {packages.items.map((pkg) => (
            <div className="flex flex-col" key={pkg.packageName}>
              <p className="subhead-sm mb-4 text-text-primary">{pkg.packageName}</p>
              <ul className="flex flex-col gap-6">
                {pkg.items.map((item) => (
                  <li className="body-md text-text-secondary" key={item.label}>
                    {item.label}
                  </li>
                ))}
              </ul>
              {pkg.footnote && <p className="body-md mt-6 text-text-secondary">{pkg.footnote}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SearchResultsContent({
  categories,
  itemGap,
}: {
  categories: Category[];
  itemGap?: "6" | "8";
}) {
  if (categories.length === 0) {
    return <p className="py-12 text-center text-text-secondary">No results found</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {categories.map((cat, index) => (
        <CategorySection category={cat} isFirst={index === 0} itemGap={itemGap} key={cat.id} />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CategorizedDetailModal({
  categories,
  itemGap = "8",
  packages,
  onOpenChange,
  open,
  searchAliases,
  searchPlaceholder = "Search",
  title,
  trigger,
}: CategorizedModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled (open/onOpenChange passed in) and uncontrolled (trigger-only) modes
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    withVdpViewTransition(() => {
      if (isControlled) {
        onOpenChange?.(nextOpen);
      } else {
        setInternalOpen(nextOpen);
      }
    });
  };

  // Derive a stable view-transition-name from the modal title
  const transitionName = `vdp-${title.toLowerCase().replace(/\s+/g, "-")}-modal`;

  const [activeTabId, setActiveTabId] = useState(categories[0]?.id ?? "");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Memoized corpus that only rebuilds when categories or aliases reference changes
  // This ensures O(log n + m) complexity — no rebuild on every keystroke
  const corpus = useMemo(
    () => buildCorpus(categories, searchAliases, packages),
    [categories, searchAliases, packages]
  );

  // Use the shared Fuse hook (uncontrolled mode — hook owns query state)
  // Now search includes acceptedTerms from aliases
  const { query, setQuery, clearQuery, results, isSearching } = useFuseSearch(corpus, {
    keys: ["label", "value", "acronym", "acceptedTerms"],
    limit: 20,
    threshold: 0.4,
    distance: 100,
    ignoreLocation: true,
    findAllMatches: true,
    minMatchCharLength: 2,
  });

  // Group flat results back into categories for display
  const searchCategories = groupResultsByCategory(results);

  // ─── Scroll spy via callback ref ─────────────────────────────────────────
  // The dialog mounts inside a portal AFTER this component renders. A regular
  // useEffect runs before scrollContainerRef.current is set. A callback ref
  // fires the moment React attaches the DOM node, which is exactly when the
  // dialog opens — so we set up the scroll listener at that point.
  const cleanupRef = useRef<(() => void) | undefined>(undefined);
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const packagesRef = useRef(packages);
  packagesRef.current = packages;

  const computeActiveSection = useCallback((container: HTMLElement): string | null => {
    // When scrolled to the bottom, select the last tab directly.
    // Use a 10px threshold to account for sub-pixel rounding on fractional DPR displays (1.25x, 1.5x).
    const isAtBottom =
      container.scrollHeight > container.clientHeight + 10 &&
      container.scrollTop + container.clientHeight >= container.scrollHeight - 10;

    if (isAtBottom) {
      const pkg = packagesRef.current;
      if (pkg && pkg.items.length > 0) {
        return "package";
      }
      return categoriesRef.current.at(-1)?.id ?? categoriesRef.current[0]?.id ?? null;
    }

    return scanVisibleSectionFromDOM(container, categoriesRef.current, packagesRef.current);
  }, []);

  const scrollContainerCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      scrollContainerRef.current = node;

      if (!node) {
        return;
      }

      const handleScroll = () => {
        if (isScrollingRef.current) {
          return;
        }
        const activeId = computeActiveSection(node);
        if (activeId !== null) {
          setActiveTabId(activeId);
        }
      };

      const rafId = requestAnimationFrame(handleScroll);
      node.addEventListener("scroll", handleScroll, { passive: true });

      cleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        node.removeEventListener("scroll", handleScroll);
      };
    },
    [computeActiveSection]
  );

  // Detach listener on unmount as a safety net
  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    },
    []
  );

  function handleTabSelect(id: string) {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    setActiveTabId(id);
    isScrollingRef.current = true;

    const target = container.querySelector<HTMLElement>(`#category-${id}`);
    if (target) {
      performScroll(container, target);
    } else {
      // Section not yet in DOM — wait one frame then scroll
      requestAnimationFrame(() => {
        const nextTarget = container.querySelector<HTMLElement>(`#category-${id}`);
        if (nextTarget) {
          performScroll(container, nextTarget);
        } else {
          isScrollingRef.current = false;
        }
      });
    }
  }

  function performScroll(container: HTMLElement, target: HTMLElement) {
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const paddingTop = Number.parseFloat(window.getComputedStyle(target).paddingTop) || 0;
    const nextScrollTop = container.scrollTop + (targetRect.top - containerRect.top) + paddingTop;

    // scrollTo may not exist in jsdom — fall back to direct assignment
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top: nextScrollTop, behavior: "smooth" });
    } else {
      container.scrollTop = nextScrollTop;
    }

    // Clear any existing timeout
    if (scrollTimeoutRef.current !== undefined) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Release the lock once smooth scroll settles
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      scrollTimeoutRef.current = undefined;
    }, SCROLL_ANIMATION_DURATION);
  }

  // Cleanup: cancel any pending scroll timeout on unmount
  useEffect(
    () => () => {
      if (scrollTimeoutRef.current !== undefined) {
        clearTimeout(scrollTimeoutRef.current);
      }
    },
    []
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      {trigger ? (
        <div style={{ viewTransitionName: isOpen ? undefined : transitionName }}>
          <DialogTrigger>{trigger}</DialogTrigger>
        </div>
      ) : null}
      <DialogContent
        className="lg:w-full lg:max-w-237.75 lg:pb-0"
        style={{ viewTransitionName: isOpen ? transitionName : undefined }}
      >
        <DialogTopBar className="pt-5 pb-5 md:pb-6">
          <DialogHeader className="mt-0">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        </DialogTopBar>
        <DialogBody className="flex flex-col lg:flex-row lg:gap-18">
          {/* Left nav — vertical on desktop only, hidden on mobile/tablet */}
          <Tabs
            className="hidden shrink-0 lg:flex lg:min-w-40"
            onValueChange={(value) => handleTabSelect(value as string)}
            orientation="vertical"
            value={activeTabId}
          >
            <TabsList aria-label="Categories">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.title}
                </TabsTrigger>
              ))}
              {packages && packages.items.length > 0 && (
                <TabsTrigger value="package">
                  {packages.items.length > 1 ? "Packages" : "Package"}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {/* Right panel — search + content */}
          <div className="flex min-h-0 flex-1 flex-col gap-8">
            {/* Search — desktop only (in right panel) */}
            <ModalSearch
              className="hidden lg:block"
              onChange={setQuery}
              onClear={clearQuery}
              placeholder={searchPlaceholder}
              query={query}
            />

            {/* Horizontal tabs — mobile/tablet only, hidden during search */}
            {!isSearching && (
              <div className="lg:hidden">
                <CategoryTabs
                  activeId={activeTabId}
                  categories={categories}
                  onSelect={handleTabSelect}
                  packages={packages}
                />
              </div>
            )}

            {/* Scrollable content */}
            <div
              className="min-h-0 flex-1 overflow-y-auto pb-20 lg:px-8 lg:pb-8 [&::-webkit-scrollbar]:hidden"
              ref={scrollContainerCallbackRef}
            >
              {isSearching ? (
                <SearchResultsContent categories={searchCategories} itemGap={itemGap} />
              ) : (
                <div className="flex flex-col gap-8">
                  {categories.map((cat, index) => (
                    <CategorySection
                      category={cat}
                      isFirst={index === 0}
                      itemGap={itemGap}
                      key={cat.id}
                    />
                  ))}
                  {packages && packages.items.length > 0 && <PackageSection packages={packages} />}
                </div>
              )}
            </div>
          </div>
        </DialogBody>

        {/* Footer — search pinned to bottom on mobile/tablet, content scrolls behind it */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 grid grid-cols-4 px-5 pb-5 sm:grid-cols-8 lg:hidden">
          <ModalSearch
            className="pointer-events-auto col-span-full sm:col-span-6 sm:col-start-2"
            onChange={setQuery}
            onClear={clearQuery}
            placeholder={searchPlaceholder}
            query={query}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
