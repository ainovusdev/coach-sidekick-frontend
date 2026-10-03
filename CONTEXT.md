# Frontend glossary (CONTEXT.md)

The names the UI uses for the backend's concepts (see `../coach-sidekick-backend/CONTEXT.md` for the entities). Use these in copy, routes, component names and tests.

## Surfaces

- **Coach app**: everything under `/clients`, `/sessions`, `/meeting`, `/commitments`, `/resources`, `/settings`; nav in `components/layout/navigation.tsx`.
- **Sidekick / client portal**: `/client-portal/*`, the coachee-facing app; nav in `components/client-portal/client-navigation.tsx`. "Your Sidekick" in copy.
- **Admin panel**: `/admin/*`, super-admin only; includes the **data-analyst agent** at `/agent`.
- **Sandbox cockpit**: `/sandboxes/{id}` for our side; tabs Today · Delivery · Outcomes · Commitments · People · Groups · Settings. **Client report**: the same route for the primary client and supervisors. **Dashboard**: `/sandboxes`.
- **Detail pages**: `/sandboxes/{id}/clients|coaches|groups/{id}`.

## Words in copy

- **Client** in the coach app; **coachee** inside sandboxes. Never "customer".
- **Session**; **group session**; **live meeting** (the in-call screen under `/meeting`).
- **Commitment** everywhere a work item appears (coach app, portal, sandbox timeline). Not "task", not "todo".
- **Thrill Form**: the post-session questionnaire. **Coach reflection**: the coach's post-session notes.
- **Gold seal / gold sealed / gold sealing**: the client's approval of an outcome. **Propose**, **request changes**, **reopen**.
- **Pairing** (1:1) and **group** inside a sandbox. Not "pod".
- **Hats**: account executive, sandbox owner, lead coach, primary client, primary client admin, supervisor.
- **View as** (super admin impersonation); **profile switcher** (a coachee changing their active client profile).
- **Proficiency Ladder**: the trainee rubric shown on session analysis when the `proficiency-rubric` flag is on.
- A number that cannot be measured shows **"—"**, never 0.

## Design-system tokens

`bg-paper` (page background), `text-ink` / `text-ink-muted` (text), `border-line` (rules), status pairs for success/warning/danger. Components live in `components/ui/`; see `.design-sync/conventions.md` for the full set.
