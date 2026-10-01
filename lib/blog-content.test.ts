import { expect, it } from "vitest";

it("ships a complete Hebrew SEO content cluster with unique, indexable articles", async () => {
  const module = await import("./blog-content").catch(() => ({}));
  const posts = "fallbackBlogPosts" in module ? module.fallbackBlogPosts : undefined;

  expect(posts).toBeInstanceOf(Array);
  if (!Array.isArray(posts)) return;

  expect(posts).toHaveLength(9);
  expect(posts.map((post) => post.slug)).toEqual(expect.arrayContaining([
    "hair-clipper-importer-israel",
    "wholesale-clippers-for-barbershops",
    "hairdressing-equipment-wholesale-clippers",
    "hair-clippers-for-retailers-and-distributors",
  ]));
  expect(new Set(posts.map((post) => post.slug)).size).toBe(posts.length);
  for (const post of posts) {
    expect(post.indexable).toBe(true);
    expect(post.metaTitle.length).toBeGreaterThan(20);
    expect(post.metaDescription.length).toBeGreaterThan(80);
    expect(post.body).toContain("<h2>");
    expect(post.body).toMatch(/href="\/(shop|compare|contact)/);
    expect(post.faq.length).toBeGreaterThanOrEqual(3);
    expect(post.tags.length).toBeGreaterThanOrEqual(2);
    expect(post.publishedAt).toBeTruthy();
  }
});

it("lets a CRM article override its built-in version without hiding the rest of the cluster", async () => {
  const [{ fallbackBlogPosts }, blogModule] = await Promise.all([
    import("./blog-content"),
    import("./blogs"),
  ]);
  const mergeBlogPosts = "mergeBlogPosts" in blogModule ? blogModule.mergeBlogPosts : undefined;

  expect(mergeBlogPosts).toBeTypeOf("function");
  if (typeof mergeBlogPosts !== "function") return;

  const override = { ...fallbackBlogPosts[0], id: "crm-post", title: "כותרת מעודכנת מה-CRM" };
  const merged = mergeBlogPosts([override], fallbackBlogPosts);

  expect(merged).toHaveLength(9);
  expect(merged.find((post) => post.slug === override.slug)).toMatchObject({ id: "crm-post", title: "כותרת מעודכנת מה-CRM" });
});

it("matches each wholesale article to a distinct high-intent business search", async () => {
  const { fallbackBlogPosts } = await import("./blog-content");
  const byId = (id: string) => fallbackBlogPosts.find((post) => post.id === id);

  expect(byId("hair-clipper-importer-israel")).toMatchObject({ primaryKeyword: "יבואן מכונות תספורת" });
  expect(byId("wholesale-clippers-for-barbershops")).toMatchObject({
    title: expect.stringContaining("מכונות תספורת בסיטונאות"),
    primaryKeyword: "מכונות תספורת בסיטונאות",
  });
  expect(byId("hairdressing-equipment-wholesale-clippers")).toMatchObject({
    title: expect.stringContaining("סיטונאות למספרות"),
    primaryKeyword: "סיטונאות למספרות",
  });
  expect(byId("hair-clippers-for-retailers-and-distributors")).toMatchObject({
    title: expect.stringContaining("מכונות תספורת מקצועיות"),
    primaryKeyword: "מכונות תספורת מקצועיות לספרים",
  });
});
