"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SignOutButton } from "./SignOutButton";
import { NavIcon, type NavIconName } from "./icons/NavIcons";

type NavLink = { href: string; label: string };
type NavModule = { key: string; label: string; icon: NavIconName; links: NavLink[] };

// Add future modules as another entry here. A module with several pages gets
// a menu (hover or click its row to see what's inside); a module with one
// page is just a link.
const modules: NavModule[] = [
  {
    key: "website",
    label: "Website",
    icon: "website",
    links: [
      { href: "/website/events", label: "Events" },
      { href: "/website/bible-studies", label: "Bible Studies" },
      { href: "/website/serving", label: "Serving Opportunities" },
      { href: "/website/photos", label: "Photos" },
      { href: "/website/content", label: "Content" },
    ],
  },
  {
    key: "leadership",
    label: "Leadership",
    icon: "leadership",
    links: [
      { href: "/roles", label: "Roles" },
      { href: "/small-groups", label: "Small Groups" },
      { href: "/people", label: "People Directory" },
      { href: "/attendance", label: "Attendance" },
    ],
  },
  { key: "merch", label: "Merch", icon: "merch", links: [{ href: "/merch", label: "Orders" }] },
  { key: "brand", label: "Brand", icon: "brand", links: [{ href: "/brand", label: "Logos, colors & type" }] },
  { key: "files", label: "Files", icon: "files", links: [{ href: "/files", label: "All Files" }] },
];

// Set apart at the bottom, above the profile.
const adminModule: NavModule = {
  key: "admin",
  label: "Admin",
  icon: "admin",
  links: [
    { href: "/team", label: "Team logins" },
    { href: "/connections", label: "Bot connections" },
  ],
};

const isActive = (pathname: string, m: NavModule) => m.links.some((l) => pathname.startsWith(l.href));
const hasMenu = (m: NavModule) => m.links.length > 1;

// ---- remembered open/closed state (per browser) -----------------------------

const COLLAPSED_KEY = "officeNavCollapsed";
const listeners = new Set<() => void>();
let memory: boolean | null = null; // fallback when storage is blocked

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readCollapsed() {
  if (memory !== null) return memory;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}
function writeCollapsed(v: boolean) {
  memory = v;
  try {
    localStorage.setItem(COLLAPSED_KEY, v ? "1" : "0");
  } catch {
    /* storage blocked: it just won't be remembered */
  }
  listeners.forEach((l) => l());
}

// ---- small pieces -----------------------------------------------------------

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function Avatar({ avatarUrl, initial, size }: { avatarUrl: string | null; initial: string; size: string }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage/20 text-sm font-semibold text-clay-900`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- small nav avatar, arbitrary user upload
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

// ---- phone drawer: same modules, as expandable groups ------------------------

function MobileModule({
  module,
  pathname,
  defaultOpen,
}: {
  module: NavModule;
  pathname: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const active = isActive(pathname, module);

  if (!hasMenu(module)) {
    return (
      <Link
        href={module.links[0].href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "bg-clay-900/8 text-clay-900" : "text-clay-700 hover:bg-clay-900/5"
        }`}
      >
        <NavIcon name={module.icon} />
        {module.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "text-clay-900" : "text-clay-700"
        } hover:bg-clay-900/5`}
      >
        <NavIcon name={module.icon} />
        <span className="flex-1 text-left">{module.label}</span>
        <ChevronIcon className={`text-clay-400 transition-transform duration-150 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <ul className="ml-[22px] mt-0.5 space-y-0.5 border-l border-clay-900/10 pl-3">
          {module.links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith(l.href)
                    ? "bg-clay-900/8 font-semibold text-clay-900"
                    : "font-medium text-clay-700 hover:bg-clay-900/5"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MobileNavLinks({ pathname }: { pathname: string }) {
  const all = [...modules, adminModule];
  const current = all.find((m) => isActive(pathname, m));
  return (
    <div className="flex min-h-full flex-1 flex-col overflow-y-auto px-3 py-5">
      <div className="space-y-1">
        {modules.map((m) => (
          <MobileModule key={m.key} module={m} pathname={pathname} defaultOpen={current ? m.key === current.key : m.key === "website"} />
        ))}
      </div>
      <div className="mt-auto space-y-1 border-t border-clay-900/8 pt-3">
        <MobileModule module={adminModule} pathname={pathname} defaultOpen={current?.key === "admin"} />
      </div>
    </div>
  );
}

// ---- the sidebar ------------------------------------------------------------

type Pop = { key: string; x: number; y: number; pinned: boolean };

export function LeftNav({
  email,
  name,
  avatarUrl,
}: {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  // Hover or click a module row (open sidebar) or icon (collapsed rail) to see
  // what's inside it: a small menu beside the row. A mouse hovering opens it;
  // a click keeps it open ("pinned") until you click elsewhere or press Escape.
  const [pop, setPop] = useState<Pop | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close drawer + menus on navigation. Adjusted during render (React's
  // recommended pattern for "reset state when a prop changes") rather than
  // in an effect, so it takes effect on the same render as the navigation.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setPop(null);
  }

  // Don't let the page scroll behind the phone drawer while it's open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!pop) return;
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-nav-menu], [data-nav-trigger]")) return;
      setPop(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPop(null);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [pop]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setPop((cur) => (cur?.pinned ? cur : null)), 160);
  };
  const openPop = (key: string, el: HTMLElement, pinned: boolean) => {
    cancelClose();
    const r = el.getBoundingClientRect();
    setPop({ key, x: r.right + 8, y: r.top, pinned });
  };

  const triggerProps = (m: NavModule) => ({
    "data-nav-trigger": "",
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      if (!pop?.pinned) openPop(m.key, e.currentTarget, false);
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => e.pointerType === "mouse" && scheduleClose(),
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      if (!pop?.pinned) openPop(m.key, e.currentTarget, false);
    },
    onBlur: scheduleClose,
  });

  const rowClass = (active: boolean, open: boolean) =>
    `relative flex items-center rounded-xl text-sm font-medium transition-colors ${
      collapsed ? "mx-auto h-11 w-11 justify-center" : "gap-3 px-3 py-2.5"
    } ${
      active || open
        ? "bg-clay-900/8 text-clay-900"
        : "text-clay-700 hover:bg-clay-900/5 hover:text-clay-900"
    }`;

  function renderModule(m: NavModule) {
    const active = isActive(pathname, m);
    const open = pop?.key === m.key;
    const inner = (
      <>
        <NavIcon name={m.icon} />
        {!collapsed && <span className="flex-1 text-left">{m.label}</span>}
        {!collapsed && hasMenu(m) && <ChevronIcon className="text-clay-400" />}
        {active && (
          <span
            aria-hidden="true"
            className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-r-full bg-terracotta-dark"
          />
        )}
      </>
    );

    // A module with one page is a plain link. (In the rail it still shows its
    // name on hover.)
    if (!hasMenu(m)) {
      return (
        <Link
          key={m.key}
          href={m.links[0].href}
          aria-label={m.label}
          aria-current={active ? "page" : undefined}
          className={rowClass(active, open)}
          {...(collapsed ? triggerProps(m) : {})}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        key={m.key}
        type="button"
        aria-label={m.label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${rowClass(active, open)} w-full`}
        {...triggerProps(m)}
        onClick={(e) => {
          if (open && pop?.pinned) setPop(null);
          else openPop(m.key, e.currentTarget, true);
        }}
      >
        {inner}
      </button>
    );
  }

  const popModule = pop ? [...modules, adminModule].find((m) => m.key === pop.key) : null;
  const initial = (name ?? email ?? "?")[0].toUpperCase();
  const display = name || email || "Signed in";

  return (
    <>
      {/* Desktop: permanent full-height sidebar that collapses to an icon rail. */}
      <nav
        style={{ width: collapsed ? 64 : 256 }}
        className="sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-clay-900/8 bg-white transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex"
      >
        <Link
          href="/website/events"
          className={`flex shrink-0 items-center border-b border-clay-900/8 ${
            collapsed ? "justify-center px-2 py-4" : "gap-2.5 px-5 py-5"
          }`}
        >
          {collapsed ? (
            <Image src="/icons/icon-192.png" alt="Shine Ministries" width={36} height={36} className="h-9 w-9 rounded-lg" />
          ) : (
            <>
              <Image
                src="https://www.shineministriesok.com/brand/shine-logo-sea-breeze-dark.png"
                alt="Shine Ministries"
                width={1000}
                height={517}
                priority
                className="h-12 w-auto"
              />
              <span className="h-4 w-px bg-clay-900/15" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-500">Office</span>
            </>
          )}
        </Link>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden py-5 ${collapsed ? "px-2" : "px-3"}`}>
          <div className="flex min-h-full flex-col">
            <div className="space-y-1">{modules.map(renderModule)}</div>
            <div className="mt-auto space-y-1 border-t border-clay-900/8 pt-3">{renderModule(adminModule)}</div>
          </div>
        </div>

        <div className={`shrink-0 border-t border-clay-900/8 ${collapsed ? "flex flex-col items-center gap-2 py-4" : "px-4 py-4"}`}>
          <Link
            href="/settings"
            title={`${display} — your profile`}
            aria-label="Your profile and settings"
            className={`flex items-center gap-3 rounded-lg transition-colors ${
              collapsed ? "" : "-mx-2 px-2 py-1.5"
            } ${settingsActive ? "bg-clay-900/8" : "hover:bg-clay-900/5"}`}
          >
            <Avatar avatarUrl={avatarUrl} initial={initial} size={collapsed ? "h-9 w-9" : "h-10 w-10"} />
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-clay-900">{display}</span>
                <span className="block text-xs font-bold uppercase tracking-wide text-clay-900">Admin</span>
              </span>
            )}
          </Link>
          <div className={collapsed ? "" : "mt-2 pl-0.5"}>
            <SignOutButton iconOnly={collapsed} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setPop(null);
            writeCollapsed(!collapsed);
          }}
          aria-label={collapsed ? "Open the menu" : "Collapse the menu to icons"}
          title={collapsed ? "Open the menu" : "Collapse the menu to icons"}
          className="absolute -right-3 top-[26px] z-40 flex h-6 w-6 items-center justify-center rounded-full border border-clay-900/15 bg-white text-clay-500 shadow-sm transition-colors hover:border-clay-900/30 hover:text-clay-900"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
          >
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* The menu beside a hovered or clicked module. Fixed-position so it
            isn't clipped by the sidebar's own scrolling. */}
        {pop && popModule && (
          <div
            data-nav-menu=""
            role="menu"
            aria-label={popModule.label}
            style={{
              left: pop.x,
              top: Math.max(8, Math.min(pop.y, (typeof window === "undefined" ? 800 : window.innerHeight) - (popModule.links.length * 38 + 56))),
            }}
            onPointerEnter={cancelClose}
            onPointerLeave={(e) => e.pointerType === "mouse" && scheduleClose()}
            className="fixed z-50 min-w-48 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-clay-900/10"
          >
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-clay-500">
              {popModule.label}
            </p>
            {popModule.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith(l.href)
                    ? "bg-clay-900/8 font-semibold text-clay-900"
                    : "font-medium text-clay-700 hover:bg-clay-900/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile / PWA: fixed top bar with a hamburger in the top-right that
          opens a slide-in drawer, instead of a permanent sidebar eating a
          chunk of a phone-width screen. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-clay-900/8 bg-white px-4 md:hidden">
        <Link href="/website/events" className="flex items-center">
          <Image
            src="https://www.shineministriesok.com/brand/shine-logo-sea-breeze-dark.png"
            alt="Shine Ministries"
            width={1000}
            height={517}
            priority
            className="h-8 w-auto"
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
          <div className="absolute inset-0 bg-clay-900/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <nav className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-clay-900/8 px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-500">Office</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-clay-500 transition-colors hover:bg-clay-900/5"
              >
                <CloseIcon />
              </button>
            </div>
            <MobileNavLinks pathname={pathname} />
            <div className="border-t border-clay-900/8 px-5 py-4">
              <Link
                href="/settings"
                className={`-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
                  settingsActive ? "bg-clay-900/8" : "hover:bg-clay-900/5"
                }`}
              >
                <Avatar avatarUrl={avatarUrl} initial={initial} size="h-10 w-10" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-clay-900">{display}</span>
                  <span className="block text-xs font-bold uppercase tracking-wide text-clay-900">Admin</span>
                </span>
              </Link>
              <div className="mt-3">
                <SignOutButton />
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
