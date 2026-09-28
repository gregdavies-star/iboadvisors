# HubSpot build runbook - paid-social nurture (28 Sep 2026)

What was built automatically, what is left to click through in HubSpot, and the exact settings for each remaining step. Companion to `DRIP_SEQUENCE_STRATEGY.md` and `DRIP_SEQUENCE_EMAILS.md`.

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
| Create lists (suppression list, enrollment lists) | Connector lacks the `crm.lists.write` scope, even after reconnecting | Build the lists in section 4 by hand (10 minutes), or reinstall the HubSpot connector granting the Lists scope and I will create them |
| Set marketing-contact status on the 40 paid-social contacts marked non-marketing | Connector lacks the `marketable-contacts-write` scope | Contacts > filter Marketing contact status = Non-marketing AND Original source = Paid social > select all > Actions > Set as marketing contacts |
| Workflows | The connector has no workflow tool | Build per section 5 (about 60 minutes for all seven) |

## 4. Lists to create (Contacts > Lists > Create, Active list)

| List name | Filters |
|---|---|
| **Suppression - csgpartners.com (never email)** | Email ends with `csgpartners.com`. Add this list as an exclusion on every workflow's enrollment ("Contact is not a member of") and as a suppression list on the catch-up send. Today it holds one contact (already a non-marketing contact). |
| **Nurture - Paid social owners, qualified** | Original source = Paid social AND `ibo_qualified` = True AND Date of last meeting booked in meetings tool is unknown AND Lifecycle stage is not Customer |
| **Nurture - Paid social owners, $1M-$3M** | Original source = Paid social AND (`What is your approximate annual EBITDA?` is any of `$1m - $3m` OR `What is your approximate annual EBITDA (profit)?` is any of `$1M - $3M`) |
| **Nurture - Paid social owners, under $1M** | Original source = Paid social AND (`What is your approximate annual EBITDA?` is any of `$500k - $1m`, `$0` OR `What is your approximate annual EBITDA (profit)?` is any of `$0 - $1M`) |
| **Nurture - Advisers** | `Role` = Business Advisor (the site modal writes this; add the same question to the LinkedIn Lead Gen Form) |
| **Nurture - Booked** | Date of last meeting booked in meetings tool is known |

## 5. Workflows to build (Automation > Workflows > Contact-based)

Common settings for every nurture workflow:
- **Goal:** Date of last meeting booked in meetings tool **is known**.
- **Unenrollment triggers:** Lead status is any of Unqualified, Not Interested, Contact In a Year; Last marketing email reply date is known; Recent sales email replied date is known; Unsubscribed from all email = true.
- **Suppression:** contact is not a member of "Suppression - csgpartners.com".
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
- Enroll: Date of last meeting booked in meetings tool is known.
- Delay until 24 hours before the meeting start (use the meeting's start time property from the Meetings tool) -> F1. 
- SMS at T-2h is not available (no SMS tool in this portal); skip until HubSpot SMS or Twilio is added.
- If meeting outcome = No show: wait 30 minutes -> F3 -> 2 days -> F4 -> 5 days -> enroll in W1 at A7.

## 6. Email IDs (fill from HubSpot after the build)

See `marketing/hubspot_email_ids.json` in this folder once the build finishes; each entry has the internal name, the marketing email object ID and the editor URL.

## 7. Catch-up send (this week)

Marketing > Email > "IBO Nurture A1-Catchup - Your Independent Buyout (IBO) question (catch-up)". Recipients are already attached (176 contacts; csgpartners.com excluded). Review and send. Then add the same 176 contacts to W1 starting at A2 (enroll manually from the list "Nurture - Paid social owners, qualified" with "skip A1" set, or clone W1 without the A1 step for this one enrollment).

## 8. Existing campaigns: current state and what to switch off

- No workflow has ever sent a marketing email from this portal, so there is nothing running to disable.
- Two "Edmund" emails from May are published as automated emails (cannot be renamed by the connector). They are not attached to any workflow; leave them or unpublish from the UI (Actions > Unpublish) to be safe.
- The one-to-one "IBO Email Sequence" from June was manual and is not running.
