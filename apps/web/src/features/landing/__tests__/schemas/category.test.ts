// @vitest-environment node
import { validCategory } from "@features/landing/__fixtures__/valid-category";
import { categorySchema } from "@features/landing/data/schemas";

describe("categorySchema", () => {
  it("parses a fully valid category with description present", () => {
    const result = categorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  it("parses a valid category with description omitted", () => {
    const { description: _description, ...withoutDescription } = validCategory;
    const result = categorySchema.safeParse(withoutDescription);
    expect(result.success).toBe(true);
  });

  it("parses a relative href successfully", () => {
    const result = categorySchema.safeParse({ ...validCategory, href: "/vehicles" });
    expect(result.success).toBe(true);
  });

  it("fails when href exceeds 2048 characters", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      href: `/vehicles/${"a".repeat(2040)}`,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const hrefIssue = result.error.issues.find((issue) => issue.path[0] === "href");
      expect(hrefIssue?.code).toBe("too_big");
    }
  });

  it("fails when label is an empty string", () => {
    const result = categorySchema.safeParse({ ...validCategory, label: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const labelIssue = result.error.issues.find((issue) => issue.path[0] === "label");
      expect(labelIssue?.code).toBe("too_small");
    }
  });

  it("fails when imageUrl is not a valid URL", () => {
    const result = categorySchema.safeParse({ ...validCategory, imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const urlIssue = result.error.issues.find((issue) => issue.path[0] === "imageUrl");
      expect(urlIssue).toBeDefined();
    }
  });

  it("fails when imageUrl is missing", () => {
    const { imageUrl: _imageUrl, ...withoutImageUrl } = validCategory;
    const result = categorySchema.safeParse(withoutImageUrl);
    expect(result.success).toBe(false);
    if (!result.success) {
      const urlIssue = result.error.issues.find((issue) => issue.path[0] === "imageUrl");
      expect(urlIssue).toBeDefined();
    }
  });
});
