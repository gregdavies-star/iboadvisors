# Session hand-off: Calendly scheduling plan for /book

Paste this into the first message of the new session (one started inside the IBO Advisors
organization). It replaces the hand-off from session_01DyVcqKKjUpoKzuYR1khFXZ (30 Oct), which
closed section 8 and started WP1 with Greg.

## Working rules

- Use Fable for orchestration and planning, Opus workers for execution (build, audits, menial
  tasks). Nothing is deployed until Greg says build.
- Repos: `gregdavies-star/iboadvisors` and `gregdavies-star/iboadvisors-dashboard`, both on branch
  `claude/intelligent-cerf-54lo66`. Commit to that branch and push. Do not open a pull request
  unless asked.
- `CLAUDE.md` in iboadvisors holds the standing rules (Managing Partner, 30 minutes, the /book
  confirmation rules, no deploy without "build"). Follow them.
- HubSpot access: the environment variable `IBO_HUBSPOT_SERVICE_KEY` is a private app token
  (app 59288867) for the IBO portal 245308986 on NA2. Use it with curl for direct API calls.
  Never print the token. Scopes: `automation`, `oauth`, `crm.objects.contacts.read/write`,
  `crm.schemas.contacts.read/write`, `crm.objects.users.read/write`, `crm.objects.leads.read/write`,
  `marketing.campaigns.read/write`, `automation.sequences.*`, `crm.lists.read`, `forms`,
  `crm.objects.owners.read`. Meetings are readable under the contacts scopes (verified); the
  meetings scope was not offered in the private-app picker. Not available: `content` (marketing
  email names), `scheduler.meetings.meeting-link.read` (scheduling page slugs). The new session's
  environment must carry the same variable; if it does not, ask Greg before anything else.
- Calendly access: the environment variable `CALENDLY_PAT` is a personal access token on Greg's
  Calendly owner account (Teams Plus trial, added 30 Oct). Use it with curl against
  `https://api.calendly.com` for GET calls only; never print it. The token for the dashboard
  build (WP1 step 6) will be a separate one, created later for Vercel.
- Nothing has been written to HubSpot by any session. Keep it that way unless Greg says
  otherwise for a specific change.
- Redact prospect names and emails to initials in anything that is written down.

## What exists

`docs/plans/2026-10-29-calendly-scheduling.md` in iboadvisors (read it in full first). It is the
plan to replace the HubSpot meetings round-robin embed on /book with a Calendly Teams round robin
(Michael and Darren, 30 minutes) while keeping HubSpot the source of truth via a Calendly webhook
receiver in the dashboard app. Sections: 1 recommendation, 2 flow today, 3 dependency inventory
(20 rows), 4 target architecture, 5 HubSpot data contract, 6 work packages WP0 to WP6, 7 what
changes for Michael and Darren, 8 decisions for Greg, 9 unverified points, 10 costs, Appendix A
Calendly facts, Appendix B HubSpot facts, Appendix C the portal audit of 29 Oct 2026.

Commits on the branch so far: the plan (21ebb2e), the audit folded in (45b7b4f), decision 10,
then on 29 and 30 Oct decisions 1 to 9 one by one (a746a99 to ef8d597), the event-firing
finding (19b0651) and decision 8 with Appendix D (a964882). Section 8 is closed.

## What the 29 Oct audit established (details in Appendix C)

- Every scheduler booking is `hs_meeting_source` MEETINGS_PUBLIC from round-robin scheduling page
  134451922. The portal has never had a MEETINGS_EMBEDDED meeting. 727 meetings in all, 279 from
  scheduling pages, 252 of those past and still SCHEDULED, 0 ever NO_SHOW.
- List 58 is a 9-way OR including `engagements_last_meeting_booked is known`. W1 to W6 goals are
  that single filter. W2 branches on it before A1b. W8 triggers on event 4-1724222 (meeting
  outcome changed to NO_SHOW) and also branches three times on `engagements_last_meeting_booked
  is after today`. W7 is off. No W9 exists; list 283 is only a suppression list.
- Two enabled workflows the first inventory missed run on the meeting-booked event 4-1720599:
  4879166163 sets lifecycle stage to MQL, 4830712547 emails Edmund Breitling.
- The `ibo_meeting_*` contact properties exist (group `ibo_attribution`) but nothing writes them
  on a /book booking; the Meetings Link form `michael-chasen/discussing-the-ibo`
  (4b0ad4cd-b92c-454f-9df3-110820dd2a92) has only first name, last name, email.
- The pre-call form a86c0176 has `email`, `pre_call_note`, `pre_call_note_host`, as expected.
- Owners: Michael 88777593, Darren 162759897, both active. Users: 7, five super admins.

## Decisions

Taken by Greg on 29 Oct:

- Decision 10: no-show practice. W8 gets a second trigger, "Lead Status is any of No Show" with
  re-enrolment on, alongside the existing meeting-outcome trigger (WP2 step 8). The meeting
  outcome stays the system record. Greg will enforce the practice with the reps. The 6 historical
  "No Show" lead statuses stay as they are.

- Decision 1 (29 Oct): Greg signs up for Calendly Teams as the organization owner and adds
  Michael and Darren as the two hosts; three seats. Greg's account owns the token and webhook
  (WP0 step 1, WP1 step 6).

- Decision 2 (29 Oct): owner set to the host only when empty at booking; moved to the host when
  the meeting outcome becomes COMPLETED (new meeting-based workflow, WP2 step 9). Edmund's comp
  credit is the booking's outreach attribution, not the owner: stamped on the meeting record as
  `ibo_booking_*` (section 5.2) and read by a meetings report (WP2 step 10).

- Decisions 3, 4, 5 (29 Oct), as recommended: invite from the host's calendar; booking form is
  name and email only; completed meetings stay a manual mark.

- Decision 6 (29 Oct): do not install the native Calendly for HubSpot app; the webhook receiver
  is the only writer. A form-first hybrid was weighed and rejected (reasons in section 8).
- Greg, 29 Oct: Edmund's comp credit is a minor matter for this project. The per-booking
  `ibo_booking_*` stamp stays (cheap, written by the receiver anyway); the comp report (WP2 step
  10) is deferred. Do not let it drive any further decision.

- Decisions 7 and 9 (29 Oct): 14-day fallback window, unpublish the HubSpot scheduling page on
  day 15; Darren's seat is a UI check on the same day, no action before.

- Decision 8 (29 Oct): the dashboard is used every day and cannot be interrupted; every column
  must be accurate through cutover. Dashboard parity is a hard gate on WP3 and WP5, with the
  column inventory in Appendix D and the required changes in WP3. The new bookings panel is
  deferred to after cutover.

Section 8 is closed: all ten decisions are recorded. The plan now waits on Greg's Calendly
sign-up (WP0, WP1), the WP2 HubSpot steps, and Greg saying build for WP3 and WP4.

## WP1 progress as of 30 Oct

Greg has: signed up for Calendly (Teams Plus free trial, owner account), invited Michael and
Darren, created the team round-robin event type "Independent Buyout (IBO) Discussion" (30 min,
Zoom, pool of Michael and Darren, schedule set by host, 14-day window, 4 hours notice), and
generated the PAT. Michael's availability is a custom schedule on his own account; Darren's was
the Calendly default. Greg believes the Calendly setup is correct and asked for it to be verified
through the API. Not yet confirmed: Darren's Zoom and both hosts' Google Calendar connections,
the booking form (decision 4: name and email only), confirmation page with no redirect, calendar
invitation mode (decision 3), the "three things" confirmation text, the reminder workflow, and
the LinkedIn Campaign Manager conversion check.

## Suggested next steps for the new session

1. Confirm both variables: `GET /account-info/v3/details` on HubSpot must return portal
   245308986; `GET /users/me` on Calendly must return Greg's owner account.
2. Verify WP1 read-only through the Calendly API and report what does not match WP1 steps 1 to
   5 and 7 or decisions 3 and 4: `GET /users/me` for the organization URI; `GET /event_types`
   with the organization; the event type's duration, location (kind zoom), pool and hosts,
   `custom_questions`; `GET /user_availability_schedules?user=` for each host's hours; `GET
   /event_type_available_times` for the next 7 days (slot count per host); `GET
   /organization_memberships` for who has accepted. The invitation mode, confirmation redirect
   and reminder workflow are not in the API; ask Greg to confirm them from the UI.
3. Ask Michael and Darren, through Greg, which hours the HubSpot scheduling page used, so the
   Calendly hours match (the HubSpot page settings are not readable with our scopes).
4. WP1 step 8: once the hosts' calendars are connected, two test bookings under Greg's email,
   one per host; fetch the scheduled events and invitees with the PAT, redact, and save as WP3
   fixtures under `docs/plans/fixtures/` (prospect data redacted to initials).
5. WP2 step 8 (the W8 second trigger) is a UI change Greg can make any time; the click path was
   given on 29 Oct.
6. WP3 and WP4 wait on Greg saying build. Do not start them before that.
7. Known runbook follow-ups outside this plan: W0 suppresses lists 58, 59, 283 but not 68; W8's
   final "enrol in W6" never takes effect because every W8 contact is already in list 58.
