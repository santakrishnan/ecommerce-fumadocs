// Discriminated result envelope for a BFF operation.
export type BffResult<TData, TError> =
  | { success: true; data: TData }
  | { success: false; error: TError };
