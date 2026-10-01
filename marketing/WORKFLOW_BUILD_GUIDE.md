# Workflow build guide (go-live step 3)

Everything here is done in HubSpot: Automation > Workflows. Build in this order so every
"Enroll in another workflow" action has a target that already exists:
W6, W1, W2, W3, W4, W5, W7, W8, W0. Leave all of them switched off. HubSpot autosaves the
draft as you build; do NOT click "Review and publish" (that is the on switch, step 6/8).

Nine workflows, not eight: the meeting track is split into W7 (reminder before the meeting)
and W8 (no-show recovery), because a no-show outcome is entered by hand after the meeting and a
separate trigger is more reliable than a timed check.

## Before you start

Two HubSpot rules found while building W6 (29 Sep):

- "Go to workflow" (HubSpot's name for Enroll in another workflow) only lists workflows that are
  switched ON. Build every workflow now WITHOUT its Go to workflow steps, then add them on go-live
  day right after the target is switched on, in the order W6, W1, W2, W3, W4, W5, W7, W8, W0.
  Editing a live workflow is allowed. Each is a one-minute edit.
- A workflow cannot enroll into itself. W6 loops with "Go to action" back to action 1. If Go to
  action only offers later actions, duplicate actions 1-11 once instead (eight months of coverage).

- Lists 58 "Suppression - never nurture" and 59 "Suppression - met Michael (static, 29 Sep 2026)" exist.
- The 27 emails are drafts in Marketing > Email. Only Automated-type emails show up in the
  Send email picker, so the retired batch copies of B5, F1, F4 cannot be chosen by mistake.
- Operating rule for Michael/Edmund: after every meeting, set the meeting's Outcome
  (Completed / No show / Canceled) on the contact timeline. W8 depends on it.

## Creating each workflow

1. Automation > Workflows > Create workflow > From scratch.
2. Object: Contacts. Type: Blank workflow. Next.
3. Click the name at top left and rename (names below).
4. Trigger: "Set up triggers" if the workflow has one; otherwise close the trigger panel.
   A workflow with no trigger can still be turned on; it only receives contacts from other
   workflows or manual enrollment.
5. Add actions with the + between steps. Action names used below are HubSpot's:
   - Send email (Communications)
   - Delay for a set amount of time / Delay until a day or time / Delay until a specific date or
     date property (Delay)
   - If/then branch (Branch)
   - Enroll in another workflow (Workflow)
   - Create task, Set property value (CRM)
6. Settings tab (top of editor) for the common settings below.

## Settings common to W1 to W6 (trigger box > Details > Settings tab)

HubSpot's editor (as of 29 Sep) has no free-form unenrollment criteria; unenrollment is done
with suppression lists and a goal. Click Details on the trigger box at the top of the canvas,
then the Settings tab:

- Re-enroll: off (W6: on).
- "Added to a suppression segment": ON, then pick three lists:
  - 58 "Suppression - never nurture" (internal domains, CSG Partners, Michael's test addresses,
    scheduler bookings, customers, Unqualified / Not Interested)
  - 59 "Suppression - met Michael (static, 29 Sep 2026)"
  - 68 "Suppression - replied or contact in a year" (replied to a marketing or sales email, or
    lead status Contact In a Year; created 29 Sep for this purpose)
- "Met a workflow goal": ON, goal criteria: Latest meeting activity is known.
- "No longer meet eligibility conditions": leave as is.
- Save.

The Settings item in the top menu bar (run windows, pause dates, auto turn-off) is not used.

## W6 - IBO Nurture W6 - Long tail monthly (build first)

Trigger: none. Re-enrollment: on.

1. Delay until a day or time (Tuesday 7:30 AM)
2. Send email: IBO Nurture L1 - The pros and cons, honestly
3. Delay 30 days
4. Delay until Tuesday 7:30 AM
5. Send email: IBO Nurture L2 - How they'll value your company
6. Delay 30 days
7. Delay until Tuesday 7:30 AM
8. Send email: IBO Nurture L3 - The second bite, explained
9. Delay 30 days
10. Delay until Tuesday 7:30 AM
11. Send email: IBO Nurture Q - Still the right time to talk? (quarterly re-ask)
12. Go to action: action 1 (loops until L4-L10 are written). See the rule above if only later actions are offered.

## W1 - IBO Nurture W1 - Track A qualified owner

Design change 29 Sep: W1 does NOT send A1. A1 is sent by whichever workflow hands the contact
over (W0 for new leads; the batch catch-up email for list 57; A1b from W2). That removes the
if/then branch, so no branch logic is needed anywhere in W1.

Trigger: Manually triggered (fed by W0, W2, W3, W4 and the manual list-57 enrollment).
Settings tab: Re-enroll off; suppression segments 58, 59, 68; goal "Date of last meeting booked
in meetings tool is known".

1. Delay 1 day
2. Delay until a day or time (Tue/Wed/Thu 7:30 AM)
3. Send email: IBO Nurture A2 - Most Owners/Founders Don't Know this Exists
4. Delay 1 day
5. Delay until a day or time
6. Send email: IBO Nurture A3 - The $26M difference
7. Delay 1 day
8. Delay until a day or time
9. Send email: IBO Nurture A4 - The Founders/Owners Exit Conversation is Broken
10. Delay 3 days
11. Delay until a day or time
12. Send email: IBO Nurture A5 - A note from Michael Chasen
13. Delay 3 days
14. Delay until a day or time
15. Send email: IBO Nurture A6 - What PE hopes you never learn
16. Delay 4 days
17. Delay until a day or time
18. Send email: IBO Nurture A7 - Three options, pick one
19. Delay 5 days
20. Delay until a day or time
21. Send email: IBO Nurture A8 - Should I close your file? (breakup)
22. Delay 27 days
23. (go-live day, after W6 is on) Go to workflow: W6

## W2 - IBO Nurture W2 - Abandoned scheduler

Trigger: When filter criteria is met. Form submission: "Learn More" form, which is "IBO Homepage Form (via API)" in Marketing > Forms
(GUID ec6307ff-aa5a-4e75-b423-11846eab6ad7) has been filled out
AND contact property "What is your approximate annual EBITDA (profit)?" is any of
$3M - $5M, $5M - $10M, $3M - $10M, $10M - $20M, $10M+, $20M+.
Enroll existing contacts: No. Re-enrollment: on (on each new form submission).

1. Delay 60 minutes
2. If/then branch: Date of last meeting booked in meetings tool is known.
   - Yes: end (they booked).
   - No: continue.
3. Send email: IBO Nurture A1b - Your calendar link (abandoned scheduler)
4. Delay 1 day
5. Enroll in another workflow: W1

## W3 - IBO Nurture W3 - Track B owner $1M-$3M

Trigger: none (fed by W0). Go-live day: enroll existing = Yes is done at switch-on (step 6).

1. Send email: IBO Nurture B1 - Honest answer on fit ($1M-$3M)
2. Delay 7 days
3. Delay until a day or time
4. Send email: IBO Nurture B2 - The four levers that move EBITDA
5. Delay 14 days
6. Delay until a day or time
7. Send email: IBO Nurture B3 - Exit planning, eight steps
8. Delay 24 days
9. Delay until a day or time
10. Send email: IBO Nurture B4 - Other doors: MBO, minority recap
11. Enroll in another workflow: W6
12. Delay 45 days
13. Delay until a day or time
14. Send email: IBO Nurture B5 - Has EBITDA crossed $3M? (quarterly re-qualify)
15. If/then branch: contact property ibo_qualified is equal to True.
    - Yes: Enroll in another workflow: W1. End.
    - No: continue.
16. Delay 90 days, Delay until a day or time, Send B5, same if/then as step 15.
17. Repeat step 16 twice more (B5 at roughly day 135, 225, 315). Then end.

## W4 - IBO Nurture W4 - Track C owner under $1M

Trigger: none (fed by W0).

1. Send email: IBO Nurture C1 - Honest answer on fit (under $1M)
2. Delay 45 days
3. Enroll in another workflow: W6
4. Delay 45 days
5. Delay until a day or time
6. Send email: IBO Nurture B5 - Has EBITDA crossed $3M? (quarterly re-qualify)
7. If/then branch: ibo_qualified is equal to True. Yes: Enroll in W1, end. No: continue.
8. Delay 90 days, Delay until a day or time, Send B5, same if/then. Repeat twice more. End.

## W5 - IBO Nurture W5 - Track D advisers

Trigger: none (fed by W0).

1. Send email: IBO Nurture D1 - Thanks, and a quick question (advisers)
2. Delay 3 days
3. Delay until a day or time
4. Send email: IBO Nurture D2 - How to spot an IBO candidate in your book
5. Delay 7 days
6. Delay until a day or time
7. Send email: IBO Nurture D3 - What we do for referring advisers
8. Delay 10 days
9. Delay until a day or time
10. Send email: IBO Nurture D4 - Close the loop? (breakup)
11. Delay 25 days
12. Enroll in another workflow: W6

## W7 - IBO Nurture W7 - Meeting reminder (F1)

This workflow is for people who HAVE booked, so it must not use lists 58/59 or the
meeting-based goal. Its own settings:

- Trigger: When filter criteria is met. Contact property "Date of last meeting booked in
  meetings tool" is known
  AND Email does not contain csgpartners.com
  AND Email does not contain iboadvisors.com
  AND Email does not contain roedgers.com
  AND Email does not contain hubspot.com.
  Enroll existing contacts: No. Re-enrollment: on, when "Date of last meeting booked in
  meetings tool" changes (so a rescheduled meeting gets a fresh reminder).
- Unenrollment: Lead status is any of Unqualified, Not Interested; Unsubscribed from all
  email is true.
- No suppression lists, no goal.
- As built (30 Sep): the API has no unenrollment-trigger field, so the unenrollment rule above
  is implemented as the workflow goal in W7 and W8 (same effect; reporting shows "met goal").

1. Delay until a specific date or date property: "Date of last meeting booked in meetings
   tool", 1 day BEFORE.
2. If/then branch: "Date of last meeting booked in meetings tool" is after today (i.e. the
   meeting is still in the future and has not been canceled).
   - Yes: Send email: IBO Nurture F1 - Tomorrow: three things to have handy
   - No: end.

## W8 - IBO Nurture W8 - No-show recovery (F3, F4, A7, A8)

Own settings, same as W7 (no lists 58/59, no meeting goal, same email-domain exclusions
added to the trigger, same unenrollment).

- Trigger: When filter criteria is met. Activity filter: Meetings > Meeting outcome is any
  of No show (in the trigger panel choose "Meeting" under activity/engagement properties).
  Enroll existing contacts: No. Re-enrollment: on.
- As built (30 Sep): unenrollment is implemented as the goal, as in W7. The meeting-outcome
  re-enrollment trigger could not be set via the API; tick it in Settings at go-live.

1. Delay 30 minutes
2. Send email: IBO Nurture F3 - Missed you, grab another slot
3. Delay 2 days
4. Delay until a day or time
5. If/then branch: "Date of last meeting booked in meetings tool" is after today.
   - Yes: end (they rebooked; W7 takes over).
   - No: continue.
6. Send email: IBO Nurture F4 - Still worth the 20 minutes?
7. Delay 5 days
8. Delay until a day or time
9. Same if/then as step 5. No: continue.
10. Send email: IBO Nurture A7 - Three options, pick one
11. Delay 5 days
12. Delay until a day or time
13. Same if/then as step 5. No: continue.
14. Send email: IBO Nurture A8 - Should I close your file? (breakup)
15. Delay 27 days
16. Enroll in another workflow: W6

(HubSpot cannot enroll a contact part-way through W1, so A7 and A8 are sent from here.)

## W0 - IBO Nurture W0 - Paid-social intake router (build last)

Own settings:

- Trigger: When filter criteria is met. Contact property "Original source" is any of
  Paid Social. Enroll existing contacts: NO (the catch-up send covers history).
  Re-enrollment: off.
- Suppression lists: 58 and 59. No goal, no other unenrollment.

1. Create task. Assigned to: Edmund Breitling. Type: Call. Priority: High.
   Due: 1 hour after this action. Title:
   `Paid-social lead - call {{contact.firstname}} {{contact.lastname}} ({{contact.what_is_your_approximate_annual_ebitda}})`
2. If/then branch with multiple branches (use "Value equals" or add branches in this order;
   the first match wins):
   - Branch "Adviser": Role is any of Business Advisor
     -> Enroll in another workflow: W5
   - Branch "Qualified": "What is your approximate annual EBITDA?" contains any of
     $3m, $5m, $10m
     OR "What is your approximate annual EBITDA (profit)?" is any of
     $3M - $5M, $5M - $10M, $3M - $10M, $10M - $20M, $10M+, $20M+
     -> Set property value: ibo_qualified = True
     -> Send email: IBO Nurture A1 - Your Independent Buyout (IBO) question
     -> Enroll in another workflow: W1 (go-live day)
   - Branch "$1M-$3M": "What is your approximate annual EBITDA?" is any of $1m - $3m
     OR "...(profit)?" is any of $1M - $3M, $0 - $3M
     -> Set property value: ibo_qualified = False
     -> Enroll in another workflow: W3
   - Branch "Under $1M": "What is your approximate annual EBITDA?" is any of $500k - $1m
     OR "...(profit)?" is any of $0 - $1M
     -> Set property value: ibo_qualified = False
     -> Enroll in another workflow: W4
   - None met (no EBITDA answer): Send email A1, then Enroll in another workflow: W1
     (A1 asks for the number).

   As built (30 Sep): the branches are in the order Adviser, $1M-$3M, Under $1M, Qualified, then
   the default. The EBITDA answers are stored as band strings like "$1M - $3M", so a Qualified
   "contains $3m" check placed first would catch every $1M-$3M owner; checking the exact bands
   first gives the intended routing (details in HUBSPOT_WORKFLOW_BUILD_LOG.md).

## After building

- Every Send email action shows a red "Changes needed" while the emails are drafts. That is
  expected: automated emails must be published ("Review and publish" in the email editor,
  which sends nothing) before a workflow using them can be turned on. Do that after Michael
  signs off (runbook step 4b), not now.

- All nine show "Off" in the Workflows list. Do not turn any on yet.
- Tell Claude; the dry run (step 4) uses W1.
- Switch-on order at go-live (step 6 then 8): W6, W1, W2, W3 (enroll existing Yes),
  W4 (Yes), W5 (Yes), W7, W8, then W0 last.
