"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
    label: "Leadership",
    links: [
      { href: "/roles", label: "Roles" },
      { href: "/small-groups", label: "Small Groups" },
      { href: "/people", label: "People Directory" },
    ],
  },
  {
    label: "Brand",
    links: [{ href: "/brand", label: "Logos, colors & type" }],
  },
  {
    label: "Files",
    links: [{ href: "/files", label: "All Files" }],
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

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M2.5 5.5A.75.75 0 0 1 3.25 4.75h13.5a.75.75 0 0 1 0 1.5H3.25A.75.75 0 0 1 2.5 5.5Zm0 4.5A.75.75 0 0 1 3.25 9.25h13.5a.75.75 0 0 1 0 1.5H3.25A.75.75 0 0 1 2.5 10Zm.75 3.75a.75.75 0 0 0 0 1.5h13.5a.75.75 0 0 0 0-1.5H3.25Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 1 0 1.06 1.06L10 11.06l4.72 4.72a.75.75 0 1 0 1.06-1.06L11.06 10l4.72-4.72a.75.75 0 0 0-1.06-1.06L10 8.94 5.28 4.22Z" />
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

function NavLinks({ pathname }: { pathname: string }) {
  const activeSection = sections.find((s) => s.links.some((l) => pathname.startsWith(l.href)));

  return (
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
  );
}

function ProfileFooter({
  email,
  avatarUrl,
  settingsActive,
}: {
  email: string | null;
  avatarUrl: string | null;
  settingsActive: boolean;
}) {
  const initial = email ? email[0].toUpperCase() : "?";

  return (
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
  const settingsActive = pathname.startsWith("/settings");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer on navigation. Adjusted during render (React's
  // recommended pattern for "reset state when a prop changes") rather than
  // in an effect, so it takes effect on the same render as the navigation
  // instead of one tick later.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Don't let the page scroll behind the drawer while it's open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop: permanent full-height sidebar. */}
      <nav className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-clay-900/8 bg-white md:flex">
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
        <NavLinks pathname={pathname} />
        <ProfileFooter email={email} avatarUrl={avatarUrl} settingsActive={settingsActive} />
      </nav>

      {/* Mobile / PWA: fixed top bar with a hamburger in the top-right that
          opens a slide-in drawer, instead of a permanent sidebar eating a
          chunk of a phone-width screen. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-clay-900/8 bg-white px-4 md:hidden">
        <Link href="/website/events" className="flex items-center">
          <Image
            src="https://www.shineministriesok.com/brand/shine-logo.png"
            alt="Shine Ministries"
            width={1000}
            height={517}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-clay-700 transition-colors hover:bg-clay-900/5"
        >
          <HamburgerIcon />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-clay-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <nav className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-clay-900/8 px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-500">
                Office
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-clay-500 transition-colors hover:bg-clay-900/5"
              >
                <CloseIcon />
              </button>
            </div>
            <NavLinks pathname={pathname} />
            <ProfileFooter email={email} avatarUrl={avatarUrl} settingsActive={settingsActive} />
          </nav>
        </div>
      )}
    </>
  );
}
