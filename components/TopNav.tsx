"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Properties", href: "/" },
  { label: "Analytics", href: "/analytics" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-6 flex-shrink-0 z-50">
      <span className="text-[#1976d2] font-semibold text-sm tracking-wide">
        Property Lens
      </span>
      <span className="text-gray-300 text-xs">|</span>
      <nav className="flex gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/property")
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                active
                  ? "bg-blue-50 text-[#1976d2] font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto text-xs text-gray-400">v0 internal demo</div>
    </header>
  );
}
