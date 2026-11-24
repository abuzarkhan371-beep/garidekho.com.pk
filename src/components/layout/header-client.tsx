"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck, Bike, CarFront, ChevronDown, CircleUserRound, Heart, LayoutDashboard,
  LogOut, Menu, Plus, ShieldCheck, Store, Truck, Wrench, X, Newspaper, MessagesSquare,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type HeaderUser = {
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  isVerified: boolean;
  isGuest: boolean;
};

const navItems = [
  { label: "Buy a Car", href: "/cars", menu: [
    { label: "All Cars", href: "/cars" }, { label: "Sedans", href: "/cars?bodyType=SEDAN" },
    { label: "SUVs", href: "/cars?bodyType=SUV" }, { label: "Hatchbacks", href: "/cars?bodyType=HATCHBACK" },
    { label: "Electric Cars", href: "/cars?fuelType=ELECTRIC" },
  ] },
  { label: "Sell a Car", href: "/sell" },
  { label: "Bikes", href: "/bikes" },
  { label: "Auto Parts", href: "/auto-parts" },
  { label: "News & Reviews", href: "/news" },
];

const mobileLinks = [
  { label: "Buy a Car", href: "/cars", icon: CarFront },
  { label: "Sell a Car", href: "/sell", icon: Plus },
  { label: "Bikes", href: "/bikes", icon: Bike },
  { label: "Commercial Vehicles", href: "/commercial-vehicles", icon: Truck },
  { label: "Auto Parts", href: "/auto-parts", icon: Wrench },
  { label: "News & Reviews", href: "/news", icon: Newspaper },
];

export function HeaderClient({ user, logoUrl }: { user: HeaderUser | null; logoUrl?: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const chromeStyle = {
    backgroundColor: "var(--gdk-header)",
    "--gdk-chrome-fg": "var(--gdk-header-fg)",
  } as React.CSSProperties;

  return (
    <header className="gdk-chrome sticky top-0 z-40 w-full border-b border-ink-100 backdrop-blur-md" style={chromeStyle}>
      <div
        className="hidden py-1.5 text-[0.72rem] text-ink-200 lg:block"
        style={{ backgroundColor: "var(--gdk-ink-950-base)" }}
      >
        <div className="container-gdk flex items-center justify-between">
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-orange-400" />
            Pakistan&apos;s verified automotive marketplace — every listing reviewed by our team
          </p>
          <div className="flex items-center gap-5">
            <Link href="/dealers" className="transition-colors hover:text-white">Find a Dealer</Link>
            <Link href="/inspection" className="transition-colors hover:text-white">Car Inspection</Link>
            <Link href="/estimate" className="transition-colors hover:text-white">Car Valuation</Link>
            <Link href="/help" className="transition-colors hover:text-white">Help Center</Link>
          </div>
        </div>
      </div>

      <div className="container-gdk flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <Logo logoUrl={logoUrl} />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {navItems.map((item) =>
            item.menu ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 hover:text-link-soft",
                      pathname.startsWith(item.href) && "text-link-soft",
                    )}
                  >
                    {item.label} <ChevronDown className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Explore cars</DropdownMenuLabel>
                  {item.menu.map((entry) => (
                    <DropdownMenuItem key={entry.href} asChild>
                      <Link href={entry.href}>{entry.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 hover:text-link-soft",
                  (pathname === item.href || pathname.startsWith(`${item.href}/`)) && "text-link-soft",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl border border-ink-200 px-2 py-1.5 transition-colors hover:border-link dark:border-ink-700">
                  <span className="flex size-7 items-center justify-center overflow-hidden rounded-lg bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-200">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt="" className="size-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="hidden max-w-24 truncate text-sm font-semibold xl:block">{user.name}</span>
                  <ChevronDown className="size-3.5 text-ink-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <span className="block text-sm font-semibold text-ink-900 dark:text-white">{user.name}</span>
                  <span className="block truncate text-xs font-normal text-ink-500">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.isGuest ? (
                  <>
                    <DropdownMenuItem asChild><Link href="/my-ads"><CarFront /> My Ads</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/register?claim=1"><CircleUserRound /> Save ads & create account</Link></DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard /> My Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/dashboard/listings"><CarFront /> My Listings</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/saved"><Heart /> Saved Vehicles</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/messages"><MessagesSquare /> Messages</Link></DropdownMenuItem>
                    {user.role === "DEALER" && (
                      <DropdownMenuItem asChild><Link href="/dealer"><Store /> Dealer Portal</Link></DropdownMenuItem>
                    )}
                    {["ADMIN", "SUPER_ADMIN", "MODERATOR", "SUPPORT_AGENT"].includes(user.role) && (
                      <DropdownMenuItem asChild><Link href="/admin"><ShieldCheck /> Admin Panel</Link></DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/dashboard/settings"><CircleUserRound /> Account Settings</Link></DropdownMenuItem>
                  </>
                )}
                <form action="/api/auth/logout" method="post">
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full text-red-600 dark:text-red-400"><LogOut /> Sign out</button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 hover:text-link-soft sm:block">
              Login
            </Link>
          )}

          <Button asChild variant="brand" size="sm" className="ml-1 h-9 gap-1.5 px-3 sm:h-10 sm:px-4">
            <Link href="/sell"><Plus /> <span className="hidden sm:inline">Post an Ad</span><span className="sm:hidden">Post</span></Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="gdk-on-light border-t border-ink-100 bg-white px-4 pb-5 pt-3 lg:hidden dark:border-ink-800 dark:bg-ink-950">
          <nav className="grid grid-cols-2 gap-2" aria-label="Mobile navigation">
            {mobileLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 hover:text-link dark:text-ink-200 dark:hover:bg-ink-800"
              >
                <item.icon className="size-4 text-cta-ink dark:text-cta" /> {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3 dark:border-ink-800">
            <ThemeToggle />
            {user ? (
              <Button asChild variant="outline" className="flex-1"><Link href={user.isGuest ? "/my-ads" : "/dashboard"}>{user.isGuest ? "My Ads" : "My Dashboard"}</Link></Button>
            ) : (
              <>
                <Button asChild variant="outline" className="flex-1"><Link href="/login">Login</Link></Button>
                <Button asChild className="flex-1"><Link href="/register">Register</Link></Button>
              </>
            )}
          </div>
          {user?.isVerified && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-cta-ink dark:text-cta">
              <BadgeCheck className="size-4" /> Your account is verified
            </p>
          )}
        </div>
      )}
    </header>
  );
}
