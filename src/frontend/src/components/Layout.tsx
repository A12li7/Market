import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CandlestickChart,
  GraduationCap,
  History,
  Menu,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

const NAV_ITEMS = [
  { to: "/", label: "تحليل الشارت", icon: CandlestickChart, id: "chart" },
  {
    to: "/schools",
    label: "مدارس التحليل",
    icon: GraduationCap,
    id: "schools",
  },
  { to: "/history", label: "سجل التحليلات", icon: History, id: "history" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-subtle">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            data-ocid="nav.brand_link"
            className="flex items-center gap-2.5 transition-smooth hover:opacity-90"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground shadow-glow-primary">
              <CandlestickChart className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight text-foreground">
                تحليل الشارت
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                AI Market Desk
              </span>
            </span>
          </Link>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-ocid={`nav.link.${item.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-smooth",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            data-ocid="nav.menu_toggle"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-10 items-center justify-center rounded-md border border-border text-foreground transition-smooth hover:bg-secondary md:hidden"
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {menuOpen && (
          <nav
            aria-label="التنقل للجوال"
            className="border-t border-border bg-card px-4 py-3 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      data-ocid={`nav.mobile_link.${item.id}`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-smooth",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      <main className="flex-1 bg-background">{children}</main>

      <footer className="border-t border-border bg-muted/40">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-right">
          <p>
            © {new Date().getFullYear()}. صُنع بحب باستخدام{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-muted-foreground/80">
            تحليل فني بالذكاء الاصطناعي — ليس نصيحة استثمارية
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
