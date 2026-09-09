const HEADER_ID_PATTERN = /-col-\d+-vin-(.*)$/;

/** Stable, document-unique id for a column header. VIN is recoverable via parseVinFromHeaderId. */
function toColumnHeaderId(input: { tableId: string; columnIndex: number; vin: string }): string {
  return `${input.tableId}-col-${input.columnIndex}-vin-${input.vin}`;
}

/** Inverse of toColumnHeaderId — recovers the embedded VIN, or null when the id does not match. */
function parseVinFromHeaderId(headerId: string): string | null {
  const match = HEADER_ID_PATTERN.exec(headerId);
  return match ? (match[1] ?? null) : null;
}

export { parseVinFromHeaderId, toColumnHeaderId };
