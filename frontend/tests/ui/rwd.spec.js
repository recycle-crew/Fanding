const { test: base, expect } = require("../test-api.cjs");
const test = base.extend({
  browserErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "RWD 操作不得發生未處理的腳本錯誤").toEqual([]);
    },
    {
      auto: true,
    },
  ],
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

test("RWD Demo Layout 承載子頁並保留工作區", async ({ page }) => {
  await page.goto("/demo/vendors");
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  const sidebar = await page.locator("#sidebar").elementHandle();
  const header = await page.locator(".topbar").elementHandle();
  for (const [module, heading] of [
    ["receipt", "掃碼入庫"],
    ["stocktake-history", "歷史盤點紀錄"],
    ["vendors", "廠商資料維護"],
  ]) {
    if (page.viewportSize().width <= 800)
      await page.locator("#menu-toggle").click();
    await page.locator(`#module-nav [data-module="${module}"]`).click();
    await expect(page.locator("#content h2")).toHaveText(heading);
    await expect(page.locator(".topbar")).toBeVisible();
    expect(
      await sidebar.evaluate(
        (node) => node === document.querySelector("#sidebar"),
      ),
    ).toBe(true);
    expect(
      await header.evaluate(
        (node) => node === document.querySelector(".topbar"),
      ),
    ).toBe(true);
    if (page.viewportSize().width <= 800)
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
    "rwd-small-phone": [480, 481],
    "rwd-phone": [800, 801],
    "rwd-tablet": [900, 901],
    "rwd-desktop": [700, 701, 1000, 1001],
  }[testInfo.project.name];
  const documentPage = testInfo.project.name === "rwd-tablet";
  const boardPage = testInfo.project.name === "rwd-desktop";
  await page.goto(
    documentPage ? "/architecture" : boardPage ? "/board" : "/demo/vendors",
  );
  if (!documentPage && !boardPage) {
    await page.locator("#login-form button[type=submit]").click();
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
      expect(columns).toBe(width <= 900 ? 1 : 2);
    } else if (boardPage) {
      const columns = await page
        .locator(".board-layout")
        .evaluate((node) =>
          getComputedStyle(node).gridTemplateColumns.split(" "),
        );
      expect(columns.length).toBe(width <= 700 ? 1 : 2);
      if (width > 700)
        expect(columns[0]).toBe(width <= 1000 ? "180px" : "215px");
      await expect(page.locator("#page-nav")).toHaveCSS(
        "display",
        width <= 700 ? "flex" : "grid",
      );
    } else if (testInfo.project.name === "rwd-small-phone") {
      const columns = await page
        .locator("#editor-fields")
        .evaluate(
          (node) =>
            getComputedStyle(node).gridTemplateColumns.split(" ").length,
        );
      expect(columns).toBe(width <= 480 ? 1 : 2);
    } else {
      if (width <= 800)
        await expect(page.locator("#menu-toggle")).toBeVisible();
      else await expect(page.locator("#sidebar")).toBeVisible();
      await expect(page.locator("#menu-toggle")).toHaveCSS(
        "display",
        width <= 800 ? "block" : "none",
      );
    }
    await checkResponsiveLayout(page);
    await expect(page).toHaveScreenshot(`tailwind-breakpoint-${width}.png`);
  }
});

test("RWD React 重複代碼錯誤及唯讀說明", async ({ page }) => {
  await page.goto("/demo");
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  await page.locator("#login-form button[type=submit]").click();
  if (page.viewportSize().width <= 800)
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

test("RWD SPA 跨頁切換、錨點與找不到頁面", async ({ page }) => {
  await page.goto("/");
  await page.locator('nav a[href="/architecture"]').click();
  await expect(page.locator(".document-layout")).toBeVisible();
  await checkResponsiveLayout(page);
  await expect(page).toHaveScreenshot("spa-architecture-navigation.png");
  await page.locator('nav a[href="/demo"]').click();
  await expect(page.locator("#login-form")).toBeVisible();
  await checkResponsiveLayout(page);
  await page.goBack();
  await expect(page.locator(".document-layout")).toBeVisible();
  await page.goForward();
  await expect(page.locator("#login-form")).toBeVisible();
  await page.reload();
  await expect(page.locator("#login-form")).toBeVisible();
  await checkResponsiveLayout(page);
  await page.goto("/missing-page");
  await expect(page.getByRole("heading", { name: "找不到頁面" })).toBeVisible();
  await checkResponsiveLayout(page);
  await expect(page).toHaveScreenshot("spa-not-found-rwd.png");
});
async function checkResponsiveLayout(page) {
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
async function enterDemoModule(page, module, privileged = false) {
  await page.goto("/demo");
  await expect(page.locator("#login-form")).toBeVisible();
  if (privileged)
    await page.locator("#demo-permission").selectOption("privileged");
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.locator("#workspace")).toBeVisible();
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`#module-nav [data-module="${module}"]`).click();
  await page.addStyleTag({
    content: "#notice {visibility:hidden !important;}",
  });
}

async function waitForPreviewScene(preview) {
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
        "index.html": "/",
        "architecture.html": "/architecture",
        "board.html": "/board",
        "demo.html": "/demo",
      }[path],
    );
    await expect(
      page.locator(path === "demo.html" ? "#login-form" : "h1"),
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
    if (page.viewportSize().width <= 800) {
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
test("RWD 暫時縮窄視窗後恢復側欄偏好寬度", async ({ page }) => {
  await enterDemoModule(page, "receipt");
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator("#sidebar-drag").press("ArrowRight");
  await page.locator("#sidebar-resize").press("End");
  const viewport = page.viewportSize(),
    width = await page
      .locator("#sidebar")
      .evaluate((element) => element.getBoundingClientRect().width);
  await page.setViewportSize({
    width: 160,
    height: viewport.height,
  });
  await expect
    .poll(() =>
      page
        .locator("#sidebar")
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeLessThan(width);
  await page.setViewportSize(viewport);
  await expect
    .poll(() =>
      page
        .locator("#sidebar")
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBe(width);
  await page.locator("#sidebar-resize").press("ArrowLeft");
  await expect
    .poll(() =>
      page
        .locator("#sidebar")
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBe(width - 20);
  await page.locator("#sidebar-resize").press("ArrowRight");
  await expect
    .poll(() =>
      page
        .locator("#sidebar")
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBe(width);
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "sidebar-preferred-width.png",
  );
});
test("RWD 帳號固定側欄底部且移動縮放後可登出", async ({ page }) => {
  await enterDemoModule(page, "his");
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  const footer = page.locator("#sidebar .sidebar-account");
  await expect(
    page.locator(".topbar #account-label,.topbar #logout"),
  ).toHaveCount(0);
  await expect(footer).toContainText("demo.pharmacy");
  const beforeScroll = await footer.boundingBox();
  await page.locator(".sidebar-body").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await footer.boundingBox(), "功能選單捲動不移動帳號區").toEqual(
    beforeScroll,
  );
  await expect(page.locator("#logout")).toBeInViewport();
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "sidebar-account-fixed.png",
  );
  await page.locator("#sidebar-drag").press("ArrowRight");
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
  await expect(page.locator("#logout")).toBeInViewport();
  await checkResponsiveLayout(page);
  await expect(page.locator("#sidebar")).toHaveScreenshot(
    "sidebar-account-floating.png",
  );
  await page.locator("#logout").click();
  await expect(page.locator("#login")).toBeVisible();
  await expect(page.locator("#workspace")).toBeHidden();
});
test("RWD 長帳號與權限在側欄底部不溢出", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.locator("#login-form")).toBeVisible();
  await page
    .locator('#login-form [name="account"]')
    .fill("pharmacy.inventory.supervisor.long.account");
  await page.locator("#demo-permission").selectOption("privileged");
  await page.locator('#login-form button[type="submit"]').click();
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await expect(page.locator("#account-label")).toContainText("高權限（展示）");
  await page.locator("#sidebar-resize").press("Home");
  const accountBounds = await page.locator("#account-label").boundingBox(),
    sidebarBounds = await page.locator("#sidebar").boundingBox();
  expect(accountBounds.x + accountBounds.width).toBeLessThanOrEqual(
    sidebarBounds.x + sidebarBounds.width,
  );
  await expect(page.locator("#logout")).toBeInViewport();
  await checkResponsiveLayout(page);
  await expect(page.locator(".sidebar-account")).toHaveScreenshot(
    "sidebar-account-long-name.png",
  );
});
test("RWD 導覽點擊與聚焦不得改變文字或項目尺寸", async ({ page }) => {
  await enterDemoModule(page, "overview");
  if (page.viewportSize().width <= 800)
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
    if (page.viewportSize().width <= 800)
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
]) {
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
  await page.goto("/demo");
  await expect(page.locator("#login-form")).toBeVisible();
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
  if (page.viewportSize().width <= 800)
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
  await expect(frame.locator("#login-form")).toBeVisible();
  await expect(page.locator("#player-status")).toHaveText("");
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
      BrowserMultiFormatReader: class {},
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
