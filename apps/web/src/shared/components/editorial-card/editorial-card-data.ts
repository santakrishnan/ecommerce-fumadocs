/** Serializable editorial card data — icon resolved client-side by name. */
export interface EditorialCardData {
  eyebrow: string;
  headline: string;
  href: string;
  iconName?: "bolt" | "binocular" | "location";
  imageUrl: string;
  matches?: number;
  surface?: "light" | "dark";
}
