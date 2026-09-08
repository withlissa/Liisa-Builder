import { useEffect, useMemo, useState } from 'react';
import {
  Accessibility,
  Check,
  ChevronRight,
  CircleUserRound,
  Copy,
  Database,
  Download,
  Gauge,
  Monitor,
  Network,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Trash2,
  Wallet,
} from 'lucide-react';
import { robinhoodChain } from '@/lib/web3';
import { cn } from '@/lib/utils';

export type StartupSurface = 'home' | 'projects' | 'templates' | 'import' | 'integrations' | 'activity' | 'credits';

type WorkspacePreferences = {
  startupSurface: StartupSurface;
  reducedMotion: boolean;
  compactInterface: boolean;
};

const SETTINGS_KEY = 'lissa-workspace-preferences-v1';
const PROJECTS_KEY = 'lissa-projects-v1';
const DEFAULT_SETTINGS: WorkspacePreferences = {
  startupSurface: 'home',
  reducedMotion: false,
  compactInterface: true,
};

export function readWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') as Partial<WorkspacePreferences>;
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function applyWorkspacePreferences(preferences: WorkspacePreferences) {
  document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
  document.documentElement.dataset.interfaceDensity = preferences.compactInterface ? 'compact' : 'comfortable';
}

type SettingsSection = 'general' | 'accessibility' | 'account' | 'data';

const sections = [
  { id: 'general' as const, label: 'General', description: 'Workspace defaults', icon: Settings2 },
  { id: 'accessibility' as const, label: 'Accessibility', description: 'Motion and density', icon: Accessibility },
  { id: 'account' as const, label: 'Account & network', description: 'Wallet and chain status', icon: ShieldCheck },
  { id: 'data' as const, label: 'Data controls', description: 'Export and local storage', icon: Database },
];

function SettingToggle({
  checked,
  onChange,
  label,
  description,
  testId,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  testId: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/[0.06] py-5 last:border-b-0">
      <div>
        <div className="text-[13px] font-medium text-neutral-100">{label}</div>
        <p className="mt-1 max-w-lg text-[11px] leading-5 text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#555cff]',
          checked ? 'border-[#353be0] bg-[#050BE0]' : 'border-white/15 bg-white/[0.06]',
        )}
        data-testid={testId}
      >
        <span className={cn('absolute top-[3px] h-3 w-3 rounded-full bg-white transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
      </button>
    </div>
  );
}

export default function WorkspaceSettings({
  address,
  isConnected,
  chainId,
  disconnect,
  switchChain,
  isSwitching,
  open,
}: {
  address?: string;
  isConnected: boolean;
  chainId?: number;
  disconnect: () => void;
  switchChain: (input: { chainId: number }) => void;
  isSwitching: boolean;
  open: (input: { view: 'Connect' | 'Account' }) => void;
}) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [preferences, setPreferences] = useState(readWorkspacePreferences);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [storageVersion, setStorageVersion] = useState(0);
  const isCorrectChain = chainId === robinhoodChain.id;
  const shortAddress = address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'No wallet connected';

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    applyWorkspacePreferences(preferences);
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 1200);
    return () => window.clearTimeout(timer);
  }, [preferences]);

  const storage = useMemo(() => {
    const raw = localStorage.getItem(PROJECTS_KEY) || '[]';
    try {
      const projects = JSON.parse(raw) as unknown[];
      return { projects: Array.isArray(projects) ? projects.length : 0, bytes: new Blob([raw]).size };
    } catch {
      return { projects: 0, bytes: new Blob([raw]).size };
    }
  }, [storageVersion]);

  const updatePreference = <Key extends keyof WorkspacePreferences>(key: Key, value: WorkspacePreferences[Key]) => {
    setPreferences(current => ({ ...current, [key]: value }));
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const exportWorkspace = () => {
    let projects: unknown[] = [];
    try {
      const savedProjects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]') as unknown;
      projects = Array.isArray(savedProjects) ? savedProjects : [];
    } catch {
      projects = [];
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      preferences,
      projects,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lissa-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_SETTINGS);
    setActiveSection('general');
  };

  const clearProjects = () => {
    localStorage.removeItem(PROJECTS_KEY);
    setConfirmClear(false);
    setStorageVersion(version => version + 1);
    window.dispatchEvent(new StorageEvent('storage', { key: PROJECTS_KEY, newValue: '[]' }));
    window.setTimeout(() => window.location.reload(), 150);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#676cff]">Workspace control center</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Settings</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-500">Configure how Lissa opens, displays motion, connects to Robinhood Chain, and stores project data in this browser.</p>
        </div>
        <div className={cn('flex h-8 items-center gap-2 border px-3 text-[10px] transition-colors', saved ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300' : 'border-white/[0.07] bg-white/[0.025] text-neutral-500')}>
          <Check className="h-3 w-3" />
          {saved ? 'Preferences saved' : 'Changes save automatically'}
        </div>
      </div>

      <div className="grid min-h-[560px] overflow-hidden border border-white/[0.08] bg-[#05070e] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-white/[0.07] bg-[#03050b] p-3 lg:border-b-0 lg:border-r">
          <div className="mb-2 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-600">Configuration</div>
          <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'group flex items-center gap-3 border px-3 text-left transition-colors',
                  preferences.compactInterface ? 'min-h-14' : 'min-h-16',
                  activeSection === section.id
                    ? 'border-[#262ccb]/40 bg-[#050BE0]/10'
                    : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.025]',
                )}
              >
                <section.icon className={cn('h-4 w-4 shrink-0', activeSection === section.id ? 'text-[#676cff]' : 'text-neutral-600 group-hover:text-neutral-400')} />
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-[11px] font-medium', activeSection === section.id ? 'text-white' : 'text-neutral-400')}>{section.label}</span>
                  <span className="mt-0.5 block truncate text-[9px] text-neutral-650">{section.description}</span>
                </span>
                <ChevronRight className={cn('h-3 w-3', activeSection === section.id ? 'text-[#676cff]' : 'text-neutral-700')} />
              </button>
            ))}
          </nav>
          <div className="mt-4 border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Local-first preferences
            </div>
            <p className="mt-2 text-[9px] leading-4 text-neutral-600">Workspace preferences remain in this browser and never include wallet keys.</p>
          </div>
        </aside>

        <section className="min-w-0 p-5 sm:p-7 lg:p-8">
          {activeSection === 'general' && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Monitor className="h-5 w-5 text-[#676cff]" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Workspace behavior</h3>
                  <p className="mt-1 text-[11px] text-neutral-500">Choose what Lissa shows when you return.</p>
                </div>
              </div>
              <div className="border border-white/[0.07] bg-[#02040a]">
                <label className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="block text-[13px] font-medium text-neutral-100">Startup destination</span>
                    <span className="mt-1 block text-[11px] leading-5 text-neutral-500">The first workspace Lissa opens on your next visit.</span>
                  </span>
                  <select
                    value={preferences.startupSurface}
                    onChange={event => updatePreference('startupSurface', event.target.value as StartupSurface)}
                    className="h-9 min-w-44 border border-white/10 bg-[#080b14] px-3 text-[11px] text-neutral-200 outline-none focus:border-[#555cff]"
                    data-testid="select-startup-surface"
                  >
                    <option value="home">Home</option>
                    <option value="projects">Projects</option>
                    <option value="templates">Templates</option>
                    <option value="import">Import</option>
                    <option value="integrations">Integrations</option>
                    <option value="activity">Activity</option>
                    <option value="credits">Credits</option>
                  </select>
                </label>
                <div className="grid gap-px bg-white/[0.06] sm:grid-cols-3">
                  {[
                    { label: 'Projects stored', value: storage.projects, icon: Database },
                    { label: 'Local data', value: `${Math.max(0.1, storage.bytes / 1024).toFixed(1)} KB`, icon: Gauge },
                    { label: 'Save mode', value: 'Automatic', icon: Check },
                  ].map(item => (
                    <div key={item.label} className="bg-[#02040a] p-5">
                      <item.icon className="h-4 w-4 text-neutral-600" />
                      <div className="mt-4 text-lg font-semibold text-white">{item.value}</div>
                      <div className="mt-1 text-[9px] uppercase tracking-wider text-neutral-600">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'accessibility' && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Accessibility className="h-5 w-5 text-[#676cff]" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Accessibility & display</h3>
                  <p className="mt-1 text-[11px] text-neutral-500">Adjust motion and information density across the workspace.</p>
                </div>
              </div>
              <div className="border border-white/[0.07] bg-[#02040a] px-5">
                <SettingToggle
                  checked={preferences.reducedMotion}
                  onChange={value => updatePreference('reducedMotion', value)}
                  label="Reduce interface motion"
                  description="Minimizes transitions and animated progress effects throughout Lissa."
                  testId="toggle-reduced-motion"
                />
                <SettingToggle
                  checked={preferences.compactInterface}
                  onChange={value => updatePreference('compactInterface', value)}
                  label="Compact settings navigation"
                  description="Keeps the settings navigation concise. Turn this off for larger category targets and more breathing room."
                  testId="toggle-compact-interface"
                />
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <CircleUserRound className="h-5 w-5 text-[#676cff]" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Account & network</h3>
                  <p className="mt-1 text-[11px] text-neutral-500">Review the wallet session used for access and build credits.</p>
                </div>
              </div>
              <div className="border border-white/[0.07] bg-[#02040a]">
                <div className="flex flex-col gap-5 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.03]"><Wallet className="h-4 w-4 text-neutral-400" /></div>
                    <div>
                      <div className="text-[12px] font-medium text-white">{shortAddress}</div>
                      <div className="mt-1 text-[10px] text-neutral-600">{isConnected ? 'Active wallet session' : 'Connect to access LISSA-gated builds'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isConnected && (
                      <button onClick={() => void copyAddress()} className="flex h-8 items-center gap-2 border border-white/10 px-3 text-[10px] text-neutral-400 hover:bg-white/[0.04] hover:text-white">
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    )}
                    <button onClick={() => isConnected ? open({ view: 'Account' }) : open({ view: 'Connect' })} className="h-8 bg-[#050BE0] px-3 text-[10px] font-medium text-white hover:bg-[#171df0]">
                      {isConnected ? 'Manage wallet' : 'Connect wallet'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Network className={cn('h-4 w-4', isCorrectChain ? 'text-emerald-400' : 'text-amber-400')} />
                    <div>
                      <div className="text-[12px] font-medium text-neutral-200">{isCorrectChain ? robinhoodChain.name : `Unsupported chain${chainId ? ` · ${chainId}` : ''}`}</div>
                      <div className="mt-1 text-[10px] text-neutral-600">Required network · Chain ID {robinhoodChain.id}</div>
                    </div>
                  </div>
                  {isConnected && !isCorrectChain && (
                    <button onClick={() => switchChain({ chainId: robinhoodChain.id })} disabled={isSwitching} className="h-8 border border-amber-400/25 bg-amber-400/[0.08] px-3 text-[10px] text-amber-300 disabled:opacity-50">
                      {isSwitching ? 'Switching…' : 'Switch network'}
                    </button>
                  )}
                </div>
              </div>
              {isConnected && (
                <button onClick={disconnect} className="mt-5 h-9 border border-red-400/15 bg-red-400/[0.04] px-4 text-[10px] font-medium text-red-300 hover:bg-red-400/[0.08]" data-testid="button-disconnect">
                  Disconnect current wallet
                </button>
              )}
            </div>
          )}

          {activeSection === 'data' && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Database className="h-5 w-5 text-[#676cff]" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Data controls</h3>
                  <p className="mt-1 text-[11px] text-neutral-500">Export workspace data or remove local browser records.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col gap-4 border border-white/[0.07] bg-[#02040a] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[12px] font-medium text-neutral-100">Export workspace</div>
                    <p className="mt-1 max-w-lg text-[10px] leading-5 text-neutral-600">Downloads preferences and locally saved project sessions as a readable JSON backup.</p>
                  </div>
                  <button onClick={exportWorkspace} className="flex h-8 shrink-0 items-center justify-center gap-2 border border-white/10 px-3 text-[10px] text-neutral-300 hover:bg-white/[0.04]">
                    <Download className="h-3 w-3" /> Export JSON
                  </button>
                </div>
                <div className="flex flex-col gap-4 border border-white/[0.07] bg-[#02040a] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[12px] font-medium text-neutral-100">Reset preferences</div>
                    <p className="mt-1 max-w-lg text-[10px] leading-5 text-neutral-600">Restores startup, motion, and density settings. Projects remain untouched.</p>
                  </div>
                  <button onClick={resetPreferences} className="flex h-8 shrink-0 items-center justify-center gap-2 border border-white/10 px-3 text-[10px] text-neutral-300 hover:bg-white/[0.04]">
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                </div>
                <div className="border border-red-400/15 bg-red-400/[0.025] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[12px] font-medium text-red-200">Clear local project history</div>
                      <p className="mt-1 max-w-lg text-[10px] leading-5 text-red-200/45">Permanently removes {storage.projects} locally stored project session{storage.projects === 1 ? '' : 's'} from this browser. Export first if you need a backup.</p>
                    </div>
                    {!confirmClear ? (
                      <button onClick={() => setConfirmClear(true)} className="flex h-8 shrink-0 items-center justify-center gap-2 border border-red-400/20 px-3 text-[10px] text-red-300 hover:bg-red-400/[0.06]">
                        <Trash2 className="h-3 w-3" /> Clear projects
                      </button>
                    ) : (
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => setConfirmClear(false)} className="h-8 border border-white/10 px-3 text-[10px] text-neutral-400">Cancel</button>
                        <button onClick={clearProjects} className="h-8 bg-red-500 px-3 text-[10px] font-medium text-white">Confirm delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}