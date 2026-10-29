# Calendly scheduling for /book, with HubSpot kept as the source of truth

Status: plan for review. Nothing in this document is built or deployed (standing rule 4).
Date: 29 October 2026. Companion to `marketing/HUBSPOT_BUILD_RUNBOOK.md` and
`marketing/HUBSPOT_WORKFLOW_BUILD_LOG.md`.

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
introduces a parallel `ibo_last_meeting_booked` contact property and re-points the four places that
read the HubSpot one (suppression list 58, the W1 to W6 goals, the W2 branch, the dashboard).

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
                             ibo_meeting_* -> hidden booking-form questions, hubspotutk -> parentHubspotUtk
                  postMessage {meetingBookSucceeded, meetingsPayload.bookingResponse.postResponse}
                           -> organizer (email/userId/name) -> HOSTS table -> host
                           -> timerange -> date/time tile, Google/Outlook/.ics fallbacks
                  State 2: IBO confirmation (approved mockup): confirmed with <host>, steps card,
                           optional pre-call note -> HubSpot form a86c0176... (pre_call_note, pre_call_note_host)
                  GA4 meeting_booked {src, host, lead_days}; Google Ads label slot (empty)
```

HubSpot's meetings tool then does the rest on its own: creates the contact if needed, logs a
Meeting engagement (source `MEETINGS_EMBEDDED`) owned by the round-robin organizer, sends the
calendar invitation and the confirmation email that carries the "three things" prep text, sends
reminders 2 hours and 10 minutes before, stamps `engagements_last_meeting_booked` and the
`engagements_last_meeting_booked_source/medium/campaign` UTM properties, and records a submission of
the auto-generated "Meetings Link: discussing-the-ibo" form.

## 3. Everything that depends on the HubSpot meetings tool (the migration inventory)

Found by reading both repos and the marketing runbooks. Each row must still work after the switch.

| # | Dependency | Where | Reads | After Calendly |
|---|---|---|---|---|
| 1 | Suppression list 58 "never nurture" | HubSpot list | `engagements_last_meeting_booked` is known | Add OR `ibo_last_meeting_booked` is known |
| 2 | W1 to W6 goal ("met goal" = booked) | HubSpot workflows 5021190877, 5022981825, 5022928581, 5023160006, 5023183577, 5021185726 | same property | Goal becomes either property known |
| 3 | W2 abandoned-scheduler branch (60 min, then if/then before A1b) | workflow 5022981825 | same property | Branch on either property |
| 4 | W7 pre-meeting email (off since 22 Oct) | workflow 5022928580 | same property; re-enrols on change | Leave off; if ever re-enabled, trigger on `ibo_last_meeting_booked` |
| 5 | W8 no-show recovery | workflow 5023073984 | event "Meeting outcome changed" to NO_SHOW (event type 4-1724222) | Receiver PATCHes `hs_meeting_outcome=NO_SHOW` on the HubSpot meeting; verify the event fires for API-created meetings, else rebuild W8 as a meeting-based workflow |
| 6 | List 283 "Suppression - in conversation" (W9 trigger) | HubSpot list | Lead Status, or Last Contacted within 14 days (`notes_last_contacted`) | API-logged meetings should update Last Contacted; verify with one test |
| 7 | Dashboard "booked" classification | `lib/ingest/hubspot/classify.ts:884-890` | `engagements_last_meeting_booked` OR an associated live meeting | Second half already covers API meetings; add `ibo_last_meeting_booked` to the first |
| 8 | Dashboard booking attribution | `classify.ts:990-993`, `lib/email/nurture.ts:237`, `lib/email/rollup.ts:662,677` | `engagements_last_meeting_booked_source/medium/campaign` | Fall back to `ibo_meeting_source/medium/campaign` (the receiver writes them) |
| 9 | Dashboard funnel label "Direct meetings-link (calendar)" | `classify.ts:417,435-436` | landing URL host `meetings-na2.hubspot.com` | Add `calendly.com` and the `/book` page |
| 10 | Dashboard meetings sync, Today's Meetings, No-show queue, Missed Meeting | `sync.ts:655-671`, `lib/queries/*`, `lib/ads/follow-up.ts` | HubSpot meeting objects (any source) | Works unchanged as long as the receiver creates real Meeting objects associated to the contact |
| 11 | GA4 `schedule_click` | `modal.js:477-500`, `exit.js:617-650` | link host `meetings-na2.hubspot.com` | Add `calendly.com` |
| 12 | Attribution tests | `scripts/test-attribution.mjs` | stubs `meetings-na2.hubspot.com`, asserts `ibo_meeting_*` params | Update stubs and assertions |
| 13 | Nurture email `[scheduler]` link | `marketing/DRIP_SEQUENCE_EMAILS.md:8`, 19 live links in `hubspot_email_content.json` | `/book?src=email&utm_*&email&firstName&lastName` | **No change**: `/book` translates these params to Calendly prefill |
| 14 | Confirmation email with the "three things" prep text, reminders at 2 h and 10 min | HubSpot scheduling page automation | HubSpot meetings tool | Rebuild in Calendly: event-type confirmation email plus a Calendly Workflow with two reminders |
| 15 | Pre-call note | `book/book.js` -> HubSpot form a86c0176 -> workflow 5062740687 | invitee email + host email | **No change**: the receiver's lookup returns both |
| 16 | "Meetings Link: discussing-the-ibo" form submissions | HubSpot | automatic per booking | Replaced by a deliberate "Calendly booking" Forms API submission from `/book` (carries `hutk`) |
| 17 | HubSpot meetings-tool reports by scheduling page | HubSpot reports | `hs_created_by_scheduling_page`, source MEETINGS_* | Lost. Replace with a dashboard view over the `calendly_bookings` table |
| 18 | `CLAUDE.md` HubSpot facts | repo | describes the NA2 embed | Rewrite the scheduler bullets after cutover |

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
no owner (decision 2 below).

| Property | Type | Written on | Value |
|---|---|---|---|
| `ibo_last_meeting_booked` (new) | datetime | invitee.created | the Calendly `created_at` of the booking |
| `ibo_last_meeting_start` (new) | datetime | created, canceled | `scheduled_event.start_time`; cleared on cancel without reschedule |
| `ibo_meeting_host` (new) | enumeration: michael, darren | created | from `event_memberships[0].user_email` |
| `ibo_meeting_status` (new) | enumeration: scheduled, rescheduled, canceled, no_show, completed | every event | latest state |
| `ibo_meeting_source`, `_medium`, `_campaign`, `_content` (exist) | text | created | page attribution if the `/confirm` call arrived, else Calendly `tracking.utm_*` |
| `ibo_meeting_uuid`, `ibo_meeting_landing_url`, `ibo_meeting_timestamp` (exist) | text, text, date | created | page attribution only (Calendly cannot carry them) |
| `ibo_meeting_entry_src` (new) | text | created | `modal`, `ibo-exit`, `calculator`, `pdf`, `email`, `direct` |
| `calendly_invitee_uri` (new) | text | created | for support lookups |

`engagements_last_meeting_booked*` are left alone: HubSpot sets them only from its own tool, and
they stay valid for the historical bookings already in the portal.

### 5.2 Meeting engagement (`POST /crm/v3/objects/meetings`)

| Property | Value |
|---|---|
| `hs_timestamp`, `hs_meeting_start_time` | `scheduled_event.start_time` |
| `hs_meeting_end_time` | `scheduled_event.end_time` |
| `hs_meeting_title` | "Independent Buyout (IBO) Discussion" (the Calendly event type is named identically so the confirmation's "invitation titled ..." line stays true) |
| `hs_meeting_body` | invitee name and email, entry source, timezone, cancel and reschedule URLs, any question answers |
| `hs_meeting_location` | `location.join_url` (Zoom) |
| `hs_meeting_external_url` | the Calendly event URI |
| `hs_meeting_outcome` | `SCHEDULED`; later `RESCHEDULED`, `CANCELED`, `NO_SHOW`, or back to `SCHEDULED` when a no-show is undone |
| `hubspot_owner_id` | host's owner id: Michael 88777593, Darren 162759897 |
| `hs_activity_type` | optional; only if IBO's portal defines meeting types |
| `calendly_invitee_uri` (new custom meeting property) | idempotency key; the Supabase row holds the HubSpot meeting id too |
| associations | `associationTypeId` 200 to the contact |

`hs_meeting_source` is read-only through the API; API-created meetings are expected to show as
INTEGRATION (unverified, see section 9). Any list or report that filters on MEETINGS_EMBEDDED must
be re-pointed.

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

1. Calendly **Teams**, 2 seats (Michael, Darren). Round robin is Teams and above; the pricing page
   shows $16 per seat per month on annual billing. Decide who is the Calendly organization owner or
   admin: the API token and the organization-scope webhook must be created by an admin, and the
   token then covers both hosts' events.
2. Each host connects Google Calendar and Zoom in Calendly.
3. Decisions 1 to 9 in section 8.
4. Give this session reachable HubSpot access: reconnect the HubSpot connector to portal 245308986,
   or add `HUBSPOT_PRIVATE_APP_TOKEN` to the cloud environment's secrets. The connector in the
   current session is signed in to a different portal (Nikeonis, 247738774), which is why section 9
   still lists portal checks as open.

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
6. Personal access token (admin, scopes `scheduled_events:read`, `webhooks:write`) and a webhook
   signing key, both stored as Vercel environment variables on the dashboard project
   (`CALENDLY_API_TOKEN`, `CALENDLY_WEBHOOK_SIGNING_KEY`, `CALENDLY_ORG_URI`). Never in the repo.
7. Branding: primary colour to the site navy; `hide_event_type_details=1` since the page already
   carries the heading and lede; `hide_gdpr_banner=1` because `/privacy-signals.js` handles consent.
8. Two test bookings (one per host, forced by blocking the other's calendar) to record real
   `invitee.created` payloads for the test fixtures.

### WP2. HubSpot preparation (Greg in the UI plus this session, about half a day)

1. Create the contact properties in 5.1 and the meeting property in 5.2 (group "IBO Meeting").
2. Create the "Calendly booking" form (fields: `email`, `firstname`, `lastname`, the `ibo_meeting_*`
   set, `ibo_meeting_host`, `ibo_meeting_entry_src`); its GUID goes into `book/book.js`.
3. Private app `dashboardapp`: confirm it can create meetings (community sources say
   `crm.objects.contacts.write` suffices; if the test in WP4 gets a 403, add the meetings scope).
4. List 58: add OR `ibo_last_meeting_booked is known`. W1 to W6 goals and the W2 if/then: add the
   same OR. Leave W7 off.
5. W8: keep the trigger. The WP4 test decides whether the "Meeting outcome changed" event fires for
   API-created meetings; if not, rebuild W8 as a meeting-based workflow (enrol meetings where
   outcome is No show, then act on the associated contact).
6. Record which lists, reports or workflows filter on the "Meetings Link: discussing-the-ibo" form
   or on `hs_meeting_source`, and re-point them.

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
| Book as an existing contact owned by someone else | owner unchanged, meeting owner = host |
| Reschedule from the invite | old meeting RESCHEDULED, new meeting SCHEDULED, possibly other host |
| Cancel | CANCELED; contact leaves nothing in a send list |
| Mark no-show in Calendly | NO_SHOW within a minute, W8 enrols the contact (or the meeting-based rebuild does) |
| Undo no-show | back to SCHEDULED, W8 unenrols per its rule |
| Webhook down for 10 minutes | Calendly retries; reconcile cron fills any gap |
| Replay the same delivery | no duplicate meeting |
| List 58, W2 branch, dashboard | contact suppressed, W2 does not send A1b, dashboard shows the meeting under the host |
| Pre-call note | lands on the contact and reaches the booked host |

Delete the test contacts and meetings afterwards.

### WP6. Cutover and decommission (when Greg says build)

1. Deploy the dashboard (receiver live but idle). Create the production webhook subscription with
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

## 8. Decisions for Greg

1. **Plan and admin.** Calendly Teams with 2 host seats; who is the organization admin that owns the
   token (a third admin seat, or Michael)?
2. **Contact owner on booking.** Recommended: set the host as owner only when the contact has none;
   never overwrite. Same as today's effective behaviour.
3. **Invite sender.** Recommended: calendar invitation from the host's calendar, not Calendly's
   email confirmation, so the confirmation copy and the "Gmail holds invitations from new senders"
   advice stay true.
4. **Booking questions.** Recommended: name and email only, as today. Phone is optional and would
   lower completion.
5. **Completed meetings.** Recommended: stay manual (Had Zoom Meeting in the dashboard, outcome in
   HubSpot). Auto-marking past meetings COMPLETED is possible later with a cron.
6. **Native Calendly for HubSpot app.** Recommended: do not install. It would duplicate meetings and
   cannot write the properties the programme needs.
7. **Fallback window.** Recommended: keep the HubSpot scheduling page published for 14 days after
   cutover.
8. **Dashboard view.** Add a Calendly bookings panel (host split, source, status) to replace the lost
   HubSpot meetings-tool report, or defer.
9. **Darren's HubSpot seat.** If his paid Sales Hub seat existed only for the meetings round robin,
   check whether it can be released once HubSpot scheduling is unpublished (cost offset; unverified).

## 9. Unverified points and how each gets settled

| Point | Risk if wrong | Settled by |
|---|---|---|
| `calendly.event_scheduled` arrives with `event.origin === 'https://calendly.com'` | listener never fires | WP1 test booking, console log; the official sample does not check origin at all, so the check is ours |
| API-created meetings fire HubSpot's "Meeting outcome changed" event (W8 trigger) | W8 silent on no-shows | WP5 no-show case; fallback is the meeting-based workflow |
| API-logged meetings update `notes_last_contacted` (list 283) | contacts not suppressed as "in conversation" | WP5, inspect the test contact |
| `crm.objects.contacts.write` is enough to create meetings with `dashboardapp` | 403 on create | WP4 first replay; add the meetings scope if needed |
| `hs_meeting_source` value for API meetings (expected INTEGRATION) | source-filtered reports empty | WP5, read the created meeting |
| Round-robin reschedule can land on the other host | confirmation copy names the wrong partner if we reuse the stored host | handled: `/confirm` re-resolves the host from the new event |
| Calendly's own confirmation page names the host | none for us (we swap it out), but it affects the one second before State 2 renders | WP1 test booking |
| Monthly (not annual) Calendly pricing | budget | Calendly pricing page at purchase |
| Current IBO portal state: custom properties, list 58 definition, meeting types, how many MEETINGS_EMBEDDED meetings exist | WP2 scope | reconnect the HubSpot connector or add the token (WP0.4), then rerun the portal audit |

## 10. Costs and effort

| Item | Figure |
|---|---|
| Calendly Teams | $16 per seat per month, annual, per the pricing page; 2 to 3 seats |
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
  logged meeting (verify).
- Workflows: "Meeting outcome changed" is documented as firing when an outcome changes in the
  account; meeting-based workflows can enrol meetings by property regardless of source.
