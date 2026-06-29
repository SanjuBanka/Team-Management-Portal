import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Default landing → dashboard (guarded by _authenticated layout)
    throw redirect({ to: "/dashboard" });
  },
});
