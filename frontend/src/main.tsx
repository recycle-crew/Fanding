import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "@/router";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ConsumptionsProvider } from "@/features/consumptions/ConsumptionsProvider";
import "@/styles/tailwind.css";

const container = document.getElementById("root");
if (!container) throw new Error("缺少 React 掛載入口");
createRoot(container).render(
  <Provider store={store}>
    <ConsumptionsProvider>
      <RouterProvider router={router} />
    </ConsumptionsProvider>
  </Provider>,
);

if (import.meta.env.MODE === "test")
  void import("@/features/workspace/testBridge").then(({ installTestBridge }) =>
    installTestBridge(store),
  );
