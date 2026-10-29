# Calendly scheduling for /book, with HubSpot kept as the source of truth

Status: plan for review. Nothing in this document is built or deployed (standing rule 4).
Date: 29 October 2026. Companion to `marketing/HUBSPOT_BUILD_RUNBOOK.md` and
`marketing/HUBSPOT_WORKFLOW_BUILD_LOG.md`.
Revised the same evening after a read-only audit of the live portal (Appendix C). Sections 2, 3,
5, 6, 8 and 9 carry the corrections; each is marked "(audit)".

## 1. Recommendation in one paragraph

Replace the HubSpot meetings iframe on `/book` with a Calendly **Teams round-robin event type**
(Michael and Darren, 30 minutes), keep the on-site confirmation exactly as it is, and make HubSpot
the system of record by writing every booking, reschedule, cancellation and no-show into the CRM
ourselves from a **Calendly webhook receiver** that lives in the dashboard app
(`iboadvisors-dashboard`, Next.js route handler, already holds a HubSpot private app token and a
Supabase database). Do **not** rely on Calendly's native HubSpot app: it logs a meeting but cannot
set the one property the whole nurture programme keys on, it never updates an existing contact's
owner or properties, and its behaviour on an NA2 portal is undocumented. The one thing nobody can
replicate is HubSpot's own "Date of last meeting booked in meetings tool" property, so the plan
introduces a parallel `ibo_last_meeting_booked` contact property and re-points the five places that
read the HubSpot one (suppression list 58, the W1 to W6 goals, the W2 branch, the three W8 rebook
branches, the dashboard).

## 2. The flow today

```
Learn More modal (modal.js)            ibo-exit / ibo-exit2 (exit.js)     Valuation calculator      Nurture emails
  submit lead -> HubSpot form            submit lead -> HubSpot form        submit -> HubSpot form     [scheduler] link
  qualified ($3M+ EBITDA)                                                   PDF button
        |                                      |                                  |                      |
        v                                      v                                  v                      v
  /book?src=modal&firstName&lastName&email&utm_*&ibo_meeting_*     src=ibo-exit   src=calculator|pdf   src=email
                                       |
                                       v
                /book (book/index.html + book/book.js)
                  State 1: HubSpot meetings iframe (meetings-na2.hubspot.com/michael-chasen/discussing-the-ibo)
                           HubSpot's embed script forwards the page's query string into the iframe:
                             firstName/lastName/email prefill, utm_* -> "of last booking" props,
                             hubspotutk -> parentHubspotUtk. The ibo_meeting_* params ride along but
                             nothing stores them: the booking form has only first name, last name
                             and email (audit)
                  postMessage {meetingBookSucceeded, meetingsPayload.bookingResponse.postResponse}
                           -> organizer (email/userId/name) -> HOSTS table -> host
                           -> timerange -> date/time tile, Google/Outlook/.ics fallbacks
                  State 2: IBO confirmation (approved mockup): confirmed with <host>, steps card,
                           optional pre-call note -> HubSpot form a86c0176... (pre_call_note, pre_call_note_host)
                  GA4 meeting_booked {src, host, lead_days}; Google Ads label slot (empty)
```

HubSpot's meetings tool then does the rest on its own: creates the contact if needed, logs a
Meeting engagement owned by the round-robin organizer, sends the calendar invitation and the
confirmation email that carries the "three things" prep text, sends reminders 2 hours and 10
minutes before, stamps `engagements_last_meeting_booked` and the
`engagements_last_meeting_booked_source/medium/campaign` UTM properties (there is no `_content`
counterpart; `utm_content` is dropped), and records a submission of the auto-generated
"Meetings Link: michael-chasen/discussing-the-ibo" form.

Audit corrections to this picture:

- The meeting's `hs_meeting_source` is **`MEETINGS_PUBLIC`**, not `MEETINGS_EMBEDDED`. The portal
  has never recorded a `MEETINGS_EMBEDDED` meeting (0 of 727). Every booking from the `/book`
  embed and from the hosted page alike is `MEETINGS_PUBLIC`, created by scheduling page
  `134451922` (the round robin), so the source cannot tell `/book` bookings from hosted-page ones.
- A booking also fires HubSpot's meeting-booked event (`4-1720599`), which drives two enabled
  workflows the earlier inventory missed: `4879166163` "Meeting Booked -> Change to MQL" (sets
  `lifecyclestage` to `marketingqualifiedlead`; every recent booker is MQL) and `4830712547`
  "Meeting Booked - Notify Edmund" (internal email to Edmund Breitling on every booking).
- The contact's owner is set to the host only when the contact had none. Existing contacts keep
  their owner (two recent bookers owned by Edmund kept him while the meeting went to Michael).

## 3. Everything that depends on the HubSpot meetings tool (the migration inventory)

Found by reading both repos and the marketing runbooks, then checked against the live portal
(Appendix C). Each row must still work after the switch. Rows 1 to 4 and 6 to 8 were confirmed
exactly as written; rows 5, 16 and 17 were corrected; rows 19 and 20 are new.

| # | Dependency | Where | Reads | After Calendly |
|---|---|---|---|---|
| 1 | Suppression list 58 "never nurture" (dynamic, 345 members, a 9-way OR) | HubSpot list | `engagements_last_meeting_booked` is known | Add a tenth OR branch: `ibo_last_meeting_booked` is known |
| 2 | W1 to W6 goal ("met goal" = booked) | HubSpot workflows 5021190877, 5022981825, 5022928581, 5023160006, 5023183577, 5021185726 | same property (confirmed: the goal is this single filter in all six; nothing in the portal references `hs_latest_meeting_activity`) | Goal becomes either property known |
| 3 | W2 abandoned-scheduler branch (60 min, then if/then before A1b) | workflow 5022981825 | same property | Branch on either property |
| 4 | W7 pre-meeting email (off since 22 Oct) | workflow 5022928580 | same property; re-enrols on change; its branch tests "is after today" | Leave off; if ever re-enabled, trigger and branch on `ibo_last_meeting_start` |
| 5 | W8 no-show recovery | workflow 5023073984 | Trigger: event "Meeting outcome changed" to NO_SHOW (event type 4-1724222). **Also** three if/then branches ("Rebooked" if `engagements_last_meeting_booked` is after today) before F4, A7 and A8 (audit) | Receiver PATCHes `hs_meeting_outcome=NO_SHOW` on the HubSpot meeting; verify the event fires for API-created meetings, else rebuild W8 as a meeting-based workflow. Re-point the three branches to "`ibo_last_meeting_start` is after today OR `engagements_last_meeting_booked` is after today", or a rebooked contact still gets F4, A7 and A8. Note: W8 has **never fired on a scheduler booking**: 0 of 279 scheduling-page meetings has ever been NO_SHOW and 252 past ones still read SCHEDULED; reps mark no-shows as Lead Status "No Show" instead (decision 10) |
| 6 | List 283 "Suppression - in conversation" (W9 trigger) | HubSpot list | Lead Status in a sales stage, or Last Contacted within 14 days (`notes_last_contacted`) | API-logged meetings should update Last Contacted; verify with one test. (No W9 workflow exists yet; 283 is used only as a suppression list on W0 to W6) |
| 7 | Dashboard "booked" classification | `lib/ingest/hubspot/classify.ts:884-890` | `engagements_last_meeting_booked` OR an associated live meeting | Second half already covers API meetings; add `ibo_last_meeting_booked` to the first so a canceled Calendly booking stays "booked", as a canceled HubSpot one does today. Rows 7 to 10 are expanded column by column in Appendix D (decision 8) |
| 8 | Dashboard booking attribution | `classify.ts:990-993`, `lib/email/nurture.ts:237`, `lib/email/rollup.ts:662,677` | `engagements_last_meeting_booked_source/medium/campaign` (confirmed populated, e.g. `linkedin / paid / IBO_XPR_Conversions_IBO Discussion`; HubSpot keeps no content value) | Fall back to `ibo_meeting_source/medium/campaign` (the receiver writes them) |
| 9 | Dashboard funnel label "Direct meetings-link (calendar)" | `classify.ts:417,435-436` | landing URL host `meetings-na2.hubspot.com` | Add `calendly.com` and the `/book` page |
| 10 | Dashboard meetings sync, Today's Meetings, No-show queue, Missed Meeting | `sync.ts:655-671`, `lib/queries/*`, `lib/ads/follow-up.ts` | HubSpot meeting objects (any source) | Works unchanged as long as the receiver creates real Meeting objects associated to the contact |
| 11 | GA4 `schedule_click` | `modal.js:477-500`, `exit.js:617-650` | link host `meetings-na2.hubspot.com` | Add `calendly.com` |
| 12 | Attribution tests | `scripts/test-attribution.mjs` | stubs `meetings-na2.hubspot.com`, asserts `ibo_meeting_*` params | Update stubs and assertions |
| 13 | Nurture email `[scheduler]` link | `marketing/DRIP_SEQUENCE_EMAILS.md:8`, 19 live links in `hubspot_email_content.json` | `/book?src=email&utm_*&email&firstName&lastName` | **No change**: `/book` translates these params to Calendly prefill |
| 14 | Confirmation email with the "three things" prep text, reminders at 2 h and 10 min | HubSpot scheduling page automation | HubSpot meetings tool | Rebuild in Calendly: event-type confirmation email plus a Calendly Workflow with two reminders |
| 15 | Pre-call note | `book/book.js` -> HubSpot form a86c0176 -> workflow 5062740687 | invitee email + host email | **No change**: the receiver's lookup returns both |
| 16 | "Meetings Link: michael-chasen/discussing-the-ibo" form (`4b0ad4cd-b92c-454f-9df3-110820dd2a92`, type MEETING, fields first name, last name, email only) | HubSpot | automatic per booking; sets `recent_conversion_event_name` on every booker; no workflow or list references it | Replaced by a deliberate "Calendly booking" Forms API submission from `/book` (carries `hutk`). An improvement, not a like-for-like swap: today's form stores none of the `ibo_meeting_*` values the URL carries |
| 17 | HubSpot meetings-tool reports by scheduling page | HubSpot reports | `hs_created_by_scheduling_page` = 134451922, source `MEETINGS_PUBLIC` (not EMBEDDED) | Lost. Replace with a dashboard view over the `calendly_bookings` table |
| 18 | `CLAUDE.md` HubSpot facts | repo | describes the NA2 embed | Rewrite the scheduler bullets after cutover |
| 19 | "Meeting Booked -> Change to MQL" (new, audit) | workflow 4879166163, enabled | HubSpot meeting-booked event 4-1720599 (unfiltered) sets `lifecyclestage=marketingqualifiedlead` | Verify in WP5 whether the event fires for API-created meetings. If not, the receiver sets `lifecyclestage` to MQL when the contact is below it (never downgrades), or the workflow is rebuilt as a meeting-based one |
| 20 | "Meeting Booked - Notify Edmund" (new, audit) | workflow 4830712547, enabled | same event; internal email to Edmund Breitling (owner 164598474) per booking | Same test. Fallback: a meeting-based workflow (enrol meetings on create, notify), or the receiver sends the notification |
| 22 | LinkedIn Campaign Manager conversion "Meeting Scheduled" (dashboard column "LinkedIn conv. (post-click)", via Windsor) | LinkedIn, `lib/ads/conversion-rule.ts` | LinkedIn's own conversion rule; if it fires on the HubSpot meetings confirmation URL it stops firing after cutover | Check the rule in Campaign Manager in WP1; re-point it to the `/book` confirmation state if it is URL-based. No dashboard code |
| 21 | Edmund's booking credit (comp; decision 2) | HubSpot reports | contact-level `engagements_last_meeting_booked_campaign` (19 contacts carry an `edmund` campaign today; only 8 bookers are owned by Edmund, so owner was never the measure) | The receiver stamps the attribution on each **meeting record** (`ibo_booking_source/medium/campaign/entry_src`, new custom meeting properties) and on the contact (`ibo_meeting_*`). Credit = meetings whose campaign identifies his outreach, whoever owns the contact, so the owner move on completion costs nothing |

## 4. Target architecture

```
/book (static site)                                   iboadvisors-dashboard (Vercel, Next.js)                HubSpot (245308986)
-----------------------------------------------        -------------------------------------------------        -----------------
Calendly inline embed (widget.js)                      POST /dashboard/api/book/confirm   (from the page)         Contact (upsert by email)
  url: calendly.com/<org>/ibo-discussion                 verify URIs, fetch event + invitee with the PAT,          ibo_last_meeting_booked
  prefill: name/email from URL params                    store row in calendly_bookings, return                    ibo_last_meeting_start
  utm: from tracking.js store                            {host_email, start, end, invitee email/name}               ibo_meeting_host / _status
  hide_event_type_details, hide_gdpr_banner              -> also PATCH contact ibo_meeting_* attribution            ibo_meeting_source/medium/
                                                                                                                      campaign/content/uuid/
postMessage calendly.event_scheduled                   POST /dashboard/api/webhooks/calendly  (from Calendly)        landing_url/timestamp
  {event.uri, invitee.uri}  ------------------------>    verify Calendly-Webhook-Signature (HMAC-SHA256)            hubspot_owner_id (if empty)
  -> POST /confirm -> render State 2                     invitee.created      -> upsert contact, create Meeting    Meeting engagement
  -> submitForm("Calendly booking" form, hutk)           invitee.canceled     -> outcome RESCHEDULED or CANCELED     hs_meeting_outcome
  -> GA4 meeting_booked {src, host}                      invitee_no_show.*    -> outcome NO_SHOW / revert            hubspot_owner_id = host
                                                         idempotent on invitee URI (calendly_bookings)              association 200 -> contact
                                                                                                                  Forms API submission
                                                       GET /dashboard/api/cron/calendly-reconcile (4-hourly)        "Calendly booking" (hutk)
                                                         list Calendly events since last run, repair gaps
```

Why this shape:

- **Webhook, not the native app.** The native Calendly for HubSpot app (Standard+) logs a Meeting
  activity titled "Meeting-Calendly: <event>" and can push outcomes, but Calendly's own help page
  says it never changes an existing contact's details or owner, maps answers to properties only for
  new contacts, documents only a "Calendly UTM source" property, and says nothing about NA2. It also
  cannot write the `ibo_*` properties the lists and workflows will key on. Installing it alongside
  our receiver would create duplicate meetings. Leave it uninstalled.
- **Receiver in the dashboard repo.** It already has a HubSpot client (`lib/ingest/hubspot/client.ts`),
  Supabase service access, the cron-auth pattern, the owners table and the Meetings list. The static
  site has no server code and should stay that way. The public URL is
  `https://www.iboadvisors.com/dashboard/api/...` through the existing rewrite (same origin as the
  page, so the browser call needs no CORS), with
  `https://iboadvisors-dashboard.vercel.app/dashboard/api/webhooks/calendly` as the webhook target so
  deliveries do not depend on the site's rewrite. Both paths must be added to
  `lib/auth/public-paths.ts`, which today only opens `/login`, `/logout`, `/api/cron/*` and
  `/api/health`.
- **Confirmation lookup is server-side.** Calendly's `calendly.event_scheduled` message carries only
  two URIs, no host, no time, no email. Resolving them needs an authenticated call, so the page asks
  our `/confirm` endpoint, which uses the Calendly token. Calendly's "redirect with event details"
  option would pass `assigned_to` and `event_start_time`, but its behaviour inside an inline embed is
  unverified and a community report from this month says it does not fire; it also navigates away
  from the on-site confirmation, which is the same reason the HubSpot redirect setting is kept off.
- **Two channels into HubSpot, by design.** The webhook is authoritative for the meeting record. The
  page's Forms API submission ("Calendly booking" form, with `hutk`, `pageUri`, the `ibo_meeting_*`
  fields and `src`) keeps the booking tied to the visitor's HubSpot web-analytics session and the
  original-source attribution, which a server-side write cannot do. Either channel alone is a
  degraded but working booking.
- **Reconciliation cron.** Calendly retries failed deliveries for 24 hours and then disables the
  subscription. A 4-hourly job lists scheduled events since the last run and repairs anything
  missing, and re-creates the subscription if Calendly reports it disabled.

## 5. HubSpot data contract

### 5.1 Contact

Upsert by email. Names are written only when the contact has none (mirrors the meetings tool,
which does not overwrite). `hubspot_owner_id` is set to the host's owner only when the contact has
no owner at booking; it moves to the host when the meeting outcome becomes COMPLETED, through a
meeting-based HubSpot workflow (WP2 step 9), not through the receiver (decision 2).

| Property | Type | Written on | Value |
|---|---|---|---|
| `ibo_last_meeting_booked` (new) | datetime | invitee.created | the Calendly `created_at` of the booking |
| `ibo_last_meeting_start` (new) | datetime | created, canceled | `scheduled_event.start_time`; cleared on cancel without reschedule |
| `ibo_meeting_host` (new) | enumeration: michael, darren | created | from `event_memberships[0].user_email` |
| `ibo_meeting_status` (new) | enumeration: scheduled, rescheduled, canceled, no_show, completed | every event | latest state |
| `ibo_meeting_source`, `_medium`, `_campaign`, `_content` (exist, group `ibo_attribution`) | text | created | page attribution if the `/confirm` call arrived, else Calendly `tracking.utm_*` |
| `ibo_meeting_uuid`, `ibo_meeting_landing_url`, `ibo_meeting_timestamp` (exist) | text, text, date | created | page attribution only (Calendly cannot carry them) |
| `ibo_meeting_entry_src` (new) | text | created | `modal`, `ibo-exit`, `calculator`, `pdf`, `email`, `direct` |
| `calendly_invitee_uri` (new) | text | created | for support lookups |
| `lifecyclestage` (exists) | enumeration | created, only if row 19 in section 3 needs it | `marketingqualifiedlead` when the contact is below MQL; never downgraded |

Audit notes on this table: the `ibo_meeting_*` group exists (also `_ad_id` and `_platform_id`)
but is effectively unused. Six contacts carry values, all from 11 to 17 September via the hosted
meetings page; none of the October `/book` bookers has any. The receiver writing them is new
behaviour, not a continuation. None of the "(new)" properties exists yet, so WP2 creates them
without name clashes. The contact also has `pre_call_note_date`, which the pre-call form never
sets (not on the form); harmless, left as is.

`engagements_last_meeting_booked*` are left alone: HubSpot sets them only from its own tool, and
they stay valid for the historical bookings already in the portal (240 contacts carry the date
today; 290 carry `hs_latest_meeting_activity`).

### 5.2 Meeting engagement (`POST /crm/v3/objects/meetings`)

| Property | Value |
|---|---|
| `hs_timestamp`, `hs_meeting_start_time` | `scheduled_event.start_time` |
| `hs_meeting_end_time` | `scheduled_event.end_time` |
| `hs_meeting_title` | "Independent Buyout (IBO) Discussion" (confirmed as the round robin's current title; the Calendly event type is named identically so the confirmation's "invitation titled ..." line stays true) |
| `hs_meeting_body` | invitee name and email, entry source, timezone, cancel and reschedule URLs, any question answers (today's body is the Zoom invitation text) |
| `hs_meeting_location` | `location.join_url` (Zoom). Today's bookings hold the Zoom URL here too, with `hs_meeting_location_type` empty; `hs_video_conference_url` and `_platform` are tool-written and not part of the contract |
| `hs_meeting_external_url` | the Calendly event URI |
| `hs_meeting_outcome` | `SCHEDULED`; later `RESCHEDULED`, `CANCELED`, `NO_SHOW`, or back to `SCHEDULED` when a no-show is undone (the five option values are confirmed) |
| `hubspot_owner_id` | host's owner id: Michael 88777593, Darren 162759897 (both confirmed, active, no teams) |
| `hs_activity_type` | not set: the portal defines no meeting types (the option list is empty) |
| `calendly_invitee_uri` (new custom meeting property) | idempotency key; the Supabase row holds the HubSpot meeting id too. This will be the portal's first custom meeting property (all 127 today are HubSpot-defined) |
| `ibo_booking_source`, `ibo_booking_medium`, `ibo_booking_campaign`, `ibo_booking_entry_src` (new custom meeting properties) | the booking's attribution, same values as the contact's `ibo_meeting_*` at that moment, written once and never changed. Per-booking credit for comp (decision 2): a meeting report filtered on campaign and outcome COMPLETED does not depend on who owns the contact, and a contact's second booking does not overwrite the first |
| associations | `associationTypeId` 200 to the contact |

`hs_meeting_source` is read-only through the API (confirmed, as are `hs_created_by_scheduling_page`
and `hs_organizer_email`); API-created meetings are expected to show as INTEGRATION (the portal's
3 INTEGRATION meetings come from the Circleback app; unverified for ours, see section 9). Today's
scheduler bookings are `MEETINGS_PUBLIC`, never `MEETINGS_EMBEDDED`. No workflow or list filters on
the source or on the scheduling page; only saved reports might (WP2 step 6).

### 5.3 Event handling

| Calendly event | Receiver action |
|---|---|
| `invitee.created` (no `old_invitee`) | upsert contact, create meeting, write contact properties, store row |
| `invitee.canceled` with `rescheduled: true` | PATCH old meeting `hs_meeting_outcome=RESCHEDULED`; contact `ibo_meeting_status=rescheduled` |
| `invitee.created` with `old_invitee` | create the new meeting as above (new host possible on round robin); contact `ibo_last_meeting_start` moves |
| `invitee.canceled` with `rescheduled: false` | PATCH `CANCELED`; contact status canceled, `ibo_last_meeting_start` cleared, `ibo_last_meeting_booked` kept (the contact did book) |
| `invitee_no_show.created` | PATCH `NO_SHOW` (fires W8); contact status no_show |
| `invitee_no_show.deleted` | PATCH back to `SCHEDULED`; contact status scheduled |
| duplicate delivery | no-op (row already has that state) |

COMPLETED stays a manual mark, as today (decision 5).

### 5.4 Supabase

New table `calendly_bookings`: `invitee_uri` PK, `event_uri`, `invitee_email`, `host_email`,
`start_time`, `end_time`, `status`, `hs_contact_id`, `hs_meeting_id`, `entry_src`, `attribution`
jsonb (from the page), `tracking` jsonb (from Calendly), `confirm_received_at`,
`webhook_received_at`, `raw_webhook` jsonb, timestamps. RLS on, service role only, matching
migration `0005`. New `sync_runs` kind for the reconcile cron.

## 6. Work packages

Planning and review stay with this session; the build packages are sized for Opus execution with
the acceptance criteria below. Nothing deploys until Greg says build.

### WP0. Accounts and decisions (Greg, about half a day)

1. **Decided 29 Oct (decision 1):** Greg signs up for Calendly **Teams** as the organization
   owner, then adds Michael and Darren as users and connects them as the two hosts. Round robin is
   Teams and above; the pricing page shows $16 per seat per month on annual billing, so this is
   three seats. Greg's owner account creates the API token and the organization-scope webhook (WP1
   step 6), and the token then covers both hosts' events.
2. Each host connects Google Calendar and Zoom in Calendly.
3. Decisions 1 to 9 in section 8.
4. Done 29 Oct: `IBO_HUBSPOT_SERVICE_KEY` (private app 59288867 on portal 245308986) is in the
   cloud environment, with `crm.lists.read`, `forms` and `crm.objects.owners.read` added for the
   audit. Meetings turned out to be readable under the contacts scopes. The audit is Appendix C.

### WP1. Calendly configuration (Greg with this session, no code, about half a day)

1. Event type "Independent Buyout (IBO) Discussion": team event, round robin, **30 minutes**,
   Zoom location, hosts Michael and Darren at equal priority, "Maximize for availability" (the
   "equal distribution" mode hides a host who is 3 bookings ahead and can cost bookings). Slug
   `ibo-discussion` or similar. Keep the booking form to name and email (decision 4).
2. Confirmation page: Calendly's own page, **no redirect** (the on-site confirmation takes over the
   instant `calendly.event_scheduled` fires).
3. Calendar invitation mode: "calendar invitation" so the invite arrives from the host's own
   calendar address, keeping the confirmation copy "Open the invitation from michael@iboadvisors.com"
   true. Verify the sender on a test booking.
4. Confirmation email: move the "three things" prep text from the HubSpot scheduling page's
   automation into the Calendly event-type confirmation email.
5. Calendly Workflow: email reminders at 2 hours and 10 minutes before, matching today.
6. Personal access token (created under Greg's owner account, scopes `scheduled_events:read`,
   `webhooks:write`) and a webhook
   signing key, both stored as Vercel environment variables on the dashboard project
   (`CALENDLY_API_TOKEN`, `CALENDLY_WEBHOOK_SIGNING_KEY`, `CALENDLY_ORG_URI`). Never in the repo.
7. Branding: primary colour to the site navy; `hide_event_type_details=1` since the page already
   carries the heading and lede; `hide_gdpr_banner=1` because `/privacy-signals.js` handles consent.
8. Two test bookings (one per host, forced by blocking the other's calendar) to record real
   `invitee.created` payloads for the test fixtures.

### WP2. HubSpot preparation (Greg in the UI plus this session, about half a day)

1. Create the contact properties in 5.1 (the existing `ibo_attribution` group fits) and the meeting
   property in 5.2.
2. Create the "Calendly booking" form (fields: `email`, `firstname`, `lastname`, the `ibo_meeting_*`
   set, `ibo_meeting_host`, `ibo_meeting_entry_src`); its GUID goes into `book/book.js`.
3. Private app `dashboardapp`: confirm it can create meetings (community sources say
   `crm.objects.contacts.write` suffices; if the test in WP4 gets a 403, add the meetings scope).
   Reading meetings worked with contacts scopes alone in the audit, which supports this.
4. List 58: add a tenth OR branch, `ibo_last_meeting_booked is known`. W1 to W6 goals and the W2
   if/then: add the same OR. Leave W7 off.
5. W8: keep the trigger. Re-point its three "Rebooked" branches (audit) to
   `ibo_last_meeting_start is after today` OR `engagements_last_meeting_booked is after today`.
   The WP5 no-show case decides whether the "Meeting outcome changed" event fires for API-created
   meetings; if not, rebuild W8 as a meeting-based workflow (enrol meetings where outcome is No
   show, then act on the associated contact). Either way this is the first time W8 will have had a
   real no-show to act on (decision 10).
6. Saved reports: the audit found no list or workflow that filters on the Meetings Link form, on
   `hs_meeting_source` or on the scheduling page, so only HubSpot reports can. Open the reports
   library, search for the scheduling page / "Meetings (Public)" filters, and re-point them.
7. Workflows 4879166163 (MQL on booking) and 4830712547 (notify Edmund): keep as they are until
   the WP5 test shows whether event 4-1720599 fires for API-created meetings; if it does not,
   rebuild both as meeting-based workflows (enrol meetings on create) or let the receiver do the
   two writes (section 3 rows 19 and 20).
8. W8 second trigger (decision 10, can be done now, before any Calendly work): in the W8 trigger
   panel add a second trigger group, "Lead Status is any of No Show", with re-enrolment on when
   Lead Status changes to No Show, keeping the existing "Meeting outcome changed to No show" event
   trigger and the staff-domain refinement on both. Then set the outcome on the next real no-show
   and confirm one contact enrols once and F3 goes out 30 minutes later. Note for the runbook: Lead
   Status "No Show" is not in list 283's sales stages, which is right for a recovery sequence.
9. Owner on completion (decision 2): a new meeting-based workflow, "Meeting completed -> contact
   owner is the host": enrol meetings when `hs_meeting_outcome` becomes COMPLETED, re-enrolment on,
   action: set the associated contact's `hubspot_owner_id` to the meeting's owner. Works for the
   existing HubSpot-tool meetings and for the Calendly-created ones alike, since both are real
   meeting records owned by the host. Build it after the comp report in step 10 exists, so no
   owner moves before the credit measure is in place.
10. Deferred (Greg, 29 Oct: not on this project's critical path). Edmund's comp report
    (decision 2): a saved meetings report, filter `ibo_booking_campaign`
    (or the existing contact-level `engagements_last_meeting_booked_campaign` for history) on his
    outreach campaigns, grouped by `hs_meeting_outcome`. Which campaign and source values count
    as his outreach is confirmed with Greg when the report is built (today: `dripify / outbound /
    edmund-1`; bookings from the nurture emails arrive as `hs_automation` and are a separate
    question).

### WP3. Dashboard build (Opus, 1.5 to 2 days)

Files: `app/api/webhooks/calendly/route.ts`, `app/api/book/confirm/route.ts`,
`app/api/cron/calendly-reconcile/route.ts`, `lib/ingest/calendly/{client,webhook,signature,hosts}.ts`,
`lib/ingest/hubspot/client.ts` (add `createMeeting`, `updateMeeting`, `upsertContactByEmail`,
`getContactByEmail`), `lib/ingest/hubspot/classify.ts` (rows 7 to 9 in section 3),
`lib/ingest/hubspot/properties.ts` and `docs/reference/properties_used.json` (new properties),
`lib/auth/public-paths.ts`, `supabase/migrations/00xx_calendly_bookings.sql`, `vercel.json` (cron),
`.env.example`, `README.md`, a plan note under `docs/plans/`.

Acceptance:

- Signature check uses the raw request body, rejects a bad or stale (`t` older than 3 minutes)
  signature with 401, and is covered by a unit test with a fixture signed by a known key.
- Replaying each recorded payload (created, canceled+rescheduled, created with old_invitee,
  canceled, no_show created, no_show deleted) against a HubSpot sandbox or the live portal with a
  test email produces exactly the writes in 5.1 to 5.3, and replaying the same payload twice
  produces no second meeting.
- Host resolution: `user_email` to owner id for both hosts; an unknown host logs a warning, still
  creates the meeting, and leaves `hubspot_owner_id` unset rather than failing.
- `/confirm` accepts only URIs on `https://api.calendly.com/scheduled_events/`, rate-limits by IP,
  returns within 2 seconds, and returns `{host_email, start, end, email, first_name, last_name}`.
- Reconcile cron is idempotent and reports counts to `sync_runs`.
- Existing dashboard tests pass; `booked_meeting` is true for a contact whose only meeting is
  Calendly-created.

**Dashboard parity (decision 8, hard gate).** The dashboard is used every day and must not be
interrupted: every column in Appendix D reads the same for a Calendly booking as for a HubSpot
one, from the first booking and through the 14-day fallback when both kinds coexist. The
inventory of 29 Oct found no filter on meeting source anywhere in the app, so most columns
already work off the meeting object; these are the changes that make the rest hold:

1. Fetch the new contact properties (`ibo_last_meeting_booked`, `ibo_last_meeting_start`,
   `ibo_meeting_host`, `ibo_meeting_status`, `ibo_meeting_source/medium/campaign/content`,
   `ibo_meeting_entry_src`) in `properties.ts` and `docs/reference/properties_used.json`.
2. `classify.ts` booked flag: OR in `ibo_last_meeting_booked`, so canceled bookings stay
   "booked" as today (row 7).
3. `classify.ts` last-booking UTMs (`meeting_booked_at/_source/_medium/_campaign`): take whichever
   of `engagements_last_meeting_booked` and `ibo_last_meeting_booked` is later, with that set's
   UTMs. This alone fixes every Email Nurture column that reads the booking campaign (From
   nurture, Assisted, Direct, Step booked, weekly nurture meetings, the Booking column).
4. `classify.ts` `funnelType`: `iboadvisors.com/book` and `calendly.com` URLs, and
   `ibo_meeting_entry_src` set, read "Direct meetings-link (calendar)". Fixes the Funnel labels,
   the Meetings list Source detail and the contact Source subline.
5. Attribution fallback for contacts the receiver had to create (Forms API submission failed, so
   HubSpot has no visit): `attributionUrl` falls back to `ibo_meeting_landing_url`, and
   `platform()` treats `OFFLINE` like direct traffic when that URL carries ad UTMs. Keeps Platform,
   row membership and Overview channel right.
6. No change to the worklist no-show rule: the receiver gives the superseding meeting outcome
   SCHEDULED and marks the old one RESCHEDULED, which is what HubSpot does today (3 RESCHEDULED
   scheduler meetings exist), so "rebooked" resolves.
7. Receiver requirements the columns depend on (already in section 5): associate the meeting to
   the contact (an unassociated meeting is invisible everywhere); set `hs_meeting_start_time`,
   `hs_meeting_end_time`, `hs_timestamp`; use HubSpot's internal outcome values; never overwrite
   COMPLETED; set the contact owner only when blank (decision 2), since Point person and the
   worklist Owner read the contact owner.
8. Acceptance: a fixture contact whose only meeting is Calendly-created reads identically to a
   HubSpot-booked control on every Appendix D column; the sync's 4-hourly cadence is unchanged,
   so a Calendly booking appears within the same window as a HubSpot one does today.

### WP4. Site build (Opus, 1 day)

Files: `book/index.html`, `book/book.js`, `modal.js` and `ibo-exit/exit.js` (`schedule_click`
hosts), `scripts/test-attribution.mjs`, `CLAUDE.md` (HubSpot facts), `marketing/*.md` notes.

- State 1 loads `https://assets.calendly.com/assets/external/widget.js` and calls
  `Calendly.initInlineWidget({url, parentElement, prefill, utm})`. `prefill` is built from the
  existing `firstName`, `lastName`, `email` URL params (so the modal, exit page, calculator and the 19
  nurture email links keep working unchanged); `utm` from `tracking.utmParams()`; the `src` value is
  kept on the page and sent in `/confirm` and the form submission, not into Calendly.
- Message listener: accept only `event.origin === 'https://calendly.com'` and
  `event.data.event` starting with `calendly.`; on `calendly.event_scheduled` POST `/confirm`, then
  render State 2 from the response via the existing `HOSTS` table keyed by host email; on a failed
  lookup still show State 2 with "Your time is in the invitation" (the existing fallback). Handle
  `calendly.page_height` for resizing (replaces the HubSpot `{height}` handling).
- Submit the "Calendly booking" form through `tracking.submitForm` with `hutk`, attribution and
  `src`; fail-soft as today.
- Keep: 30 minutes everywhere, Managing Partner, the note card (its `pre_call_note_host` is the
  looked-up host email), no "where will you take the call", no reschedule commitment. The
  "Need a different time?" line can now point at Calendly's `reschedule_url` returned by `/confirm`.
- GA4: `scheduler_view`, `meeting_booked {src, host, lead_days}`, `meeting_book_failed` unchanged;
  add `time_selected` on `calendly.date_and_time_selected`. Google Ads label slot unchanged.
- Keep the old implementation as `book/book-hubspot.js` for one release so rollback is a one-line
  script swap.
- `npm run test:attribution` and `npm run seo:check` pass. The page stays `noindex`.

### WP5. Verification (this session plus Greg, 1 day)

Test matrix, run against a Vercel preview of the dashboard with a temporary Calendly webhook pointed
at the preview URL, then once more on production before the site deploy:

| Case | Expect |
|---|---|
| Book from `/book?src=modal&...` as a brand-new email | contact created, owner = host, Meeting with owner = host, outcome SCHEDULED, `ibo_*` set, form submission on the timeline with the right original source, confirmation shows the host and local time, invite arrives from the host's address, GA4 event |
| Same booking, side effects (audit) | lifecycle stage becomes MQL and Edmund gets the "Meeting Booked" email, either because event 4-1720599 fired for the API meeting or because the fallback in WP2 step 7 is in place; `notes_last_contacted` moved |
| Book as an existing contact owned by someone else | owner unchanged, meeting owner = host, `ibo_booking_*` on the meeting carry the attribution |
| Mark the meeting Completed in HubSpot | contact owner becomes the host (WP2 step 9); the meeting's `ibo_booking_campaign` is unchanged, so the comp report still credits the outreach |
| Reschedule from the invite | old meeting RESCHEDULED, new meeting SCHEDULED, possibly other host |
| Cancel | CANCELED; contact leaves nothing in a send list |
| Mark no-show in Calendly | NO_SHOW within a minute, W8 enrols the contact (or the meeting-based rebuild does) |
| Undo no-show | back to SCHEDULED, W8 unenrols per its rule |
| Webhook down for 10 minutes | Calendly retries; reconcile cron fills any gap |
| Replay the same delivery | no duplicate meeting |
| List 58, W2 branch, dashboard | contact suppressed, W2 does not send A1b, dashboard shows the meeting under the host |
| Pre-call note | lands on the contact and reaches the booked host |
| Dashboard parity sweep (decision 8) | after the next 4-hourly sync, walk every Appendix D column for the test contact against a HubSpot-booked control: Ad Performance Meetings, kind columns, Meetings Held, Today's Meetings, Missed Meeting, No Meeting Scheduled; Meetings list Meeting, Point person, Source; Overview and Forecast counts; Funnel label; Pipeline last touch; contact detail; Email Nurture From nurture, Assisted, Direct, Step booked, Meeting held, worklist No-show and Owner |
| Dashboard regression on the dashboard-only deploy (WP6 step 1) | before the site deploys, the same sweep over existing HubSpot-booked contacts shows no column changed |

Delete the test contacts and meetings afterwards.

### WP6. Cutover and decommission (when Greg says build)

1. Deploy the dashboard first (receiver live but idle, parity changes in). Run the regression
   sweep from WP5 on existing HubSpot bookings: nothing may change while no Calendly booking
   exists. Only then create the production webhook subscription with
   a script (`events`: `invitee.created`, `invitee.canceled`, `invitee_no_show.created`,
   `invitee_no_show.deleted`; `scope`: organization; `signing_key` set).
2. Deploy the site. Links, emails and redirects do not change: `/book` is the only entry point.
3. Watch the first 10 bookings: every `calendly_bookings` row has both `confirm_received_at` and
   `webhook_received_at`, a HubSpot meeting id and a contact id.
4. Keep the HubSpot scheduling page published but unlinked for 14 days as the fallback. Then
   unpublish it, remove `book/book-hubspot.js`, and update `CLAUDE.md` and the marketing runbooks.
5. After 90 days, drop the `engagements_last_meeting_booked` OR-conditions if nobody still books
   through HubSpot.

Rollback at any point: redeploy the previous site build (Vercel instant rollback) or swap the
script tag back to `book-hubspot.js`. The HubSpot scheduling page is untouched until step 4, and the
receiver is harmless when nothing books through Calendly.

## 7. What changes for Michael and Darren

- They mark no-shows in Calendly (Meetings > Details > Mark no-show), not in HubSpot. The receiver
  mirrors it to HubSpot within seconds. Marking it in HubSpot only still fires W8 but leaves
  Calendly's record unmarked; the dashboard follows HubSpot, so no data is lost either way.
- Their calendar invite is sent by Calendly through their own Google Calendar; Zoom links come from
  their Calendly Zoom connection.
- HubSpot still shows every meeting on the contact timeline, owned by the right partner, and every
  contact still carries the campaign that produced the booking.
- When they mark a meeting Completed, the contact's owner moves to them (decision 2). Until then
  the owner stays whoever had the record, so Edmund keeps his contacts through the booking.

## 8. Decisions for Greg

1. **Plan and admin. Decided 29 Oct.** Greg signs up for Calendly Teams as the organization
   owner and adds Michael and Darren as the two hosts (three seats). Greg's account owns the API
   token and the webhook subscription (WP0 step 1, WP1 step 6).
2. **Contact owner on booking. Decided 29 Oct.** At booking the host becomes owner only when the
   contact has none (today's effective behaviour). When the meeting outcome becomes COMPLETED the
   owner moves to the host (WP2 step 9). Edmund's comp is a booking that came out of his outreach,
   regardless of who owned the record, so credit is measured from the booking's attribution, never
   from the owner: the receiver stamps it on the meeting record (section 5.2) and a meetings report
   reads it (WP2 step 10). Portal check on 29 Oct: 19 bookers carry an `edmund` campaign while
   only 8 are owned by Edmund, which confirms owner was never the right measure.
3. **Invite sender. Decided 29 Oct, as recommended.** Calendar invitation from the host's calendar, not Calendly's
   email confirmation, so the confirmation copy and the "Gmail holds invitations from new senders"
   advice stay true.
4. **Booking questions. Decided 29 Oct, as recommended.** Name and email only, as today. Phone is optional and would
   lower completion.
5. **Completed meetings. Decided 29 Oct, as recommended.** Stay manual (Had Zoom Meeting in the dashboard, outcome in
   HubSpot). Auto-marking past meetings COMPLETED is possible later with a cron.
6. **Native Calendly for HubSpot app. Decided 29 Oct: do not install.** Considered against a
   form-first hybrid (attribution written on the IBO form submit, the app logging the meeting).
   The 29 Oct portal check showed the meeting-booked event fires for non-scheduler meetings, which
   helps both paths equally. What decided it: the confirmation lookup needs server code with the
   Calendly token whichever way, so the receiver is a one-day increment, not the whole build; the
   receiver alone controls the meeting owner per host (the app needs each host's HubSpot user
   connected, and the portal's Zoom app shows what happens otherwise: three meetings under one
   owner with no contact attached), the outcome mapping that W8 depends on, the attribution for
   the entry paths that never pass the form (19 nurture email links, the PDF link, outbound), and
   behaviour on NA2. Two writers would duplicate every meeting. Revisit only if HubSpot stops
   being the source of truth.
7. **Fallback window. Decided 29 Oct, as recommended.** Keep the HubSpot scheduling page published
   but unlinked for 14 days after cutover; unpublish on day 15 (WP6 step 4).
8. **Dashboard. Decided 29 Oct.** Greg: the IBO dashboard is used every day, actively, and cannot
   have an interruption; it must be built so that even during cutover every column is accurate.
   So dashboard parity is a hard gate on WP3 and WP5 (Appendix D is the column inventory and WP3
   lists the changes), the dashboard deploys before the site with a regression sweep in between
   (WP6 step 1), and both booking kinds must read correctly side by side through the fallback
   window. The new Calendly bookings panel that would replace the lost HubSpot meetings-tool
   report is deferred to after cutover: the Supabase table holds every booking from day one, so
   nothing is lost by waiting, and WP3 stays focused on the receiver and parity.
9. **Darren's HubSpot seat. Decided 29 Oct.** No action now. On day 15, when the scheduling page
   is unpublished (WP6 step 4), check in HubSpot's users and seats settings whether his paid Sales
   Hub seat is still needed for anything beyond the round robin, and release it if not. The API
   does not expose seat assignments, so this stays a UI check.
10. **No-show practice (new, from the audit). Decided 29 Oct: Greg will enforce it.** Nobody has
    ever set a scheduler meeting's outcome to No show: 0 of 279, with 252 past meetings still
    "Scheduled", while 6 contacts carry Lead Status "No Show". W8 has therefore never run on a
    real no-show. The two marks differ: Lead Status "No Show" on the contact triggers nothing
    today; Outcome "No show" on the meeting activity fires W8. Decision: **W8 gets both
    triggers** (WP2 step 8), so the reps' existing Lead Status habit starts the recovery sequence
    and the meeting outcome stays the system record that HubSpot's meeting reports and the
    dashboard's no-show views read. After cutover, "Mark no-show" in Calendly sets the outcome
    automatically through the receiver (section 7). Double enrolment is not a risk: HubSpot does
    not re-enrol a contact who is still active in the workflow, and W8 runs about 40 days. The 6
    historical "No Show" lead statuses are left alone.

## 9. Unverified points and how each gets settled

| Point | Risk if wrong | Settled by |
|---|---|---|
| `calendly.event_scheduled` arrives with `event.origin === 'https://calendly.com'` | listener never fires | WP1 test booking, console log; the official sample does not check origin at all, so the check is ours |
| API-created meetings fire HubSpot's "Meeting outcome changed" event (W8 trigger) | W8 silent on no-shows | WP5 no-show case; fallback is the meeting-based workflow |
| API-logged meetings update `notes_last_contacted` (list 283) | contacts not suppressed as "in conversation" | **Largely settled 29 Oct**: calendar-synced meetings moved `notes_last_contacted` and `hs_latest_meeting_activity` on every associated contact (same check as the row below). WP5 confirms once for an API-created meeting |
| `crm.objects.contacts.write` is enough to create meetings with `dashboardapp` | 403 on create | WP4 first replay; add the meetings scope if needed |
| `hs_meeting_source` value for API meetings (expected INTEGRATION) | source-filtered reports empty | WP5, read the created meeting |
| Round-robin reschedule can land on the other host | confirmation copy names the wrong partner if we reuse the stored host | handled: `/confirm` re-resolves the host from the new event |
| Calendly's own confirmation page names the host | none for us (we swap it out), but it affects the one second before State 2 renders | WP1 test booking |
| Monthly (not annual) Calendly pricing | budget | Calendly pricing page at purchase |
| HubSpot's meeting-booked event (4-1720599) fires for API-created meetings | MQL stage and Edmund's notification stop on cutover | **Largely settled 29 Oct** from portal data: on 5 of the portal's calendar-synced (BIDIRECTIONAL_API) meetings, every associated contact not already MQL entered MQL at the meeting's exact creation minute (7 contacts, 14 Sep to 25 Oct), and `hs_latest_meeting_activity` and `notes_last_contacted` moved for all of them. The event therefore fires for meetings the scheduler did not create. WP5 confirms it once for an API-created meeting; the fallback in WP2 step 7 is now unlikely to be needed |
| Current IBO portal state: custom properties, list 58 definition, meeting types, how many MEETINGS_EMBEDDED meetings exist | WP2 scope | **Settled 29 Oct** by the read-only audit in Appendix C: the `ibo_meeting_*` group exists and the six "(new)" names are free; list 58 is a 9-way OR with `engagements_last_meeting_booked is known` as one branch; the portal defines no meeting types; zero MEETINGS_EMBEDDED meetings exist, all 279 scheduler bookings are MEETINGS_PUBLIC |

## 10. Costs and effort

| Item | Figure |
|---|---|
| Calendly Teams | $16 per seat per month, annual, per the pricing page; 3 seats (Greg as owner, Michael, Darren) per decision 1 |
| HubSpot | no change in tier; possibly one Sales seat fewer (decision 9) |
| Vercel and Supabase | within current usage |
| Build effort | WP3 1.5 to 2 days, WP4 1 day, WP5 1 day; WP0 to WP2 about 1.5 days of Greg's time spread across the week |

## Appendix A. Calendly facts the build relies on

- Round robin: Teams, Teams Plus, Enterprise. Assignment "Maximize for availability" with priority
  stars; ties go to the host without a recent meeting, then random.
- Embed: `https://assets.calendly.com/assets/external/widget.js`; `Calendly.initInlineWidget({url,
  parentElement, prefill: {name | firstName, lastName, email, customAnswers}, utm: {utmSource,
  utmMedium, utmCampaign, utmContent, utmTerm}})`. A bare iframe gets no events or resizing.
- postMessage events: `calendly.profile_page_viewed`, `calendly.event_type_viewed`,
  `calendly.date_and_time_selected`, `calendly.event_scheduled` (payload `{event: {uri}, invitee:
  {uri}}` only), `calendly.page_height` (`{height: "1200px"}`).
- URL options: `hide_event_type_details=1`, `hide_landing_page_details=1`, `hide_gdpr_banner=1`,
  `primary_color` and friends on paid plans. Prefill params `name`, `first_name`, `last_name`,
  `email`, `guests`, `a1`..`a10`.
- Webhooks: `POST /webhook_subscriptions` with `url`, `events`, `organization`, `scope`,
  `signing_key`. Header `Calendly-Webhook-Signature: t=<unix>,v1=<hex>`; signed string is
  `t + "." + raw body`, HMAC-SHA256; 3-minute tolerance. Retries with back-off for 24 hours, then the
  subscription is disabled and must be recreated.
- `invitee.created` payload: `email`, `first_name`, `last_name`, `name`, `timezone`,
  `questions_and_answers[]`, `tracking.utm_*`, `rescheduled`, `old_invitee`, `new_invitee`,
  `cancel_url`, `reschedule_url`, `cancellation{}`, `no_show{}`, and the embedded
  `scheduled_event{uri, name, status, start_time, end_time, location{join_url}, event_memberships[{user,
  user_email, user_name}]}`.
- Reschedule fires `invitee.canceled` (`rescheduled: true`) then `invitee.created` (`old_invitee`).
- No-show: marked in the Calendly app, or `POST /invitee_no_shows {invitee}` and `DELETE
  /invitee_no_shows/{uuid}`; fires `invitee_no_show.created` / `.deleted`.
- Rate limit 500 requests per user per minute on paid plans.

## Appendix B. HubSpot facts the build relies on

- Meetings: `POST /crm/v3/objects/meetings`, `hs_timestamp` required, association type 200 to a
  contact, `PATCH /crm/v3/objects/meetings/{id}` for outcome. Outcome values `SCHEDULED`,
  `COMPLETED`, `RESCHEDULED`, `NO_SHOW`, `CANCELED`. `hs_meeting_source` is read-only.
- Contacts: `GET /crm/v3/objects/contacts/{email}?idProperty=email`, `PATCH` by the same id, create
  with `POST /crm/v3/objects/contacts`. Batch upsert by email does not support partial updates, so
  read-then-write to avoid blanking names.
- Forms API: `https://api.hsforms.com/submissions/v3/integration/submit/245308986/{guid}` with
  `context.hutk` and `pageUri`, as `tracking.submitForm` already does.
- `engagements_last_meeting_booked` and its `_source/_medium/_campaign` are written only by the
  meetings tool. `notes_last_contacted`, `notes_last_updated`, `num_contacted_notes` are written by any
  logged meeting (confirmed 29 Oct on calendar-synced meetings; see section 9).
- The meeting-booked event `4-1720599` fires for meetings the scheduler did not create: the MQL
  workflow stamped 7 contacts at the creation minute of their calendar-synced meetings (29 Oct
  check). The 3 Zoom-app INTEGRATION meetings in the portal have **no associated contact**, a
  reminder that a third-party app logs what it can match and silently drops the rest.
- Workflows: "Meeting outcome changed" is documented as firing when an outcome changes in the
  account; meeting-based workflows can enrol meetings by property regardless of source.
- Event type ids in this portal (audit): `4-1639801` form submission (filtered on `hs_form_id`),
  `4-1720599` meeting booked (unfiltered, drives the MQL and Notify-Edmund workflows), `4-1724222`
  meeting outcome changed (W8, filtered to NO_SHOW). The Automation v4 API returns ids only.
- The audit key's scopes are enough to read meetings, meeting properties and the v1 engagements
  feed without a meetings scope; the private-app scope picker offered none. Scheduler meeting-link
  details need `scheduler.meetings.meeting-link.read`; marketing email names need `content`.

## Appendix C. Portal audit, 29 October 2026

Read-only, with `IBO_HUBSPOT_SERVICE_KEY` (private app 59288867, portal 245308986, NA2,
account type STANDARD, timezone US/Eastern). Scopes at the time: `automation`, `oauth`,
`crm.objects.contacts.read/write`, `crm.schemas.contacts.read/write`, `crm.objects.users.read/write`,
`crm.objects.leads.read/write`, `marketing.campaigns.read/write`, `automation.sequences.*`,
plus `crm.lists.read`, `forms`, `crm.objects.owners.read` added during the audit. Only GET and
search / batch-read POST calls were made. Prospects are reduced to initials; staff are named.

### C.1 Contact properties

- 471 contact properties. The custom group `ibo_attribution` (created 18 Sep 2026) holds
  `ibo_form_{source,medium,campaign,content,landing_url,uuid,timestamp,ad_id,platform_id}` and
  `ibo_meeting_{same nine}`. Other custom properties of interest: `pre_call_note` (textarea),
  `pre_call_note_host` (text), `pre_call_note_date` (date, never set), `had_zoom_meeting`
  (enumeration, single option Yes), `ibo_qualified` (radio True/False), `ibo_email_sequence_date`,
  `ibo_email_sequence_number`.
- HubSpot-defined and read-only: `engagements_last_meeting_booked` (datetime),
  `engagements_last_meeting_booked_{source,medium,campaign}` (text; no content field),
  `hs_latest_meeting_activity`, `notes_last_contacted`, `hs_last_sales_activity_timestamp`.
- Not present (free for WP2): `ibo_last_meeting_booked`, `ibo_last_meeting_start`,
  `ibo_meeting_host`, `ibo_meeting_status`, `ibo_meeting_entry_src`, `calendly_invitee_uri`.
- Counts: 240 contacts with `engagements_last_meeting_booked`; 290 with
  `hs_latest_meeting_activity`; 5 with `ibo_meeting_source`; 6 with `ibo_meeting_uuid`
  (timestamps 11 to 17 Sep 2026, landing URLs all on `meetings-na2.hubspot.com`); 5 with
  `pre_call_note`; 6 with Lead Status "No Show".

### C.2 Meetings object

- 127 properties, all HubSpot-defined; no custom meeting property exists.
- `hs_meeting_source` options: CRM_UI, INTEGRATION, AVAILABILITY_SCHEDULE, BIDIRECTIONAL_API,
  BIDIRECTIONAL_SYNC, MEETINGS_EMBEDDED, MEETINGS_PUBLIC, MANUAL_LOGGING_FROM_CALENDAR,
  ADHOC_NOTETAKER. Read-only.
- `hs_meeting_outcome` options: SCHEDULED, COMPLETED, RESCHEDULED, NO_SHOW, CANCELED. Writable.
- `hs_activity_type`: no options defined.
- Read-only properties relevant to us: `hs_created_by_scheduling_page` (equals
  `hs_meeting_created_from_link_id` on every record), `hs_organizer_email`, `hs_booking_instance_id`,
  `hs_all_attendee_emails`, `hs_guest_emails`, `hs_object_source*`.

Counts (`total` from the search API):

| Query | Meetings |
|---|---|
| All | 727 |
| Source CRM_UI / INTEGRATION / BIDIRECTIONAL_API / BIDIRECTIONAL_SYNC | 275 / 3 / 13 / 157 |
| Source MEETINGS_PUBLIC / MEETINGS_EMBEDDED | 279 / 0 |
| Outcome SCHEDULED / COMPLETED / RESCHEDULED / NO_SHOW / CANCELED / unset | 266 / 278 / 3 / 8 / 8 / 164 |
| MEETINGS_PUBLIC by outcome: SCHEDULED / COMPLETED / RESCHEDULED / NO_SHOW / CANCELED | 257 / 13 / 3 / 0 / 6 |
| MEETINGS_PUBLIC, outcome SCHEDULED, start already in the past | 252 |
| MEETINGS_* in the last 90 days | 141 |
| Owner Michael, all sources / MEETINGS_* | 553 / 202 |
| Owner Darren, all sources / MEETINGS_* | 142 / 77 |

Scheduling pages behind the 279 scheduler meetings:

| Page id | Meetings | Owners | Active | Titles |
|---|---|---|---|---|
| 134451922 (round robin, `michael-chasen/discussing-the-ibo`) | 142 | Michael 79, Darren 63 | yes, last booking 29 Oct | "Independent Buyout (IBO) Discussion" (51, current), "Discussion about the IBO" (84, older), 6 "Canceled: ..." |
| 134005352 (Michael only) | 123 | Michael 123 | last booking 11 Sep | "Independent Buyout Discussion (IBO) with Michael Chasen" |
| 134389828 (Darren only) | 14 | Darren 14 | last booking 19 Aug | "<name> and Darren Gleeman" |

What the tool writes on a round-robin booking (meeting 412996583139, 29 Oct, contact I. S.):
`hs_meeting_source` MEETINGS_PUBLIC, `hs_created_by_scheduling_page` 134451922, `hubspot_owner_id`
88777593 with `hs_organizer_email` michael@iboadvisors.com (the organizer email is empty on 61 of
the page's 142 meetings, so owner id is the reliable host field), `hs_meeting_title` "Independent
Buyout (IBO) Discussion", `hs_meeting_body` the Zoom invitation text, `hs_meeting_location` and
`hs_video_conference_url` the Zoom URL, `hs_video_conference_platform` zoom,
`hs_meeting_location_type` empty, `hs_meeting_outcome` SCHEDULED, `hs_timestamp` =
`hs_meeting_start_time`, `hs_meeting_end_time` 30 minutes later, `hs_timezone` the booker's zone,
`hs_meeting_pre_meeting_prospect_reminders` at 2 h and 10 min before, `hs_meeting_external_url` a
Google Calendar event link, `hs_i_cal_uid` and `hs_unique_id` the Google event id,
`hs_engagement_source` and `hs_object_source` MEETINGS. On the contact:
`engagements_last_meeting_booked` = start time, `_source/_medium/_campaign` = `dripify / outbound /
edmund-1` (another booker: `linkedin / paid / IBO_XPR_Conversions_IBO Discussion`),
`hs_latest_meeting_activity` = start time, `recent_conversion_event_name` = "Meetings Link:
michael-chasen/discussing-the-ibo", `lifecyclestage` marketingqualifiedlead, `ibo_meeting_*` all
empty. The 10 most recent scheduler meetings all match this shape; 9 are Michael's, 1 Darren's.

Known `/book` bookers (the 5 contacts with a pre-call note) have scheduler meetings that are all
MEETINGS_PUBLIC from page 134451922 (one has no meeting at all). The embed never produces
MEETINGS_EMBEDDED on this portal.

### C.3 Lists

| List | Type | Size | Definition |
|---|---|---|---|
| 58 Suppression - never nurture | dynamic | 345 | OR of: email contains `@csgpartners.com`, `@iboadvisors.com`, `@roedgers.com`, `@hubspot.com`, `mlchasen`; email = `michael@class.com`; `engagements_last_meeting_booked` is known; `lifecyclestage` in [evangelist, customer]; `hs_lead_status` in [UNQUALIFIED, Not Interested] |
| 59 Suppression - met Michael (static, 29 Sep 2026) | static | 228 | no filters |
| 68 Suppression - replied or contact in a year | dynamic | 324 | OR of: `hs_email_last_reply_date` is known; `hs_sales_email_last_replied` is known; `hs_lead_status` = BAD_TIMING |
| 283 Suppression - in conversation | dynamic | 173 | OR of: `hs_lead_status` in [IN_PROGRESS, Closed, Deal Executed, Prospecting, CONNECTED, OPEN, OPEN_DEAL]; `notes_last_contacted` between today minus 14 days and now (US/Eastern) |

Lists 58, 59 and 68 were created by user 168015793, who is no longer among the portal's users.

### C.4 Forms

- Pre-call note (/book confirmation), `a86c0176-58e8-437b-9474-f38bddd0a0a0`, type hubspot,
  created 5 Oct: `email` (required), `pre_call_note` (multi-line, required, label "Anything you'd
  like your host to know before you talk?"), `pre_call_note_host` (hidden). Creates new contacts
  for unknown emails; no notification recipients (the workflow does that). 8 submissions, 5 to 22
  Oct, every page URL on `www.iboadvisors.com/book`. Their query strings show `src=modal` with
  `utm_*`, `ibo_meeting_*`, `firstName`, `lastName`, `email` (six), and `src=email` with
  `utm_source=hs_automation`, `_hsenc`, `_hsmi` (one). Host was Darren on one, Michael on seven.
- IBO Homepage Form (via API), `ec6307ff-aa5a-4e75-b423-11846eab6ad7`, type hubspot, created 10
  Jun, updated 18 Sep: `firstname`, `lastname`, `email`, `phone`, `company`, `ibo_qualified`, hidden
  EBITDA (`what_is_your_approximate_annual_ebitda_profit`) and `role`, and the nine hidden
  `ibo_form_*` fields. No `ibo_meeting_*` or `utm_*` field. Notifies Cyrus Roepers only.
- Meetings Link forms (type MEETING, visible only through the v2 forms API, submissions not
  exportable): `michael-chasen/discussing-the-ibo` (`4b0ad4cd-b92c-454f-9df3-110820dd2a92`,
  fields firstname, lastname, email), plus `michael-chasen`, `michael-chasen/ibo-discussion`,
  `darren-gleeman`, `darren-gleeman/ibo-discussions-w-darren`, `croepers`, `ebreitling`,
  `greg-davies`. No form named "Calendly" or "booking" exists. 25 forms in all.

### C.5 Workflows (18 in the portal)

| Id | Name | On | Trigger | Suppression | Goal / unenrolment |
|---|---|---|---|---|---|
| 5023073981 | IBO Nurture W0 - Paid-social intake router | yes | `hs_analytics_source` = PAID_SOCIAL | 58, 59, 283 (not 68) | none |
| 5021190877 | W1 - Track A qualified owner | yes | manual | 58, 59, 68, 283 | `engagements_last_meeting_booked` is known |
| 5022981825 | W2 - Abandoned scheduler | yes | form ec6307ff submitted, EBITDA in the $3M+ bands, role not Business Advisor; re-enrol on | 58, 59, 68, 283 | same goal; action 2 branches "Booked" on the same property, else sends content 402323441400 (A1b), waits a day, enrols in W1 |
| 5022928581 | W3 - Track B | yes | manual | 58, 59, 68, 283 | same goal |
| 5023160006 | W4 - Track C | yes | manual | 58, 59, 68, 283 | same goal |
| 5023183577 | W5 - Track D advisers | yes | manual | 58, 59, 68, 283 | same goal |
| 5021185726 | W6 - Long tail monthly | yes | manual, re-enrol on | 58, 59, 68, 283 | same goal |
| 5022928580 | W7 - Meeting reminder (F1) | **off** (22 Oct) | `engagements_last_meeting_booked` is known, staff domains excluded; re-enrols when it changes | none | goal = Lead Status Unqualified/Not Interested or opted out; branch "is after today" then content 404482977482 |
| 5023073984 | W8 - No-show recovery | yes | event 4-1724222 with `hs_meeting_outcome` = NO_SHOW, staff domains excluded, re-enrol on | none | same goal as W7; 30 min, F3 (402353625838), 2 days, branch `engagements_last_meeting_booked` is after today, F4 (402564904679), 5 days, branch, A7 (402323479241), 5 days, branch, A8 (402353623789), 27 days, enrol in W6 |
| 5062740687 | IBO Booking - Pre-call note to host | yes | `pre_call_note` is known, non-staff; re-enrols when it changes | none | branch `pre_call_note_host` contains "darren@": internal email and task to Darren, else to Michael |
| 4879166163 | Meeting Booked -> Change to MQL | yes | event 4-1720599, unfiltered | none | sets `lifecyclestage` = marketingqualifiedlead |
| 4830712547 | Meeting Booked - Notify Edmund | yes | event 4-1720599, unfiltered | none | internal email to Edmund Breitling |
| 4821523136 | Form submission notification for Michael | yes | form c16ecef7 (MessageFromWebsiteContactForm) | none | internal email to Michael |
| 4789101297 | Contact Lead Nurture (Post Opt-In) | off | event 4-1463224, refined to `engagements_last_meeting_booked` unknown | none | goal: any associated meeting, or the property known |
| 4830720720, 4788953840, 4809343688, 4294306491 | older drafts | off | various | none | not relevant |

Two consequences the plan now carries: W8's three rebook branches need re-pointing (section 3 row
5), and W8's final "enrol in W6" never takes effect today, because every W8 contact has booked and
is therefore in list 58, which W6 suppresses, and W6's goal is already met for them. That second
point predates this plan and is left for the nurture runbook.

### C.6 Owners and users

Seven owners, none archived, no teams: Cyrus Roepers 79839272, Michael Chasen 88777593
(michael@iboadvisors.com), Darren Gleeman 162759897 (darren@iboadvisors.com), Edmund Breitling
164598474, Aimlogic Analytics 167324501, Greg Davies 167550776, and 167550786 with the email
`brian@iboadvisors.om` (typo in the portal, no name). Five of the seven users are super admins;
`/settings/v3/users` returns no role or seat information.

### C.7 What the API could not show

- Scheduling page slugs (needs `scheduler.meetings.meeting-link.read`); page 134451922 is
  inferred to be `michael-chasen/discussing-the-ibo` from every booker's conversion event name.
- Marketing email names behind content ids (needs `content`); the runbooks map them.
- Meetings Link form submissions (HubSpot refuses to export MEETING-type forms).
- Event type display names (Automation v4 returns ids only).
- Seat assignments (decision 9).

## Appendix D. Dashboard inventory, 29 October 2026 (decision 8)

Read-only pass over `iboadvisors-dashboard` at b5b7363. Nothing in the app filters on
`hs_meeting_source`, `hs_created_by_scheduling_page`, `hs_organizer_email` or `hs_meeting_title`
(zero hits). The sync fetches every meeting with four properties (`hs_meeting_outcome`,
`hs_meeting_start_time`, `hs_createdate`, `hs_lastmodifieddate`), stores `contact_id`, `outcome`,
`start_time`, `created_at`, and treats every outcome except CANCELED as live. The full HubSpot sync
runs every 4 hours (`vercel.json`), so a booking of either kind appears within that window.

Derived contact fields the pages read: `booked_meeting` (scheduler property OR a live meeting
object), `first_meeting_booked_at` (earliest `hs_createdate` of a live meeting),
`meeting_booked_campaign` (scheduler property only, today), `had_zoom_meeting` (manual flag),
`owner_id` (contact owner), `funnel_type` and `platform` (from landing URLs and analytics source).

| Page | Column or view | Reads | Calendly booking |
|---|---|---|---|
| Ad Performance | Meetings; Meetings booked by kind (Company, Advisor, IBO Qualified, Unknown); Meetings Held and its status columns; Lead to meeting; Cost / meeting | `booked_meeting`, `lead_status`, role and qualification | works unchanged |
| Ad Performance | Today's Meetings | live meeting `start_time` within today, Eastern | works once the receiver sets `hs_meeting_start_time` and associates the contact; counts meeting objects, so a second writer would double-count (decision 6) |
| Ad Performance | Follow up: No Meeting Scheduled (IBO Qualified, Unknown) | `booked_meeting` false | works; WP3 item 2 keeps canceled bookings out of it, as today |
| Ad Performance | Follow up: Missed Meeting | latest live `start_time` before today, `had_zoom_meeting` unset, not IBO Unqualified | works unchanged; decided by Had Zoom Meeting, not by NO_SHOW |
| Ad Performance | LinkedIn conv. (post-click) | LinkedIn's own "Meeting Scheduled" conversion via Windsor | outside the app; check the rule in Campaign Manager (section 3 row 22) |
| Ad Performance, Overview | row membership and per-channel split | landing URLs, `ibo_meeting_landing_url` (ad-set id only), `hs_analytics_source` | works when HubSpot tracked the visitor; WP3 item 5 covers receiver-created contacts |
| Meetings list | who is listed; Meeting time and "+N more"; Status; Had Zoom Meeting; Role / IBO Qualified; follow-up filter | `booked_meeting`, live `start_time`, `lead_status`, flag | works once start time and association are set |
| Meetings list | Point person | contact `hubspot_owner_id` | works with decision 2 (owner set when blank); a dash otherwise |
| Meetings list, contact detail, Funnel | Source detail, Source subline, funnel-type labels and filter | `funnel_type` from the URL (`meetings-na2.hubspot.com`) or "Meetings Link:" conversion name | **needs WP3 item 4** |
| Overview, Forecast | Meetings, Meeting rate, Cost / meeting, Meeting to contract | `booked_meeting` by platform | works unchanged |
| Funnel | Booked Meeting stage counts | `booked_meeting` | works unchanged |
| Lead Quality | lead-form bypass | `funnel_type` = ad lead form | works unchanged, reads no meeting signal |
| Pipeline | Last touch, Days since touch | `v_deal_staleness`: max live `start_time` up to now, not CANCELED or NO_SHOW | works once start time and association are set |
| Contact detail | Meeting booked; Meetings on record (time, outcome); edits to Point person, Had Zoom Meeting, Lead Status | `booked_meeting`, meeting rows, HubSpot properties | works unchanged |
| Email Nurture | booking time behind every nurture metric; Meeting held; qualified-LinkedIn 30-day rate; legacy sequence; list health | `first_meeting_booked_at`, outcome COMPLETED, `booked_meeting` | works unchanged (COMPLETED stays the team's manual mark, decision 5) |
| Email Nurture | From nurture, Assisted, Direct, Nurture to meeting, Cost / meeting incl. nurture, Step booked, weekly nurture meetings, untracked footnote, Booking column | `meeting_booked_campaign` (scheduler property) | **needs WP3 item 3**; without it every Calendly booking reads Assisted and From nurture drops to 0 |
| Email Nurture worklist | No-show queue and label; "booked after entering" exclusion; Owner; Last human touch | outcome NO_SHOW with a later SCHEDULED or COMPLETED meeting as rebooked; `first_meeting_booked_at`; contact owner; `notes_last_contacted` | works with the section 5.3 outcome mapping; last contacted confirmed to move for non-scheduler meetings (section 9) |

Pre-existing behaviour that is the same for both booking kinds and is left alone: a RESCHEDULED
meeting is live, so an old slot can still appear under Today's Meetings and "+N more" on the day
it was originally booked for. The offline reference script `docs/reference/analyze.py` still reads
the scheduler property and is not a page.
