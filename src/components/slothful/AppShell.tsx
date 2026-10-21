import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, ListTodo, Feather, CalendarDays, Inbox, Settings, Plus, Search, Sprout } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Wordmark } from './Logo';
import { useUI } from './ui-context';
import { EnergyBars } from './bits';
const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/tasks', label: 'My Tasks', icon: ListTodo },
  { to: '/brain-dump', label: 'Brain Dump', icon: Feather },
  { to: '/gentle-plan', label: 'Gentle Plan', icon: CalendarDays },
  { to: '/quiet-inbox', label: 'Quiet Inbox', icon: Inbox },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;
export function AppShell({ children }: { children: ReactNode }) {
  const { data, energy, ready } = useStore();
  const { openTask } = useUI();
  const path = useRouterState({ select: s => s.location.pathname });
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const matches = data.tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())).slice(0, 6);
  return <div className="min-h-screen lg:pl-60">
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-sidebar px-5 py-8 lg:flex">
      <Link to="/" className="mb-10 px-3"><Wordmark /></Link>
      <nav className="grid gap-1">{nav.map(n => <Button key={n.to} asChild variant="ghost" className={cn('h-11 justify-start px-3 text-muted-foreground', path === n.to && 'bg-secondary text-primary')}><Link to={n.to}><n.icon />{n.label}</Link></Button>)}</nav>
      <div className="mt-auto border-t pt-5 text-sm"><div className="flex items-center gap-2"><EnergyBars e={energy}/><span className="capitalize">{energy} energy today</span></div><Link to="/settings" className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary"/>{data.settings.provider === 'demo' ? 'Demo mode · no connection needed' : `Local model · ${data.settings.model}`}</Link><Link to="/settings" className="mt-6 flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-secondary text-primary">{data.settings.name.charAt(0).toUpperCase()}</span><span>{data.settings.name}<span className="block text-xs text-muted-foreground">Your own little space</span></span></Link></div>
    </aside>
    <header className="flex h-20 items-center justify-between gap-3 border-b px-5 lg:px-10"><div className="lg:hidden"><Link to="/"><Wordmark/></Link></div><span className="hidden text-sm text-muted-foreground lg:block">{nav.find(n => n.to === path)?.label}</span><div className="flex items-center gap-2 sm:gap-5"><span className="hidden text-xs text-muted-foreground sm:block">{ready ? new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''}</span><Button variant="ghost" size="icon" aria-label="Search tasks" title="Search tasks" onClick={() => setSearching(!searching)}><Search/></Button><Button variant="outline" onClick={() => openTask()}><Plus/><span className="hidden sm:inline">Add task</span></Button></div></header>
    {searching && <div className="border-b bg-card px-5 py-4 lg:px-10"><input autoFocus className="field max-w-lg" placeholder="Search tasks…" aria-label="Search all tasks" value={search} onChange={e => setSearch(e.target.value)}/>{search && <div className="mt-2 grid max-w-lg gap-1">{matches.map(t => <Button variant="ghost" className="justify-start whitespace-normal text-left" key={t.id} onClick={() => { openTask(t); setSearching(false); }}>{t.title}</Button>)}{!matches.length && <p className="text-sm text-muted-foreground">No matching tasks.</p>}</div>}</div>}
    <main className="mx-auto max-w-7xl px-5 py-8 pb-28 sm:px-8 lg:px-10 lg:py-10">{ready ? children : <div className="flex items-center gap-2 text-muted-foreground"><Sprout className="size-5 animate-pulse"/>Settling in…</div>}</main>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card py-3 lg:hidden">{nav.map(n => <Link key={n.to} to={n.to} className={cn('flex min-w-0 flex-col items-center gap-1 text-[10px] text-muted-foreground', path === n.to && 'text-primary')}><n.icon className="size-5"/><span>{n.label === 'Overview' ? 'Home' : n.label === 'My Tasks' ? 'Tasks' : n.label === 'Brain Dump' ? 'Dump' : n.label === 'Gentle Plan' ? 'Plan' : n.label === 'Quiet Inbox' ? 'Inbox' : 'Settings'}</span></Link>)}</nav>
  </div>;
}
