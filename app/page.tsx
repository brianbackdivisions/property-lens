import { getAllProperties } from "@/lib/data";
import PropertyLibraryClient from "@/components/PropertyLibraryClient";

export default function HomePage() {
  const properties = getAllProperties();
  return <PropertyLibraryClient properties={properties} />;
}
