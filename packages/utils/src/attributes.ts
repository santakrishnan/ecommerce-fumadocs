export interface AttributeLike {
  key: string;
  label: string;
  value?: string;
}

export interface CardWithAttributes<TAttribute extends AttributeLike = AttributeLike> {
  attributes?: TAttribute[];
}

export function normalizeAttributeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findAttribute<TAttribute extends AttributeLike>(
  card: CardWithAttributes<TAttribute>,
  candidates: string[]
): TAttribute | undefined {
  const wanted = new Set(candidates.map((candidate) => normalizeAttributeToken(candidate)));

  return card.attributes?.find((attribute) => {
    const keyToken = normalizeAttributeToken(attribute.key);
    const labelToken = normalizeAttributeToken(attribute.label);
    return wanted.has(keyToken) || wanted.has(labelToken);
  });
}

export function getAttributeValue<TAttribute extends AttributeLike>(
  card: CardWithAttributes<TAttribute>,
  candidates: string[]
): string | undefined {
  return findAttribute(card, candidates)?.value;
}
