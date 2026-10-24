'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'History', href: '/history' },
  { label: 'Honours', href: '/honours' },
  { label: 'Legends', href: '/legends' },
  { label: 'Matches', href: '/matches' },
  { label: 'Players', href: '/players' },
  { label: 'Seasons', href: '/seasons' },
  { label: 'Records', href: '/records' },
  { label: 'Compare', href: '/compare' },
  { label: 'Transfers', href: '/transfers' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#080808]/95 backdrop-blur-md border-b border-[#3B321F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-8 h-8 border border-[#C9A64B] bg-[#111111] flex items-center justify-center text-xs font-serif font-bold tracking-widest text-[#C9A64B] group-hover:bg-[#C9A64B] group-hover:text-[#080808] transition-colors">
              RM
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg font-bold tracking-[0.18em] text-[#F1EEE7] group-hover:text-[#E6D3A0] transition-colors">
                ROYAL MADRID
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#AAA69C] hidden sm:block">
                Historical &amp; Statistical Archive
              </span>
            </div>
          </Link>

          {/* Desktop Horizontal Navigation (All 10 Primary Sections) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden xl:flex items-center gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-2 text-xs uppercase tracking-[0.14em] font-medium transition-colors relative ${
                    active
                      ? 'text-[#C9A64B]'
                      : 'text-[#AAA69C] hover:text-[#E6D3A0]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C9A64B]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Header Actions: Global Search Icon + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-[#3B321F] hover:border-[#C9A64B] text-[#F1EEE7] hover:text-[#E6D3A0] transition-colors text-xs"
              aria-label="Open Global Archive Search"
            >
              <Search className="w-3.5 h-3.5 text-[#C9A64B]" />
              <span className="hidden sm:inline text-[#AAA69C]">Search</span>
              <kbd className="hidden md:inline-block text-[10px] font-mono text-[#AAA69C] border border-[#3B321F] px-1 bg-[#080808]">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="xl:hidden p-2 bg-[#111111] border border-[#3B321F] text-[#F1EEE7] hover:border-[#C9A64B]"
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-[#C9A64B]" />
              ) : (
                <Menu className="w-5 h-5 text-[#C9A64B]" />
              )}
            </button>
          </div>
        </div>

        {/* Compact Mobile / Tablet Navigation Drawer */}
        {mobileOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="xl:hidden bg-[#111111] border-t border-[#3B321F] px-4 py-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2.5 text-xs uppercase tracking-widest font-mono border ${
                      active
                        ? 'border-[#C9A64B] bg-[#C9A64B]/10 text-[#E6D3A0]'
                        : 'border-[#3B321F] bg-[#171717] text-[#F1EEE7] hover:border-[#C9A64B]/60'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
