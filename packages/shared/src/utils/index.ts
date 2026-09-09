/**
 * Shared Utilities
 *
 * Reusable utility functions for common operations across apps.
 *
 * Guidelines:
 * - Keep utilities pure and side-effect free
 * - Use TypeScript generics for flexibility
 * - Document edge cases and return types
 * - Consider tree-shaking (export individual functions)
 */

export { formatCurrency, formatDate, truncate } from "./formatters";
export { capitalize, formatSlugLabel, toCamelCase, toKebabCase } from "./strings";
export { isValidEmail, isValidPhone, isValidURL } from "./validators";
