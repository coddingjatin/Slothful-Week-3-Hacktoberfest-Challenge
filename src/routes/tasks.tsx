import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, Segmented } from '@/components/slothful/bits';
import { TaskRow } from '@/components/slothful/TaskRow';
import { useUI } from '@/components/slothful/ui-context';
import { useStore } from '@/lib/store';
import { filterTasks, sortTasks, type TaskFilter, type TaskSort } from '@/lib/tasks';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/tasks')({ head: () => pageMeta('My Tasks', 'A calm place for everything you want to do.'), component: Tasks });
function Tasks() {
 const { data, today } = useStore(); const { openTask } = useUI();
 const [filter,setFilter] = useState<TaskFilter>('all'); const [query,setQuery] = useState(''); const [category,setCategory] = useState(''); const [sort,setSort] = useState<TaskSort>('smart');
 const tasks = sortTasks(filterTasks(data.tasks,{filter,query,category,today}),sort);
 return <><PageHeader eyebrow="One thing at a time" title="My Tasks"><Button onClick={() => openTask()}><Plus/>New task</Button></PageHeader><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Segmented label="Task filter" value={filter} onChange={setFilter} options={[{value:'all',label:'All'},{value:'today',label:'Today'},{value:'upcoming',label:'Upcoming'},{value:'completed',label:'Completed'}]}/><span className="text-xs text-muted-foreground">{tasks.length} tasks</span></div><div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><label className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><input className="field pl-9" aria-label="Search tasks" placeholder="Find a task…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select className="field" aria-label="Category filter" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{[...new Set(data.tasks.map(t=>t.category))].map(c=><option key={c}>{c}</option>)}</select><select className="field" aria-label="Sort tasks" value={sort} onChange={e=>setSort(e.target.value as TaskSort)}><option value="smart">Smart order</option><option value="due">Due date</option><option value="priority">Priority</option><option value="effort">Smallest first</option><option value="created">Newest first</option></select></div>{tasks.length ? <ul className="overflow-hidden rounded-lg border bg-card">{tasks.map(t=><TaskRow key={t.id} task={t}/>)}</ul> : <div className="py-16 text-center"><ListTodo className="mx-auto mb-3 size-8 text-muted-foreground"/><h2 className="font-serif text-xl">A little breathing room.</h2><p className="mt-2 text-sm text-muted-foreground">No tasks here just yet.</p></div>}</>;
}
