import { useState } from 'react';
import { BaseModal } from './BaseModal';
import { TaskDiff, ChangeDetail, QuizDiffSummary } from '../utils/quizDiff';
import { Task } from '../QuestionsTypes';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffSummary: QuizDiffSummary;
  currentVersion: number;
  onConfirmUpdate: () => void;
}

export function DiffModal({
  isOpen,
  onClose,
  diffSummary,
  currentVersion,
  onConfirmUpdate
}: DiffModalProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            Update Quiz to v{currentVersion + 1}?
          </h2>
          <p className="text-sm text-slate-400">Review changes before updating</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-emerald-400">
            {diffSummary.totalChanges}
          </div>
          <div className="flex-1">
            <p className="text-slate-300 font-medium">
              {diffSummary.totalChanges === 1 ? 'question changed' : 'questions changed'}
            </p>
            <div className="flex items-center gap-3 text-sm mt-1">
              {diffSummary.addedCount > 0 && (
                <span className="text-emerald-400">
                  {diffSummary.addedCount} added
                </span>
              )}
              {diffSummary.removedCount > 0 && (
                <span className="text-rose-400">
                  {diffSummary.removedCount} removed
                </span>
              )}
              {diffSummary.modifiedCount > 0 && (
                <span className="text-amber-400">
                  {diffSummary.modifiedCount} modified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Changes List */}
      <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
        {diffSummary.taskDiffs.map(diff => (
          <TaskDiffItem
            key={diff.taskId}
            diff={diff}
            isExpanded={expandedTasks.has(diff.taskId)}
            onToggle={() => toggleExpanded(diff.taskId)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirmUpdate}
          className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Update to v{currentVersion + 1}
        </button>
      </div>
    </BaseModal>
  );
}

interface TaskDiffItemProps {
  diff: TaskDiff;
  isExpanded: boolean;
  onToggle: () => void;
}

function TaskDiffItem({ diff, isExpanded, onToggle }: TaskDiffItemProps) {
  const questionPreview = diff.type === 'added'
    ? diff.newTask?.question.value.slice(0, 60)
    : diff.oldTask?.question.value.slice(0, 60);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header: question preview + change type badge */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors text-left">
        <ChangeBadge type={diff.type} />
        <span className="flex-1 text-slate-200 truncate">{questionPreview}...</span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded: detailed changes */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/70">
          {diff.type === 'added' && <AddedTaskDetails task={diff.newTask!} />}
          {diff.type === 'removed' && <RemovedTaskDetails task={diff.oldTask!} />}
          {diff.type === 'modified' && <ModifiedTaskDetails changes={diff.changes!} />}
        </div>
      )}
    </div>
  );
}

interface ChangeBadgeProps {
  type: 'added' | 'removed' | 'modified';
}

function ChangeBadge({ type }: ChangeBadgeProps) {
  const styles = {
    added: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    removed: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    modified: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  };

  const labels = {
    added: 'Added',
    removed: 'Removed',
    modified: 'Modified'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function AddedTaskDetails({ task }: { task: Task }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1">Question:</p>
        <p className="text-sm text-emerald-300 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
          {task.question.value}
        </p>
      </div>
      {task.answers && task.answers.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Answers:</p>
          <div className="space-y-1">
            {task.answers.map((ans, i) => (
              <div
                key={i}
                className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded flex items-center gap-2">
                {ans.isCorrect && (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{ans.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RemovedTaskDetails({ task }: { task: Task }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1">Question:</p>
        <p className="text-sm text-rose-300 bg-rose-500/10 p-2 rounded border border-rose-500/20 line-through">
          {task.question.value}
        </p>
      </div>
      {task.answers && task.answers.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Answers:</p>
          <div className="space-y-1">
            {task.answers.map((ans, i) => (
              <div
                key={i}
                className="text-sm text-slate-400 bg-slate-700/30 p-2 rounded line-through">
                {ans.value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModifiedTaskDetails({ changes }: { changes: ChangeDetail[] }) {
  return (
    <div className="space-y-3">
      {changes.map((change, idx) => (
        <div key={idx} className="border-l-2 border-amber-500/50 pl-3">
          <p className="text-xs text-amber-300 font-medium mb-2">{change.fieldLabel}</p>
          <div className="space-y-2">
            <ValueComparison label="Old" value={change.oldValue} type="old" />
            <div className="flex items-center gap-2 text-slate-500">
              <div className="flex-1 border-t border-slate-700"></div>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <div className="flex-1 border-t border-slate-700"></div>
            </div>
            <ValueComparison label="New" value={change.newValue} type="new" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ValueComparisonProps {
  label: string;
  value: unknown;
  type: 'old' | 'new';
}

function ValueComparison({ label, value, type }: ValueComparisonProps) {
  const styles = type === 'old'
    ? 'bg-rose-500/10 border-rose-500/20 text-slate-300'
    : 'bg-emerald-500/10 border-emerald-500/20 text-slate-200';

  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}:</p>
      <div className={`p-2 rounded border text-sm ${styles}`}>
        <ValueDisplay value={value} />
      </div>
    </div>
  );
}

function ValueDisplay({ value }: { value: unknown }) {
  if (value === undefined || value === null) {
    return <span className="text-slate-500 italic">(none)</span>;
  }

  if (typeof value === 'string') {
    if (value.length > 200) {
      return <span>{value.slice(0, 200)}...</span>;
    }
    return <span>{value}</span>;
  }

  if (typeof value === 'object') {
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
  }

  return <span>{String(value)}</span>;
}
