import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Home, 
  FolderOpen, 
  LayoutTemplate, 
  Activity, 
  Settings, 
  Search,
  Terminal, 
  Wallet, 
  LogOut, 
  Network, 
  ArrowUp, 
  Coins, 
  Plus, 
  X,
  Clock,
  Copy,
  Check,
  ExternalLink
  ,Import,
  ArrowRight,
  FileArchive,
  Table2,
  Box,
  PlugZap,
  ChevronDown,
  Github,
  Grid2X2,
  List,
  Cloud,
  HardDrive,
  SlidersHorizontal,
  GitBranch
} from "lucide-react";
import { requireGitHubConnection } from '@/lib/github-oauth';
import { robinhoodChain } from '@/lib/web3';
import { cn } from '@/lib/utils';
import type { ProjectSession } from '@/pages/lissa-app';
import { useListProjects, getListProjectsQueryKey } from '@workspace/api-client-react';
import WorkspaceSettings, { applyWorkspacePreferences, readWorkspacePreferences } from './workspace-settings';

const TEMPLATES = [
  { id: 'lumina', title: 'Lumina Interactive List', category: 'Interactive Gallery', description: 'Cinematic image slider with GSAP text reveals and Three.js shader transitions.', image: 'https://cdn.21st.dev/assets/mirror/b2/b26ed9367c41626c7e61d837f0ea11cdaa3148a499e6bee171176886c8959950.jpg' },
  { id: 'performance', title: 'Built for Intelligent Performance', category: 'Marketing', description: 'Paper-gray stage with an LED-dot masthead, motion background, and glass metric cards.', image: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/5c3ec08f-2dbf-4c0a-8588-f6106a789443.webp' },
  { id: 'oceanpulse', title: 'OceanPulse Hero', category: 'Nonprofit', description: 'Ocean-conservation hero with aerial reef media and a responsive editorial layout.', image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260831_224622_4eeb9d43-9e46-4483-9530-1eb4ef4c942d.png&w=1920&q=85' },
  { id: 'heritage', title: 'Heritage Grove Footer', category: 'Editorial Footer', description: 'Full-viewport footer over a hand-drawn teal mountain-and-lake landscape.', image: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4f690bd1-881a-4192-82f2-d714d34c8fb9.png' },
  { id: 'junglemind', title: 'JungleMind AI Hero', category: 'AI Product', description: 'Launch experience set in a sunlit glasshouse jungle with a frosted prompt card.', image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260831_223518_f11bfa03-4e65-47e1-a4a7-30e42a7a8c2f.png&w=1920&q=85' },
  { id: 'nexeus', title: 'Nexeus Future Builder', category: 'Agency', description: 'Painted alpine panorama with future-building copy and a translucent glass footer.', image: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp' },
];

export default function BuilderHome({
  onGenerate,
  onResume,
  onImportProject,
  projects,
  walletProps,
  creditStatus,
  isCreditStatusLoading,
  onClaimCredits,
  isClaimingCredits,
}: {
  onGenerate: (prompt: string, files?: File[]) => void;
  onResume: (projectId: string) => void;
  onImportProject: (title: string, files: Record<string, string>) => void;
  projects: ProjectSession[];
  walletProps: any;
  creditStatus: any;
  isCreditStatusLoading: boolean;
  onClaimCredits: () => void;
  isClaimingCredits: boolean;
}) {
  const [surface, setSurface] = useState<'home' | 'projects' | 'templates' | 'import' | 'integrations' | 'activity' | 'credits' | 'settings'>(() => {
    const requestedSurface = new URLSearchParams(window.location.search).get('surface');
    const validSurfaces = new Set(['home', 'projects', 'templates', 'import', 'integrations', 'activity', 'credits', 'settings']);
    return validSurfaces.has(requestedSurface || '')
      ? requestedSurface as 'home' | 'projects' | 'templates' | 'import' | 'integrations' | 'activity' | 'credits' | 'settings'
      : readWorkspacePreferences().startupSurface;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof TEMPLATES)[number] | null>(null);
  const [templatePrompt, setTemplatePrompt] = useState('');
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState('');
  const [repos, setRepos] = useState<Array<{ fullName: string; description?: string; private?: boolean }>>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoVisibility, setRepoVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [integrationSearch, setIntegrationSearch] = useState('');
  const [integrationCategory, setIntegrationCategory] = useState('All');
  const [repositoryFilter, setRepositoryFilter] = useState<'all' | 'local' | 'synced' | 'published'>('all');
  const [repositorySort, setRepositorySort] = useState<'updated' | 'created' | 'name'>('updated');
  const [repositoryView, setRepositoryView] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    address, isConnected, chainId, disconnect, switchChain, isSwitching, open
  } = walletProps;

  const isCorrectChain = chainId === robinhoodChain.id;
  const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
  const canBuild = Boolean(prompt.trim() || files.length);

  useEffect(() => {
    applyWorkspacePreferences(readWorkspacePreferences());
  }, []);

  const openTemplate = async (template: (typeof TEMPLATES)[number]) => {
    setSelectedTemplate(template);
    setTemplatePrompt('');
    setPromptCopied(false);
    setIsTemplateLoading(true);
    try {
      const response = await fetch(`/api/templates/${template.id}/prompt`);
      if (!response.ok) throw new Error('Prompt unavailable');
      setTemplatePrompt(await response.text());
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const copyTemplatePrompt = async () => {
    if (!templatePrompt) return;
    await navigator.clipboard.writeText(templatePrompt);
    setPromptCopied(true);
    window.setTimeout(() => setPromptCopied(false), 1600);
  };

  const openGithubImport = async () => {
    setGithubOpen(true);
    setGithubLoading(true);
    setGithubError('');
    setRepoSearch('');
    setRepoVisibility('all');
    try {
      const response = await fetch('/api/github/repos');
      if (await requireGitHubConnection(response)) return;
      if (!response.ok) throw new Error('Unable to load repositories');
      setRepos(await response.json());
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : 'Unable to load repositories');
    } finally {
      setGithubLoading(false);
    }
  };

  const importGithubRepository = async (fullName: string) => {
    setGithubLoading(true);
    setGithubError('');
    try {
      const response = await fetch(`/api/github/import/${fullName}`);
      if (await requireGitHubConnection(response)) return;
      if (!response.ok) throw new Error('Repository import failed');
      const data = await response.json() as { files: Record<string, string> };
      onImportProject(fullName, data.files);
      setGithubOpen(false);
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : 'Repository import failed');
    } finally {
      setGithubLoading(false);
    }
  };

  const { data: serverProjects = [], isLoading: isServerProjectsLoading } = useListProjects(
    { walletAddress: address || '' },
    { query: { enabled: !!address, queryKey: getListProjectsQueryKey({ walletAddress: address || '' }) } }
  );

  const mergedProjects = useMemo(() => {
    const map = new Map();
    serverProjects.forEach(p => {
      map.set(p.id, {
        id: p.id,
        title: p.title,
        createdAt: new Date(p.createdAt).getTime(),
        updatedAt: new Date(p.updatedAt).getTime(),
        published: p.published,
        isLocal: false,
        isSynced: true
      });
    });
    projects.forEach(p => {
      const existing = map.get(p.id);
      map.set(p.id, {
        id: p.id,
        title: p.app?.appName || p.app?.title || p.prompt.slice(0, 30) + '...',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        published: existing?.published || false,
        isLocal: true,
        isSynced: !!existing
      });
    });
    return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [projects, serverProjects]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return mergedProjects
      .filter(project => {
        if (query && !project.title.toLowerCase().includes(query)) return false;
        if (repositoryFilter === 'local') return project.isLocal;
        if (repositoryFilter === 'synced') return project.isSynced;
        if (repositoryFilter === 'published') return project.published;
        return true;
      })
      .sort((a, b) => {
        if (repositorySort === 'name') return a.title.localeCompare(b.title);
        if (repositorySort === 'created') return b.createdAt - a.createdAt;
        return b.updatedAt - a.updatedAt;
      });
  }, [mergedProjects, repositoryFilter, repositorySort, searchQuery]);

  const repositoryStats = useMemo(() => ({
    total: mergedProjects.length,
    local: mergedProjects.filter(project => project.isLocal).length,
    synced: mergedProjects.filter(project => project.isSynced).length,
    published: mergedProjects.filter(project => project.published).length,
  }), [mergedProjects]);

  const visibleGithubRepos = useMemo(() => {
    const query = repoSearch.trim().toLowerCase();
    return repos.filter(repo => {
      if (query && !`${repo.fullName} ${repo.description || ''}`.toLowerCase().includes(query)) return false;
      if (repoVisibility === 'private') return Boolean(repo.private);
      if (repoVisibility === 'public') return !repo.private;
      return true;
    });
  }, [repoSearch, repoVisibility, repos]);

  const activities = useMemo(() => {
     const events: Array<{id: string, projectId: string, title: string, type: 'created' | 'updated' | 'published', timestamp: number}> = [];
     mergedProjects.forEach(p => {
       events.push({ id: `${p.id}-created`, projectId: p.id, title: p.title, type: 'created', timestamp: p.createdAt });
       if (p.updatedAt > p.createdAt + 1000) {
         events.push({ id: `${p.id}-updated`, projectId: p.id, title: p.title, type: 'updated', timestamp: p.updatedAt });
       }
       if (p.published) {
         events.push({ id: `${p.id}-published`, projectId: p.id, title: p.title, type: 'published', timestamp: p.updatedAt }); 
       }
     });
     return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [mergedProjects]);

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-6 py-12">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <div className="space-y-3 mb-2">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#050BE0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#050BE0] shadow-[0_0_8px_rgba(5,11,224,0.8)]" />
            Lissa builder
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.035em] text-white">What do you want to build?</h2>
          <p className="max-w-xl text-sm leading-6 text-neutral-400">
            Describe the product, experience, and interactions you have in mind. Lissa will plan the architecture, build the project, review its quality, and open it in your live workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-white/5 py-3 text-[11px] text-neutral-500">
          <span>
            Builds today <strong className="ml-1 font-medium text-neutral-200">{isCreditStatusLoading ? '—' : creditStatus?.unlimited ? 'Unlimited' : creditStatus?.freeBuildsRemaining ?? 0}</strong>
          </span>
          <span>
            Balance <strong className="ml-1 font-medium text-neutral-200">{isCreditStatusLoading ? '—' : (creditStatus?.creditBalance ?? 0).toFixed(2)}</strong>
          </span>
          <span>
            Claimable <strong className="ml-1 font-medium text-neutral-200">{isCreditStatusLoading ? '—' : (creditStatus?.claimableCredit ?? 0).toFixed(2)}</strong>
          </span>
          <button
            type="button"
            onClick={() => setSurface('credits')}
            className="ml-auto font-medium text-[#050BE0] transition-colors hover:text-[#151BEF]"
            data-testid="button-open-credits"
          >
            Manage credits
          </button>
        </div>
  
        <div className="bg-[#05070e] border border-white/10 rounded-xl p-4 shadow-sm focus-within:border-[#050BE0]/40 focus-within:ring-1 focus-within:ring-[#050BE0]/20 transition-all">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canBuild) {
                  onGenerate(prompt.trim() || 'Use the attached files as reference.', files);
                  setFiles([]);
                }
              }
            }}
            placeholder="e.g. Build a CRM dashboard with a sidebar, data tables, and a dark theme..."
            className="w-full bg-transparent resize-none outline-none text-sm text-neutral-200 placeholder:text-neutral-600 min-h-[120px]"
            data-testid="input-prompt"
          />
          
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5 mt-2">
              {files.map((file, index) => (
                <span key={`${file.name}-${index}`} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-neutral-300">
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button onClick={() => setFiles(current => current.filter((_, i) => i !== index))} className="hover:text-white" data-testid={`button-remove-file-${index}`}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
  
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                const next = Array.from(e.target.files || []).filter(f => f.size <= 10_000_000);
                setFiles(current => [...current, ...next].slice(0, 5));
                e.target.value = '';
              }} />
              <button onClick={() => fileInputRef.current?.click()} className="text-neutral-400 hover:text-white p-1.5 rounded-md hover:bg-white/5 transition-colors" data-testid="button-attach-file">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                if (canBuild) {
                  onGenerate(prompt.trim() || 'Use the attached files as reference.', files);
                  setFiles([]);
                }
              }}
              disabled={!canBuild}
              className="px-5 py-2 bg-[#050BE0] hover:bg-[#151BEF] disabled:bg-white/5 disabled:text-neutral-500 disabled:border disabled:border-white/5 text-white text-xs font-semibold rounded-md flex items-center gap-2 transition-all shadow-sm"
              data-testid="button-build"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Build Context
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#676cff]">
            <GitBranch className="h-3.5 w-3.5" />
            Source workspace
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Repository</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-500">Manage local sessions, synced projects, published builds, and GitHub imports from one workspace.</p>
        </div>
        <button
          onClick={() => void openGithubImport()}
          className="flex h-9 items-center justify-center gap-2 bg-[#050BE0] px-4 text-[11px] font-medium text-white transition-colors hover:bg-[#171df0]"
          data-testid="button-import-github"
        >
          <Github className="h-3.5 w-3.5" />
          Import repository
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 border border-white/[0.08] bg-[#05070e] lg:grid-cols-4">
        {[
          { label: 'All projects', value: repositoryStats.total, icon: FolderOpen, filter: 'all' as const },
          { label: 'Local sessions', value: repositoryStats.local, icon: HardDrive, filter: 'local' as const },
          { label: 'Cloud synced', value: repositoryStats.synced, icon: Cloud, filter: 'synced' as const },
          { label: 'Published', value: repositoryStats.published, icon: ExternalLink, filter: 'published' as const },
        ].map((stat, index) => (
          <button
            key={stat.label}
            onClick={() => setRepositoryFilter(stat.filter)}
            className={cn(
              'group p-4 text-left transition-colors sm:p-5',
              index % 2 === 0 ? 'border-r border-white/[0.06]' : '',
              index < 2 ? 'border-b border-white/[0.06] lg:border-b-0' : '',
              index < 3 ? 'lg:border-r' : '',
              repositoryFilter === stat.filter ? 'bg-[#050BE0]/10' : 'hover:bg-white/[0.025]',
            )}
          >
            <div className="flex items-center justify-between">
              <stat.icon className={cn('h-4 w-4', repositoryFilter === stat.filter ? 'text-[#676cff]' : 'text-neutral-600 group-hover:text-neutral-400')} />
              {repositoryFilter === stat.filter && <span className="h-1.5 w-1.5 rounded-full bg-[#676cff]" />}
            </div>
            <div className="mt-4 text-xl font-semibold text-white">{stat.value}</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-neutral-600">{stat.label}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 border-y border-white/[0.07] py-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
          <input
            type="text"
            placeholder="Search repositories and projects"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="h-9 w-full border border-white/[0.08] bg-[#05070e] pl-9 pr-4 text-[11px] text-white outline-none transition-colors placeholder:text-neutral-650 focus:border-[#555cff]/60"
            data-testid="input-search-projects"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 items-center gap-2 border border-white/[0.08] bg-[#05070e] px-3">
            <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-600" />
            <select
              value={repositorySort}
              onChange={event => setRepositorySort(event.target.value as 'updated' | 'created' | 'name')}
              className="bg-transparent text-[10px] text-neutral-300 outline-none"
              aria-label="Sort repositories"
            >
              <option value="updated">Recently updated</option>
              <option value="created">Recently created</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="flex h-9 border border-white/[0.08] bg-[#05070e] p-1">
            <button
              onClick={() => setRepositoryView('grid')}
              className={cn('flex h-7 w-7 items-center justify-center', repositoryView === 'grid' ? 'bg-white/10 text-white' : 'text-neutral-600 hover:text-neutral-300')}
              aria-label="Grid view"
            >
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setRepositoryView('list')}
              className={cn('flex h-7 w-7 items-center justify-center', repositoryView === 'list' ? 'bg-white/10 text-white' : 'text-neutral-600 hover:text-neutral-300')}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {isServerProjectsLoading && !mergedProjects.length ? (
        <div className="flex min-h-64 flex-1 items-center justify-center border border-white/[0.07] bg-[#05070e] text-xs text-neutral-500">Syncing repository…</div>
      ) : filteredProjects.length ? (
        repositoryView === 'grid' ? (
          <div className="grid grid-cols-1 gap-3 pb-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map(project => (
              <article key={project.id} className="group flex min-h-52 flex-col border border-white/[0.075] bg-[#05070e] p-5 transition-colors hover:border-[#555cff]/35 hover:bg-[#070914]" data-testid={`row-project-${project.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-white/10 bg-[#090c15]">
                    <FolderOpen className="h-4 w-4 text-neutral-400" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {project.isSynced && <span className="border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[8px] font-medium uppercase tracking-wider text-emerald-300">Synced</span>}
                    {project.published && <span className="border border-[#676cff]/20 bg-[#050BE0]/10 px-2 py-1 text-[8px] font-medium uppercase tracking-wider text-[#8b8fff]">Published</span>}
                    {project.isLocal && !project.isSynced && <span className="border border-white/10 bg-white/[0.03] px-2 py-1 text-[8px] font-medium uppercase tracking-wider text-neutral-500">Local</span>}
                  </div>
                </div>
                <h3 className="mt-5 truncate text-sm font-semibold text-neutral-100 transition-colors group-hover:text-white">{project.title}</h3>
                <p className="mt-2 text-[10px] leading-5 text-neutral-600">{project.isSynced ? 'Stored locally and synchronized with your Lissa workspace.' : 'Available in this browser as a local build session.'}</p>
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/[0.06] pt-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-neutral-650">
                      <Clock className="h-3 w-3" />
                      Last modified
                    </div>
                    <div className="mt-1.5 text-[10px] text-neutral-400">{new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <button
                    onClick={() => onResume(project.id)}
                    className="flex h-8 items-center gap-2 border border-white/10 px-3 text-[10px] font-medium text-neutral-300 transition-colors hover:border-[#555cff]/40 hover:bg-[#050BE0]/10 hover:text-white"
                    data-testid={`button-resume-${project.id}`}
                  >
                    {project.isLocal ? 'Resume' : 'Open'}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden border border-white/[0.08] bg-[#05070e]">
            <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] bg-black/20 px-5 py-3 text-[9px] font-medium uppercase tracking-wider text-neutral-600 md:grid">
              <div className="col-span-5">Repository</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3">Modified</div>
              <div className="col-span-1 text-right">Open</div>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {filteredProjects.map(project => (
                <div key={project.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-white/[0.02] md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-5" data-testid={`row-project-${project.id}`}>
                  <div className="col-span-5 flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/10 bg-[#090c15]"><FolderOpen className="h-3.5 w-3.5 text-neutral-400" /></div>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-medium text-neutral-200">{project.title}</div>
                      <div className="mt-1 truncate font-mono text-[9px] text-neutral-650">{project.id}</div>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 pl-11 md:pl-0">
                    <span className={cn('h-1.5 w-1.5 rounded-full', project.isSynced ? 'bg-emerald-400' : 'bg-neutral-600')} />
                    <span className="text-[10px] text-neutral-400">{project.isSynced ? 'Synced workspace' : 'Local session'}</span>
                    {project.published && <ExternalLink className="h-3 w-3 text-[#676cff]" />}
                  </div>
                  <div className="col-span-3 pl-11 text-[10px] text-neutral-500 md:pl-0">{new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => onResume(project.id)} className="flex h-7 w-7 items-center justify-center border border-white/10 text-neutral-500 hover:border-[#555cff]/40 hover:text-white" data-testid={`button-resume-${project.id}`}><ArrowRight className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="flex min-h-64 flex-1 flex-col items-center justify-center border border-dashed border-white/[0.09] bg-[#05070e]/60 px-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center border border-white/10 bg-white/[0.025]"><FolderOpen className="h-5 w-5 text-neutral-600" /></div>
          <h3 className="mt-4 text-sm font-medium text-neutral-300">No matching repositories</h3>
          <p className="mt-2 max-w-sm text-[10px] leading-5 text-neutral-600">Adjust the search or status filter, or import source from your connected GitHub account.</p>
          <button onClick={() => void openGithubImport()} className="mt-5 flex h-8 items-center gap-2 border border-white/10 px-3 text-[10px] text-neutral-300 hover:bg-white/[0.04]">
            <Github className="h-3 w-3" /> Import from GitHub
          </button>
        </div>
      )}
    </div>
  );

  const renderTemplates = () => (
    <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto px-6 py-10 overflow-y-auto">
      <div className="mb-8 space-y-2">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#050BE0]">Curated builds</div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Build from a visual reference</h2>
        <p className="max-w-xl text-sm leading-6 text-neutral-500">Explore production-grade compositions, inspect the complete prompt, copy it, or send it directly to Lissa.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-8">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => void openTemplate(t)}
            className="group overflow-hidden rounded-lg border border-white/10 bg-[#05070e] text-left transition-colors hover:border-[#050BE0]/50"
            data-testid={`card-template-${t.id}`}
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-[#090b12]">
              <img src={t.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-sm border border-white/15 bg-black/55 px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-white/80 backdrop-blur-md">{t.category}</span>
              <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-neutral-100">{t.title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-neutral-500">{t.description}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${selectedTemplate.title} prompt`}>
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#05070e] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#050BE0]">{selectedTemplate.category}</div>
                <h3 className="mt-1 text-base font-semibold text-white">{selectedTemplate.title}</h3>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-white/5 hover:text-white" aria-label="Close template" data-testid="button-close-template"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid min-h-0 flex-1 md:grid-cols-[0.9fr_1.1fr]">
              <div className="min-h-52 overflow-hidden border-b border-white/10 bg-black md:border-b-0 md:border-r">
                <img src={selectedTemplate.image} alt={`${selectedTemplate.title} preview`} className="h-full w-full object-cover" />
              </div>
              <div className="flex min-h-0 flex-col p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Complete prompt</span>
                  <button onClick={() => void copyTemplatePrompt()} disabled={!templatePrompt} className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 hover:text-white disabled:opacity-40" data-testid="button-copy-template">
                    {promptCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {promptCopied ? 'Copied' : 'Copy prompt'}
                  </button>
                </div>
                <textarea readOnly value={isTemplateLoading ? 'Loading complete prompt…' : templatePrompt} className="min-h-64 flex-1 resize-none rounded-md border border-white/10 bg-[#02040a] p-4 font-mono text-[11px] leading-5 text-neutral-400 outline-none" data-testid="template-prompt" />
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setSelectedTemplate(null)} className="h-9 rounded-md border border-white/10 px-4 text-xs font-medium text-neutral-400 hover:bg-white/5 hover:text-white">Cancel</button>
                  <button
                    onClick={() => {
                      setPrompt(templatePrompt);
                      setSelectedTemplate(null);
                      setSurface('home');
                    }}
                    disabled={!templatePrompt}
                    className="h-9 rounded-md bg-[#050BE0] px-4 text-xs font-semibold text-white hover:bg-[#151BEF] disabled:opacity-40"
                    data-testid="button-use-template"
                  >
                    Use this template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-6 py-10">
      <h2 className="text-lg font-medium text-white mb-8">Event Log</h2>
      
      <div className="space-y-6">
        {activities.length > 0 ? activities.map(event => (
          <div key={event.id} className="flex gap-4 group" data-testid={`row-activity-${event.id}`}>
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-[#05070e] border border-white/10 flex items-center justify-center shrink-0 z-10">
                 {event.type === 'created' && <Plus className="w-3 h-3 text-emerald-400" />}
                 {event.type === 'updated' && <Activity className="w-3 h-3 text-[#050BE0]" />}
                 {event.type === 'published' && <Network className="w-3 h-3 text-purple-400" />}
              </div>
              <div className="w-px flex-1 bg-white/5 my-1 group-last:hidden" />
            </div>
            <div className="pb-6">
              <div className="text-[13px] text-neutral-300">
                <span className="font-medium text-white">{event.title}</span> was {event.type}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                {new Date(event.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-sm text-neutral-500">No activity recorded.</div>
        )}
      </div>
    </div>
  );

  const importProviders = [
    { id: 'github', name: 'GitHub', description: 'Import a repository from your connected GitHub account.', logo: 'https://cdn.simpleicons.org/github/ffffff', active: true },
    { id: 'bitbucket', name: 'Bitbucket', description: 'Import an existing repository or application.', logo: 'https://cdn.simpleicons.org/bitbucket/2684FF' },
    { id: 'figma', name: 'Figma Design', description: 'Turn an existing product design into a live application.', logo: 'https://cdn.simpleicons.org/figma' },
    { id: 'generated-project', name: 'Generated project', description: 'Migrate an existing AI-generated project into Lissa.', logo: '/brand/lissa-logo.jpg' },
    { id: 'bolt', name: 'Bolt', description: 'Continue an existing prototype inside the Lissa workspace.', logo: '/brand/integrations/bolt.png' },
    { id: 'base44', name: 'Base44', description: 'Migrate an application and continue building with Lissa.', logo: '/brand/integrations/base44.png' },
    { id: 'vercel', name: 'Vercel', description: 'Import a deployed project or source repository.', logo: 'https://cdn.simpleicons.org/vercel/ffffff' },
    { id: 'spreadsheet', name: 'Spreadsheet', description: 'Create an application from structured tabular data.', icon: Table2 },
    { id: 'zip', name: 'ZIP file', description: 'Upload and import an existing project archive.', icon: FileArchive },
    { id: 'empty', name: 'Empty project', description: 'Start with an unconfigured source workspace.', icon: Box },
  ];

  const renderImport = () => (
    <div className="flex flex-1 flex-col w-full max-w-5xl mx-auto px-6 py-10 overflow-y-auto">
      <div className="mb-8">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#050BE0]">Bring your work</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Import to Lissa</h2>
        <p className="mt-2 text-sm text-neutral-500">Migrate source, designs, and data from another product into your Lissa workspace.</p>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {importProviders.map(provider => {
          const ProviderIcon = provider.icon;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={provider.active ? () => void openGithubImport() : undefined}
              disabled={!provider.active}
              className={cn(
                'group flex min-h-16 items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors',
                provider.active
                  ? 'border-white/10 bg-[#070910] hover:border-[#050BE0]/55 hover:bg-white/[0.025]'
                  : 'cursor-not-allowed border-white/[0.055] bg-[#05070e] opacity-55'
              )}
              data-testid={`import-${provider.id}`}
            >
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.035]">
                {provider.logo ? <img src={provider.logo} alt={`${provider.name} logo`} className="h-4.5 w-4.5 max-h-[18px] max-w-[18px] object-contain" /> : ProviderIcon ? <ProviderIcon className="h-4 w-4 text-neutral-300" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-100">{provider.name}</span>
                  {!provider.active && <span className="text-[8px] font-medium uppercase tracking-wider text-neutral-600">Coming soon</span>}
                </div>
                <p className="mt-1 truncate text-[10px] text-neutral-500">{provider.description}</p>
              </div>
              <ArrowRight className={cn('h-3.5 w-3.5 shrink-0', provider.active ? 'text-neutral-500 group-hover:text-white' : 'text-neutral-700')} />
            </button>
          );
        })}
      </div>

      {githubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Import from GitHub">
          <div className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden border border-white/10 bg-[#05070e] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.035]"><Github className="h-4 w-4 text-neutral-200" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Import from GitHub</h3>
                  <p className="mt-0.5 text-[10px] text-neutral-500">{githubLoading ? 'Reading the connected account…' : `${repos.length} repositories available`}</p>
                </div>
              </div>
              <button onClick={() => setGithubOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-white/5 hover:text-white" aria-label="Close GitHub import"><X className="h-4 w-4" /></button>
            </div>
            {!githubLoading && !githubError && (
              <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
                  <input
                    value={repoSearch}
                    onChange={event => setRepoSearch(event.target.value)}
                    placeholder="Search name or description"
                    className="h-9 w-full border border-white/[0.08] bg-[#02040a] pl-9 pr-3 text-[10px] text-white outline-none placeholder:text-neutral-650 focus:border-[#555cff]/60"
                    autoFocus
                  />
                </div>
                <div className="flex h-9 border border-white/[0.08] bg-[#02040a] p-1">
                  {(['all', 'public', 'private'] as const).map(visibility => (
                    <button
                      key={visibility}
                      onClick={() => setRepoVisibility(visibility)}
                      className={cn('px-3 text-[9px] font-medium capitalize transition-colors', repoVisibility === visibility ? 'bg-white/10 text-white' : 'text-neutral-600 hover:text-neutral-300')}
                    >
                      {visibility}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="min-h-48 overflow-y-auto p-2">
              {githubLoading ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 text-xs text-neutral-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#676cff]" />
                  Loading repositories…
                </div>
              ) : githubError ? (
                <div className="m-3 border border-red-500/20 bg-red-500/5 p-4">
                  <div className="text-xs font-medium text-red-300">GitHub repositories unavailable</div>
                  <p className="mt-1 text-[10px] leading-5 text-red-200/50">{githubError}</p>
                  <button onClick={() => void openGithubImport()} className="mt-3 h-8 border border-red-400/20 px-3 text-[10px] text-red-200">Try again</button>
                </div>
              ) : visibleGithubRepos.length ? visibleGithubRepos.map(repo => (
                <button key={repo.fullName} onClick={() => void importGithubRepository(repo.fullName)} className="group flex w-full items-center gap-3 border-b border-white/[0.05] px-3 py-3 text-left last:border-b-0 hover:bg-white/[0.035]" data-testid={`github-repo-${repo.fullName}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/[0.08] bg-[#090c15]"><Github className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-300" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-neutral-200">{repo.fullName}</div>
                    <div className="mt-1 truncate text-[10px] text-neutral-600">{repo.description || 'No repository description'}</div>
                  </div>
                  <span className={cn('border px-2 py-1 text-[8px] uppercase tracking-wider', repo.private ? 'border-amber-400/15 bg-amber-400/[0.05] text-amber-300/70' : 'border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300/70')}>{repo.private ? 'Private' : 'Public'}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-700 group-hover:text-[#676cff]" />
                </button>
              )) : (
                <div className="flex h-48 flex-col items-center justify-center text-center">
                  <Github className="h-5 w-5 text-neutral-700" />
                  <div className="mt-3 text-xs text-neutral-400">No repositories match this view</div>
                  <button onClick={() => { setRepoSearch(''); setRepoVisibility('all'); }} className="mt-2 text-[10px] text-[#676cff]">Clear filters</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const integrations = [
    { id: 'github', name: 'GitHub', category: 'Developer tools', description: 'Manage repositories, issues, pull requests, and source imports.', logo: 'https://cdn.simpleicons.org/github/ffffff', active: true },
    { id: 'gitlab', name: 'GitLab', category: 'Developer tools', description: 'Manage projects, repositories, issues, and merge requests.', logo: 'https://cdn.simpleicons.org/gitlab' },
    { id: 'bitbucket', name: 'Bitbucket', category: 'Developer tools', description: 'Connect repositories, pipelines, issues, and workspaces.', logo: 'https://cdn.simpleicons.org/bitbucket/2684FF' },
    { id: 'linear', name: 'Linear', category: 'Developer tools', description: 'Read and manage product issues, projects, and cycles.', logo: 'https://cdn.simpleicons.org/linear/ffffff' },
    { id: 'jira', name: 'Jira', category: 'Developer tools', description: 'Work with Jira projects, issues, boards, and workflows.', logo: 'https://cdn.simpleicons.org/jira/2684FF' },
    { id: 'slack', name: 'Slack', category: 'Communication', description: 'Read and send workspace messages through the Slack Web API.', logo: 'https://cdn.simpleicons.org/slack' },
    { id: 'discord', name: 'Discord', category: 'Communication', description: 'Connect communities, channels, messages, and server workflows.', logo: 'https://cdn.simpleicons.org/discord/5865F2' },
    { id: 'twilio', name: 'Twilio', category: 'Communication', description: 'Send SMS and build voice or messaging experiences.', logo: 'https://cdn.simpleicons.org/twilio/F22F46' },
    { id: 'resend', name: 'Resend', category: 'Communication', description: 'Send transactional and marketing emails from your application.', logo: 'https://cdn.simpleicons.org/resend/ffffff' },
    { id: 'airtable', name: 'Airtable', category: 'Productivity', description: 'List, retrieve, create, update, and delete structured records.', logo: 'https://cdn.simpleicons.org/airtable' },
    { id: 'notion', name: 'Notion', category: 'Productivity', description: 'Work with pages, databases, blocks, and workspace content.', logo: 'https://cdn.simpleicons.org/notion/ffffff' },
    { id: 'asana', name: 'Asana', category: 'Productivity', description: 'Manage tasks, projects, workspaces, and team workflows.', logo: 'https://cdn.simpleicons.org/asana/F06A6A' },
    { id: 'calendly', name: 'Calendly', category: 'Productivity', description: 'Manage scheduling links, event types, and invitees.', logo: 'https://cdn.simpleicons.org/calendly/006BFF' },
    { id: 'google-drive', name: 'Google Drive', category: 'Cloud storage', description: 'Access documents, files, folders, and shared drives.', logo: 'https://cdn.simpleicons.org/googledrive' },
    { id: 'dropbox', name: 'Dropbox', category: 'Cloud storage', description: 'Manage files, folders, sharing, and team content.', logo: 'https://cdn.simpleicons.org/dropbox/0061FF' },
    { id: 'box', name: 'Box', category: 'Cloud storage', description: 'Manage cloud files, folders, users, and webhooks.', logo: 'https://cdn.simpleicons.org/box/0061D5' },
    { id: 'stripe', name: 'Stripe', category: 'Payments', description: 'Manage payments, customers, subscriptions, and invoices.', logo: 'https://cdn.simpleicons.org/stripe/635BFF' },
    { id: 'shopify', name: 'Shopify', category: 'Payments', description: 'Build storefronts and manage catalog, inventory, and orders.', logo: 'https://cdn.simpleicons.org/shopify/7AB55C' },
    { id: 'revenuecat', name: 'RevenueCat', category: 'Payments', description: 'Manage mobile subscriptions, entitlements, and purchases.', logo: 'https://cdn.simpleicons.org/revenuecat/F25A5A' },
    { id: 'openai', name: 'OpenAI', category: 'AI and media', description: 'Use language, vision, speech, and image generation models.', logo: 'https://cdn.simpleicons.org/openai/ffffff' },
    { id: 'anthropic', name: 'Anthropic', category: 'AI and media', description: 'Build agent and generation workflows with Claude models.', logo: 'https://cdn.simpleicons.org/anthropic/D4A27F' },
    { id: 'gemini', name: 'Google Gemini', category: 'AI and media', description: 'Use Gemini models for multimodal AI applications.', logo: 'https://cdn.simpleicons.org/googlegemini/8E75B2' },
    { id: 'replicate', name: 'Replicate', category: 'AI and media', description: 'Run and manage hosted AI model predictions.', logo: 'https://cdn.simpleicons.org/replicate/ffffff' },
    { id: 'postgresql', name: 'PostgreSQL', category: 'Data and analytics', description: 'Connect applications to relational data and SQL workflows.', logo: 'https://cdn.simpleicons.org/postgresql/4169E1' },
    { id: 'snowflake', name: 'Snowflake', category: 'Data and analytics', description: 'Query and operate on cloud warehouse data.', logo: 'https://cdn.simpleicons.org/snowflake/29B5E8' },
    { id: 'databricks', name: 'Databricks', category: 'Data and analytics', description: 'Work with lakehouse data, SQL warehouses, and analytics.', logo: 'https://cdn.simpleicons.org/databricks/FF3621' },
    { id: 'youtube', name: 'YouTube', category: 'Marketing and social', description: 'Interact with videos, channels, playlists, and publishing.', logo: 'https://cdn.simpleicons.org/youtube/FF0000' },
    { id: 'mailchimp', name: 'Mailchimp', category: 'Marketing and social', description: 'Manage audiences, campaigns, templates, and reports.', logo: 'https://cdn.simpleicons.org/mailchimp/FFE01B' },
    { id: 'hubspot', name: 'HubSpot', category: 'CRM and sales', description: 'Work with contacts, companies, deals, and CRM activity.', logo: 'https://cdn.simpleicons.org/hubspot/FF7A59' },
    { id: 'salesforce', name: 'Salesforce', category: 'CRM and sales', description: 'Connect customer records, opportunities, and sales workflows.', logo: 'https://cdn.simpleicons.org/salesforce/00A1E0' },
  ];

  const integrationCategories = ['All', ...Array.from(new Set(integrations.map(item => item.category)))];
  const visibleIntegrations = integrations.filter(item => {
    const matchesCategory = integrationCategory === 'All' || item.category === integrationCategory;
    const query = integrationSearch.trim().toLowerCase();
    return matchesCategory && (!query || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query));
  });

  const renderIntegrations = () => (
    <div className="flex flex-1 flex-col w-full max-w-6xl mx-auto px-6 py-10 overflow-y-auto">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#050BE0]">Connected services</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Integrations</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Connect the services your projects depend on. The catalog follows the main categories available in Replit’s integration ecosystem.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
            <input value={integrationSearch} onChange={event => setIntegrationSearch(event.target.value)} placeholder="Search integrations" className="h-9 w-52 rounded-md border border-white/10 bg-[#05070e] pl-9 pr-3 text-xs text-white outline-none focus:border-[#050BE0]/50" data-testid="input-search-integrations" />
          </div>
          <label className="relative">
            <select value={integrationCategory} onChange={event => setIntegrationCategory(event.target.value)} className="h-9 appearance-none rounded-md border border-white/10 bg-[#05070e] pl-3 pr-8 text-xs text-neutral-300 outline-none focus:border-[#050BE0]/50">
              {integrationCategories.map(category => <option key={category}>{category}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />
          </label>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-xs font-medium text-neutral-300">Connected</h3>
        <div className="max-w-[360px] rounded-lg border border-[#050BE0]/30 bg-[#05070e] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.035]">
              <img src="https://cdn.simpleicons.org/github/ffffff" alt="GitHub logo" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white">GitHub</span>
                <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Active</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-neutral-500">Import repositories and continue development inside Lissa.</p>
            </div>
          </div>
          <button onClick={() => void openGithubImport()} className="mt-4 h-8 w-full rounded-md border border-white/10 text-[11px] font-medium text-neutral-300 hover:bg-white/5 hover:text-white" data-testid="button-manage-github">Manage</button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-300">All integrations</h3>
        <span className="text-[10px] text-neutral-600">{visibleIntegrations.length} services</span>
      </div>
      <div className="grid grid-cols-1 gap-3 pb-8 md:grid-cols-2 xl:grid-cols-3">
        {visibleIntegrations.map(item => (
          <div key={item.id} className="flex min-h-44 flex-col rounded-lg border border-white/[0.075] bg-[#05070e] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.035]">
                <img src={item.logo} alt={`${item.name} logo`} className="max-h-5 max-w-5 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-100">{item.name}</span>
                  {item.active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Active" />}
                </div>
                <span className="text-[9px] uppercase tracking-wider text-neutral-600">{item.category}</span>
              </div>
            </div>
            <p className="mt-3 flex-1 text-[11px] leading-5 text-neutral-500">{item.description}</p>
            <button onClick={item.active ? () => void openGithubImport() : undefined} disabled={!item.active} className={cn('mt-4 h-8 w-full rounded-md border text-[11px] font-medium transition-colors', item.active ? 'border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white' : 'cursor-not-allowed border-white/[0.06] text-neutral-650')}>{item.active ? 'Manage' : 'Coming soon'}</button>
          </div>
        ))}
        {!visibleIntegrations.length && <div className="col-span-full border border-dashed border-white/10 py-16 text-center text-xs text-neutral-600">No integrations match this filter.</div>}
      </div>
    </div>
  );

  const renderSettings = () => (
    <WorkspaceSettings
      address={address}
      isConnected={isConnected}
      chainId={chainId}
      disconnect={disconnect}
      switchChain={switchChain}
      isSwitching={isSwitching}
      open={open}
    />
  );

  const renderCredits = () => (
    <div className="flex flex-1 flex-col w-full max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#050BE0]">LISSA holder utility</div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Build credits</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
          Every wallet receives two free builds each day. Eligible LISSA holders accrue additional credits over time and can claim them here for more agent builds.
        </p>
      </div>

      <div className="grid grid-cols-1 border border-white/10 bg-[#05070e] sm:grid-cols-3">
        <div className="border-b border-white/5 p-5 sm:border-b-0 sm:border-r">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">Free builds today</div>
          <div className="mt-3 text-2xl font-semibold text-white" data-testid="text-free-builds">
            {isCreditStatusLoading ? '—' : creditStatus?.unlimited ? 'Unlimited' : creditStatus?.freeBuildsRemaining ?? 0}
          </div>
        </div>
        <div className="border-b border-white/5 p-5 sm:border-b-0 sm:border-r">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">Credit balance</div>
          <div className="mt-3 text-2xl font-semibold text-white" data-testid="text-credit-balance">
            {isCreditStatusLoading ? '—' : (creditStatus?.creditBalance ?? 0).toFixed(2)}
          </div>
        </div>
        <div className="p-5">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">Earning rate</div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {isCreditStatusLoading ? '—' : (creditStatus?.earningRatePerHour ?? 0).toFixed(2)}
            <span className="ml-1 text-xs font-normal text-neutral-500">/ hour</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-5 border border-white/10 bg-[#05070e] p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Available to claim</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {isCreditStatusLoading ? '—' : (creditStatus?.claimableCredit ?? 0).toFixed(2)}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {creditStatus?.eligible ? 'Your connected wallet is eligible and continues accruing credits.' : 'This wallet is not currently accruing holder credits.'}
          </p>
        </div>
        <button
          onClick={onClaimCredits}
          disabled={isClaimingCredits || !creditStatus?.claimableCredit}
          className="h-10 min-w-36 rounded-md bg-[#050BE0] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#151BEF] disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-neutral-600"
          data-testid="button-claim-credits"
        >
          {isClaimingCredits ? 'Claiming credits…' : 'Claim credits'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[#02040a] text-neutral-100 overflow-hidden font-sans selection:bg-[#050BE0]/30">
      {/* Persistent Sidebar */}
      <aside className="w-11 flex flex-col items-center py-2 border-r border-white/5 bg-[#05070e] shrink-0 z-20">
        <div className="w-6 h-6 rounded-sm bg-black overflow-hidden mb-3 border border-white/10">
          <img src="/brand/lissa-logo.jpg" alt="Lissa" className="w-full h-full object-cover" />
        </div>
      
        <nav className="flex flex-col gap-0.5 w-full px-1.5">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'projects', icon: FolderOpen, label: 'Projects' },
            { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
            { id: 'import', icon: Import, label: 'Import' },
            { id: 'integrations', icon: PlugZap, label: 'Integrations' },
            { id: 'activity', icon: Activity, label: 'Activity' },
            { id: 'credits', icon: Coins, label: 'Credits' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSurface(item.id as any)}
              className={cn(
                "h-8 w-full rounded-sm flex items-center justify-center transition-colors",
                surface === item.id 
                  ? 'bg-[#050BE0]/10 text-[#050BE0]' 
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
              )}
              title={item.label}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </nav>
      
        <div className="mt-auto px-1.5 w-full">
          <button
            onClick={() => setSurface('settings')}
            className={cn(
              "h-8 w-full rounded-sm flex items-center justify-center transition-colors",
              surface === 'settings' 
                ? 'bg-[#050BE0]/10 text-[#050BE0]' 
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
            )}
            title="Settings"
            data-testid="nav-settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#02040a] relative z-10">
        {/* Top Header */}
        <header className="h-12 border-b border-white/5 bg-[#05070e] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">{surface}</span>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                {!isCorrectChain && (
                  <button
                    onClick={() => switchChain({ chainId: robinhoodChain.id })}
                    disabled={isSwitching}
                    className="flex items-center gap-1.5 px-2 py-1 rounded border border-amber-400/30 bg-amber-500/10 text-amber-300 text-[11px] font-medium disabled:opacity-60"
                  >
                    <Network className="w-3 h-3" />
                    Switch
                  </button>
                )}
                <button
                  onClick={() => open({ view: 'Account' })}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-neutral-300 text-[11px] font-medium hover:bg-white/10 transition-colors"
                >
                  <Wallet className="w-3 h-3 text-[#050BE0]" />
                  {shortAddress}
                </button>
              </div>
            ) : (
              <button
                onClick={() => open({ view: 'Connect' })}
                className="px-3 py-1 bg-[#050BE0] text-white text-[11px] font-medium rounded hover:bg-[#151BEF] transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="relative z-10 flex flex-col min-h-full">
            {surface === 'home' && renderHome()}
            {surface === 'projects' && renderProjects()}
            {surface === 'templates' && renderTemplates()}
            {surface === 'import' && renderImport()}
            {surface === 'integrations' && renderIntegrations()}
            {surface === 'activity' && renderActivity()}
            {surface === 'credits' && renderCredits()}
            {surface === 'settings' && renderSettings()}
          </div>
        </main>
      </div>
    </div>
  );
}
