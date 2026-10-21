import { useEffect, useRef, useState } from 'react';
import { Feather, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractTasks, type AISource } from '@/lib/ai/provider';
import type { ProposedTask } from '@/lib/ai/schemas';
import { useStore } from '@/lib/store';
import { uid } from '@/lib/tasks';
import { SourceBadge } from './bits';
import { toast } from 'sonner';
export function BrainDump({ compact = false }: { compact?: boolean }) {
  const { data, today, addTask } = useStore();
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState<ProposedTask[]>([]);
  const [source, setSource] = useState<AISource>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);
  async function run(demo = false) {
    if (!text.trim()) return;
    const c = new AbortController(); ctrl.current = c; setLoading(true); setError(''); setTasks([]);
    const r = await extractTasks(text, today, demo ? { ...data.settings, provider: 'demo' } : data.settings, c.signal);
    if (c.signal.aborted) return;
    setLoading(false);
    if (r.ok) { setTasks(r.data); setSource(r.source); if (!r.data.length) setError('No tasks found. Try adding an action you want to take.'); } else setError(r.error);
  }
  function save(t: ProposedTask) { addTask({ title: t.title, category: t.category, priority: t.priority, effort: t.effortMinutes, due: t.due ?? undefined, subtasks: t.steps.map(title => ({ id: uid(), title, done: false })) }); }
  return <div className="grid gap-4"><textarea aria-label="Brain dump" className={`field resize-y ${compact ? 'min-h-28' : 'min-h-48'}`} maxLength={20000} placeholder="What's taking up space in your head? I need to finish my assignment, reply to my mentor…" value={text} onChange={e => setText(e.target.value)}/><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{data.settings.provider === 'demo' ? 'Demo · rule-based' : `Local model · ${data.settings.model}`}</span>{loading ? <Button variant="outline" onClick={() => {ctrl.current?.abort(); setLoading(false);}}>Cancel</Button> : <Button disabled={!text.trim()} onClick={() => run()}><Feather/>Sort my thoughts</Button>}</div>{loading && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin"/>Finding the small, doable things…</p>}{error && <div role="alert" className="text-sm text-destructive">{error}<div className="mt-2 flex gap-2"><Button variant="outline" onClick={() => run()}>Try again</Button><Button variant="secondary" onClick={() => run(true)}>Use demo mode</Button></div></div>}{tasks.length > 0 && <><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-serif text-xl">A little more clarity</h3>{source && <SourceBadge source={source}/>}</div><div className="grid gap-3">{tasks.map((t, i) => <div className="surface grid gap-3 p-4" key={i}><input aria-label={`Proposed task ${i+1}`} className="field" value={t.title} onChange={e => setTasks(all => all.map((x,j) => j===i ? {...x,title:e.target.value} : x))}/><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><label className="grid gap-1 text-xs">Category<input className="field" value={t.category} onChange={e => setTasks(all => all.map((x,j) => j===i ? {...x,category:e.target.value} : x))}/></label><label className="grid gap-1 text-xs">Priority<select className="field" value={t.priority} onChange={e => setTasks(all => all.map((x,j) => j===i ? {...x,priority:e.target.value as ProposedTask['priority']} : x))}>{['low','medium','high'].map(p => <option key={p}>{p}</option>)}</select></label><label className="grid gap-1 text-xs">Minutes<input type="number" min="5" max="480" className="field" value={t.effortMinutes} onChange={e => setTasks(all => all.map((x,j) => j===i ? {...x,effortMinutes:Math.max(5,Number(e.target.value))} : x))}/></label><label className="grid gap-1 text-xs">Due date<input type="date" className="field" value={t.due ?? ''} onChange={e => setTasks(all => all.map((x,j) => j===i ? {...x,due:e.target.value || null} : x))}/></label></div><div className="flex justify-end gap-2"><Button size="icon" variant="ghost" aria-label={`Discard proposed task ${i+1}`} onClick={() => setTasks(all => all.filter((_,j)=>j!==i))}><Trash2/></Button><Button disabled={!t.title.trim()} variant="outline" onClick={() => {save(t); setTasks(all => all.filter((_,j)=>j!==i)); toast.success('Task added.');}}><Plus/>Save task</Button></div></div>)}</div><Button className="justify-self-end" disabled={tasks.some(t => !t.title.trim())} onClick={() => {tasks.forEach(save); setTasks([]); setText(''); toast.success('Tasks added.');}}>Save all {tasks.length} tasks</Button></>}</div>;
}
