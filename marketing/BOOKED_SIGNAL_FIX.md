# Fix: nurture emails still sent after a /book booking (found 22 Nov 2026)

## Cause
Workflows W1-W6 and W2's pre-send check use `engagements_last_meeting_booked` ("Date of last meeting booked
in meetings tool"). HubSpot only fills it for bookings made on its hosted page (meeting source
`MEETINGS_PUBLIC`). Since the 9 Nov cut-over, /book books through the Scheduler API (source `INTEGRATION`),
which never fills it. Result: booked leads look unbooked, so W2 sends A1b an hour after the form, and W1
keeps sending A2... after the booking (its goal never fires).

Evidence: Zaid Ali (contact 605376553675) booked 9:12:31 ET on 22 Nov, A1b sent 10:12:26 ET. Also hit:
Marc Deschenaux (A1b), Steve Karasick (A2), Nathaniel Schiffer (A2). At risk of the same: Jeff Daniel,
Stuart Sleper.

## The signal that already works (no site code needed)
After a successful booking `book.js` posts to the form "Meeting booked (attribution)"
(GUID f0bfe61a-4201-4758-912c-489637fcedc6). On Zaid's record this showed as
`recent_conversion_event_name` = "...Meeting booked (attribution)" at 9:12:34 ET, 3 seconds after the booking.
The post is fire-and-forget, so use it together with a meeting-activity check (belt and braces).

"Booked" = has submitted form "Meeting booked (attribution)" (any time)
          OR has an associated Meeting activity with outcome Scheduled / start date in the future.

## Changes (HubSpot > Automation > Workflows; each workflow is edited and re-saved, nothing else)
1. **W2 (5022981825)**: replace the step-2 if/then "Date of last meeting booked is known" with
   "Booked" as defined above (use an OR branch with both conditions).
   Add the same if/then again immediately before "Send email A1b" (second look, catches a booking made
   during the delay).
2. **W1, W3, W4, W5, W6, W0 (and any workflow with a booked goal)**: change the goal from
   `engagements_last_meeting_booked is known` to "has submitted form Meeting booked (attribution)"
   (goals accept form-submission criteria). Keep the old criterion as an OR so hosted-page bookings
   still count.
3. **W8 (no-show), list 283 and anything else that reads the old property**: search the portal for the
   property (Settings > Properties > engagements_last_meeting_booked > "Used in") and repeat step 2.
4. **Clean-up**: in W1 (and W3-W6) use Enrolled contacts > filter to Zaid Ali, Marc Deschenaux,
   Steve Karasick, Nathaniel Schiffer, Jeff Daniel, Stuart Sleper and unenroll. Then re-run the weekly check.
5. **Test after any booking-path change**: book as a test contact on /book, wait the delay, confirm the
   contact exits W2 and W1 and no email goes out.

## "Hi there"
Unchanged on purpose: the sent email personalises (preview-as-contact renders "Hi Zaid"). "Hi there" is
what the timeline view shows. If a real recipient copy still says "Hi there", check that contact's
firstname at send time.

## API route (once a valid token exists)
`HUBSPOT_PRIVATE_APP_TOKEN` in the cloud environment currently returns 401 (28 characters, looks truncated
or revoked). Replace it with a private-app token with the `automation` scope (read and write) and a new
session can apply steps 1-4 through /automation/v4/flows (GET the flow, edit the goal and branch, PUT with
the current revisionId). Edits should be verified by GET and a before/after diff, as in
HUBSPOT_WORKFLOW_BUILD_LOG.md.
