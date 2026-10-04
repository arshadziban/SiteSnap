import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-ink">
          <img src={logo} alt="" className="h-9 w-auto" />
          <span className="text-2xl tracking-tight">SiteSnap</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm font-semibold text-muted transition-colors hover:text-primary">
            Capture
          </Link>
          <span className="hidden rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted sm:inline">
            No signup required
          </span>
        </nav>
      </div>
    </header>
  );
}
