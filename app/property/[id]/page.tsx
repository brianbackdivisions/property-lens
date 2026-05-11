import { Suspense } from "react";
import { getProperty, getAllProperties } from "@/lib/data";
import { notFound } from "next/navigation";
import PropertyDetailClient from "@/components/PropertyDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllProperties().map((p) => ({ id: p.property_id }));
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) notFound();

  return (
    <Suspense>
      <PropertyDetailClient property={property} />
    </Suspense>
  );
}
