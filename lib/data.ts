import type { Property } from "./types";
import propertiesData from "@/data/properties.json";

export function getAllProperties(): Property[] {
  return propertiesData as Property[];
}

export function getProperty(id: string): Property | undefined {
  return (propertiesData as Property[]).find((p) => p.property_id === id || p.folder_id === id);
}
