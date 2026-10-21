import { describe, it, expect } from 'vitest';
import { createTask, setDone, filterTasks } from '@/lib/tasks';
import { buildPlan } from '@/lib/planner';
import { extractTasksDemo } from '@/lib/ai/demo';
import { ExtractTasksSchema, parseModelJson } from '@/lib/ai/schemas';
import { parseBackup, validateTextFile } from '@/lib/imports';
import { DEFAULT_SETTINGS } from '@/lib/store';
describe('Local task operations',()=>{
 it('creates and completes a task',()=>{const t=createTask({title:'  Reply to mentor  '});expect(t.title).toBe('Reply to mentor');expect(setDone(t,true).done).toBe(true);expect(setDone(t,false).completedAt).toBeUndefined();});
 it('filters today without including completed or future tasks',()=>{const tasks=[createTask({title:'Today',due:'2026-10-21'}),createTask({title:'Later',due:'2026-10-22'}),createTask({title:'Done',due:'2026-10-21',done:true})];expect(filterTasks(tasks,{filter:'today',today:'2026-10-21'}).map(t=>t.title)).toEqual(['Today']);});
});
describe('Planning rules',()=>{
 for(const energy of ['low','medium','high'] as const) it(`${energy} plan never exceeds available time and leaves breathing room`,()=>{const tasks=Array.from({length:12},(_,i)=>createTask({title:`Task ${i}`,effort:10}));const p=buildPlan(tasks,energy,60,'2026-10-21');expect(p.used).toBeLessThan(60);expect(p.used).toBeLessThanOrEqual(p.budget);});
 it('low energy starts with a tiny task',()=>{const tiny=createTask({title:'Reply',effort:5});const p=buildPlan([createTask({title:'Presentation',effort:60}),tiny],'low',120,'2026-10-21');expect(p.items[0]?.taskId).toBe(tiny.id);});
});
describe('Transparent AI parsing',()=>{
 it('does not invent a due date',()=>{expect(extractTasksDemo('Reply to my mentor','2026-10-21')[0]?.due).toBeNull();});
 it('uses an explicitly stated tomorrow',()=>{expect(extractTasksDemo('Buy groceries tomorrow','2026-10-21')[0]?.due).toBe('2026-10-22');});
 it('rejects malformed model output',()=>{expect(parseModelJson('not json',ExtractTasksSchema).ok).toBe(false);});
 it('accepts fenced structured model output',()=>{const r=parseModelJson('```json\n{"tasks":[{"title":"Reply"}]}\n```',ExtractTasksSchema);expect(r.ok).toBe(true);if(r.ok)expect(r.data.tasks[0]?.title).toBe('Reply');});
});
describe('File safety',()=>{
 it('rejects unsupported text files',()=>{expect(validateTextFile({name:'note.exe',size:10})).not.toBeNull();});
 it('rejects text files over 1 MB',()=>{expect(validateTextFile({name:'note.txt',size:1048577})).not.toBeNull();expect(validateTextFile({name:'note.txt',size:1048576})).toBeNull();});
 it('rejects corrupt backups and accepts valid data',()=>{expect(()=>parseBackup('{"version":1,"tasks":[{}]}')).toThrow();expect(parseBackup(JSON.stringify({version:1,tasks:[],settings:DEFAULT_SETTINGS,snippets:[],reflections:{}})).version).toBe(1);});
});
