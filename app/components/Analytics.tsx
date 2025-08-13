"use client";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type Gtag = (...args: unknown[]) => void;
type GTagWindow = Window & { gtag?: Gtag; dataLayer?: unknown[] };

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;
  const gtag: Gtag | undefined = (window as GTagWindow).gtag;
    if (!gtag) return;
    const search = searchParams?.toString();
    const url = pathname + (search ? `?${search}` : "");
    gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
    if (pathname === "/unlock") {
      gtag("event", "unlock_page_impression", {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return (
    GA_ID ? (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          // Disable automatic page view; we handle it on route changes
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
    ) : null
  );
}
