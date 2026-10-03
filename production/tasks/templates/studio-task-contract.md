# Task Contract Template — Ma Sói Game Studio

## Identity
- Task ID / Title:
- Product goal / approved scope reference:
- Owner role / reason this role is needed:
- Thread ID / status:
- Requested model / reasoning / reason (AGENTS.md role table):
- Host-confirmed effective configuration / unverified limitation:
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
- Shared Game State / Store owner:
- Out of scope:
- Permission mechanism/fallback when sandbox blocks write:

## Bundled execution plan
- One deliverable / independent batch / reason for grouping:
- Authorized sequential phases (no extra PM handoff where prerequisites/gates are already satisfied):
- Required source approvals/reviews and dependent branches that must stop if missing:
- Parallel preparation leases / conflicts with other writers or compilation:
- Verification budget: one relevant batch invocation; exact cases/evidence:
- Bounded changed-source correction/verification allowance, if explicitly granted:
- Stop conditions and exact handoff when input/scope/permission is missing:

## Deliverable and acceptance
- Implementable output (not just a report unless this is explicitly a planning/review task):
- Acceptance criteria, each independently testable:
- Source / static / logic / UI / runtime gates and required verdicts:
- Must preserve existing behavior and user-approved decisions:

## Verification and result
- Exact validation commands:
- Expected evidence files/log/counts:
- Changed files:
- Actual command / exit / result:
- Criteria PASS / FAIL / CONCERNS / BLOCKED / NOT RUN:
- Unresolved work and suggested next step:
- Short PM report: changed decision → actual action/status → exact next action; operating bottleneck/remedy when relevant:

Executor returns results in its own chat/evidence. PM alone accepts DONE and dispatches a follow-up. No unapproved commit/push/spend or cross-thread messaging.
