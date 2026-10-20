import { Link } from "react-router";
import { BaseButton } from "@/components/ui/BaseButton";

export function NotFound() {
  return (
    <main className="shell route-status">
      <h1>找不到頁面</h1>
      <p>請確認網址，或返回系統規劃。</p>
      <BaseButton asChild>
        <Link to="/">返回系統規劃</Link>
      </BaseButton>
    </main>
  );
}
