# HubSpot workflow build log (IBO Nurture W0-W8)

Status as of 30 Sep 2026, verified by a fresh GET of every flow: all nine IBO Nurture workflows
exist in portal 245308986, all are switched OFF, and none has a "Go to workflow" action yet
(those are added on go-live day, see below). W1 and W6 were built by hand in the editor on
29 Sep; the other seven were built through the Automation v4 API on 30 Sep.

Editor URL pattern: `https://app-na2.hubspot.com/workflows/245308986/platform/flow/<id>/edit`

## Flows

| Key | Name | Flow id | Actions | Built |
|---|---|---|---|---|
| W0 | IBO Nurture W0 - Paid-social intake router | [5023073981](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5023073981/edit) | 7 | API, 30 Sep |
| W1 | IBO Nurture W1 - Track A qualified owner | [5021190877](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5021190877/edit) | 22 | By hand, 29 Sep |
| W2 | IBO Nurture W2 - Abandoned scheduler | [5022981825](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5022981825/edit) | 4 | API, 30 Sep |
| W3 | IBO Nurture W3 - Track B owner $1M-$3M | [5022928581](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5022928581/edit) | 26 | API, 30 Sep |
| W4 | IBO Nurture W4 - Track C owner under $1M | [5023160006](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5023160006/edit) | 18 | API, 30 Sep |
| W5 | IBO Nurture W5 - Track D advisers | [5023183577](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5023183577/edit) | 11 | API, 30 Sep |
| W6 | IBO Nurture W6 - Long tail monthly | [5021185726](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5021185726/edit) | 23 | By hand, 29 Sep |
| W7 | IBO Nurture W7 - Meeting reminder (F1) | [5022928580](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5022928580/edit) | 3 | API, 30 Sep |
| W8 | IBO Nurture W8 - No-show recovery (F3, F4, A7, A8) | [5023073984](https://app-na2.hubspot.com/workflows/245308986/platform/flow/5023073984/edit) | 15 | API, 30 Sep |

## Settings as built

| Flow | Trigger | Re-enrollment | Suppression lists | Goal |
|---|---|---|---|---|
| W0 | Original source is Paid Social | Off | 58, 59 | None |
| W1, W6 | None (manual, fed by other flows); built by hand per the guide | Per the guide (W1 off, W6 on) | 58, 59, 68 | Date of last meeting booked in meetings tool is known |
| W2 | Learn More form submission ("IBO Homepage Form (via API)", GUID ec6307ff-aa5a-4e75-b423-11846eab6ad7), filtered to the $3M+ EBITDA (profit) bands | On, each submission | 58, 59, 68 | Same as W1 |
| W3, W4, W5 | None (manual, fed by W0) | Off | 58, 59, 68 | Same as W1 |
| W7 | Date of last meeting booked is known AND email does not contain csgpartners.com, iboadvisors.com, roedgers.com, hubspot.com | On, when that date changes | None | Unenrollment rule (see check 2) |
| W8 | Associated meeting outcome is No show AND the same four email exclusions | On, but no trigger (see check 3) | None | Unenrollment rule (see check 2) |

W0 task: assigned to Edmund Breitling (owner 164598474), type Call, priority High, due 1 hour
after the action, title "Paid-social lead - call {{firstname}} {{lastname}} ({{EBITDA answer}})".

## Deviations from the guide and editor checks (do before switch-on)

1. **W0 branch order.** Built as Adviser, $1M-$3M, Under $1M, Qualified, then the default
   (no EBITDA answer). The free-text "What is your approximate annual EBITDA?" answers are
   stored as band strings such as "$1M - $3M" and "$500K - $1M", so the guide's Qualified rule
   (contains $3m/$5m/$10m) checked first would have routed every $1M-$3M owner as Qualified.
   Checking the exact-match bands first gives the outcome the guide intends. The Qualified
   branch contains-filters cover both "$3M" and "$3m" (and $5M/$5m, $10M/$10m) plus the
   profit-property bands.
2. **W7 and W8 unenrollment is the goal.** The API has no unenrollment-trigger field, so the
   unenrollment rule (Lead status is any of Unqualified, Not Interested; OR Unsubscribed from
   all email is true) was built as the workflow goal. Functionally the same (the contact leaves
   the workflow); reporting will count these as "met goal". It can be moved to unenrollment
   triggers in the editor's Settings tab in a minute if preferred.
3. **W8 re-enrollment has no trigger.** Re-enrollment is on, but the API silently drops an
   activity/association filter (meeting outcome) as a re-enrollment trigger. Until it is set,
   a contact who no-shows a second time will not re-enter W8. At go-live: Details > Settings >
   re-enrollment, tick the meeting-outcome filter.
4. **W7 action 1 direction.** "Delay until Date of last meeting booked, 1 day before" is stored
   as delta -1 day. Confirm the editor shows "1 day before" (not after) before switch-on.
5. **W4 two 45-day delays.** Actions 2 and 3 are two consecutive 45-day delays on purpose, so
   the "Go to workflow: W6" step can be inserted between them on go-live day, per the guide.
6. **W0 task due date.** "Due 1 hour after" was set via the API; check the editor shows it.

## Go-live: "Go to workflow" steps to add in the UI

HubSpot only offers a target that is already switched on, so add each step right after its
target is switched on (runbook step 6). Positions refer to the action numbers as built.

| Flow | Where | Target |
|---|---|---|
| W1 | After action 22 (27-day delay) | W6 |
| W2 | After action 4 (1-day delay) | W1 |
| W3 | After action 10 (send B4) | W6 |
| W3 | On the "Qualified" branch of actions 14, 18, 22, 26 | W1 |
| W4 | Between actions 2 and 3 (the two 45-day delays) | W6 |
| W4 | On the "Qualified" branch of actions 6, 10, 14, 18 | W1 |
| W5 | After action 11 (25-day delay) | W6 |
| W8 | After action 15 (27-day delay) | W6 |
| W0 | "Adviser" branch | W5 |
| W0 | After action 3 (set ibo_qualified False, $1M-$3M branch) | W3 |
| W0 | After action 4 (set ibo_qualified False, Under $1M branch) | W4 |
| W0 | After action 6 (send A1, Qualified branch) | W1 |
| W0 | After action 7 (send A1, no EBITDA answer) | W1 |

## Automation v4 API notes for future edits (from the 30 Sep probes)

- Unknown field keys are silently dropped (200 OK, key missing). Always GET and diff after a write.
- PUT replaces the whole flow and needs the current revisionId.
- Never reuse an action id deleted by an earlier PUT; new actions need ids at or above the
  GET's nextAvailableActionId (reuse fails with a generic 400).
- LIST_BRANCH needs `"type":"LIST_BRANCH"`; a branch that ends simply omits its connection.
- Task due date: `fields.due_time` = `{"delta":60,"timeUnit":"MINUTES"}`.
- Fixed task owner: `owner_assignment` = `{"type":"CUSTOM","value":{"type":"STATIC_VALUE","staticValue":"<ownerId>"}}`.
- "Delay until date property, N days before": actionTypeId 0-35 with delta "-N" and time_unit DAYS.
- Delay until day of week/time is actionTypeId 0-1 (delta 0 DAYS with time of day and weekdays).
- Edit record (0-5) needs no association block; associationTypeId 1 would edit the associated company.
- String exclusion operator is `DOES_NOT_CONTAIN` (`NOT_CONTAINS` is rejected).
- "Go to workflow" is actionTypeId 0-15 (its fields are not yet confirmed; read them from a GET
  after the first one is added in the UI).
