import { createRoot } from "react-dom/client";
async function start() {
  const root = createRoot(document.getElementById("root"));
  const page = location.pathname.split("/").at(-1) || "index.html";
  if (page === "demo.html") {
    await import("./demo.css");
    await import("./theme.css");
    const [{ DemoPage }, { DemoProvider }] = await Promise.all([
      import("../features/demo/DemoPage"),
      import("../features/demo/store"),
    ]);
    root.render(
      <DemoProvider>
        <DemoPage />
      </DemoProvider>,
    );
  } else if (page === "board.html") {
    await import("./board.css");
    await import("./theme.css");
    const { BoardPage } = await import("../features/planning/BoardPage");
    root.render(<BoardPage />);
  } else if (page === "architecture.html") {
    const { ArchitecturePage } =
      await import("../features/planning/ArchitecturePage");
    await import("./theme.css");
    root.render(<ArchitecturePage />);
  } else {
    const { PlanningPage } = await import("../features/planning/PlanningPage");
    await import("./theme.css");
    root.render(<PlanningPage />);
  }
}
void start().catch((error) => {
  document.getElementById("root").textContent =
    `畫面載入失敗，請重新整理後重試：${error instanceof Error ? error.message : String(error)}`;
});
