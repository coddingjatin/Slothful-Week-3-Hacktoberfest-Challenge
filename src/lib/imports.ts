import { z } from 'zod';
import type { AppData } from './types';
export const MAX_TEXT_FILE_BYTES = 1024 * 1024;
export function validateTextFile(file: { name: string; size: number }) {
  if (!/\.(txt|md|csv)$/i.test(file.name)) return 'Choose a .txt, .md, or .csv file.';
  if (file.size > MAX_TEXT_FILE_BYTES) return 'Choose a text file smaller than 1 MB.';
  return null;
}
const energy = z.enum(['low','medium','high']);
const task = z.object({id:z.string(),title:z.string().trim().min(1),notes:z.string().optional(),category:z.string(),priority:energy,effort:z.number().finite().min(5),due:z.string().optional(),done:z.boolean(),completedAt:z.string().optional(),createdAt:z.string(),subtasks:z.array(z.object({id:z.string(),title:z.string(),done:z.boolean()}))});
const backup = z.object({version:z.literal(1),tasks:z.array(task),settings:z.object({name:z.string(),defaultEnergy:energy,availableMinutes:z.number().finite().min(0).max(1440),provider:z.enum(['demo','ollama']),endpoint:z.string().url(),model:z.string(),timeoutMs:z.number().finite().min(1000).max(300000),reduceMotion:z.boolean()}),snippets:z.array(z.object({id:z.string(),title:z.string(),body:z.string(),createdAt:z.string()})),reflections:z.record(z.string()),plan:z.object({date:z.string(),energy,minutes:z.number().finite().min(0),items:z.array(z.object({taskId:z.string(),minutes:z.number().finite().min(5),status:z.enum(['suggested','accepted'])}))}).optional(),todayEnergy:z.object({date:z.string(),energy}).optional()});
export function parseBackup(text: string): AppData {
  const data: unknown = JSON.parse(text);
  return backup.parse(data);
}
