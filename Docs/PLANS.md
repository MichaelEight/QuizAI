# QuizAI Feature Plans

## Update Quiz Feature

### Current State

**What Works:**
- ✅ Save quiz to library - saves all quiz data including cached hints, explanations, and scoring templates
- ✅ Load quiz from library - restores quiz with all cached data
- ⚠️ Update existing quiz - **Partially implemented** - can only update metadata (title, description, teacher, subject), NOT the actual questions/tasks

**How to Update Metadata Currently:**
1. Go to Library page
2. Find your quiz
3. Click the "Edit" icon (pencil)
4. Modify: Title, Description, Teacher, Subject Name, Subject Code
5. Click Save

**Limitation**: This does NOT update questions, answers, or any cached data (hints, explanations, templates).

### What's Missing

Users cannot currently:
- ❌ Update quiz questions/tasks after saving
- ❌ Overwrite a quiz with new content
- ❌ Update cached data (hints, explanations, scoring templates) for an existing quiz

Users must delete and re-save the quiz to update content, which loses the quiz ID and timestamps.

### Proposed Solution: Full "Update Quiz" Feature

**Capabilities:**
1. Load an existing quiz into the quiz session
2. Make changes (add/remove questions, regenerate cached data, etc.)
3. Save over the existing quiz (preserving ID and created date)
4. Update all cached data (hints, explanations, scoring templates)

**Implementation Approach:**

#### 1. Add "Edit Quiz" Button in Library
- New button alongside "Load" in LibraryPage.tsx
- Triggers "edit mode" when loading quiz

#### 2. Track Edit Mode in QuizPage
- Add state: `isEditMode: boolean` and `editingQuizId: string | null`
- Pass from LibraryPage via navigation state or context

#### 3. Modify Save Modal Behavior
- When in edit mode:
  - Pre-populate form with existing quiz metadata
  - Change button text from "Save" to "Update"
  - Call `updateQuiz()` instead of `saveQuiz()`

#### 4. Implement Full Update in QuizLibraryContext
- New method: `updateQuizContent(id, fullQuizData)`
- Updates:
  - All tasks (including answerOverride fields)
  - Source text
  - Uploaded file names
  - Metadata
  - Question counts (recalculated)
  - `updatedAt` timestamp
- Preserves:
  - Quiz ID
  - `createdAt` timestamp
  - `originalQuizId` (if translated)

#### 5. Update IndexedDBProvider
- Existing `update()` method uses `put()` which supports full replacement
- Ensure it accepts full `SavedQuiz` object, not just partial updates

### User Flow

**Edit Existing Quiz:**
```
LibraryPage
  ↓ Click "Edit Quiz"
  ↓
QuizPage (edit mode)
  ↓ Make changes to questions
  ↓ Regenerate hints/explanations/templates
  ↓ Click "Save to Library"
  ↓
SaveQuizModal (pre-populated)
  ↓ Click "Update"
  ↓
QuizLibraryContext.updateQuizContent()
  ↓
IndexedDB (overwrite existing quiz)
  ↓
Navigate back to Library
```

**Versus Load Quiz (Current):**
```
LibraryPage
  ↓ Click "Load"
  ↓
QuizPage (normal mode)
  ↓ Take quiz, answer questions
  ↓ Click "Save to Library" (if modified)
  ↓
SaveQuizModal (empty form)
  ↓ Creates NEW quiz (different ID)
```

### Benefits

1. **Preserve Quiz Identity**: Same ID across updates (important for future features like sharing, analytics)
2. **Update Cached Data**: Regenerate hints, explanations, templates without losing quiz
3. **Iterative Improvement**: Teachers can refine quizzes over time
4. **Clear Timestamps**: `createdAt` shows original creation, `updatedAt` shows last modification
5. **Better UX**: Clear distinction between "load to take" vs "load to edit"

### Technical Considerations

**Data to Preserve on Update:**
- Quiz ID
- `createdAt` timestamp
- `originalQuizId` (if this is a translation)

**Data to Update:**
- `tasks` array (full replacement, includes all answerOverride data)
- `sourceText`
- `uploadedFileNames`
- All metadata fields (title, description, etc.)
- Question counts (recalculated)
- `updatedAt` timestamp

**Edge Cases:**
- User loads quiz in edit mode but navigates away → handle unsaved changes warning
- User loads same quiz in multiple tabs → last save wins (IndexedDB default behavior)
- Quiz has been deleted by another tab → show error, cannot update non-existent quiz

### Files to Modify

1. **`src/LibraryPage.tsx`**
   - Add "Edit Quiz" button
   - New handler: `handleEditQuiz(quiz)`
   - Navigate to QuizPage with edit mode flag

2. **`src/QuizPage.tsx`**
   - Add state: `isEditMode`, `editingQuizId`
   - Read edit mode from navigation state/context
   - Pass edit mode info to SaveQuizModal

3. **`src/components/SaveQuizModal.tsx`**
   - Accept props: `editMode?: boolean`, `existingQuizId?: string`, `existingMetadata?: Partial<SavedQuiz>`
   - Pre-populate form if editing
   - Change submit button text: "Save" vs "Update"
   - Call appropriate context method

4. **`src/context/QuizLibraryContext.tsx`**
   - Add method: `updateQuizContent(id: string, data: CreateQuizData): Promise<void>`
   - Fetch existing quiz
   - Preserve ID, createdAt, originalQuizId
   - Update all other fields
   - Call storage.update()

5. **`src/services/storage/IndexedDBProvider.ts`**
   - Review `update()` method - ensure it supports full object replacement
   - May need new method: `updateFull(quiz: SavedQuiz)` using `put()`

### Alternative: "Save As New" vs "Update Existing"

Could also provide both options:
- "Save as New Quiz" (current behavior, generates new ID)
- "Update Original Quiz" (new behavior, preserves ID)

This gives users flexibility to create variants while preserving originals.

---

## Implementation Priority

**Phase 1**: Full update capability (preserves ID, updates all content)
**Phase 2**: "Save as new" vs "Update" choice in modal
**Phase 3**: Unsaved changes warning when navigating away from edit mode
