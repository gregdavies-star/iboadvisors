# HubSpot build runbook - paid-social nurture (28 Sep 2026)

What was built automatically, what is left to click through in HubSpot, and the exact settings for each remaining step. Companion to `DRIP_SEQUENCE_STRATEGY.md` and `DRIP_SEQUENCE_EMAILS.md`.

## 0. Do this first: email authentication (test sends went to junk on 28 Sep)

Verified by DNS lookup on 28 Sep: iboadvisors.com has no HubSpot DKIM records, an SPF record whose only include (`dc-aa8e722993._spfm.iboadvisors.com`) does not resolve, no DMARC record, and no Google DKIM. Mail is hosted on Google Workspace; DNS is at Cloudflare. Gmail therefore treats every HubSpot send as a spoof of your own domain and files it as spam. Fix before any send:

1. HubSpot: Settings > Content > Domains & URLs > Connect a domain > Email sending > iboadvisors.com. Add the two CNAME records HubSpot shows (hs1-245308986._domainkey and hs2-245308986._domainkey) in Cloudflare with the proxy off, then Verify.
2. Cloudflare: replace the SPF TXT on iboadvisors.com with `v=spf1 include:_spf.google.com include:<HubSpot include from the connect screen> ~all`.
3. Cloudflare: add `_dmarc.iboadvisors.com TXT v=DMARC1; p=none; rua=mailto:dmarc@iboadvisors.com`. Tighten to `p=quarantine` after two clean weeks of reports.
4. Google Workspace admin: turn on Gmail DKIM signing for the domain (Apps > Google Workspace > Gmail > Authenticate email).
5. One hour later resend one test to Michael, open Show original in Gmail and confirm SPF PASS, DKIM PASS with domain iboadvisors.com, DMARC PASS. Michael should mark the earlier tests Not spam.

## 1. What is done (built through the HubSpot connector)

- **26 automated nurture emails** created as drafts with Michael's 28 Sep copy, plain-text style, first-name personalisation, sender and reply-to set, subscription type "Marketing Information", and a per-email tagged scheduler link (`utm_campaign=<track>&utm_content=<email id>`) with the contact's name and email pre-filled. IDs in section 6.
- **26 test copies** ("TEST for Michael - ...") as batch emails addressed only to michael@iboadvisors.com, identical to the production copy plus a "Template: <name>" line at the bottom. They are ready to send; see section 2.
- **Catch-up email** ("IBO Nurture A1-Catchup") as a batch email addressed to the 176 catch-up contacts (140 never-contacted paid-social leads plus 79 qualified LinkedIn leads from July-September without a meeting, de-duplicated), with the csgpartners.com contact excluded.
- **Superseded drafts renamed** with an "ARCHIVE (superseded 28 Sep)" prefix so nobody publishes them: the four "IBO Nurture - Email 1-4" drafts from 25 Sep, "Edmund Nurture - Email 1 (Clone)", "New email", and "$100M Quick Math".
- **`ibo_qualified` backfilled** on every paid-social contact whose EBITDA band is known (True for $3M+, False under $3M), so workflows can branch on one property.

## 2. Send Michael his test copies (5 minutes)

The connector cannot send email, so this is a click each. In HubSpot: Marketing > Email > filter by name "TEST for Michael". For each one: open > **Review and send** > **Send now**. The recipient is already set to Michael only. Alternatively open each production email and use **Actions > Send test email** to michael@iboadvisors.com; the test copies exist so the template name appears at the bottom of what he receives.

## 3. Three things the connector was not allowed to do

| Item | Why blocked | Fix |
|---|---|---|
| Create lists (suppression list, enrollment lists) | Connector reports the Lists object as REQUIRES_REAUTHORIZATION (scopes `crm.lists.write`, `crm.segments.write`) | Disconnect and reconnect the HubSpot connector in Claude, accepting every permission on the HubSpot consent screen. Then say "build the lists" and they will be created through the connector. Same reauthorization unlocks the Campaign object (`marketing.campaigns.write`), which groups all 27 emails for reporting. |
| Set marketing-contact status on the 40 paid-social contacts marked non-marketing | Connector lacks the `marketable-contacts-write` scope | Contacts > filter Marketing contact status = Non-marketing AND Original source = Paid social > select all > Actions > Set as marketing contacts |
| Workflows | The connector has no workflow tool | Build per section 5 (about 60 minutes for all seven) |

## 4. Lists to create (Contacts > Lists > Create, Active list)

| List name | Filters |
|---|---|
| **Suppression - never nurture** | OR of: Email contains any of `@csgpartners.com`, `@iboadvisors.com`, `@roedgers.com`, `@hubspot.com`, `mlchasen`, `michael@class.com` (Michael's personal test addresses); **Latest meeting activity is known** (this one property covers scheduler bookings, calendar-synced meetings and meetings logged by hand, past and upcoming; "Date of last meeting booked in meetings tool" only covers the scheduler and misses about 470 contacts); Lifecycle stage is any of Customer, Evangelist; Lead status is any of Unqualified, Not Interested. Add this list as "Contact is not a member of" on every workflow enrollment and as the exclusion list on the catch-up send. As of 28 Sep it holds the 9 internal contacts plus 227 contacts with a meeting on record. |
| **Nurture - Paid social owners, qualified** | Original source = Paid social AND `ibo_qualified` = True AND Latest meeting activity is unknown AND not a member of "Suppression - never nurture" |
| **Nurture - Paid social owners, $1M-$3M** | Original source = Paid social AND (`What is your approximate annual EBITDA?` is any of `$1m - $3m` OR `What is your approximate annual EBITDA (profit)?` is any of `$1M - $3M`) |
| **Nurture - Paid social owners, under $1M** | Original source = Paid social AND (`What is your approximate annual EBITDA?` is any of `$500k - $1m`, `$0` OR `What is your approximate annual EBITDA (profit)?` is any of `$0 - $1M`) |
| **Nurture - Advisers** | `Role` = Business Advisor (the site modal writes this; add the same question to the LinkedIn Lead Gen Form) |
| **Nurture - Booked** | Latest meeting activity is known |

## 5. Workflows to build (Automation > Workflows > Contact-based)

Common settings for every nurture workflow:
- **Goal:** Latest meeting activity **is known** (fires on any meeting, including calendar-synced and upcoming).
- **Unenrollment triggers:** Lead status is any of Unqualified, Not Interested, Contact In a Year; Last marketing email reply date is known; Recent sales email replied date is known; Unsubscribed from all email = true.
- **Suppression:** contact is not a member of "Suppression - never nurture". Also add an unenrollment trigger: Latest meeting activity is known.
- **Re-enrollment:** off (except W6, see below).
- Scheduled emails use the delay action **"Delay until a day or time"** with Tuesday-Thursday, 7:30am, and "use contact's time zone" where the lead's time zone is known.

### W0 - Paid-social intake router
- Enroll: Contact created AND Original source = Paid social (turn on "enroll existing contacts": No; the catch-up handles history).
- Actions: create Task for Edmund Breitling, high priority, due in 1 hour, title "Paid-social lead - call {{contact.firstname}} ({{ibo band }})".
- Branch on `ibo_qualified` / EBITDA band: True -> enroll in W1; $1M-$3M -> W3; under $1M -> W4; Role = Business Advisor -> W5; unknown band -> enroll in W1 (the A1 email asks for the number).
- Note: `ibo_qualified` is only backfilled on existing contacts. For new contacts add a first action that sets `ibo_qualified` from the EBITDA band: True when `What is your approximate annual EBITDA?` contains any of `$3m`, `$5m`, `$10m` or `..._profit` is any of `$3M - $5M`, `$5M - $10M`, `$10M - $20M`, `$10M+`, `$20M+`; False otherwise.

### W1 - Track A, qualified owner (7 emails / 18 days)
Send A1 -> delay 1 day -> A2 (Tue-Thu 7:30) -> delay 1 day -> A3 -> delay 1 day -> A4 -> delay 3 days -> A5 -> delay 3 days -> A6 -> delay 4 days -> A7 -> delay 5 days -> A8 -> delay 27 days -> enroll in W6.

### W2 - Track A2, abandoned scheduler
- Enroll: Form submission on the Learn More form (GUID ec6307ff-aa5a-4e75-b423-11846eab6ad7) AND `What is your approximate annual EBITDA (profit)?` is any of the $3M+ bands.
- Delay 60 minutes -> if/then: Date of last meeting booked is known -> end; else send A1b -> delay 1 day -> enroll in W1 (W1's first step A1 should be skipped for these: put A1 behind an if/then "Has been sent A1b" = No).

### W3 - Track B, owner $1M-$3M
B1 -> 7 days -> B2 -> 14 days -> B3 -> 24 days -> B4 -> 45 days -> B5 -> 90 days -> B5 (loop via re-enrollment every 90 days). Also enroll in W6 at day 45. If/then after each B5: `ibo_qualified` = True -> enroll in W1.

### W4 - Track C, owner under $1M
C1 -> 45 days -> enroll in W6; every 90 days send B5.

### W5 - Track D, advisers
D1 -> 3 days -> D2 -> 7 days -> D3 -> 10 days -> D4 -> 25 days -> enroll in W6.

### W6 - Long tail (monthly)
- Enroll: from W1/W3/W4/W5 hand-off. Re-enrollment on: new form submission, or new session from Paid social.
- Monthly: L1 -> 30 days -> L2 -> 30 days -> L3 -> 30 days -> (L4-L10: build as they are written; until then loop L1-L3). Every 90 days: Q.
- Delay until the first Tuesday, 7:30am.

### W7 - Track F, meeting booked
- Enroll: Latest meeting activity is known (or Meeting start time is known via the Meetings activity filter).
- Delay until 24 hours before the meeting start (use the meeting's start time property from the Meetings tool) -> F1. 
- SMS at T-2h is not available (no SMS tool in this portal); skip until HubSpot SMS or Twilio is added.
- If meeting outcome = No show: wait 30 minutes -> F3 -> 2 days -> F4 -> 5 days -> enroll in W1 at A7.

## 6. Email IDs

Full machine-readable list in `marketing/hubspot_email_ids.json`. All are drafts in portal 245308986.

### Production (automated, for workflows; A1-Catchup is a batch email)

| Key | Internal name | Object ID |
|---|---|---|
| A1 | IBO Nurture A1 - Your Independent Buyout (IBO) question | 860702939871 |
| A1b | IBO Nurture A1b - Your calendar link (abandoned scheduler) | 860669025996 |
| A2 | IBO Nurture A2 - Most Owners/Founders Don't Know this Exists | 860757860060 |
| A3 | IBO Nurture A3 - The $26M difference | 860757965554 |
| A4 | IBO Nurture A4 - The Founders/Owners Exit Conversation is Broken | 860704843490 |
| A5 | IBO Nurture A5 - A note from Michael Chasen | 860699558620 |
| A6 | IBO Nurture A6 - What PE hopes you never learn | 860637635289 |
| A7 | IBO Nurture A7 - Three options, pick one | 860645689025 |
| A8 | IBO Nurture A8 - Should I close your file? (breakup) | 860708443897 |
| L1 | IBO Nurture L1 - The pros and cons, honestly | 860750506702 |
| L2 | IBO Nurture L2 - How they'll value your company | 860710187760 |
| L3 | IBO Nurture L3 - The second bite, explained | 860669137645 |
| Q | IBO Nurture Q - Still the right time to talk? (quarterly re-ask) | 860640395972 |
| B1 | IBO Nurture B1 - Honest answer on fit ($1M-$3M) | 860761459403 |
| B2 | IBO Nurture B2 - The four levers that move EBITDA | 860703195883 |
| B3 | IBO Nurture B3 - Exit planning, eight steps | 860750653125 |
| B4 | IBO Nurture B4 - Other doors: MBO, minority recap | 860694432493 |
| B5 | IBO Nurture B5 - Has EBITDA crossed $3M? (quarterly re-qualify) | 861120111300 |
| C1 | IBO Nurture C1 - Honest answer on fit (under $1M) | 860645492456 |
| D1 | IBO Nurture D1 - Thanks, and a quick question (advisers) | 860706602689 |
| D2 | IBO Nurture D2 - How to spot an IBO candidate in your book | 860659891926 |
| D3 | IBO Nurture D3 - What we do for referring advisers | 860635590372 |
| D4 | IBO Nurture D4 - Close the loop? (breakup) | 860701586150 |
| F1 | IBO Nurture F1 - Tomorrow: three things to have handy | 861123106525 |
| F3 | IBO Nurture F3 - Missed you, grab another slot | 860759619306 |
| F4 | IBO Nurture F4 - Still worth the 20 minutes? | 861122596600 |
| A1-Catchup | IBO Nurture A1-Catchup - Your Independent Buyout (IBO) question (catch-up) | 860757857999 |

### Test copies for Michael (batch, recipient = michael@iboadvisors.com only)

| Key | Test email name | Object ID |
|---|---|---|
| A1 | TEST for Michael - IBO Nurture A1 - Your Independent Buyout (IBO) question | 860633460413 |
| A1b | TEST for Michael - IBO Nurture A1b - Your calendar link (abandoned scheduler) | 860763082458 |
| A2 | TEST for Michael - IBO Nurture A2 - Most Owners/Founders Don't Know this Exists | 860766335710 |
| A3 | TEST for Michael - IBO Nurture A3 - The $26M difference | 860763294396 |
| A4 | TEST for Michael - IBO Nurture A4 - The Founders/Owners Exit Conversation is Broken | 860694435518 |
| A5 | TEST for Michael - IBO Nurture A5 - A note from Michael Chasen | 860645693138 |
| A6 | TEST for Michael - IBO Nurture A6 - What PE hopes you never learn | 860695584481 |
| A7 | TEST for Michael - IBO Nurture A7 - Three options, pick one | 860753865447 |
| A8 | TEST for Michael - IBO Nurture A8 - Should I close your file? (breakup) | 860657755869 |
| L1 | TEST for Michael - IBO Nurture L1 - The pros and cons, honestly | 860663625450 |
| L2 | TEST for Michael - IBO Nurture L2 - How they'll value your company | 860633460442 |
| L3 | TEST for Michael - IBO Nurture L3 - The second bite, explained | 860657671906 |
| Q | TEST for Michael - IBO Nurture Q - Still the right time to talk? (quarterly re-ask) | 860637641421 |
| B1 | TEST for Michael - IBO Nurture B1 - Honest answer on fit ($1M-$3M) | 860669254365 |
| B2 | TEST for Michael - IBO Nurture B2 - The four levers that move EBITDA | 860647060209 |
| B3 | TEST for Michael - IBO Nurture B3 - Exit planning, eight steps | 860654840555 |
| B4 | TEST for Michael - IBO Nurture B4 - Other doors: MBO, minority recap | 860763296455 |
| B5 | TEST for Michael - IBO Nurture B5 - Has EBITDA crossed $3M? (quarterly re-qualify) | 860694437601 |
| C1 | TEST for Michael - IBO Nurture C1 - Honest answer on fit (under $1M) | 860763081461 |
| D1 | TEST for Michael - IBO Nurture D1 - Thanks, and a quick question (advisers) | 860695500514 |
| D2 | TEST for Michael - IBO Nurture D2 - How to spot an IBO candidate in your book | 860633499328 |
| D3 | TEST for Michael - IBO Nurture D3 - What we do for referring advisers | 860641584853 |
| D4 | TEST for Michael - IBO Nurture D4 - Close the loop? (breakup) | 860779128510 |
| F1 | TEST for Michael - IBO Nurture F1 - Tomorrow: three things to have handy | 860694324984 |
| F3 | TEST for Michael - IBO Nurture F3 - Missed you, grab another slot | 860663737045 |
| F4 | TEST for Michael - IBO Nurture F4 - Still worth the 20 minutes? | 860669141738 |

## 7. Catch-up send (this week)

Marketing > Email > "IBO Nurture A1-Catchup - Your Independent Buyout (IBO) question (catch-up)". Recipients are already attached (176 contacts; csgpartners.com excluded). Verified 28 Sep: none of the 176 has any meeting on record, and the email already carries a 231-contact exclusion (every contact with a meeting on record plus the 9 internal addresses) so it is safe to send even before the suppression list exists. Add "Suppression - never nurture" under "Don't send to" as well once the list is built, then Review and send. Then add the same 176 contacts to W1 starting at A2 (enroll manually from the list "Nurture - Paid social owners, qualified" with "skip A1" set, or clone W1 without the A1 step for this one enrollment).

## 8. Existing campaigns: current state and what to switch off

- No workflow has ever sent a marketing email from this portal, so there is nothing running to disable.
- Two "Edmund" emails from May are published as automated emails (cannot be renamed by the connector). They are not attached to any workflow; leave them or unpublish from the UI (Actions > Unpublish) to be safe.
- The one-to-one "IBO Email Sequence" from June was manual and is not running.

## 9. Layout change (29 Sep) after Michael's review

Michael's test sends looked like a marketing template: HubSpot's drag-and-drop editor wraps content in a centred 600px table, applied its default blue-grey text and teal links, and added 175% line spacing to every paragraph, which doubled the blank-line gaps. All 27 production drafts now use a single-column full-width layout, Arial 14px near-black text, standard blue underlined links, paragraph spacing matching a hand-written email, and a left-aligned 11px grey footer (the address and unsubscribe links are required by law on marketing email and cannot be removed). Rendering verified on A1.

The 26 "TEST for Michael" copies were sent on 28 Sep and are therefore published and locked. To show Michael the new look, open any production email > Actions > Send test email > michael@iboadvisors.com. HubSpot prefixes the subject with [TEST] on that path; the template name is in the internal email name, not in the body.

### Tested 29 Sep: HubSpot's own "Plain text" template

Built a copy of A1 on HubSpot's built-in `@hubspot/email/dnd/plain_text.html` template to check whether it drops the table. It does not: it renders the same centred 600px table, blue-grey 15px text, teal links, 175% line spacing and centred footer that Michael objected to. The full-width layout now applied to all 27 production drafts is the plainer of the two. The only way to remove HubSpot's wrapper table entirely is a hand-coded email template built in Design Manager (Marketing > Files and Templates > Design Tools), which requires Marketing Hub Professional; the portal has no coded templates today. Every email would then need to be recreated on that template because the template cannot be changed after creation.

A fresh, unsent test of A1 in the new layout exists as "TEST for Michael v2 - IBO Nurture A1 (Plain text template)", recipient Michael only. Review and send it to show him the new look.

## 10. Michael's second round of copy edits (29 Sep)

Applied from his revised document to 12 production bodies: A1, A1b, A2, A3, A7, A8, B5, D2, D4, F1, F3, F4 (plus the matching "(IBO)" on the catch-up email). Fourteen bodies were unchanged: A4, A5, A6, L1, L2, L3, Q, B1, B2, B3, B4, C1, D1, D3. Two small edits were tidied rather than copied verbatim: the A8 addition was punctuated as one sentence ("...tax free, then let's chat."), and the D2 bullet kept the plural "Companies that want ... DON'T want" rather than the singular in the draft. The exact HTML now in HubSpot for every email is in `marketing/hubspot_email_content.json`.

## 11. B5, F1 and F4 rebuilt (29 Sep)

Those three had been created as batch emails instead of automated, and all three were published (sent) on the evening of 28 Sep during test sending: F1 and F4 to one recipient each, B5 to two. All four deliveries went to Michael's own test addresses (mlchasen@gmail.com, mlchasen+1@gmail.com, michael@class.com); no prospect received anything. A sent batch email is locked and a batch email cannot be used in a workflow, so each was recreated as an automated email with the same name and Michael's latest copy. New IDs: B5 861120111300, F1 861123106525, F4 861122596600. The old three still show in Marketing > Email with a "Sent" status; ignore them when building W3 and W7 and pick the ones with the Automated type.

## 12. Go-live checklist (29 Sep) - who does what

Order matters. "Me" = through the HubSpot connector from this session. "You" = in the HubSpot UI.

| # | Step | Owner | Notes |
|---|---|---|---|
| 1 | Reconnect the HubSpot connector in Claude and, on HubSpot's consent screen, explicitly tick Lists, Segments and Marketing campaigns (they are unticked by default). A lock icon on any of them means a HubSpot admin has to approve the scope for the app first under Settings > Integrations > Connected apps | You (2 min) | Unlocks lists, the campaign object and marketing-contact status for me. Skip it and steps 3, 4, 5 and 9 become yours. |
| 2 | Check marketing-contact headroom: Settings > Account > Marketing contacts | You (1 min) | 40 more contacts become marketing in step 3; confirm the tier allows it. |
| 3 | ~~Set the 40 paid-social non-marketing contacts to marketing~~ Not needed: all 40 already have a meeting on record, so the suppression list excludes them anyway | Nobody | Checked 29 Sep. |
| 4 | Build the suppression list and the five enrollment lists (section 4) | Me after step 1, else you (15 min) | |
| 5 | Build a static list of the 176 catch-up contacts | Me after step 1, else you | Used in step 12 to enroll them at A2. |
| 6 | Ad lead sync: Marketing > Ads > Settings > Lead syncing, turn on "create contacts as marketing contacts" for LinkedIn and Meta; confirm the Learn More website form does the same (Forms > form > Options) | You (5 min) | Without this, new signups arrive as non-marketing and receive nothing. |
| 7 | Build workflows W0-W7 (section 5), all switched off; each uses the suppression list on enrollment, goal "Latest meeting activity is known", and the unenrollment triggers. In W1, wrap the A1 send in an if/then: "Has been sent email IBO Nurture A1-Catchup" = No | You (60 min) | Pick the Automated-type B5, F1, F4 (section 11). |
| 8 | Dry run: create a test contact on a personal address with ibo_qualified = True, enroll it in W1 with the workflow on, confirm A1 lands in the inbox, first name and scheduler prefill correct, then unenroll and delete the contact | You (10 min) | I check the send registered and the headers pass authentication. |
| 9 | Create the campaign object and attach all 27 emails for reporting | Me after step 1 | Optional but cheap. |
| 10 | Catch-up send: open "IBO Nurture A1-Catchup", add "Suppression - never nurture" under Don't send to, confirm the count is 176, schedule for Wed 30 Sep 7:30am ET | You (3 min) | Exclusions for meetings, internal and Michael's test addresses are already on it. |
| 11 | Switch on W1, W2, W3, W4, W5, W6, W7. Enroll existing: W1 No, W2 No, W3 Yes, W4 Yes, W5 Yes, W6 No, W7 No | You (5 min) | Existing $1M-$3M, under-$1M and adviser contacts start their slow tracks; qualified legacy owners are covered by the catch-up instead. |
| 12 | Thursday 1 Oct: enroll the 176 catch-up contacts (list from step 5) in W1. The if/then from step 7 skips A1, so A2 goes out Tue 6 Oct 7:30am | You (2 min) | |
| 13 | Switch on W0 last | You (1 min) | New paid-social signups now get A1 within a minute and Edmund gets the call task. |
| 14 | Monitoring, first two weeks: sends, bounces, unsubscribes, spam reports, replies, meetings booked by utm_campaign | Me, on request or on a daily schedule | Anything above 0.3% spam or 2% unsubscribe on one email pauses that email. |

Not in scope: F2 SMS (no SMS tool in the portal). Legacy: the two published Edmund emails from May are attached to nothing; leave them.
