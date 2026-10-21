import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sprout, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrainDump } from "@/components/slothful/BrainDump";
import { TaskRow, TaskCheck } from "@/components/slothful/TaskRow";
import { useUI } from "@/components/slothful/ui-context";
import { useStore } from "@/lib/store";
import { sortTasks } from "@/lib/tasks";
import { pageMeta } from "@/lib/page-meta";
import sprout from "@/assets/sprout.jpg";
export const Route = createFileRoute("/")({
  head: () => pageMeta("Overview", "Your life, a little less overwhelming. Take today one small step at a time with Slothful."),
  component: Index,
});
function Index() {
  const { data, today, setReflection } = useStore();
  const { openTask, openBreakdown } = useUI();
  const active = sortTasks(data.tasks.filter(t => !t.done), "smart");
  const priorities = active.slice(0, 3);
  const due = active.filter(t => t.due && t.due <= today);
  const done = data.tasks.filter(t => t.completedAt?.slice(0,10) === today).length;
  const total = done + due.length;
  return <>
    <section className="relative mb-8 min-h-52 overflow-hidden border-b pb-8 pr-0 sm:pr-48">
      <p className="mb-3 text-sm text-muted-foreground">Hello, {data.settings.name}. Welcome to Slothful.</p>
      <h1 className="relative z-10 max-w-xl font-serif text-3xl font-normal leading-tight sm:text-4xl">Let's take today<br className="hidden sm:block"/> one step at a time.</h1>
      <p className="mt-4 text-sm text-muted-foreground">Your life, a little less overwhelming.</p>
      <img src={sprout} alt="A small plant growing steadily, with a resting sloth" className="absolute right-0 top-0 hidden h-52 w-48 object-cover mix-blend-multiply sm:block"/>
    </section>
    <div className="grid gap-8 xl:grid-cols-[1.45fr_1fr]">
      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">A few things that matter</h2><Button asChild variant="link" size="sm"><Link to="/gentle-plan">Make a plan <ArrowRight/></Link></Button></div>
        <ul className="mb-8 grid gap-3">{priorities.map((t,i) => <li className="surface flex items-start gap-3 p-4" key={t.id}><span className="mt-0.5 font-serif text-lg text-muted-foreground">0{i+1}</span><div className="min-w-0 flex-1"><Button variant="link" className="h-auto justify-start whitespace-normal p-0 text-left text-foreground" onClick={() => openTask(t)}>{t.title}</Button><p className="mt-2 text-xs text-muted-foreground">{t.effort} min · {t.category}</p></div><TaskCheck task={t}/></li>)}{!priorities.length && <p className="py-5 text-sm text-muted-foreground">Nothing on your mind? Enjoy the space.</p>}</ul>
        <section className="mb-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">A place to put your thoughts</h2><Button asChild size="icon" variant="ghost" title="Open Brain Dump" aria-label="Open Brain Dump"><Link to="/brain-dump"><ArrowRight/></Link></Button></div><BrainDump compact/></section>
        <section><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-2xl">On your list today</h2><Button variant="ghost" size="icon" aria-label="Add a task" title="Add a task" onClick={() => openTask()}><Plus/></Button></div><ul className="border-y">{due.map(t => <TaskRow key={t.id} task={t}/>)}</ul>{!due.length && <p className="py-5 text-sm text-muted-foreground">No tasks due today. A little breathing room.</p>}<Button asChild variant="link" className="mt-2 px-0"><Link to="/tasks">See all tasks <ArrowRight/></Link></Button></section>
      </div>
      <div className="min-w-0 space-y-8 xl:border-l xl:pl-8">
        <section><h2 className="mb-4 font-serif text-2xl">Small steps count</h2><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-secondary text-primary"><Check className="size-5"/></span><div><p className="text-sm">{done} {done===1?'task':'tasks'} completed today</p><p className="mt-1 text-xs text-muted-foreground">At your own pace. Always.</p></div></div><progress aria-label="Today's task progress" className="mt-5 h-1.5 w-full accent-primary" value={done} max={total || 1}/></section>
        <section className="border-y py-6"><Sprout className="mb-3 size-7 text-primary"/><h2 className="font-serif text-2xl">Make it easier</h2><p className="mb-4 mt-2 text-sm text-muted-foreground">Big task. Tiny first step.</p>{active[0] ? <><p className="mb-4 text-sm">{active[0].title}</p><Button variant="secondary" onClick={() => {const t=active[0];if(t)openBreakdown(t);}}><Sprout/>Break it into small steps</Button></> : <Button variant="secondary" onClick={() => openTask()}><Plus/>Add a task</Button>}</section>
        <section><p className="mb-2 text-xs text-muted-foreground">A MOMENT FOR YOU</p><h2 className="mb-4 font-serif text-2xl">What felt good today?</h2><textarea aria-label="Daily reflection" className="field min-h-32 resize-y" placeholder="A small win, a kind moment, or just getting through…" value={data.reflections[today] ?? ''} onChange={e => setReflection(today,e.target.value)}/><p className="mt-2 text-xs text-muted-foreground">Just for you. Saved on this device.</p></section>
        <p className="border-t pt-5 font-serif text-lg italic text-muted-foreground">Slow is still moving.</p>
      </div>
    </div>
  </>;
}
