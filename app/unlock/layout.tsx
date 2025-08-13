import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unlock – VEXView",
  description: "Enter passcode to access the app",
};

export default function UnlockLayout({ children }: { children: React.ReactNode }) {
  // Nested layouts must NOT render <html>/<body>; the root layout already does.
  return <>{children}</>;
}
