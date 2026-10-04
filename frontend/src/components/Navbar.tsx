import { Camera } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Camera size={18} aria-hidden="true" />
          </span>
          <span className="text-lg">SiteSnap</span>
        </Link>
        <span className="text-sm text-muted">No signup required</span>
      </div>
    </header>
  );
}
