"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "./SignOutButton";

type NavLink = { href: string; label: string };
type NavSectionConfig = { label: string; links: NavLink[] };

// Add future modules as another entry here — each one gets its own
// collapsible group in the nav, so the sidebar stays navigable as more
// modules are added instead of turning into one long flat list.
const sections: NavSectionConfig[] = [
  {
    label: "Website",
    links: [
      { href: "/website/events", label: "Events" },
      { href: "/website/bible-studies", label: "Bible Studies" },
      { href: "/website/serving", label: "Serving Opportunities" },
      { href: "/website/photos", label: "Photos" },
      { href: "/website/content", label: "Content" },
    ],
  },
  {
    label: "Brand",
    links: [{ href: "/brand", label: "Logos, colors & type" }],
  },
];

function itemClass(active: boolean) {
  return `block rounded-lg px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-clay-900/8 font-semibold text-clay-900"
      : "font-medium text-clay-700 hover:bg-clay-900/5"
  }`;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-3.5 w-3.5 shrink-0 text-clay-400 transition-transform duration-150 ${
        open ? "rotate-90" : ""
      }`}
    >
      <path d="M7.5 4.5a1 1 0 0 1 1.6-.8l5 4.5a1 1 0 0 1 0 1.6l-5 4.5a1 1 0 0 1-1.6-.8V4.5z" />
    </svg>
  );
}

function NavSection({
  section,
  pathname,
  defaultOpen,
}: {
  section: NavSectionConfig;
  pathname: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-clay-500 transition-colors hover:bg-clay-900/5 hover:text-clay-700"
        aria-expanded={open}
      >
        <span>{section.label}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul className="mt-1 space-y-0.5">
          {section.links.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className={itemClass(active)}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function LeftNav({
  email,
  avatarUrl,
}: {
  email: string | null;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const initial = email ? email[0].toUpperCase() : "?";
  const settingsActive = pathname.startsWith("/settings");

  const activeSection = sections.find((s) => s.links.some((l) => pathname.startsWith(l.href)));

  return (
    <nav className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-clay-900/8 bg-white">
      <Link
        href="/website/events"
        className="flex items-center gap-2.5 border-b border-clay-900/8 px-5 py-5"
      >
        <Image
          src="https://www.shineministriesok.com/brand/shine-logo.png"
          alt="Shine Ministries"
          width={1000}
          height={517}
          priority
          className="h-10 w-auto"
        />
        <span className="h-4 w-px bg-clay-900/15" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-500">
          Office
        </span>
      </Link>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <NavSection
            key={section.label}
            section={section}
            pathname={pathname}
            defaultOpen={
              activeSection ? section.label === activeSection.label : section === sections[0]
            }
          />
        ))}
      </div>

      <div className="border-t border-clay-900/8 px-5 py-4">
        <Link
          href="/settings"
          className={`-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
            settingsActive ? "bg-clay-900/8" : "hover:bg-clay-900/5"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage/20 text-sm font-semibold text-sage-dark">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- small nav avatar, arbitrary user upload
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-clay-900">{email ?? "Signed in"}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-terracotta-dark">Admin</p>
          </div>
        </Link>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
