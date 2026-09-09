// @vitest-environment node
import { validEditorialContent } from "@features/landing/__fixtures__/valid-editorial-content";
import { editorialContentSchema } from "@features/landing/data/schemas";

describe("editorialContentSchema", () => {
  it("parses a fully valid editorial content object", () => {
    const result = editorialContentSchema.safeParse(validEditorialContent);
    expect(result.success).toBe(true);
  });

  it("fails when heroHeadline is missing", () => {
    const { heroHeadline: _removed, ...withoutHeadline } = validEditorialContent;
    const result = editorialContentSchema.safeParse(withoutHeadline);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toContain("heroHeadline");
    }
  });

  it("fails with too_big when heroHeadline exceeds 120 characters", () => {
    const result = editorialContentSchema.safeParse({
      ...validEditorialContent,
      heroHeadline: "a".repeat(121),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const headlineIssue = result.error.issues.find((issue) => issue.path[0] === "heroHeadline");
      expect(headlineIssue?.code).toBe("too_big");
    }
  });

  it("fails when heroCtaUrl is not a valid URL", () => {
    const result = editorialContentSchema.safeParse({
      ...validEditorialContent,
      heroCtaUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
