import { createFileRoute } from '@tanstack/react-router';
import { BrainDump } from '@/components/slothful/BrainDump';
import { PageHeader } from '@/components/slothful/bits';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/brain-dump')({head:()=>pageMeta('Brain Dump','Unload your thoughts and review small, actionable tasks.'),component:BrainDumpPage});
function BrainDumpPage(){return <div className="max-w-3xl"><PageHeader eyebrow="Set it down" title="Brain Dump"/><BrainDump/></div>;}
