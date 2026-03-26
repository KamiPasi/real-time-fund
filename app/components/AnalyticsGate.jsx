'use client';
import Script from 'next/script';
import { getPublicRuntimeEnv } from '../lib/runtimeConfig';

export default function AnalyticsGate({ GA_ID }) {
  const resolvedGaId = GA_ID || getPublicRuntimeEnv('NEXT_PUBLIC_GA_ID');

  if (!resolvedGaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${resolvedGaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${resolvedGaId}');
        `}
      </Script>
    </>
  );
}
