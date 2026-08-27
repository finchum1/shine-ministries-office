"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";

const websiteLinks = [
  { href: "/website/events", label: "Events" },
  { href: "/website/bible-studies", label: "Bible Studies" },
  { href: "/website/photos", label: "Photos" },
];

export function LeftNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-clay-900/8 bg-white px-4 py-6">
      <Link href="/website/events" className="flex items-center justify-center px-2">
        <Image
          src="/brand/shine-logo.png"
          alt="Shine Ministries"
          width={1000}
          height={517}
          priority
          className="h-12 w-auto"
        />
      </Link>

      <div className="mt-8 flex-1 space-y-6 overflow-y-auto">
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-clay-500">
            Website
          </p>
          <ul className="space-y-0.5">
            {websiteLinks.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-sage/15 text-sage-dark" : "text-clay-700 hover:bg-clay-900/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-clay-500">
            Brand
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/brand"
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/brand")
                    ? "bg-sage/15 text-sage-dark"
                    : "text-clay-700 hover:bg-clay-900/5"
                }`}
              >
                Logos, colors &amp; type
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-clay-900/8 pt-4">
        <SignOutButton />
      </div>
    </nav>
  );
}
