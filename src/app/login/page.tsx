import { Suspense } from "react";
import LoginPage from "./LoginForm";
import "../auth.css";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-dark">
          Cargando…
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
