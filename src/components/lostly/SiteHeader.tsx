import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/find", label: "Find an Item" },
  { to: "/report", label: "Report Found" },
  { to: "/map", label: "Explore Map" },
  { to: "/my-items", label: "My Items" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/safety", label: "Safety" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-brand shadow-glow">
        <span className="h-3 w-3 rounded-full border-2 border-primary-foreground" />
      </span>
      LOSTLY<span className="text-gradient">AI</span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button asChild className="bg-brand shadow-glow hover:opacity-90"><Link to="/find">Find My Item →</Link></Button>
        </div>
        <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-muted-foreground hover:text-foreground">{n.label}</Link>
          ))}
          <Button asChild className="mt-2 w-full bg-brand"><Link to="/find" onClick={() => setOpen(false)}>Find My Item →</Link></Button>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-muted-foreground">Lost it. Show it. Find it.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/demo" className="hover:text-foreground">Live Demo</Link>
          <Link to="/map" className="hover:text-foreground">Map</Link>
          <Link to="/how-it-works" className="hover:text-foreground">How It Works</Link>
          <Link to="/safety" className="hover:text-foreground">Safety & Privacy</Link>
        </div>
        <p className="max-w-xs text-xs text-muted-foreground">LOSTLY AI assists with matching. It does not guarantee ownership or recovery.</p>
      </div>
    </footer>
  );
}
