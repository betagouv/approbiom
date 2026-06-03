import { test as base } from "@playwright/test";

const MOCK_PATH = "e2e/mocks/grist-plugin-api.js";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("https://docs.getgrist.com/grist-plugin-api.js", (route) =>
      route.fulfill({ contentType: "application/javascript", path: MOCK_PATH }),
    );
    await use(page);
  },
});

export { expect } from "@playwright/test";
