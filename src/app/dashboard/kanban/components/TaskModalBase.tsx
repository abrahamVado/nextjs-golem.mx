"use client";

import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";
import clsx from "clsx";
import { Plus, Trash2, Upload, X } from "lucide-react";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TabKey = "description" | "additional" | "owner";

interface ChecklistItem { id?: string; text: string; position?: number; completed?: boolean; completed_at?: string; }
interface TaskFileRef { file_id: number; original_name: string; mime_type?: string; size_bytes?: number; }
interface TaskDraft {
  id?: string; title: string; description: string; column_key: string; priority: Priority; due_date: string;
  tags: string[]; assignees: string[]; watchers: string[]; owner_id?: string | null; story_points?: number | null;
  checklist: ChecklistItem[]; files: TaskFileRef[];
}
interface BoardColumn { id: string; key: string; title: string; }
interface TeamMember { user_id: string; name: string; email: string; }
interface TimeEntry { id?: string; date: string; time: string; }

interface Props {
  open: boolean; mode: "create" | "edit"; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  taskDraft: TaskDraft; setTaskDraft: Dispatch<SetStateAction<TaskDraft>>;
  tags: string[]; customTag: string; setCustomTag: (value: string) => void; toggleTag: (tag: string) => void; addCustomTag: () => void;
  columns: BoardColumn[]; members: TeamMember[]; assigneeColors: string[]; initials: (name: string) => string; toggleWatcher: (userId: string) => void;
  checklistInput: string; setChecklistInput: (value: string) => void; addChecklistItem: (value: string) => void; removeChecklistItem: (index: number) => void;
  onDelete?: () => void; timeEntries?: TimeEntry[]; timeEntryDate?: string; setTimeEntryDate?: (value: string) => void;
  timeEntryValue?: string; setTimeEntryValue?: (value: string) => void; addTimeEntry?: () => void; removeTimeEntry?: (id: string) => void;
  totalTime?: string; isSaving?: boolean; isHydrating?: boolean; titleError?: string; checklistError?: string; timeEntryError?: string; submitError?: string | null;
  onUploadFile?: (file: File) => Promise<void>; onRemoveFile?: (fileID: number) => Promise<void>;
}

export default function TaskModalBase(props: Props) {
  const {
    open, mode, onClose, onSubmit, taskDraft, setTaskDraft, tags, customTag, setCustomTag, toggleTag, addCustomTag,
    columns, members, assigneeColors, initials, toggleWatcher, checklistInput, setChecklistInput, addChecklistItem, removeChecklistItem,
    onDelete, timeEntries = [], timeEntryDate = "", setTimeEntryDate, timeEntryValue = "", setTimeEntryValue, addTimeEntry, removeTimeEntry,
    totalTime = "00:00", isSaving = false, isHydrating = false, titleError, checklistError, timeEntryError, submitError, onUploadFile, onRemoveFile,
  } = props;
  const isEdit = mode === "edit";
  const canAdvanced = isEdit || Boolean(taskDraft.id);
  const [tab, setTab] = useState<TabKey>("description");

  const tabs = useMemo(() => [
    { key: "description" as const, label: "Description", disabled: false },
    { key: "additional" as const, label: "Additional Info", disabled: !canAdvanced },
    { key: "owner" as const, label: "Owner", disabled: !canAdvanced },
  ], [canAdvanced]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (f && onUploadFile) await onUploadFile(f);
  };

  return (
    <div className={clsx("modal-backdrop", open && "active")} onClick={() => !isSaving && onClose()}>
      <div className="modal" style={{ maxWidth: "900px" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-foreground">{isEdit ? "Edit Task" : "Add New Task"}</h2>
            <button className="text-slate-400 hover:text-slate-600" onClick={onClose} disabled={isSaving}><X className="h-5 w-5" /></button>
          </div>
          <hr className="mb-4 border-slate-200" />
          {isHydrating && <p className="text-sm text-slate-500 mb-3">Loading task details...</p>}
          {!canAdvanced && <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">Save the task first to unlock Additional Info and Owner tabs.</div>}

          <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
            {tabs.map((t) => (
              <button key={t.key} type="button" disabled={t.disabled} onClick={() => !t.disabled && setTab(t.key)}
                className={clsx("rounded-lg px-3 py-1.5 text-sm font-medium", tab === t.key ? "bg-blue-500 text-white" : "text-slate-600 hover:bg-slate-100", t.disabled && "opacity-50 cursor-not-allowed")}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {tab === "description" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
                  <input className="w-full px-3 py-2 border rounded-lg" value={taskDraft.title} onChange={(e) => setTaskDraft((p) => ({ ...p, title: e.target.value }))} required disabled={isSaving} />
                  {titleError && <p className="mt-1 text-xs text-red-500">{titleError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea rows={4} className="w-full px-3 py-2 border rounded-lg" value={taskDraft.description} onChange={(e) => setTaskDraft((p) => ({ ...p, description: e.target.value }))} disabled={isSaving} />
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div><label className="block text-sm font-medium mb-1">Column</label><select className="w-full px-3 py-2 border rounded-lg" value={taskDraft.column_key} onChange={(e) => setTaskDraft((p) => ({ ...p, column_key: e.target.value }))} disabled={isSaving}>{columns.map((c) => <option key={c.id} value={c.key}>{c.title}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Priority</label><select className="w-full px-3 py-2 border rounded-lg" value={taskDraft.priority} onChange={(e) => setTaskDraft((p) => ({ ...p, priority: e.target.value as Priority }))} disabled={isSaving}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Critical</option></select></div>
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={taskDraft.due_date} onChange={(e) => setTaskDraft((p) => ({ ...p, due_date: e.target.value }))} disabled={isSaving} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">{tags.map((tag) => <button key={tag} type="button" className={clsx("badge bg-slate-100 text-slate-700", taskDraft.tags.includes(tag) && "ring-2 ring-primary")} onClick={() => toggleTag(tag)} disabled={isSaving}>{tag}</button>)}</div>
                  <div className="mt-2 flex gap-2"><input className="flex-1 px-3 py-2 text-sm border rounded-lg" placeholder="Add custom tag" value={customTag} onChange={(e) => setCustomTag(e.target.value)} disabled={isSaving} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }} /><button type="button" className="px-3 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg" onClick={addCustomTag} disabled={isSaving}><Plus className="h-4 w-4" /></button></div>
                </div>
              </>
            )}

            {tab === "additional" && (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <label className="block text-sm font-medium mb-2">Files</label>
                  <label className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 mb-3"><Upload className="h-4 w-4" />Upload & Attach<input type="file" className="hidden" onChange={onFile} disabled={isSaving || !onUploadFile} /></label>
                  {(taskDraft.files || []).length === 0 ? <p className="text-xs text-slate-500">No files attached.</p> : <div className="space-y-2">{taskDraft.files.map((f, i) => <div key={`${f.file_id}-${i}`} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"><p className="truncate text-sm">{f.original_name}</p><button type="button" className="text-red-500 hover:text-red-600" onClick={() => onRemoveFile?.(f.file_id)} disabled={isSaving || !onRemoveFile}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}
                </div>
                <div className="checklist-builder rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <label className="block text-sm font-medium mb-2">Subtasks</label>
                  <div className="space-y-2 mb-3">{taskDraft.checklist.length === 0 ? <p className="text-xs text-slate-400 italic">No subtasks yet</p> : taskDraft.checklist.map((item, idx) => <div key={`${item.id || "new"}-${idx}`} className={clsx("checklist-item flex items-center gap-3 p-2 rounded-lg bg-white border", item.completed && "opacity-60")}><input type="checkbox" className="checklist-checkbox w-4 h-4" checked={Boolean(item.completed)} disabled={isSaving} onChange={() => setTaskDraft((p) => ({ ...p, checklist: p.checklist.map((c, i) => i === idx ? { ...c, completed: !c.completed, completed_at: !c.completed ? new Date().toISOString() : undefined } : c) }))} /><span className={clsx("flex-1 text-sm", item.completed && "line-through text-slate-400")}>{item.text}</span><button type="button" className="text-slate-400 hover:text-red-500" onClick={() => removeChecklistItem(idx)} disabled={isSaving}><X className="h-3.5 w-3.5" /></button></div>)}</div>
                  <div className="add-checklist-item-input flex gap-2"><input className="flex-1 px-3 py-2 text-sm border rounded-lg" placeholder="Add a subtask..." value={checklistInput} onChange={(e) => setChecklistInput(e.target.value)} disabled={isSaving} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChecklistItem(checklistInput); setChecklistInput(""); } }} /><button type="button" className="px-3 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg" onClick={() => { addChecklistItem(checklistInput); setChecklistInput(""); }} disabled={isSaving}><Plus className="h-4 w-4" /></button></div>
                  {checklistError && <p className="mt-2 text-xs text-red-500">{checklistError}</p>}
                </div>
              </>
            )}

            {tab === "owner" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1">Assign Owner</label><select className="w-full px-3 py-2 border rounded-lg" value={taskDraft.owner_id ?? ""} onChange={(e) => setTaskDraft((p) => ({ ...p, owner_id: e.target.value || null }))} disabled={isSaving}><option value="">No dedicated owner</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>)}</select><p className="mt-1 text-xs text-slate-500">Pick the single owner responsible for driving this task.</p></div>
                  <div><label className="block text-sm font-medium mb-1">Story Points</label><input type="number" min={0} max={100} step={1} className="w-full px-3 py-2 border rounded-lg" value={taskDraft.story_points ?? ""} onChange={(e) => setTaskDraft((p) => ({ ...p, story_points: e.target.value === "" ? null : Number(e.target.value) }))} disabled={isSaving} /></div>
                </div>
                <div><label className="block text-sm font-medium mb-2">Watchers</label><div className="flex flex-wrap gap-2">{members.length === 0 ? <span className="text-xs text-slate-500">No team members found.</span> : members.map((m, index) => <button key={m.user_id} type="button" className={clsx("w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-medium", assigneeColors[index % assigneeColors.length], taskDraft.watchers.includes(m.user_id) ? "ring-2 ring-primary ring-offset-2" : "border-transparent")} title={`${m.name} (${m.email})`} onClick={() => toggleWatcher(m.user_id)} disabled={isSaving}>{initials(m.name || m.email)}</button>)}</div></div>
                {isEdit && <div className="rounded-lg bg-slate-50 p-3 border border-slate-200"><label className="block text-sm font-medium mb-2">Time Spent</label><div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3"><input type="date" className="px-3 py-2 text-sm border rounded-lg" value={timeEntryDate} onChange={(e) => setTimeEntryDate?.(e.target.value)} disabled={isSaving} /><input type="time" className="px-3 py-2 text-sm border rounded-lg" value={timeEntryValue} onChange={(e) => setTimeEntryValue?.(e.target.value)} disabled={isSaving} /><button type="button" className="px-3 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg" onClick={addTimeEntry} disabled={isSaving}><Plus className="mr-1 h-4 w-4" />Add Entry</button></div>{timeEntryError && <p className="mb-2 text-xs text-red-500">{timeEntryError}</p>}{timeEntries.length === 0 ? <p className="text-xs text-slate-500">No time entries yet.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 pr-2 font-semibold text-slate-700">Date</th><th className="text-left py-2 pr-2 font-semibold text-slate-700">Time</th><th className="text-right py-2 font-semibold text-slate-700">Action</th></tr></thead><tbody>{timeEntries.map((entry, index) => <tr key={entry.id || `${entry.date}-${entry.time}-${index}`} className="border-b border-slate-100"><td className="py-2 pr-2 text-slate-700">{entry.date}</td><td className="py-2 pr-2 text-slate-700">{entry.time}</td><td className="py-2 text-right"><button type="button" className="text-red-500 hover:text-red-600" onClick={() => entry.id && removeTimeEntry?.(entry.id)} disabled={isSaving || !entry.id}><Trash2 className="h-3.5 w-3.5" /></button></td></tr>)}</tbody></table></div>}<div className="mt-3 text-sm font-medium text-slate-700">Total: {totalTime}</div></div>}
              </>
            )}

            <div className="mt-4 flex justify-between items-center">
              {isEdit ? <button type="button" className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg" onClick={onDelete} disabled={isSaving}><Trash2 className="mr-1 h-4 w-4" />Delete</button> : <span />}
              <div className="flex gap-3"><button type="button" className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg" onClick={onClose} disabled={isSaving}>Cancel</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-md disabled:opacity-60" disabled={isSaving || isHydrating}>{isSaving ? "Saving..." : isEdit ? "Save" : "Create Task"}</button></div>
            </div>
            {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export type { TaskDraft, ChecklistItem, TimeEntry, BoardColumn, TeamMember, TaskFileRef };
