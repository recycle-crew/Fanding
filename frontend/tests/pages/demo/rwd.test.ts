import { test as base, expect } from "@playwright/test";
import { DEMO_LOGIN_ENABLED as loginEnabled } from "../../../src/constants/demoAccess";
import type { Page, Locator } from "@playwright/test";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "RWD 操作不得發生未處理的腳本錯誤").toEqual([]);
    },
    {
      auto: true,
    },
  ],
});

test("RWD shadcn 表單、Accordion 與確認視窗鍵盤操作", async ({ page }) => {
  await page.goto("/docs/planning.html#question-activation");
  const question = page.locator("#question-activation");
  await expect(question).toHaveAttribute("open", "");
  const disclosure = question.locator('[data-slot="accordion-trigger"]');
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(question).not.toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(question).toHaveAttribute("open", "");
  await checkResponsiveLayout(page);
  await expect(question).toHaveScreenshot("shadcn-accordion.png");
  await enterDemoModule(page, "vendors", true);
  await expect(page.locator("#search")).toHaveAttribute("data-slot", "input");
  await expect(page.locator("#vendor-status-filter")).toHaveAttribute(
    "data-slot",
    "native-select",
  );
  await expect(page.locator(".list-panel table")).toHaveAttribute(
    "data-slot",
    "table",
  );
  const trigger = page.locator('[data-action="delete"][data-id="V005"]');
  await trigger.click();
  await expect(page.locator("#confirmation")).toBeVisible();
  await expect(page.locator("#confirmation")).toHaveAttribute(
    "data-slot",
    "dialog-content",
  );
  await checkResponsiveLayout(page);
  await expect(page.locator("#confirmation")).toHaveScreenshot(
    "shadcn-dialog.png",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#confirmation")).toBeHidden();
  await expect(trigger).toBeFocused();
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator('[data-module="issue"]').click();
  const selected = page.locator('[data-movement-view][aria-pressed="true"]');
  await expect(selected).toHaveAttribute("data-variant", "default");
  expect(
    await selected.evaluate((element) => {
      const style = getComputedStyle(element);
      return style.color !== style.backgroundColor;
    }),
  ).toBe(true);
  await expect(page.locator(".movement-view-tabs")).toHaveScreenshot(
    "shadcn-selected-filter.png",
  );
});

test("RWD IA_Map 前端組織與 Redux 文件", async ({ page }) => {
  await page.goto("/architecture");
  await expect(page.locator("h1")).toBeVisible();
  const structure = page.locator("#section-3 pre").first();
  await expect(structure).toContainText("Fanding/");
  await expect(structure).toContainText("Redux store");
  await expect(structure).toContainText("Layout.tsx");
  await structure.scrollIntoViewIfNeeded();
  await checkResponsiveLayout(page);
  await expect(structure).toHaveScreenshot(
    "architecture-project-organization.png",
  );
  const otc = page.locator("#section-3 pre").nth(1);
  await expect(otc).toContainText("pages/Otc/Layout.tsx");
  await expect(otc).toContainText("pages/Otc/Receipt.tsx");
  await expect(otc).toContainText("api/server/otc.ts");
  await otc.scrollIntoViewIfNeeded();
  await checkResponsiveLayout(page);
  await expect(otc).toHaveScreenshot("architecture-otc-organization.png");
});

test("RWD Layout 外框與 Home 登入流程及切頁保護", async ({
  page,
}, testInfo) => {
  test.skip(!loginEnabled, "Demo 已暫停登入，沒有登入／登出 UI");
  await page.goto("/vendors");
  await expect(page.locator("#login")).toBeVisible();
  await expect(page.locator("#sidebar")).toBeHidden();
  await expect(page.locator(".topbar")).toBeHidden();
  await page.locator("#login-form [name=account]").fill("layout.user");
  await page.locator("#login-form [name=password]").fill("layout-password");
  if (loginEnabled)
    await page.locator("#demo-permission").selectOption("privileged");
  await checkResponsiveLayout(page);
  await testInfo.attach("layout-home-login", {
    body: await page.screenshot({
      path: testInfo.outputPath("layout-home-login.png"),
    }),
    contentType: "image/png",
  });
  await page.locator("#forgot-password").click();
  await expect(page.locator("#recovery-form [name=account]")).toBeFocused();
  await page.locator("#recovery-form [name=email]").fill("layout@example.test");
  await page.locator("#recovery-form button[type=submit]").click();
  await expect(page.locator("#recovery-result")).toBeVisible();
  await checkResponsiveLayout(page);
  await testInfo.attach("layout-home-recovery", {
    body: await page.screenshot({
      path: testInfo.outputPath("layout-home-recovery.png"),
    }),
    contentType: "image/png",
  });
  await page.locator("#back-to-login").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await expect(page.locator("#login")).toBeHidden();
  await expect(page.locator("#account-label")).toContainText("layout.user");
  await expect(page.locator("#account-label")).toContainText("高權限");
  await page.locator(".topbar").scrollIntoViewIfNeeded();
  await checkResponsiveLayout(page);
  await testInfo.attach("layout-home-workspace", {
    body: await page.screenshot({
      path: testInfo.outputPath("layout-home-workspace.png"),
    }),
    contentType: "image/png",
  });

  // 同一路由再次導覽也應收合手機選單，且不重設 Home 的登入表單。
  if (page.viewportSize().width < 768) {
    await page.locator("#menu-toggle").click();
    await page.locator('#module-nav [data-module="vendors"]').click();
    await expect(page.locator("#menu-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }
  await page.locator("[data-action=add]").click();
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator('#module-nav [data-module="products"]').click();
  await expect(page).toHaveURL(/\/vendors$/);
  await expect(page.locator("#editor")).toBeVisible();
  await expect(page.locator("#notice")).toContainText("請先儲存");
  await checkResponsiveLayout(page);
  await testInfo.attach("layout-home-blocked-navigation", {
    body: await page.screenshot({
      path: testInfo.outputPath("layout-home-blocked-navigation.png"),
    }),
    contentType: "image/png",
  });
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator("#editor [data-close]").first().click();
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator('#module-nav [data-module="products"]').click();
  await expect(page.locator("#content h2")).toHaveText("品項資料維護");
  await page.goBack();
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await page.goForward();
  await expect(page.locator("#content h2")).toHaveText("品項資料維護");
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator("#logout").click();
  await expect(page.locator("#login")).toBeVisible();
  await expect(page.locator("#sidebar")).toBeHidden();
  await expect(page.locator(".topbar")).toBeHidden();
  await expect(page.locator("#login-form [name=account]")).toHaveValue(
    "layout.user",
  );
  await expect(page.locator("#login-form [name=password]")).toHaveValue(
    "layout-password",
  );
  await expect(page.locator("#demo-permission")).toHaveValue("privileged");
  await checkResponsiveLayout(page);
  await testInfo.attach("layout-home-logout", {
    body: await page.screenshot({
      path: testInfo.outputPath("layout-home-logout.png"),
    }),
    contentType: "image/png",
  });
});

test("RWD Demo Layout 承載子頁並保留工作區", async ({ page }) => {
  await page.goto("/vendors");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await expect(page.locator("#workspace > #sidebar")).toBeAttached();
  await expect(
    page.locator("#workspace > .main-shell > header"),
  ).toBeAttached();
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  const sidebar = await page.locator("#sidebar").elementHandle();
  const header = await page
    .locator("#workspace > .main-shell > header")
    .elementHandle();
  for (const [module, heading] of [
    ["receipt", "掃碼入庫"],
    ["stocktake-history", "歷史盤點紀錄"],
    ["vendors", "廠商資料維護"],
  ] as const) {
    if (page.viewportSize().width < 768)
      await page.locator("#menu-toggle").click();
    await page.locator(`#module-nav [data-module="${module}"]`).click();
    await expect(page.locator("#content h2")).toHaveText(heading);
    if (page.viewportSize().width < 768)
      await expect(
        page.locator("#workspace > .main-shell > header"),
      ).toBeVisible();
    else
      await expect(
        page.locator("#workspace > .main-shell > header"),
      ).toBeHidden();
    expect(
      await sidebar.evaluate(
        (node) => node === document.querySelector("#sidebar"),
      ),
    ).toBe(true);
    expect(
      await header.evaluate(
        (node) =>
          node === document.querySelector("#workspace > .main-shell > header"),
      ),
    ).toBe(true);
    if (page.viewportSize().width < 768)
      await expect(page.locator("#menu-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    await checkResponsiveLayout(page);
  }
  await page.locator("[data-action=add]").click();
  await expect(page.locator("#editor")).toBeVisible();
  await page.locator("#editor [data-close]").first().click();
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await checkResponsiveLayout(page);
  await expect(page).toHaveScreenshot("spa-demo-shared-layout.png");
});

test("RWD Tailwind 版面斷點兩側", async ({ page }, testInfo) => {
  const sizes = {
    "rwd-small-phone": [639, 640],
    "rwd-phone": [767, 768],
    "rwd-tablet": [1023, 1024],
    "rwd-desktop": [767, 768, 1023, 1024],
  }[testInfo.project.name];
  const documentPage = testInfo.project.name === "rwd-tablet";
  const boardPage = testInfo.project.name === "rwd-desktop";
  await page.goto(
    documentPage ? "/architecture" : boardPage ? "/board" : "/vendors",
  );
  if (!documentPage && !boardPage) {
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
    await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
    if (testInfo.project.name === "rwd-small-phone") {
      await page.locator("[data-action=add]").click();
      await expect(page.locator("#editor")).toBeVisible();
    }
  } else await expect(page.locator("h1")).toBeVisible();
  if (boardPage)
    for (const preview of await page.locator(".frame-preview iframe").all())
      await waitForPreviewScene(preview);
  for (const width of sizes) {
    await page.setViewportSize({ width, height: 1000 });
    if (documentPage) {
      const columns = await page
        .locator(".document-layout")
        .evaluate(
          (node) =>
            getComputedStyle(node).gridTemplateColumns.split(" ").length,
        );
      expect(columns).toBe(width < 1024 ? 1 : 2);
    } else if (boardPage) {
      const columns = await page
        .locator(".board-layout")
        .evaluate((node) =>
          getComputedStyle(node).gridTemplateColumns.split(" "),
        );
      expect(columns.length).toBe(width < 768 ? 1 : 2);
      if (width >= 768)
        expect(columns[0]).toBe(width < 1024 ? "180px" : "215px");
      await expect(page.locator("#page-nav")).toHaveCSS(
        "display",
        width < 768 ? "flex" : "grid",
      );
    } else if (testInfo.project.name === "rwd-small-phone") {
      const columns = await page
        .locator("#editor-fields")
        .evaluate(
          (node) =>
            getComputedStyle(node).gridTemplateColumns.split(" ").length,
        );
      expect(columns).toBe(width < 640 ? 1 : 2);
    } else {
      if (width < 768) await expect(page.locator("#menu-toggle")).toBeVisible();
      else await expect(page.locator("#sidebar")).toBeVisible();
      await expect(page.locator("#menu-toggle")).toHaveCSS(
        "display",
        width < 768 ? "block" : "none",
      );
    }
    await checkResponsiveLayout(page);
    await expect(page).toHaveScreenshot(`tailwind-breakpoint-${width}.png`);
  }
});

test("RWD React 重複代碼錯誤及唯讀說明", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  await expect(page.locator("#workspace")).toBeVisible();
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator("[data-module=vendors]").click();
  await page.locator("[data-action=add]").click();
  await page.locator("#editor [name=code]").fill("V001");
  await page.locator("#editor [name=name]").fill("版面測試廠商");
  await page.locator("#editor [name=phone]").fill("02-0000-9999");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor-error")).toContainText("已存在");
  await checkResponsiveLayout(page);
  await expect(page).toHaveScreenshot("react-vendor-error-rwd.png");
  await page.locator("#editor [data-close]").first().click();
  await page.locator("[data-action=edit][data-id=V001]").click();
  await page.locator("#editor [name=name]").click();
  await expect(page.locator("#readonly-notice")).toBeVisible();
  await checkResponsiveLayout(page);
  await expect(page).toHaveScreenshot("react-readonly-rwd.png");
});
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
});

test("RWD 靜態文件切換、錨點與找不到頁面", async ({ page }) => {
  await page.goto("/docs/planning.html");
  await expect(page.locator(".shell > header")).toBeVisible();
  await expect(page.locator(".shell > footer")).toBeVisible();
  await page.locator('nav a[href="architecture.html"]').click();
  await expect(page.locator(".document-layout")).toBeVisible();
  await expect(page.locator(".shell > header")).toBeVisible();
  await expect(page.locator(".shell > footer")).toBeVisible();
  await checkResponsiveLayout(page);
  await expect(page).toHaveScreenshot("spa-architecture-navigation.png");
  await page.locator('nav a[href="../"]').click();
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await checkResponsiveLayout(page);
  await page.goBack();
  await expect(page.locator(".document-layout")).toBeVisible();
  await page.goForward();
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await checkResponsiveLayout(page);
  await page.goto("/missing-page");
  await expect(page.getByRole("heading", { name: "找不到頁面" })).toBeVisible();
  await checkResponsiveLayout(page);
  await expect(page).toHaveScreenshot("spa-not-found-rwd.png");
});
test("RWD 舊頁面區預設展開與鍵盤收合保留目前頁面", async ({ page }) => {
  await enterDemoModule(page, "vendors");
  const mobile = page.viewportSize().width < 768;
  if (mobile) await page.locator("#menu-toggle").click();
  const toggle = page.getByRole("button", { name: "舊頁面區", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#legacy-pages-description")).toHaveText(
    "舊版頁面，保留供參考；後續依新規格開發。",
  );
  await expect(page.locator("#module-nav [data-module]")).toHaveCount(10);
  await expect(page.locator("#module-nav .nav-group")).toHaveText([
    "共同管理",
    "HIS 工作區",
    "OTC 工作區",
    "HIS ／ OTC 庫存總覽",
  ]);
  await toggle.scrollIntoViewIfNeeded();
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "legacy-pages-expanded.png",
  );
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#module-nav")).toBeHidden();
  await expect(page).toHaveURL(/\/vendors$/);
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await expect(
    page.locator(loginEnabled ? "#logout" : "#account-label"),
  ).toBeInViewport();
  await expect(page.locator('.demo-banner a[href="/board"]')).toBeVisible();
  await expect(
    page.locator('.demo-banner a[href="/docs/planning.html"]'),
  ).toHaveCount(0);
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "legacy-pages-collapsed.png",
  );
  // 手機外層選單的開關不重設舊頁面區狀態。
  if (mobile) {
    await page.locator("#menu-toggle").click();
    await expect(page.locator("#sidebar")).toBeHidden();
    await page.locator("#menu-toggle").click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#module-nav")).toBeHidden();
  }
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('[data-module="vendors"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.locator('[data-module="products"]').click();
  await expect(page).toHaveURL(/\/products$/);
  if (mobile) {
    await expect(page.locator("#sidebar")).toBeHidden();
    await page.locator("#menu-toggle").click();
  }
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('[data-module="products"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
  await toggle.scrollIntoViewIfNeeded();
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "legacy-pages-reopened.png",
  );
});

test("RWD 舊頁面區所有既有網址可直接開啟", async ({ page }) => {
  for (const [module, path] of [
    ["overview", "/"],
    ["vendors", "/vendors"],
    ["his", "/his"],
    ["products", "/products"],
    ["historical-cost", "/historical-cost"],
    ["receipt", "/receipt"],
    ["issue", "/issue"],
    ["requisitions", "/requisitions"],
    ["stocktake", "/stocktake/current"],
    ["stocktake-history", "/stocktake/history"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(page.locator("#content h2")).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(path);
    if (page.viewportSize().width < 768)
      await page.locator("#menu-toggle").click();
    await expect(page.locator("#legacy-pages-toggle")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(
      page.locator(`#module-nav [data-module="${module}"]`),
    ).toHaveAttribute("aria-current", "page");
    await checkResponsiveLayout(page);
  }
});

async function checkResponsiveLayout(page: Page) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const outside = [
      ...document.querySelectorAll("input,select,button,.panel,.table-wrap"),
    ]
      .filter((element) => {
        if (
          !element.checkVisibility() ||
          element.closest("#canvas-viewport,#page-nav,.table-wrap")
        )
          return false;
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.left < -1 || box.right > width + 1);
      })
      .map(
        (element) => `${element.tagName}#${element.id}.${element.className}`,
      );
    return {
      width,
      documentWidth: document.documentElement.scrollWidth,
      outside,
    };
  });
  expect(
    overflow.documentWidth,
    "整頁不得橫向溢出；表格／畫布應在自己的容器捲動",
  ).toBeLessThanOrEqual(overflow.width + 1);
  expect(overflow.outside, "表單及操作控制不得超出螢幕").toEqual([]);
  for (const table of await page.locator(".table-wrap:visible").all()) {
    expect(
      await table.evaluate((element) => element.clientWidth),
    ).toBeLessThanOrEqual(overflow.width);
    expect(
      await table.evaluate((element) => getComputedStyle(element).overflowX),
    ).toMatch(/auto|scroll/);
    await table.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    const canScroll = await table.evaluate(
      (element) =>
        element.scrollWidth <= element.clientWidth + 1 ||
        element.scrollLeft > 0,
    );
    expect(canScroll, "寬表格的最後一欄必須可透過捲動到達").toBe(true);
    await table.evaluate((element) => {
      element.scrollLeft = 0;
    });
  }
}
async function enterDemoModule(page: Page, module: string, privileged = false) {
  await page.goto("/");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await expect(page.locator("#workspace")).toBeVisible();
  if (privileged) {
    await page.evaluate(() =>
      window.__demoTest.run((state) => {
        state.canEditExistingData = true;
      }),
    );
  }
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator(`#module-nav [data-module="${module}"]`).click();
  await page.addStyleTag({
    content: "#notice {visibility:hidden !important;}",
  });
}

async function waitForPreviewScene(preview: Locator) {
  const scene = new URL(
    await preview.getAttribute("src"),
    "http://127.0.0.1:4173",
  ).searchParams.get("scene");
  const frame = preview.contentFrame();
  await expect(frame.locator("body.preview-mode")).toBeVisible();
  if (scene === "login")
    await expect(frame.locator("#login-form")).toBeVisible();
  else if (scene === "forgot-password")
    await expect(frame.locator("#password-recovery")).toBeVisible();
  else if (
    [
      "vendor-new",
      "vendor-edit",
      "his-edit",
      "requisition-new",
      "requisition-edit",
      "stocktake-edit",
    ].includes(scene)
  )
    await expect(frame.locator("#editor")).toBeVisible();
  else {
    await expect(frame.locator("#workspace")).toBeVisible();
    await expect(frame.locator("#content h2")).not.toBeEmpty();
    if (["receipt-known", "issue-form"].includes(scene))
      await expect(frame.locator("#movement-form")).toBeVisible();
    if (scene === "stocktake-confirm")
      await expect(frame.locator("#confirmation")).toBeVisible();
  }
}
for (const path of [
  "index.html",
  "architecture.html",
  "board.html",
  "demo.html",
]) {
  test(`RWD 網站頁面 ${path}`, async ({ page }) => {
    await page.goto(
      {
        "index.html": "/docs/planning.html",
        "architecture.html": "/architecture",
        "board.html": "/board",
        "demo.html": "/",
      }[path],
    );
    await expect(
      page.locator(path === "demo.html" ? "#workspace" : "h1"),
    ).toBeVisible();
    if (path === "board.html") {
      await expect(page.locator("#page-title")).not.toBeEmpty();
      await waitForPreviewScene(page.locator(".frame-preview iframe").first());
    }
    await checkResponsiveLayout(page);
    await expect(page).toHaveScreenshot(`page-${path}.png`);
    if (path !== "board.html" && path !== "demo.html") {
      for (const section of await page.locator("main section").all()) {
        await section.scrollIntoViewIfNeeded();
        await checkResponsiveLayout(page);
      }
    }
  });
}
for (const module of [
  "overview",
  "vendors",
  "his",
  "products",
  "historical-cost",
  "receipt",
  "issue",
  "requisitions",
  "stocktake",
  "stocktake-history",
]) {
  test(`RWD Demo ${module}`, async ({ page }) => {
    await enterDemoModule(page, module);
    await expect(page.locator("#module-nav button[data-module]")).toHaveCount(
      10,
    );
    await expect(
      page.locator("#module-nav button svg.navigation-icon"),
    ).toHaveCount(0);
    await expect(
      page.locator("#module-nav .nav-group svg.navigation-icon"),
    ).toHaveCount(4);
    await checkResponsiveLayout(page);
    await expect(page.locator("#content")).toHaveScreenshot(
      `module-${module}.png`,
    );
    if (page.viewportSize().width < 768) {
      await page.locator("#menu-toggle").click();
      await expect(page.locator("#sidebar")).toBeVisible();
      await expect(
        page.locator(`#module-nav [data-module="${module}"]`),
      ).toHaveAccessibleName(
        await page
          .locator(`#module-nav [data-module="${module}"] span`)
          .textContent(),
      );
      await page
        .locator(`#module-nav [data-module="${module}"]`)
        .scrollIntoViewIfNeeded();
      expect(
        await page
          .locator(`#module-nav [data-module="${module}"]`)
          .evaluate((button) => {
            const box = button.getBoundingClientRect();
            return Boolean(
              document
                .elementFromPoint(
                  box.left + box.width / 2,
                  box.top + box.height / 2,
                )
                ?.closest("#sidebar"),
            );
          }),
        "手機／平板選單不得被主頁輸入欄遮住",
      ).toBe(true);
      // 切換模組的 focus 可能捲動外頁，固定外頁位置後再截側欄，避免裁切差一像素。
      await page.evaluate(() => window.scrollTo(0, 0));
      await checkResponsiveLayout(page);
      await expect(page.locator("#sidebar")).toHaveScreenshot(
        `navigation-${module}.png`,
      );
    } else {
      await expect(
        page.locator(`#module-nav [data-module="${module}"]`),
      ).toHaveAccessibleName(
        await page
          .locator(`#module-nav [data-module="${module}"] span`)
          .textContent(),
      );
      await expect(page.locator("#sidebar")).toHaveScreenshot(
        `navigation-${module}.png`,
      );
    }
  });
}
test("RWD 歷史成本含多料號入庫快照", async ({ page }) => {
  await enterDemoModule(page, "historical-cost");
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      const voucher = domain.createMovementVoucher(state, "receipt");
      for (const productId of ["O001", "O002"])
        voucher.lines.push({
          productId,
          quantity: 10,
          unitCost: 12.34,
          note: "成本測試",
          filledBy: state.currentAccount,
        });
      domain.submitMovementVoucher(state, voucher);
      undefined;
    }),
  );
  await checkResponsiveLayout(page);
  await expect(page.locator("#content")).toHaveScreenshot(
    "historical-cost-populated.png",
  );
});
for (const module of ["overview", "receipt", "issue"]) {
  test(`RWD 批次查詢 ${module}`, async ({ page }) => {
    await enterDemoModule(page, module);
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => {
        for (const productId of ["O001", "O002"])
          state.movements.push({
            id: state.nextMovementId++,
            voucherId: "20261014001",
            workspace: "OTC",
            productId,
            type: "入庫",
            quantity: 2,
            note: "批次查詢 RWD",
            filledBy: "展示填寫人員",
            time: "2026/10/14 10:00",
            recordedAt: "2026-10-14T02:00:00Z",
          });
        undefined;
      }),
    );
    const form = page.locator(
      module === "overview"
        ? "#overview-movement-filter"
        : module === "receipt"
          ? "#receipt-movement-filter"
          : "#issue-movement-time-filter",
    );
    await form.locator('[name="voucherId"]').fill("20261014001");
    await form.locator('button[type="submit"]').click();
    await expect(
      page.locator(`#${module}-movements-table tbody tr`),
    ).toHaveCount(2);
    await checkResponsiveLayout(page);
    await expect(form.locator("..")).toHaveScreenshot(
      `batch-query-${module}.png`,
    );
  });
}
for (const direction of ["receipt", "issue"]) {
  test(`RWD ${direction} 傳票草稿與整批確認`, async ({ page }) => {
    await enterDemoModule(page, direction);
    await page.locator('[data-action="create-voucher"]').click();
    await page.locator("#barcode").fill("9902000000001");
    await page.locator("#barcode").press("Enter");
    await page.locator('#movement-form [name="quantity"]').fill("3");
    await page.locator('#movement-form [name="note"]').fill("整批傳票 RWD");
    await page.locator('#movement-form button[type="submit"]').click();
    await checkResponsiveLayout(page);
    await expect(page.locator(".voucher-section")).toHaveScreenshot(
      `${direction}-voucher-rwd-draft.png`,
    );
    await page.locator('[data-action="submit-voucher"]').click();
    await checkResponsiveLayout(page);
    await expect(page.locator("#confirmation")).toHaveScreenshot(
      `${direction}-voucher-rwd-confirm.png`,
    );
    await page.locator('#confirmation button[value="confirm"]').click();
    await expect(page.locator(".voucher-section")).toContainText(
      "已送出・鎖定",
    );
    await checkResponsiveLayout(page);
    await expect(page.locator(".voucher-section")).toHaveScreenshot(
      `${direction}-voucher-rwd-locked.png`,
    );
  });
}
test("RWD 側欄移除功能導覽與恢復位置", async ({ page }) => {
  await enterDemoModule(page, "overview");
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await expect(page.locator("#sidebar")).toBeVisible();
  await expect(
    page.locator("#sidebar-drag,#sidebar-reset,.sidebar-controls"),
  ).toHaveCount(0);
  await expect(page.locator("#sidebar .brand")).toBeVisible();
  await expect(page.locator('[data-module="overview"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    page.locator(loginEnabled ? "#logout" : "#account-label"),
  ).toBeInViewport();
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "sidebar-without-position-controls.png",
  );
  await page.locator('[data-module="vendors"]').click();
  await expect(page).toHaveURL(/vendors/);
  if (page.viewportSize().width < 768)
    await expect(page.locator("#sidebar")).toBeHidden();
});

test("RWD 暫時縮窄視窗後恢復側欄偏好寬度", async ({ page }) => {
  await enterDemoModule(page, "receipt");
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator("#sidebar-resize").press("End");
  const viewport = page.viewportSize();
  const preferredWidth = Number(
    await page.locator("#sidebar-resize").getAttribute("aria-valuenow"),
  );
  await page.setViewportSize({ width: 160, height: viewport.height });
  await expect
    .poll(async () =>
      Number(
        await page.locator("#sidebar-resize").getAttribute("aria-valuenow"),
      ),
    )
    .toBeLessThan(preferredWidth);
  await page.setViewportSize(viewport);
  await expect(page.locator("#sidebar-resize")).toHaveAttribute(
    "aria-valuenow",
    String(preferredWidth),
  );
  await page.locator("#sidebar-resize").press("ArrowLeft");
  await expect(page.locator("#sidebar-resize")).toHaveAttribute(
    "aria-valuenow",
    String(preferredWidth - 20),
  );
  await page.locator("#sidebar-resize").press("ArrowRight");
  await expect(page.locator("#sidebar-resize")).toHaveAttribute(
    "aria-valuenow",
    String(preferredWidth),
  );
  if (viewport.width >= 768) {
    await expect
      .poll(() =>
        page
          .locator("#sidebar")
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(preferredWidth);
  } else {
    // 固定側欄在手機展開時使用整個畫面寬度，偏好寬度於桌面才套用。
    await expect
      .poll(() =>
        page
          .locator("#sidebar")
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(viewport.width);
  }
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "sidebar-preferred-width.png",
  );
});
test("RWD 帳號固定側欄底部且縮放後可登出", async ({ page }) => {
  test.skip(!loginEnabled, "Demo 已暫停登入，沒有登入／登出 UI");
  await enterDemoModule(page, "his");
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  const footer = page.locator("#sidebar .sidebar-account");
  await expect(
    page.locator(".topbar #account-label,.topbar #logout"),
  ).toHaveCount(0);
  await expect(footer).toContainText("demo.pharmacy");
  await expect(page.locator("#account-label")).toContainText("一般權限");
  const logout = page.locator("#logout");
  const logoutBounds = await logout.boundingBox();
  expect(logoutBounds.width).toBeGreaterThanOrEqual(44);
  expect(logoutBounds.height).toBeGreaterThanOrEqual(44);
  expect((await footer.boundingBox()).height).toBeLessThanOrEqual(80);
  const beforeScroll = await footer.boundingBox();
  await page.locator(".sidebar-body").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await footer.boundingBox(), "功能選單捲動不移動帳號區").toEqual(
    beforeScroll,
  );
  await expect(
    page.locator(loginEnabled ? "#logout" : "#account-label"),
  ).toBeInViewport();
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "sidebar-account-fixed.png",
  );
  await page.locator("#sidebar-resize").press("Home");
  const sidebarBounds = await page.locator("#sidebar").boundingBox(),
    footerBounds = await footer.boundingBox();
  expect(
    Math.abs(
      sidebarBounds.y +
        sidebarBounds.height -
        footerBounds.y -
        footerBounds.height,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(
    page.locator(loginEnabled ? "#logout" : "#account-label"),
  ).toBeInViewport();
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "sidebar-account-resized.png",
  );
  expect(
    (await page.locator("#account-label > span").first().boundingBox()).height,
    "一般帳號在最窄側欄仍維持單行",
  ).toBe(20);
  await logout.hover();
  await expect(footer).toHaveScreenshot("sidebar-account-hover.png");
  await page.locator(".sidebar-body").hover();
  await logout.focus();
  await expect(logout).toBeFocused();
  await expect(footer).toHaveScreenshot("sidebar-account-keyboard-focus.png");
  await logout.press("Enter");
  await expect(page.locator("#login")).toBeVisible();
  await expect(page.locator("#workspace")).toBeHidden();
});
test("RWD 長帳號與權限在側欄底部不溢出", async ({ page }) => {
  test.skip(!loginEnabled, "Demo 已暫停登入，沒有登入／登出 UI");
  await page.goto("/");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await page
    .locator('#login-form [name="account"]')
    .fill("pharmacy.inventory.supervisor.long.account");
  await page.locator("#demo-permission").selectOption("privileged");
  await expect(page.locator("#workspace")).toBeVisible();
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await expect(page.locator("#account-label")).toContainText("高權限（展示）");
  await page.locator("#sidebar-resize").press("Home");
  const accountBounds = await page.locator("#account-label").boundingBox(),
    sidebarBounds = await page.locator("#sidebar").boundingBox();
  expect(accountBounds.x + accountBounds.width).toBeLessThanOrEqual(
    sidebarBounds.x + sidebarBounds.width,
  );
  const logoutBounds = await page.locator("#logout").boundingBox();
  expect(accountBounds.x + accountBounds.width).toBeLessThanOrEqual(
    logoutBounds.x,
  );
  expect(logoutBounds.width).toBeGreaterThanOrEqual(44);
  expect(logoutBounds.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator("#account-label > span").first()).toHaveText(
    "pharmacy.inventory.supervisor.long.account",
  );
  await expect(
    page.locator(loginEnabled ? "#logout" : "#account-label"),
  ).toBeInViewport();
  await checkResponsiveLayout(page);
  await expect(page.locator(".sidebar-account")).toHaveScreenshot(
    "sidebar-account-long-name.png",
  );
});
test("RWD 帳號列編輯中阻擋登出並可取消後重試", async ({ page }) => {
  test.skip(!loginEnabled, "Demo 已暫停登入，沒有登入／登出 UI");
  await enterDemoModule(page, "vendors");
  await page.locator('[data-action="add"]').click();
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator("#logout").click();
  await expect(page.locator("#editor")).toBeVisible();
  await expect(page.locator("#notice")).toContainText(
    "請先儲存或取消編輯，再登出。",
  );
  await expect(page.locator("#login")).toBeHidden();
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "sidebar-account-blocked-logout.png",
  );
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator("#editor [data-close]").first().click();
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator("#logout").click();
  await expect(page.locator("#login")).toBeVisible();
  await expect(page.locator("#sidebar")).toBeHidden();
});

test("RWD 導覽點擊與聚焦不得改變文字或項目尺寸", async ({ page }) => {
  await enterDemoModule(page, "overview");
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  else {
    await page.locator("#sidebar-resize").press("Home");
    await expect
      .poll(() =>
        page
          .locator("#sidebar")
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(180);
  }
  const initialGeometry = await page
    .locator("#module-nav button")
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect(),
          text = button.querySelector("span").getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          textWidth: text.width,
          textHeight: text.height,
          fontWeight: getComputedStyle(button).fontWeight,
        };
      }),
    );
  for (const module of [
    "vendors",
    "his",
    "products",
    "historical-cost",
    "receipt",
    "issue",
    "requisitions",
    "stocktake",
    "stocktake-history",
    "overview",
  ]) {
    const button = page.locator(`#module-nav [data-module="${module}"]`);
    await button.hover();
    await button.focus();
    const focusedGeometry = await page
      .locator("#module-nav button")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const box = button.getBoundingClientRect(),
            text = button.querySelector("span").getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            textWidth: text.width,
            textHeight: text.height,
            fontWeight: getComputedStyle(button).fontWeight,
          };
        }),
      );
    expect(focusedGeometry, "hover 與 focus 不得改變導覽尺寸").toEqual(
      initialGeometry,
    );
    if (
      ["vendors", "products", "issue", "stocktake", "overview"].includes(module)
    )
      await button.click();
    else await button.press("Enter");
    if (page.viewportSize().width < 768)
      await page.locator("#menu-toggle").click();
    const selectedGeometry = await page
      .locator("#module-nav button")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const box = button.getBoundingClientRect(),
            text = button.querySelector("span").getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            textWidth: text.width,
            textHeight: text.height,
            fontWeight: getComputedStyle(button).fontWeight,
          };
        }),
      );
    expect(selectedGeometry, "選取後不得改變字重、換行或項目尺寸").toEqual(
      initialGeometry,
    );
  }
  await page
    .locator('#module-nav [data-module="overview"]')
    .scrollIntoViewIfNeeded();
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "navigation-stable-states.png",
  );
});
for (const [module, action] of [
  ["vendors", "add"],
  ["vendors", "edit"],
  ["his", "edit"],
  ["products", "add"],
  ["products", "edit"],
  ["requisitions", "add"],
  ["requisitions", "edit"],
] as const) {
  test(`RWD 編輯頁 ${module} ${action}`, async ({ page }) => {
    await enterDemoModule(page, module);
    await page.locator(`[data-action="${action}"]`).first().click();
    await expect(page.locator("#editor")).toBeVisible();
    await checkResponsiveLayout(page);
    await expect(page.locator("#editor")).toHaveScreenshot(
      `editor-${module}-${action}.png`,
    );
    await page.locator("#editor button[type=submit]").scrollIntoViewIfNeeded();
    await expect(page.locator("#editor button[type=submit]")).toBeInViewport();
    await page.locator("#editor [data-close]").last().click();
    await expect(page.locator("#content")).toBeVisible();
  });
}
test("RWD 忘記密碼", async ({ page }) => {
  test.skip(!loginEnabled, "Demo 已暫停登入，沒有登入／登出 UI");
  await page.goto("/");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await page.locator("#forgot-password").click();
  await checkResponsiveLayout(page);
  await expect(page.locator("#password-recovery")).toHaveScreenshot(
    "forgot-password.png",
  );
});
test("RWD 盤點編輯與確認視窗", async ({ page }) => {
  await enterDemoModule(page, "stocktake");
  await page.locator('[data-action="start-batch"]').click();
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator('[data-action="edit-count"]').click();
  await checkResponsiveLayout(page);
  await expect(page.locator("#editor")).toHaveScreenshot(
    "stocktake-editor.png",
  );
  await page.locator('#editor-form [name="actual"]').fill("240");
  await page.locator("#editor-form button[type=submit]").click();
  await page.locator("[data-confirm-count]").check();
  await page.locator('[data-action="submit-batch"]').click();
  await checkResponsiveLayout(page);
  await expect(page.locator("#confirmation")).toHaveScreenshot(
    "stocktake-confirmation.png",
  );
});
test("RWD 歷史更正與唯讀提示視窗", async ({ page }) => {
  await enterDemoModule(page, "stocktake-history", true);
  await page.locator('[data-action="correct-count"]').first().click();
  await checkResponsiveLayout(page);
  await expect(page.locator("#editor")).toHaveScreenshot(
    "history-correction.png",
  );
  await page.locator("#editor [data-close]").last().click();
  if (page.viewportSize().width < 768)
    await page.locator("#menu-toggle").click();
  await page.locator('#module-nav [data-module="products"]').click();
  await page.locator('[data-action="edit"]').first().click();
  await page.locator('#editor-form [name="id"]').click();
  await checkResponsiveLayout(page);
  await expect(page.locator("#readonly-notice")).toHaveScreenshot(
    "readonly-notice.png",
  );
});
test("RWD 流程示範互動視窗", async ({ page }) => {
  await page.goto("/board");
  await page.locator("#start-tour").click();
  await expect(page.locator("#player")).toBeVisible();
  const frame = page.frameLocator("#interactive-demo");
  // 播放器先等待 iframe 的 scene 回覆，再驗證登入畫面，避免把模組下載當成畫面就緒。
  await expect(page.locator("#player-status")).toHaveText("", {
    timeout: 15000,
  });
  await expect(frame.locator("#login-form")).toBeVisible();
  await checkResponsiveLayout(page);
  await expect(page.locator("#player")).toHaveScreenshot("board-player.png");
  const player = page.locator("#player");
  expect(
    await player.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.locator("#close-player").click();
  await expect(player).toBeHidden();
});
for (const category of [
  "login",
  "vendors",
  "his",
  "receipt",
  "issue",
  "requisitions",
  "stocktake",
]) {
  test(`RWD 流程規劃分類 ${category}`, async ({ page }) => {
    await page.goto("/board");
    await page.locator(`[data-page="${category}"]`).click();
    await page.locator("#zoom-fit").click();
    await checkResponsiveLayout(page);
    for (const preview of await page.locator(".frame-preview iframe").all()) {
      await waitForPreviewScene(preview);
    }
    await expect(page.locator(".board-main")).toHaveScreenshot(
      `board-category-${category}.png`,
    );
    await page.locator("#start-tour").click();
    await expect(page.locator("#player-status")).toHaveText("");
    const frame = page.frameLocator("#interactive-demo");
    if (
      page.viewportSize().width < 800 &&
      ["vendors", "his", "requisitions"].includes(category)
    )
      await expect(frame.locator(".demo-banner")).toBeInViewport();
    expect(
      await frame
        .locator("html")
        .evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(1);
    await checkResponsiveLayout(page);
    await expect(page.locator("#player")).toHaveScreenshot(
      `board-player-${category}.png`,
    );
    await page.locator("#close-player").click();
    await expect(page.locator("#player")).toBeHidden();
  });
}
test("RWD 未建檔入庫與相機提示", async ({ page }) => {
  await enterDemoModule(page, "receipt");
  await page.evaluate(() => {
    window.ZXingBrowser = {
      BrowserMultiFormatReader: class {
        async decodeFromStream() {
          return { stop() {} };
        }
      },
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException("", "NotAllowedError");
        },
      },
    });
  });
  await page.locator('[data-action="open-barcode-camera"]').click();
  await expect(page.locator("[data-camera-status]")).toContainText("權限");
  await checkResponsiveLayout(page);
  await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
    "receipt-camera-message.png",
  );
  await page.locator('[data-action="close-barcode-camera"]').click();
  await page.locator("#barcode").fill("0001234567890");
  await page.locator("#barcode").press("Enter");
  await page.locator('[data-action="add-unknown-barcode"]').click();
  await checkResponsiveLayout(page);
  await expect(page.locator("#editor")).toHaveScreenshot(
    "receipt-new-editor.png",
  );
  await page.locator("#editor button[type=submit]").scrollIntoViewIfNeeded();
  await expect(page.locator("#editor button[type=submit]")).toBeInViewport();
});
test("RWD 調整螢幕寬度保留未送出的表單", async ({ page }) => {
  await enterDemoModule(page, "issue");
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator('#movement-form [name="quantity"]').fill("5");
  await page.locator('#movement-form [name="note"]').fill("保留未送出內容");
  for (const width of [320, 390, 480, 700, 768, 800, 1024, 1440]) {
    await page.setViewportSize({
      width,
      height: 900,
    });
    await checkResponsiveLayout(page);
    await expect(page.locator('#movement-form [name="quantity"]')).toHaveValue(
      "5",
    );
    await expect(page.locator('#movement-form [name="note"]')).toHaveValue(
      "保留未送出內容",
    );
  }
  await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
    "resized-form.png",
  );
});
