import { Task } from '../QuestionsTypes';

export interface TaskDiff {
  taskId: string;
  type: 'added' | 'removed' | 'modified';
  oldTask?: Task;
  newTask?: Task;
  changes?: ChangeDetail[];
}

export interface ChangeDetail {
  field: string;
  fieldLabel: string; // Human-readable label
  oldValue: any;
  newValue: any;
  category: 'content' | 'answers' | 'ai-generated';
}

export interface QuizDiffSummary {
  totalChanges: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  taskDiffs: TaskDiff[];
}

export function compareQuizzes(
  libraryTasks: Task[],
  currentTasks: Task[]
): QuizDiffSummary {
  // Create ID maps for fast lookup
  const libraryMap = new Map(libraryTasks.map(t => [t.id, t]));
  const currentMap = new Map(currentTasks.map(t => [t.id, t]));

  const taskDiffs: TaskDiff[] = [];

  // Find added tasks
  for (const currentTask of currentTasks) {
    // Skip removed tasks
    if (currentTask.isRemoved) continue;

    if (!libraryMap.has(currentTask.id)) {
      taskDiffs.push({
        taskId: currentTask.id,
        type: 'added',
        newTask: currentTask
      });
    }
  }

  // Find removed tasks
  for (const libraryTask of libraryTasks) {
    const currentTask = currentMap.get(libraryTask.id);
    if (!currentTask || currentTask.isRemoved) {
      taskDiffs.push({
        taskId: libraryTask.id,
        type: 'removed',
        oldTask: libraryTask
      });
    }
  }

  // Find modified tasks
  for (const currentTask of currentTasks) {
    // Skip removed tasks
    if (currentTask.isRemoved) continue;

    const libraryTask = libraryMap.get(currentTask.id);
    if (libraryTask) {
      const changes = detectTaskChanges(libraryTask, currentTask);
      if (changes.length > 0) {
        taskDiffs.push({
          taskId: currentTask.id,
          type: 'modified',
          oldTask: libraryTask,
          newTask: currentTask,
          changes
        });
      }
    }
  }

  // Calculate summary
  return {
    totalChanges: taskDiffs.length,
    addedCount: taskDiffs.filter(d => d.type === 'added').length,
    removedCount: taskDiffs.filter(d => d.type === 'removed').length,
    modifiedCount: taskDiffs.filter(d => d.type === 'modified').length,
    taskDiffs
  };
}

function detectTaskChanges(oldTask: Task, newTask: Task): ChangeDetail[] {
  const changes: ChangeDetail[] = [];

  // 1. Question text
  if (oldTask.question.value !== newTask.question.value) {
    changes.push({
      field: 'question.value',
      fieldLabel: 'Question text',
      oldValue: oldTask.question.value,
      newValue: newTask.question.value,
      category: 'content'
    });
  }

  // 2. Question type (open vs closed)
  if (oldTask.question.isOpen !== newTask.question.isOpen) {
    changes.push({
      field: 'question.isOpen',
      fieldLabel: 'Question type',
      oldValue: oldTask.question.isOpen ? 'Open' : 'Closed',
      newValue: newTask.question.isOpen ? 'Open' : 'Closed',
      category: 'content'
    });
  }

  // 3. Answers (for closed questions)
  if (!oldTask.question.isOpen && !newTask.question.isOpen) {
    const oldAnswers = oldTask.answers || [];
    const newAnswers = newTask.answers || [];

    // Compare answer count
    if (oldAnswers.length !== newAnswers.length) {
      changes.push({
        field: 'answers.length',
        fieldLabel: 'Number of answers',
        oldValue: oldAnswers.length,
        newValue: newAnswers.length,
        category: 'answers'
      });
    }

    // Compare each answer
    for (let i = 0; i < Math.max(oldAnswers.length, newAnswers.length); i++) {
      const oldAns = oldAnswers[i];
      const newAns = newAnswers[i];

      if (!oldAns && newAns) {
        changes.push({
          field: `answers[${i}]`,
          fieldLabel: `Answer ${i + 1}`,
          oldValue: undefined,
          newValue: newAns.value,
          category: 'answers'
        });
      } else if (oldAns && !newAns) {
        changes.push({
          field: `answers[${i}]`,
          fieldLabel: `Answer ${i + 1}`,
          oldValue: oldAns.value,
          newValue: undefined,
          category: 'answers'
        });
      } else if (oldAns && newAns) {
        if (oldAns.value !== newAns.value) {
          changes.push({
            field: `answers[${i}].value`,
            fieldLabel: `Answer ${i + 1} text`,
            oldValue: oldAns.value,
            newValue: newAns.value,
            category: 'answers'
          });
        }
        if (oldAns.isCorrect !== newAns.isCorrect) {
          changes.push({
            field: `answers[${i}].isCorrect`,
            fieldLabel: `Answer ${i + 1} correctness`,
            oldValue: oldAns.isCorrect ? 'Correct' : 'Incorrect',
            newValue: newAns.isCorrect ? 'Correct' : 'Incorrect',
            category: 'answers'
          });
        }
      }
    }
  }

  // 4. AI-generated content in answerOverride
  const oldOverride = oldTask.answerOverride;
  const newOverride = newTask.answerOverride;

  // Hint
  if ((oldOverride?.hint || '') !== (newOverride?.hint || '')) {
    changes.push({
      field: 'answerOverride.hint',
      fieldLabel: 'Hint',
      oldValue: oldOverride?.hint || '(none)',
      newValue: newOverride?.hint || '(none)',
      category: 'ai-generated'
    });
  }

  // Explanation
  if ((oldOverride?.explanation || '') !== (newOverride?.explanation || '')) {
    changes.push({
      field: 'answerOverride.explanation',
      fieldLabel: 'Explanation',
      oldValue: oldOverride?.explanation || '(none)',
      newValue: newOverride?.explanation || '(none)',
      category: 'ai-generated'
    });
  }

  // Expected answer (for open questions)
  if ((oldOverride?.generatedOpenAnswer || '') !== (newOverride?.generatedOpenAnswer || '')) {
    changes.push({
      field: 'answerOverride.generatedOpenAnswer',
      fieldLabel: 'Expected answer',
      oldValue: oldOverride?.generatedOpenAnswer || '(none)',
      newValue: newOverride?.generatedOpenAnswer || '(none)',
      category: 'ai-generated'
    });
  }

  // Score template (deep compare)
  const oldTemplate = oldOverride?.scoreTemplate || [];
  const newTemplate = newOverride?.scoreTemplate || [];
  if (JSON.stringify(oldTemplate) !== JSON.stringify(newTemplate)) {
    changes.push({
      field: 'answerOverride.scoreTemplate',
      fieldLabel: 'Score template',
      oldValue: oldTemplate.length > 0 ? `${oldTemplate.length} scoring criteria` : '(none)',
      newValue: newTemplate.length > 0 ? `${newTemplate.length} scoring criteria` : '(none)',
      category: 'ai-generated'
    });
  }

  return changes;
}
