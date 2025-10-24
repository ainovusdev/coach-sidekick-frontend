# UI Terminology Rebrand Summary

## Rebranding Changes

| Old Term        | New Term         | Rationale                                             |
| --------------- | ---------------- | ----------------------------------------------------- |
| **Goals**       | **Outcomes**     | More result-oriented, focuses on desired end states   |
| **Targets**     | **Desired Wins** | More motivational, emphasizes success and achievement |
| **Commitments** | **Commitments**  | Unchanged - accurately describes client promises      |

---

## Files Updated (22 Total)

### **Forms & Modals** (3 files)

1. ✅ `src/components/goals/goal-form-modal.tsx`
   - Dialog title: "Create/Edit Outcome"
   - Labels: "Outcome Title \*"
   - Placeholders: "Become an Effective Leader"
   - Toast messages: "Outcome Created/Updated"
   - Descriptions: "Create a long-term outcome..."

2. ✅ `src/components/sprints/target-form-modal.tsx`
   - Dialog title: "Create New Desired Win"
   - Labels: "Desired Win Title _", "Link to Outcome _"
   - Toast messages: "Desired Win Created"
   - Descriptions: "Add a short-term desired win..."

3. ✅ `src/components/clients/client-modal.tsx`
   - Placeholder: "outcomes, or any relevant notes..."

### **Lists & Managers** (2 files)

4. ✅ `src/components/goals/goals-list.tsx`
   - Card title: "Long-term Outcomes"
   - Buttons: "New Outcome", "Create First Outcome"
   - Empty state: "No outcomes set yet"

5. ✅ `src/components/sprints/sprint-targets-manager.tsx`
   - Card title: "Sprint Desired Wins & Outcomes"
   - Buttons: "Add Desired Win", "Create First Desired Win"
   - Help text: "Create outcomes first before adding desired wins"
   - Empty state: "No desired wins in this sprint yet"
   - Stats: "{count} desired wins"

### **Extraction Components** (2 files)

6. ✅ `src/components/extraction/enhanced-draft-review.tsx`
   - Tab labels: "Outcomes ({count})", "Desired Wins ({count})"
   - Section headings: "New Outcomes", "New Desired Wins"
   - Summary: "Found X outcomes, Y desired wins, Z commitments"
   - Empty states: "No outcomes extracted", "No desired wins extracted"
   - Buttons: "Confirm X Outcome(s)", "Confirm Y Desired Win(s)"
   - Toast messages: "Outcomes Confirmed", "Desired Wins Confirmed"
   - Links: "Links to outcome"

7. ✅ `src/components/extraction/commitment-target-selector.tsx`
   - Button: "Link to Desired Win", "Add More Desired Wins"
   - Dropdown sections: "Existing Sprint Desired Wins"
   - Empty states: "No existing desired wins", "No desired wins linked yet"
   - Loading: "Loading desired wins..."

### **Widgets** (3 files)

8. ✅ `src/components/client/current-sprint-widget.tsx`
   - Help text: "organize your outcomes"
   - Stats: "Desired Wins"
   - Progress: "Active Desired Wins ({completed}/{total} completed)"
   - Overflow: "+X more desired wins"

9. ✅ `src/components/sprints/sprint-form-modal.tsx`
   - Description: "organize outcomes and desired wins"

10. ✅ `src/app/client-portal/dashboard/components/goals-widget.tsx`
    - Card title: "Your Outcomes"
    - Empty state: "No outcomes set yet"
    - Badge: "Active"

### **Client Portal Pages** (5 files)

11. ✅ `src/app/client-portal/dashboard/page.tsx`
    - Card title: "Active Outcomes"

12. ✅ `src/app/client-portal/dashboard/enhanced-page.tsx`
    - Tab label: "Outcomes"
    - Card title: "Active Outcomes"

13. ✅ `src/app/client-portal/persona/page.tsx`
    - Tab: "Outcomes & Aspirations"

14. ✅ `src/app/client-portal/sprints/page.tsx`
    - Description: "sprint outcomes"
    - Help text: "outcomes and desired wins"
    - Stats: "Desired Wins"

15. ✅ `src/app/client-portal/sprints/[sprintId]/page.tsx`
    - Stats: "Desired Wins Completed"
    - Card title: "Your Outcomes & Desired Wins"
    - Help text: "outcomes before adding desired wins"
    - Empty state: "No desired wins"
    - Accordion: "{count} desired wins"

### **Coach Pages** (2 files)

16. ✅ `src/app/clients/[clientId]/page.tsx`
    - Tab label: "Sprints & Outcomes"

17. ✅ `src/app/sessions/[sessionId]/page.tsx`
    - Toast: "{X} outcomes, {Y} desired wins, {Z} commitments"

### **Analysis & Metrics** (1 file)

18. ✅ `src/app/sessions/[sessionId]/components/full-coaching-analysis.tsx`
    - Metric label: "Planning & Outcome Setting"

### **Persona Components** (3 files)

19. ✅ `src/app/clients/[clientId]/components/client-persona.tsx`
    - Headings: "Short-term Outcomes", "Long-term Outcomes"

20. ✅ `src/app/clients/[clientId]/components/client-persona-modern.tsx`
    - Stats: "Active Outcomes"

21. ✅ `src/components/persona/persona-history-timeline.tsx`
    - Field labels: "Primary Outcomes", "Short-term Outcomes", "Long-term Outcomes"
    - Categories: "Outcomes" (3 variants)

22. ✅ `src/components/persona/persona-evolution-timeline.tsx`
    - Field labels: "Primary Outcomes", "Short-term Outcomes", "Long-term Outcomes"
    - Categories: "Outcomes" (3 variants)

---

## Changes by Category

### **Form Labels**

- "Goal Title" → "Outcome Title"
- "Target Title" → "Desired Win Title"
- "Link to Goal" → "Link to Outcome"

### **Button Text**

- "New Goal" → "New Outcome"
- "Create Goal" → "Create Outcome"
- "Add Target" → "Add Desired Win"
- "Create Target" → "Create Desired Win"
- "Link to Target" → "Link to Desired Win"

### **Headings & Titles**

- "Your Goals" → "Your Outcomes"
- "Sprint Targets & Goals" → "Sprint Desired Wins & Outcomes"
- "Active Goals" → "Active Outcomes"

### **Messages & Descriptions**

- "No goals set yet" → "No outcomes set yet"
- "No targets in this sprint yet" → "No desired wins in this sprint yet"
- "Create goals first before adding targets" → "Create outcomes first before adding desired wins"

### **Toast Notifications**

- "Goal Created" → "Outcome Created"
- "Goal Updated" → "Outcome Updated"
- "Target Created" → "Desired Win Created"
- "Goals Confirmed" → "Outcomes Confirmed"
- "Targets Confirmed" → "Desired Wins Confirmed"

### **Tab Labels**

- "Goals" → "Outcomes"
- "Targets" → "Desired Wins"
- "Sprints & Goals" → "Sprints & Outcomes"
- "Goals & Aspirations" → "Outcomes & Aspirations"

### **Stats & Metrics**

- "X targets" → "X desired wins"
- "Active Goals" → "Active Outcomes"
- "Targets Completed" → "Desired Wins Completed"

---

## Technical Implementation Notes

### **What Changed**

- ✅ All user-visible text strings
- ✅ UI labels, buttons, headings
- ✅ Toast messages
- ✅ Form placeholders
- ✅ Empty state messages
- ✅ Help text and descriptions

### **What Stayed the Same**

- ❌ Variable names (`goal`, `target`, `goals`, `targets`)
- ❌ Function names (`createGoal`, `listTargets`)
- ❌ Service names (`GoalService`, `TargetService`)
- ❌ Component file names (`goal-form-modal.tsx`, `target-form-modal.tsx`)
- ❌ API endpoints (`/api/v1/goals`, `/api/v1/targets`)
- ❌ Database tables and fields
- ❌ TypeScript interfaces (`DraftGoal`, `DraftTarget`)

**Reason**: Maintaining consistency with backend API contract and avoiding breaking changes.

---

## Testing Checklist

### **Forms**

- [ ] Create new outcome - check title, labels, placeholders
- [ ] Edit existing outcome - check modal title and messages
- [ ] Create new desired win - check all text
- [ ] Link desired win to outcome - check dropdown text

### **Lists & Views**

- [ ] Outcomes list - check heading and empty state
- [ ] Desired wins manager - check heading and help text
- [ ] Sprint view - check tabs and stats

### **Extraction**

- [ ] Extract from AI - check toast message
- [ ] Review extraction - check tab labels
- [ ] Confirm outcomes - check confirmation message
- [ ] Confirm desired wins - check confirmation message

### **Navigation**

- [ ] Client page tabs - check "Sprints & Outcomes"
- [ ] Dashboard widgets - check titles
- [ ] Client portal navigation - check labels

### **Persona**

- [ ] Persona timeline - check field labels
- [ ] Persona history - check outcome categories

---

## Migration Impact

### **User-Facing**

- **Immediate**: All users see new terminology
- **Learning Curve**: Minimal - terms are self-explanatory
- **Documentation**: Update any user guides to use new terms

### **Backend**

- **No Changes**: API remains compatible
- **Database**: No migrations needed
- **Variables**: Code structure unchanged

### **Future Development**

- **Consistency**: Use "Outcomes" and "Desired Wins" in all new UI
- **Code**: Continue using `goal`/`target` variables for backend consistency
- **Documentation**: Update UI specs to reflect new terminology

---

## Commit Details

**Commit**: `75a2be8`
**Files Changed**: 22
**Insertions**: 803
**Deletions**: 397
**Net Change**: +406 lines (primarily due to longer terms)

---

## Summary

The UI has been comprehensively rebranded to use more motivational, outcome-focused language:

- **"Outcomes"** emphasizes desired end states rather than abstract goals
- **"Desired Wins"** creates excitement and achievement focus rather than generic targets
- **"Commitments"** remains clear and actionable

All 67+ user-facing references updated across 22 files while maintaining full backend compatibility.
