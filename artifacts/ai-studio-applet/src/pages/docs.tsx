import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { DOCS_DATA } from '@/data/docs-content';
import { Search, Copy, Check, Menu, X, Github, Send, Book } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Docs() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const currentSlug = params.slug || 'overview';
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find current section
  let currentSection = DOCS_DATA[0].items[0];
  let foundCategory = DOCS_DATA[0];
  
  for (const cat of DOCS_DATA) {
    const found = cat.items.find(item => item.id === currentSlug);
    if (found) {
      currentSection = found;
      foundCategory = cat;
      break;
    }
  }

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return DOCS_DATA.flatMap(category =>
      category.items
        .filter(item =>
          `${item.title} ${item.id} ${category.title}`.toLowerCase().includes(query)
        )
        .map(item => ({
          id: item.id,
          title: item.title,
          category: category.title,
        }))
    ).slice(0, 8);
  }, [searchQuery]);

  // Redirect if slug is invalid
  useEffect(() => {
    if (params.slug && currentSection.id !== params.slug) {
      setLocation('/docs/overview', { replace: true });
    }
  }, [params.slug, currentSection.id, setLocation]);

  // Handle intersection observer for TOC
  useEffect(() => {
    if (!currentSection.toc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    const headingElements = currentSection.toc.map((item) =>
      document.getElementById(item.id)
    ).filter(Boolean) as HTMLElement[];

    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, [currentSection]);

  useEffect(() => {
    // Reset mobile menu on navigation
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [currentSlug]);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const openSearchResult = (id: string) => {
    setSearchQuery('');
    setLocation(`/docs/${id}`);
  };

  const handleCopyPageUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-neutral-300 font-sans selection:bg-[#050BE0]/30 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#06080F]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden p-1.5 -ml-1.5 text-neutral-400 hover:text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link href="/" className="flex items-center gap-3 group">
                <img src="/brand/lissa-logo.jpg" alt="Lissa" className="h-7 w-7 rounded border border-white/10 group-hover:border-[#050BE0]/50 transition-colors" />
                <span className="font-sans font-bold text-white tracking-wide uppercase text-lg group-hover:text-[#050BE0] transition-colors">LISSA</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/docs/overview" className="text-white border-b-2 border-[#050BE0] py-5">Docs</Link>
              <Link href="/" className="text-neutral-400 hover:text-white transition-colors py-5">Builder</Link>
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-4 lg:gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Escape') setSearchQuery('');
                  if (event.key === 'Enter' && searchResults[0]) openSearchResult(searchResults[0].id);
                }}
                aria-label="Search documentation"
                placeholder="Search documentation..."
                className="h-9 w-64 rounded-md border border-white/10 bg-[#0A0D16] pl-9 pr-4 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-[#050BE0]/50 focus:ring-1 focus:ring-[#050BE0]/20 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 border border-white/10 rounded px-1.5 py-0.5 bg-white/5">
                <span className="text-[10px] text-neutral-500 font-mono">⌘K</span>
              </div>
              {searchQuery && (
                <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#0A0D16] p-2 shadow-2xl shadow-black/50">
                  {searchResults.length > 0 ? searchResults.map(result => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => openSearchResult(result.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
                    >
                      <span className="text-sm text-neutral-200">{result.title}</span>
                      <span className="ml-4 text-[10px] font-mono text-neutral-600">{result.category}</span>
                    </button>
                  )) : (
                    <div className="px-3 py-5 text-center text-sm text-neutral-500">No documentation found.</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm font-medium text-neutral-400">
              <a href="https://t.me" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 hover:text-white transition-colors">
                <Send className="w-4 h-4" /> Telegram
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 hover:text-white transition-colors">
                <Github className="w-4 h-4" /> GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1400px] w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 border-r border-white/5 py-8 pr-6">
          <div className="sticky top-24 space-y-8">
            <div className="px-2 flex items-center gap-2 text-xs font-mono font-medium text-neutral-500 uppercase tracking-widest">
              <Book className="w-3.5 h-3.5" /> Documentation
            </div>
            
            <nav className="space-y-6">
              {DOCS_DATA.map((category) => (
                <div key={category.id} className="space-y-3">
                  <h4 className="px-2 text-[11px] font-bold text-white uppercase tracking-widest">
                    {category.title}
                  </h4>
                  <div className="flex flex-col space-y-0.5">
                    {category.items.map((item) => {
                      const isActive = currentSlug === item.id;
                      return (
                        <Link 
                          key={item.id} 
                          href={`/docs/${item.id}`}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-md transition-colors",
                            isActive 
                              ? "bg-[#050BE0]/10 text-[#555CFF] font-medium border border-[#050BE0]/20" 
                              : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                          )}
                        >
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-[#06080F]/95 backdrop-blur-xl md:hidden pt-16 border-b border-white/10 overflow-y-auto">
            <div className="p-4 space-y-6 pb-20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Escape') setSearchQuery('');
                    if (event.key === 'Enter' && searchResults[0]) openSearchResult(searchResults[0].id);
                  }}
                  aria-label="Search documentation"
                  placeholder="Search documentation..."
                  className="h-10 w-full rounded-md border border-white/10 bg-[#0A0D16] pl-9 pr-4 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-[#050BE0]/50"
                />
              </div>
              {searchQuery && (
                <div className="space-y-1 rounded-xl border border-white/10 bg-[#0A0D16] p-2">
                  {searchResults.length > 0 ? searchResults.map(result => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => openSearchResult(result.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-white/5"
                    >
                      <span className="text-sm text-neutral-200">{result.title}</span>
                      <span className="ml-4 text-[10px] font-mono text-neutral-600">{result.category}</span>
                    </button>
                  )) : (
                    <div className="px-3 py-5 text-center text-sm text-neutral-500">No documentation found.</div>
                  )}
                </div>
              )}
              <nav className="space-y-6">
                {DOCS_DATA.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <h4 className="px-2 text-[11px] font-bold text-white uppercase tracking-widest">
                      {category.title}
                    </h4>
                    <div className="flex flex-col space-y-1 border-l border-white/10 ml-2 pl-2">
                      {category.items.map((item) => {
                        const isActive = currentSlug === item.id;
                        return (
                          <Link 
                            key={item.id} 
                            href={`/docs/${item.id}`}
                            className={cn(
                              "px-3 py-2 text-sm rounded-md transition-colors",
                              isActive 
                                ? "bg-[#050BE0]/10 text-[#555CFF] font-medium" 
                                : "text-neutral-400 hover:text-white"
                            )}
                          >
                            {item.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 py-8 px-4 md:px-10 lg:px-12 max-w-4xl pb-24">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-mono text-[#050BE0] font-semibold uppercase tracking-wider">
              {foundCategory.title}
            </div>
            <button
              onClick={handleCopyPageUrl}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-[#0A0D16] text-xs text-neutral-400 hover:text-white hover:border-white/20 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy page'}
            </button>
          </div>

          <article className="prose prose-invert prose-blue max-w-none">
            {currentSection.content}
          </article>
        </main>

        {/* Right Sidebar (TOC) */}
        <aside className="hidden xl:block w-64 shrink-0 py-8 pl-6">
          {currentSection.toc && currentSection.toc.length > 0 && (
            <div className="sticky top-24">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Menu className="w-3.5 h-3.5 text-neutral-500" /> On this page
              </h4>
              <nav className="flex flex-col space-y-2.5 text-sm">
                {currentSection.toc.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(heading.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        setActiveHeading(heading.id);
                      }
                    }}
                    className={cn(
                      "transition-colors",
                      activeHeading === heading.id 
                        ? "text-[#555CFF] font-medium" 
                        : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    {heading.title}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
