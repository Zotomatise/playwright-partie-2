import { Page } from "playwright/test";

export async function mockBoutique(
  page: Page,
  overrides: Partial<{
    products: Array<{
      id: string;
      title: string;
      handle: string;
      variants: any[];
    }>;
    count: number;
    offset: number;
    limit: number;
    status: number;
    extraHeaders: Record<string, string>;
    errorBody: {
      type: string;
      message: string;
    };
  }> = {},
) {
  const defaults = {
    products: [
      {
        id: "prod_mock_1",
        title: "Mock Product 1",
        handle: "mock-1",
        variants: [],
      },
      {
        id: "prod_mock_2",
        title: "Mock Product 2",
        handle: "mock-2",
        variants: [],
      },
      {
        id: "prod_mock_3",
        title: "Mock Product 3",
        handle: "mock-3",
        variants: [],
      },
    ],
    count: 3,
    offset: 0,
    limit: 12,
    status: 200,
    extraHeaders: {} as Record<string, string>,
  };

  const merged = { ...defaults, ...overrides };
  const { status, extraHeaders, errorBody, ...body } = merged; // ⚡ SÉPARATION CRITIQUE

  const finalBody = errorBody ?? body;

  await page.route("**/store/products?**", async (route) => {
    await route.fulfill({
      status,
      headers: {
        "content-type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(finalBody),
    });
  });
}
