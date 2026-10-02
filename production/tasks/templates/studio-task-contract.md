# Task contract template

## Identity
- Task ID / title:
- Product goal / approved scope reference:
- Owner role / reason this role is needed:
- Thread ID / status:
- Priority / player value:

## Inputs and dependencies
- Canonical requirement / GDD / ADR / user decision:
- Input files and relevant evidence/hash/version:
- Dependencies and satisfied/unsatisfied evidence:
- Current blockers and exact reopen conditions:

## File lease and permissions
- Exact writable paths (enumerate, not the whole repository):
- Read-only paths / files owned by another task:
- PM memory/backlog: read-only to executor.
- Shared Unity database/GUID/runtime owner:
- Out of scope:
- Permission mechanism/fallback when sandbox blocks write:

## Deliverable and acceptance
- Implementable output (not just a report unless this is explicitly a planning/review task):
- Acceptance criteria, each independently testable:
- Source/static/import/binding/runtime/visual gates and required verdicts:
- Must preserve existing behavior, original art and user changes:

## Verification and result
- Exact validation commands:
- Expected evidence files/log/XML and required assertions/counts:
- Changed files:
- Actual command / exit / result:
- Criteria PASS / FAIL / CONCERNS / BLOCKED / NOT RUN:
- Unresolved work and suggested next step:

Executor returns results in its own chat/evidence. PM alone accepts DONE and dispatches a follow-up. No unapproved commit/push/spend/GUI or cross-thread messaging.
