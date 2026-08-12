import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-dark">
      <AuthenticateWithRedirectCallback />
      <p className="mt-2 text-sm text-muted-dark">
        Conectando tu cuenta…
      </p>
    </div>
  );
}
