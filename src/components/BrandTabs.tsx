import Link from "next/link";

export type BrandTab = "shine" | "podcast";

const tabs: { key: BrandTab; label: string; href: string }[] = [
  { key: "shine", label: "Shine Ministries", href: "/brand" },
  { key: "podcast", label: "Podcast", href: "/brand?tab=podcast" },
];

// Plain links (the active tab lives in the URL), so the page stays a server
// component and a tab can be bookmarked or shared.
export function BrandTabs({ active }: { active: BrandTab }) {
  return (
    <nav aria-label="Brand sections" className="flex gap-1 border-b border-clay-900/10">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
              isActive
                ? "border-clay-900 font-semibold text-clay-900"
                : "border-transparent font-medium text-clay-500 hover:text-clay-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
