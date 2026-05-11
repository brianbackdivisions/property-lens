import { getProperty, getAllProperties } from "@/lib/data";
import { notFound } from "next/navigation";
import PropertyDetailClient from "@/components/PropertyDetailClient";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string }>;
}

export async function generateStaticParams() {
  return getAllProperties().map((p) => ({ id: p.property_id }));
}

export default async function PropertyDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { slot } = await searchParams;
  const property = getProperty(id);
  if (!property) notFound();

  return <PropertyDetailClient property={property} initialSlot={slot ?? null} />;
}
