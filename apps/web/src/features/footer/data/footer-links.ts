/**
 * Footer Navigation Links Data
 */

export interface FooterLink {
  external?: boolean;
  href: string;
  label: string;
}

export interface FooterSection {
  links: FooterLink[];
  title: string;
}

export const footerSections: FooterSection[] = [
  {
    title: "Vehicles",
    links: [
      { label: "All Vehicles", href: "/" },
      { label: "Cars & Minivan", href: "/" },
      { label: "Trucks", href: "/" },
      { label: "Crossovers & SUVs", href: "/" },
      { label: "Electrified", href: "/" },
    ],
  },
  {
    title: "Certified Program",
    links: [
      { label: "Program Overview", href: "/" },
      { label: "Warranty & Coverage", href: "/" },
      { label: "Inspection & History", href: "/" },
      { label: "Service Agreements", href: "/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Search Inventory", href: "/" },
      { label: "Local Specials", href: "/" },
      { label: "Financial Tools", href: "/" },
      { label: "Entune®", href: "/" },
      { label: "Safety Recalls & Service Campaigns", href: "/" },
      { label: "FAQ", href: "/" },
    ],
  },
  {
    title: "About Toyota",
    links: [
      { label: "Our Company", href: "/" },
      { label: "Rent a Toyota", href: "/" },
      { label: "Toyota Mobility", href: "/" },
      { label: "Toyota Financial Services", href: "/" },
      { label: "Toyota Certified Canada", href: "/" },
      { label: "Toyota Worldwide", href: "/" },
      { label: "Toyota.com", href: "/" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "YouTube", href: "/", external: true },
      { label: "Instagram", href: "/", external: true },
      { label: "TikTok", href: "/", external: true },
    ],
  },
];
