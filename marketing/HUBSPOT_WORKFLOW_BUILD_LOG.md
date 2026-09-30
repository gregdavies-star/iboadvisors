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
| W8 | Event: meeting outcome changed to No show (event 4-1724222), refined by the same four email exclusions (rebuilt 30 Sep, see check 3) | On, each no-show event | None | Unenrollment rule (see check 2) |

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
3. **W8 trigger rebuilt as an event (30 Sep).** The list-based "associated meeting outcome is No
   show" trigger could not carry a re-enrollment rule through the API, so W8's trigger is now the
   event "Meeting outcome change" (event type 4-1724222) filtered to outcome NO_SHOW, re-enrollment
   on, with the four email-domain exclusions as refinement. Each new no-show now re-enters the
   contact. CHECK IN THE EDITOR before switch-on: the API accepts any property name on an event
   filter without validating it, so open W8 and confirm the trigger reads "Meeting outcome changed,
   outcome is No show"; if the filter shows an unknown property, re-pick the outcome property in
   the trigger panel. Rollback JSON: the previous list-based enrollment is in the session notes.
4. **W7 action 1 direction.** DONE 30 Sep. The API build stored delta -1 DAYS; the canvas read
   "1 day before" but the editor panel showed 0 days / 0 hours / 1 minute before, so it would have
   fired one minute before the meeting. Re-saved in the editor as 1 day before; the API now stores
   delta "-1440" MINUTES. Rule for future API builds: express date-property delays in MINUTES.
5. **W4 two 45-day delays.** Actions 2 and 3 are two consecutive 45-day delays on purpose, so
   the "Go to workflow: W6" step can be inserted between them on go-live day, per the guide.
6. **W0 task due date.** "Due 1 hour after" was set via the API; check the editor shows it.

## Go-live status (30 Sep 2026, evening ET)

Switched ON via the API, with all "Go to workflow" hand-offs added first (19 hand-off actions in
total, each verified by GET and a before/after diff): W6, W1, W2, W3, W4, W5, W8. Full record in the
session's golive/ folder (before/after JSON per flow).

| Flow | State | Hand-off actions added |
|---|---|---|
| W6 | ON | none needed |
| W1 | ON | 23 -> W6 (after the 27-day delay) |
| W2 | ON | 5 -> W1 (after the 1-day delay) |
| W3 | ON | 27 -> W6 (between B4 and the 45-day delay); 28, 29, 30, 31 -> W1 on the Qualified branches |
| W4 | ON | 19 -> W6 (between the two 45-day delays); 20, 21, 22, 23 -> W1 on the Qualified branches |
| W5 | ON | 12 -> W6 (after the 25-day delay) |
| W8 | ON | 16 -> W6 (after the 27-day delay) |
| W7 | OFF, switch on in the editor choosing "No" for existing contacts | none needed |
| W0 | OFF, switch on in the editor choosing "No" for existing contacts, LAST | 8 -> W5 (Adviser branch); 9 -> W3; 10 -> W4; 11 -> W1 (Qualified, after A1); 12 -> W1 (no answer, after A1) |

W7 and W0 have filter triggers. The API has no "enroll existing contacts?" choice, so switching them
on through the API could enroll every existing matching contact; they are switched on in the editor.

Still to do: enroll list 61 (43) into W3, list 62 (64) into W4, list 63 (3) into W5 on Thu 1 Oct
around 7:30 ET (B1/C1/D1 send on enrollment); enroll list 57 (176) into W1 after the catch-up has
gone out on Thu 1 Oct (so A2 lands Tue 6 Oct, not the same morning as A1). Manual enrollment via
API: POST /automation/v2/workflows/<legacy id>/enrollments/contacts/<email>.

## Data fixes on 30 Sep

- The 28 Sep ibo_qualified backfill had marked 54 paid-social owners with EBITDA band "$1M - $3M" as
  True. All 54 set to False on 30 Sep; list 61 ($1M-$3M owners) grew from 43 to 96 and list 60
  (qualified) fell from 170 to 115. 27 of them were in the catch-up list; list 61 is now excluded on
  the catch-up email.
- The website lead modal stamped ibo_qualified True on Business Advisors. Fixed in modal.js (merged to
  main 30 Sep, deployed) and the 8 affected contacts cleared.
- Contacts created by the meetings scheduler and by the API are non-marketing contacts; the API cannot
  change that (hs_marketable_status is read-only). W7's F1 reminder cannot reach a scheduler-created
  contact until that source is set to create marketing contacts in Settings > Marketing Contacts.

## Automation v4 API notes for future edits (from the 30 Sep probes)

- Unknown field keys are silently dropped (200 OK, key missing). Always GET and diff after a write.
- PUT replaces the whole flow and needs the current revisionId.
- Never reuse an action id deleted by an earlier PUT; new actions need ids at or above the
  GET's nextAvailableActionId (reuse fails with a generic 400).
- LIST_BRANCH needs `"type":"LIST_BRANCH"`; a branch that ends simply omits its connection.
- Task due date: `fields.due_time` = `{"delta":60,"timeUnit":"MINUTES"}`.
- Fixed task owner: `owner_assignment` = `{"type":"CUSTOM","value":{"type":"STATIC_VALUE","staticValue":"<ownerId>"}}`.
- "Delay until date property, N days before": actionTypeId 0-35 with delta "-<N*1440>" and time_unit MINUTES. (A DAYS unit is accepted but the editor panel reads the number as minutes; W7 was corrected in the editor on 30 Sep.)
- Delay until day of week/time is actionTypeId 0-1 (delta 0 DAYS with time of day and weekdays).
- Edit record (0-5) needs no association block; associationTypeId 1 would edit the associated company.
- String exclusion operator is `DOES_NOT_CONTAIN` (`NOT_CONTAINS` is rejected).
- "Go to workflow" is actionTypeId 0-15 with `fields: {"flow_id":"<target flow id>"}` (string). Confirmed 30 Sep
  on a probe flow; other key names (flowId, workflow_id, ...) return 500.
- Event-based enrollment: the API accepts any eventTypeId and any filter property name without validation.
  Adding refinementCriteria to a flow that was never LIST_BASED fails with "Update needs listId"; switch
  it to LIST_BASED first, then to EVENT_BASED with refinement.
- Manual enrollment via the API: POST /automation/v2/workflows/<legacy workflow id>/enrollments/contacts/<email> (204). The
  legacy id comes from POST /automation/v4/workflow-id-mappings/batch/read with the v4 flow id (W0 5023073981 -> 46615263).
  The v4 flow id is rejected there. Enabling a LIST_BASED flow via PUT has no "enroll existing contacts" prompt; for the
  dry run W0 was switched to MANUAL enrollment before enabling and restored afterwards.
- hs_marketable_status is read-only in the API; contacts created via the API are non-marketing until set in the UI.
- Publishing emails is not possible via the API on this subscription: the v3 publish endpoint needs the
  marketing-email scope (Marketing Hub Professional+), and the legacy marketing-emails v1 API is retired.
  The `content` scope only grants read access to emails.
