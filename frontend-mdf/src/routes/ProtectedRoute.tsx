import { useEffect } from "react";

function isTokenValid(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("token");
  const valid = !!token && isTokenValid(token);

  useEffect(() => {
    if (!valid) {
      localStorage.clear();

      sessionStorage.setItem("auth_reason", "expired");

      window.location.replace("/");
    }
  }, [valid]);

  if (!valid) return null;

  return <>{children}</>;
}
