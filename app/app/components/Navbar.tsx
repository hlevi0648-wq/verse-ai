"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stake", label: "Stake" },
  { href: "/strategies", label: "Strategies" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Verse <span className="text-blue-400">AI</span>
        </Link>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname === l.href ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}>
              {l.label}
            </Link>
          ))}
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition">
          Connect Wallet
        </button>
      </div>
    </nav>
  );
}