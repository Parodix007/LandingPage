import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ksef, getKsefErpBySlug } from "@/content/ksef";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { KsefErpPage } from "@/components/sections/ksef/KsefErpPage";

// Second dynamic route in this project, after src/app/uslugi/[slug]/page.tsx (docs/superpowers/
// specs/2026-09-09-ksef-product-pages-design.md). generateStaticParams enumerates every
// `KsefErpPage.slug` in `ksef.erps`, so with `output: "export"` + `trailingSlash: true` this
// emits out/ksef/<erp>/index.html per ERP, and the `notFound()` calls below are a type-safety
// net only — they can never actually trigger for a slug this function itself produced. No
// ModalProvider: this page has no case/demo modals, unlike /uslugi/<slug>/.
export function generateStaticParams() {
  return ksef.erps.map((e) => ({ erp: e.slug }));
}

// Next.js 16 passes `params` as a Promise — must be awaited (see node_modules/next/dist/docs/
// 01-app/03-api-reference/04-functions/generate-metadata.md and generate-static-params.md).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ erp: string }>;
}): Promise<Metadata> {
  const { erp } = await params;
  const page = getKsefErpBySlug(erp);
  if (!page) notFound();

  const title = page.metaTitle;
  const description = page.metaDescription;

  // metadataBase is inherited from layout.tsx — do not redeclare it here.
  return {
    title,
    description,
    alternates: { canonical: `/ksef/${page.slug}/` },
    openGraph: {
      title,
      description,
      images: ["/og.png"],
      type: "website",
      url: `/ksef/${page.slug}/`,
    },
  };
}

export default async function KsefErpRoutePage({
  params,
}: {
  params: Promise<{ erp: string }>;
}) {
  const { erp } = await params;
  const page = getKsefErpBySlug(erp);
  if (!page) notFound();

  return (
    <InquiryProvider>
      <KsefErpPage page={page} />
    </InquiryProvider>
  );
}
