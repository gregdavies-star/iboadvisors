# IBO Advisors - Paid-social drip sequence: strategy and recommendations

Goal: turn HubSpot contacts created by LinkedIn and Meta ad campaigns into **meetings booked** on Michael's scheduler (`meetings-na2.hubspot.com/michael-chasen/discussing-the-ibo`).

Prepared 2026-09-25 from (a) the live HubSpot portal (410 paid-social contacts, Feb-Sep 2026), (b) the site's lead flows in this repo (`modal.js`, `ibo-exit/exit.js`, `tracking.js`), and (c) current published research on lead response, nurture cadence and email performance (sources at the end).

---

## 1. The short version

1. **Speed is the biggest lever, and it is currently the biggest gap.** Only 6 of 358 paid-social form leads got any engagement within 5 minutes; the median first touch is about 31 hours, and 140 leads (39%) have never been contacted at all. None of those 140 has booked. Research consistently shows a 5-minute response is worth several multiples in qualification rate. The first email must fire within seconds of the lead syncing, and a human call task must be due within the hour.
2. **The flow that shows the scheduler wins by a mile.** Meta leads land on the site, qualify in the modal and are redirected straight to the scheduler: 24 of 30 qualified Meta leads booked (80%). LinkedIn leads mostly come through native Lead Gen Forms and never see a calendar: 13 of 171 qualified LinkedIn leads booked (8%). The drip has to put the calendar link in the lead's hands within minutes, and the LinkedIn form's thank-you screen should link to it too.
3. **Bookings happen fast or not for a long while.** Of leads that booked after a form fill, 53% booked within 3 days, 72% within 7, 89% within 30. So: a dense 18-day "fast lane" (7 touches), then a light monthly "long tail" that never really ends.
4. **Content should read like a note from a person, not a campaign.** Plain-text, first-name, under 150 words, one link, numbers-first, no deal specifics (the 10-year confidentiality rule in `seo/STRATEGY.md` applies to email too). Plain-text B2B email reaches the primary inbox and gets replies at roughly double the rate of designed HTML.
5. **Segment on the two things the forms already capture:** EBITDA band (the $3M gate) and role (owner vs advisor). Qualified owners get the meeting-ask sequence. Under-threshold owners get a slower "grow into it" track. Advisors get a referral track. Booked contacts get a no-show-prevention track.

---

## 2. What the HubSpot data says (as of 2026-09-25)

### 2.1 Where paid-social contacts come from and how many book

| Source (Original Traffic Source drill-down) | Contacts | Created by | Meeting booked | Rate |
|---|---|---|---|---|
| LinkedIn, form leads | 289 | 238 native Lead Gen Forms, 19 site form, 32 unknown | 17 | 5.9% |
| LinkedIn, qualified owners ($3M+ band) | 171 | mostly Lead Gen Form | 13 | 7.6% |
| LinkedIn, under threshold (<$3M) | 72 | Lead Gen Form | 3 | 4.2% |
| LinkedIn, booked directly (record source = Meetings) | 42 | scheduler | 41 | n/a |
| Meta (Facebook), form leads | 64 | 63 site form (`/ibo-exit` landing page + modal) | 27 | 42% |
| Meta, qualified owners ($3M+) | 30 | site form, redirected to scheduler | 24 | 80% |
| Meta, under threshold | 33 | site form | 3 | 9% |
| Reddit | 5 | site form | 3 | n/a |

Reading: the *channel* is not the difference, the *flow* is. Meta leads see the calendar seconds after qualifying; LinkedIn Lead Gen leads get a "thanks" screen and silence. About half of LinkedIn Lead Gen leads are under the $3M threshold (65 at $500K-$1M, 60 at $1M-$3M, versus 139 at $3M+), which is fine for targeting but means the sequence must branch on band from the first email.

### 2.2 How long leads take to book

Leads that booked after a form fill (n = 47):

| Time from contact creation to booking | Share |
|---|---|
| Under 1 day | 19% |
| 1-3 days | 34% |
| 3-7 days | 19% |
| 7-14 days | 11% |
| 14-30 days | 6% |
| 30-60 days | 4% |
| 60+ days | 6% |

Median: 2.7 days overall; 2.0 days for Meta (calendar shown immediately), 6.7 days for LinkedIn (no calendar shown). Volume is now ~90-135 new contacts a month (Jul 95, Aug 90, Sep 92), so a 20-point lift in the LinkedIn qualified booking rate is roughly 10-15 extra meetings a month at current spend.

### 2.3 Speed to lead today

| Metric (form leads, n = 358) | Value |
|---|---|
| No engagement ever recorded | 232 (65%) |
| Never contacted (0 logged touches) | 140 (39%), 0 booked |
| First engagement within 5 minutes | 6 |
| Within 1 hour | 8 |
| Within 24 hours | 27 |
| Median time to first engagement (where one exists) | 30.7 hours |

Contacts with 2+ logged touches booked at 50-68%; contacts with 0 touches booked at 0%. Some of that is reverse causality (booked contacts generate activity), but the 140 untouched leads with zero bookings is the clearest single opportunity in the account.

### 2.4 What has been sent so far

- Two automated emails exist ("Edmund Nurture - Email 1", subject *Most owners don't know this exists*; "Edmund Email 2", subject *Quick math on a $100M exit*), plus a batch email "$100M Quick Math". **No paid-social contact has ever received a HubSpot marketing email** (last-marketing-email-send date is empty on all 400 analysed).
- On 2026-06-16 a one-off sales sequence went to 78 contacts (`ibo_email_sequence_date`). Two of them booked (2.6%). That is the only "drip" so far, and it went out 1-3 months after those leads arrived.
- 39 LinkedIn contacts are **non-marketing contacts** and cannot receive marketing email until their status is changed.
- Phone numbers: all 64 Meta leads (the `/ibo-exit` page requires one), 71 of 341 LinkedIn leads.
- Lead creation peaks 7am-noon ET and again 8-10pm ET; 18% of leads arrive on weekends. Automation has to cover evenings and weekends; humans can't.

### 2.5 Problems in the existing emails (fix before reuse)

- Greeting renders as "Hi there,," (double comma; and no first-name token, even though first name is on every lead).
- Email 2: "$64.2" and "$26.7" are missing "M"; the site's own figures are $37.8M net after PE sale, $64.2M via IBO, a $26.4M difference (Email 2 says $37.5M and $26.7M). "And it often with a 10-30% required rollover" and "there are no rollover requirement" are broken sentences. The subject says "$100M exit" while the body works a $50M example.
- Both emails carry the "Marketing Information" subscription and a marketing footer; for a note "from Edmund" that is fine legally but the from-name, plain-text look and reply-to must be consistent (see section 5).

---

## 3. What the research says (and how it applies here)

| Finding | Source | Implication for IBO |
|---|---|---|
| Responding within 5 minutes vs 30 minutes: ~21x more likely to qualify the lead; close rates 32% under 5 min vs 12% at 24h+ | LeanData; Optifai benchmark via aimdoc.ai; GreetNow | Email 1 fires instantly from the workflow; call task due within 1 hour; SMS within 5 minutes where a phone exists |
| Average B2B response time is 29-42 hours and 24-63% never respond | outsales.ai; caseyresponse | IBO's 31-hour median and 39% never-contacted is typical, which is why fixing it is a real edge |
| Warm, triggered sequences should be shorter and faster; 4-7 touches over 2-3 weeks captures most replies; "40% answer only after the 4th touch" | martal.ca; outboundpros.io; prospeo | 7 touches in 18 days for qualified owners, then long tail |
| The "breakup" email is often the best-performing touch (10-33% reply) | growleads.io; sendr.ai; prospeo | Email 7 is an explicit "shall I close your file?" |
| Lead Gen Forms convert 8-13% but landing pages produce 20-40% higher SQL rates; the pre-filled lead has lower intent, so fast follow-up protects quality | b2bads.com; kiin.co; zephraai | Keep Lead Gen Forms for volume but treat every one as a 5-minute lead; A/B a website-conversion LinkedIn campaign against them |
| Plain-text email: ~88% higher response than HTML in one 250k-email study; ~2x primary-inbox placement | warmforge.ai; gameplanmarketing.ca; sendcheckit | All nurture emails plain-text, from a named partner, one link |
| HNW / owner audiences: 3-5 insight-led emails, longer gaps than typical B2B, "every email should feel like a personal advisory note" | danishleadco; TTGC; ojaymediamarketing | Long tail is monthly, insight-first, never promotional |
| B2B opens peak Tue-Thu 9-11am local; C-suite reads 7:45-9:15am and 4:30-6pm; avoid Monday 9am and Friday afternoon | zeliq; superhuman; sevenatoms | Scheduled emails at 7:30-8:30am recipient time Tue-Thu; instant emails ignore the clock |
| HubSpot: set a workflow goal so contacts unenroll the moment a meeting is booked; 1-2 day delays between nurture emails; 10-25% goal completion over 90 days is healthy; sequence-to-meeting under 2% means the entry point or ICP filter is wrong | HubSpot KB; hublead.io; pedowitzgroup | Goal = "Date of last meeting booked is known"; the ICP filter is the $3M band |
| Gmail/Yahoo bulk-sender rules: spam complaints under 0.3% (aim under 0.1%), one-click unsubscribe, SPF/DKIM/DMARC | Litmus; Mailgun; Google | Keep frequency caps, honour unsubscribes instantly, verify DMARC on iboadvisors.com |
| LinkedIn Lead Gen Forms support a thank-you CTA that links to a URL; Meta Instant Forms now support in-app appointment booking ("Book time" CTA, HubSpot scheduler support rolling out) | LinkedIn Help; socialsamosa; easyinsights | Put the scheduler on both platforms' confirmation screens so the drip is the backstop, not the only path |

---

## 4. Recommended architecture

### 4.1 Segments (decided at enrollment, from data the forms already capture)

| Segment | Definition | Track | Primary goal |
|---|---|---|---|
| **A. Qualified owner** | Owner/CEO/founder, EBITDA band $3M+ (`what_is_your_approximate_annual_ebitda` in {$3m-$5m, $5m-$10m, $10m+} or `..._profit` in {$3M-$5M, $5M-$10M, $10M-$20M, $10M+, $20M+}), no meeting booked | Fast lane (7 emails / 18 days) then long tail | Meeting booked |
| **A2. Qualified, abandoned scheduler** | Segment A who came through the site modal (redirected to scheduler) but no meeting within 60 minutes | Fast lane starting at Email 1b | Meeting booked |
| **B. Under threshold, close** | Owner, $1M-$3M band | Grow-into-it (5 emails / 6 weeks) then quarterly | Stay warm; referral; re-qualify |
| **C. Under threshold, far** | Owner, under $1M | One honest email, then quarterly only | Referral; brand |
| **D. Advisor** | "Business Advisor" role (CPA, wealth advisor, attorney) | Referral track (4 emails / 3 weeks) then monthly | Intro call; referral agreement |
| **E. Unknown band** | Lead Gen Form without the EBITDA answer (46 contacts today) | Email 1 asks the band in one line (reply A/B/C); route on reply or on lead-status set by rep | Classification |
| **F. Booked** | `engagements_last_meeting_booked` is known | Pre-meeting + no-show recovery | Meeting held |

### 4.2 Exits and suppressions (apply to every track)

- **Goal (auto-unenroll):** Date of last meeting booked in meetings tool *is known* (and, for re-enrollments, *is after enrollment date*).
- **Unenroll when:** lead status becomes Unqualified, Not Interested or Contact In a Year; contact replies to any email (last marketing email reply date or recent sales email replied date is known); unsubscribed from the subscription type; rep logs a connected call.
- **Frequency cap:** never more than one nurture email per day and three per week; long tail is one per month. Suppress marketing sends for 3 days after any 1:1 sales email so the rep's thread isn't stepped on.
- **Re-enrollment:** off for the fast lane. On for the long tail only when a new form submission or a new session from paid social occurs (a returning visitor is a re-warmed lead).

### 4.3 Channels around the email

Email is the spine; the meeting comes from the combination.

| Minute/day | Action | Who |
|---|---|---|
| 0-1 min | Email 1 (plain text, calendar link) | Workflow |
| 0-5 min | SMS (where phone present and the form disclosed texting): "Edmund from IBO Advisors here - I've emailed you a link to grab 20 minutes with Michael. Reply STOP to opt out." | Workflow (HubSpot SMS or Twilio) |
| 0-60 min (8am-7pm recipient time; otherwise next morning 8am) | Call task, high priority, "LinkedIn lead - {{band}} - call, leave voicemail, mention the email" | Edmund |
| Day 1-18 | Emails 2-7 | Workflow |
| Day 3 and Day 10 | Second and third call attempts if no reply | Edmund |
| Day 0-30 | LinkedIn Matched Audience / Meta custom audience of enrolled contacts with a retargeting ad ("Still weighing a PE offer? 20 minutes.") | Ads |

---

## 5. Timing and frequency

### 5.1 Track A - Qualified owner, fast lane (7 emails, 18 days, then monthly)

| # | Send | Subject (working) | Job of the email | CTA |
|---|---|---|---|---|
| 1 | Instant, any hour | *Your IBO question* | Acknowledge, prove a human saw it, hand over the calendar | Book 20 min |
| 2 | Day 1, 7:30am local | *The $26M difference* | The one number: $50M company, $37.8M net via PE vs $64.2M via IBO, tax-free | Book, or reply "send me the math" |
| 3 | Day 3, 7:30am | *How an IBO actually works* | The mechanism in five sentences (leveraged buyout of your own shares, ESOP trust as buyer, tax deferral, warrants for upside, you stay in control) | Book |
| 4 | Day 6, 7:30am | *A note from Michael Chasen* | Founder credibility (Blackboard, $1.8B, 60+ transactions) and the three questions he'd ask about their company | Reply with answers, or book |
| 5 | Day 9, 7:30am | *What PE hopes you never learn* | Objection handling: control, rollover and the "second bite", earn-outs, what years 1-7 under PE look like | Read the post; book |
| 6 | Day 13, 7:30am | *Three options, pick one* | Reduce friction: reply "1" (talk now), "2" (in 6-12 months), "3" (just learning) | Reply |
| 7 | Day 18, 7:30am | *Should I close your file?* | Breakup; highest-reply touch; sets the long tail expectation | Reply or book |
| L | Day 45, then monthly | one insight each (see 6.3) | Stay the advisor they'll call when the PE letter arrives | Soft |
| Q | Every 90 days | *Still the right time to talk?* | Re-ask | Book |

Why this cadence: the lead asked for an "IBO discussion", so the ask goes in Email 1 (not after three value emails as for cold lists). Days 0-7 carry 72% of bookings, so four touches land there. Emails 6 and 7 are reply-optimised because after two weeks a reply is more likely than a self-serve booking. Roughly two emails a week keeps the unsubscribe risk low for an owner audience.

Send times: Email 1 is instant regardless of clock. Emails 2-7 go at 7:30-8:30am recipient time on Tue, Wed or Thu (HubSpot: "send at a specific time" plus time-zone send). If a step would land on Sat/Sun or Mon, push to Tuesday. Long-tail emails: test Tuesday 7:30am against Sunday 6pm (owners read on Sunday evening; our lead creation already peaks 8-10pm ET).

### 5.2 Track A2 - Qualified, abandoned scheduler

Trigger: site form submission with a qualifying band and no meeting within 60 minutes.

- +60 min: Email 1b *Your calendar link* - "the page may have closed before you picked a time; here it is, pre-filled with your details" (scheduler URL with `?email=&firstname=&lastname=`).
- Then join Track A at Email 2 on the same schedule.

### 5.3 Track B - Under threshold, close ($1M-$3M)

| # | Send | Subject | Job |
|---|---|---|---|
| 1 | Instant | *Honest answer on fit* | The IBO is built for $3M+ EBITDA; here is what "getting there" looks like (link to the calculator's years-to-qualify view); ask about growth trajectory |
| 2 | Day 7 | *The four levers that move EBITDA* | Pricing, mix, add-backs owners forget, owner comp normalisation |
| 3 | Day 21 | *Exit planning in 8 steps* | Blog post; positions the firm 2-5 years ahead of the exit |
| 4 | Day 45 | *Other doors: MBO, minority recap* | Blog posts; keeps them from a bad PE deal now |
| 5 | Day 90, then quarterly | *Has EBITDA crossed $3M?* | Re-qualify by reply; re-route to Track A |

### 5.4 Track C - Under threshold, far (<$1M)

One instant email (same as B1 but shorter, pointing to the calculator and the blog), then the quarterly re-qualify only.

### 5.5 Track D - Advisors

| # | Send | Subject | Job |
|---|---|---|---|
| 1 | Instant | *Thanks - and a quick question* | Ask which clients they have in mind; calendar link for a 20-min intro |
| 2 | Day 3 | *How to spot an IBO candidate in your book* | Checklist: $3M+ EBITDA, owner 55+, PE inbound, cost-plus government work, key-person management team |
| 3 | Day 10 | *What we do for referring advisors* | Co-marketing (co-written guide, webinar for their clients), confidentiality, how fees do and don't work |
| 4 | Day 20 | *Close the loop?* | Breakup |
| L | Monthly | Insight email | Same long tail as owners |

### 5.6 Track F - Booked (protect the meeting)

- Instant: HubSpot Meetings confirmation (already on).
- T-24h: *Tomorrow: three things to have handy* - rough EBITDA, ownership split, and what they want from a transaction; reschedule link.
- T-2h: SMS reminder with the video link.
- No-show +30 min: *Missed you - grab another slot* (rebook link). Day 2 and Day 7 follow-ups, then back to Track A Email 6.

### 5.7 One-time catch-up (do this week)

Send Email 7 (*Should I close your file?*), lightly reworded as "we never properly followed up", to the 140 never-contacted leads and to every qualified LinkedIn lead from Jul-Sep without a meeting. Breakup-style emails to warm-but-neglected lists typically return 10-15% replies; at ~120 qualified leads that is 12-18 conversations for one email.

---

## 6. Content

### 6.1 Rules for every email

- **Plain text.** No header image, no buttons, no columns. One hyperlink, the scheduler, with UTMs (see 7.3). Signature: name, title, phone, iboadvisors.com. Footer with physical address and unsubscribe (required).
- **From a person.** Emails 1-3, 5-7 from Edmund Breitling (reply-to edmund@iboadvisors.com); Email 4 from Michael Chasen. Never "IBO Advisors Team".
- **First name.** `{{ contact.firstname }}` with a default of "there" (and fix the double comma).
- **Length.** 60-150 words. Subject 3-7 words, sentence case, no exclamation marks, no "Re:" tricks. Preview text is the second sentence, not a teaser.
- **Numbers first, hypotheticals only.** Use the $50M worked example from the homepage and the blog; never a client, a count, a size or a timeline of IBO Advisors' own deals (10-year restriction). Firm-level lines ("$5B in payouts", "500+ transactions" for the partner network) and Michael's public background are allowed.
- **Confidential, unhurried tone.** These are owners being sold to by PE every week. "Confidential conversation", "no process, no pitch deck", "you keep the company" beat urgency.
- **One ask per email.** Book, or reply. Not both plus a download.
- **Voice check.** Would Edmund send this from his phone? If a sentence would not survive that test, cut it.

### 6.2 Draft copy - Track A (edit freely; the structure matters more than the words)

**Email 1 - instant**
Subject: Your IBO question
Preview: A 20-minute, confidential conversation with Michael.

> Hi {{firstname}},
>
> Thanks for asking about the Independent Buyout on LinkedIn. I'm Edmund Breitling, a partner at IBO Advisors.
>
> Short version: an IBO gives you private-equity-level liquidity and valuation without selling to private equity, without giving up control, and in most structures without capital gains tax on the proceeds.
>
> The fastest way to see whether it fits your company is 20 confidential minutes with our managing partner, Michael Chasen. Pick a time here: [scheduler]
>
> If you'd rather I call, reply with a good number and time.
>
> Edmund

**Email 2 - Day 1**
Subject: The $26M difference
Preview: Same company, same value, two outcomes.

> {{firstname}}, one number explains why owners look at this.
>
> Take a company worth $50M. Sold to a PE firm, after federal and state capital gains the owner typically nets about $37.8M, plus a required rollover and a board that now outvotes them.
>
> The same company, at the same $50M, structured as an IBO, nets about $64.2M: the sale proceeds are tax-free and the owner keeps warrants on the future upside and keeps running the business.
>
> That's $26.4M on the same enterprise value. The full comparison is here: [blog: Independent Buyout vs. Private Equity]
>
> Worth 20 minutes to run your numbers? [scheduler]
>
> Edmund

**Email 3 - Day 3**
Subject: How an IBO actually works
Preview: Five sentences, no jargon.

> {{firstname}},
>
> The mechanics, in five sentences. The company borrows against its own cash flow, the way a PE buyer would. Instead of a PE fund, the buyer is an employee trust the company sets up. You sell some or all of your shares to it, and under Section 1042 the gain can be deferred indefinitely. The company's income becomes largely tax-exempt, which is what makes the debt affordable. You keep the CEO seat, the board and warrants that pay out as the company grows.
>
> It is the transaction PE firms run on companies like yours, done without the PE firm. Longer version: [blog: What Is an IBO?]
>
> Questions are normal at this point. That's what the 20 minutes is for: [scheduler]
>
> Edmund

**Email 4 - Day 6 (from Michael)**
Subject: A note from Michael Chasen
Preview: Three questions I'd ask about your company.

> {{firstname}},
>
> Edmund mentioned you'd asked about the IBO. I co-founded Blackboard, took it public and sold it for $1.8B, and I've been on one side or the other of more than sixty M&A transactions since. I started IBO Advisors because most owners are only ever shown two doors: sell to PE or sell to a strategic.
>
> If we spoke, I'd ask three things: roughly what EBITDA you're running, how much of the company you want to keep, and what you'd do with the proceeds. From those I can usually tell you in 20 minutes whether an IBO is worth exploring.
>
> Reply with any of the three, or grab a time here: [scheduler]
>
> Michael

**Email 5 - Day 9**
Subject: What PE hopes you never learn
Preview: Control, rollover, and the "second bite".

> {{firstname}},
>
> Three things that don't appear in a PE term sheet's summary page: the minority-stake veto list that lets a 30% investor run your board, the 10-30% rollover that means you haven't really sold, and the earn-out that pays only if you hit numbers you no longer control.
>
> We wrote them up plainly: [blog: Private Equity Minority Stake: The Veto List] and [blog: What Happens Years 1-7].
>
> None of those exist in an IBO, which is the point. If a PE letter is sitting on your desk, it is worth 20 minutes before you answer it: [scheduler]
>
> Edmund

**Email 6 - Day 13**
Subject: Three options, pick one
Preview: Reply with a number.

> {{firstname}}, to save us both time, reply with a number:
>
> 1 - I'd like to talk in the next couple of weeks (I'll send times).
> 2 - Interesting, but not for 6-12 months (I'll check back then, nothing in between).
> 3 - Just learning for now (I'll send one useful note a month, no calls).
>
> Edmund

**Email 7 - Day 18**
Subject: Should I close your file?
Preview: No hard feelings either way.

> {{firstname}},
>
> I haven't heard back, which usually means one of two things: the timing is wrong, or the emails are. Either is fine.
>
> If it's the timing, I'll leave you alone apart from a short note once a month with one thing worth knowing about owner exits. If you'd rather not get those, reply "no" and I'll stop entirely.
>
> If I misread it and you do want the 20 minutes, the link still works: [scheduler]
>
> Edmund

### 6.3 Long tail (monthly, all tracks) - one insight per email

Rotate through existing posts, one per month, each rewritten as a 100-word plain-text note with a single link and a one-line "if this is live for you, 20 minutes" close:

1. Selling to Private Equity: Pros and Cons
2. How Private Equity Values a Company (and the multiples by industry from the calculator)
3. Rollover Equity and the Second Bite
4. The Owner Exit Conversation Is Broken
5. 7 Alternatives to Selling to Private Equity
6. Family Business Succession Planning
7. Government Contractor M&A: The Cost-Plus Edge (send only to gov-con leads)
8. Healthcare Services / Restaurant M&A (send by industry where the campaign name carries it, e.g. `..._healthcare $10m-$100m owner`)
9. How to Choose an M&A Advisor at $3M+ EBITDA
10. Management Buyout vs Private Equity

Add a quarterly "Reading the filings" note when that column exists (see `seo/STRATEGY.md`); it is the most credible long-tail content the firm can send.

### 6.4 Draft copy - other tracks (first email only)

**Track B, Email 1 - Honest answer on fit**
> Hi {{firstname}}, thanks for asking about the IBO. I'd rather be straight with you: the structure works when a company is at roughly $3M of EBITDA or more, because the company's own cash flow has to support the buyout. You told us you're in the $1M-$3M range, so it may not be the right tool today. Two things that might still help: our calculator shows how many years of growth get a company across that line ([calculator]), and this post covers the options that do work at your size ([blog: Business Exit Strategy: Every Option Compared]). If your numbers are closer to $3M than the form suggested, reply and tell me, and I'll set up a call. - Edmund

**Track D, Email 1 - Thanks, and a quick question**
> Hi {{firstname}}, thanks for reaching out about the IBO. Most of our best conversations start with an advisor who has an owner client being courted by PE. Do you have a specific client in mind, or are you learning the structure for your practice? Either way, 20 minutes with Michael Chasen is the quickest way in: [scheduler]. Everything is confidential, and we're happy to describe how we work with referring advisors on the call. - Edmund

**Track F, no-show +30 min - Missed you**
> {{firstname}}, looks like today didn't work. No problem; here's the link to grab another time: [scheduler]. If something's changed, just reply and tell me. - Edmund

---

## 7. HubSpot implementation notes

### 7.1 Data hygiene first (one afternoon)

1. **Normalise the EBITDA band.** Two properties exist: `what_is_your_approximate_annual_ebitda` (Lead Ad Properties, free text like "$3m - $5m", "$4m", "$25m") and `what_is_your_approximate_annual_ebitda_profit` (site form enumeration). Create `ibo_ebitda_band` (enum: under_1m, 1m_3m, 3m_5m, 5m_10m, 10m_plus, unknown) and a workflow that maps both into it. Set `ibo_qualified` = True for 3m_5m and above; today it is unset on 500+ contacts.
2. **Role.** The site modal writes CEO/Founder/Owner vs Business Advisor; the LinkedIn form does not ask. Add the role question to the LinkedIn Lead Gen Form (a single dropdown cuts unqualified leads 25-40% at a cost of ~8-10% conversion) and map it to the existing `role` property.
3. **Marketing contact status.** Set the 39 non-marketing LinkedIn contacts to marketing contacts, or the workflow emails will silently skip them.
4. **Sender authentication.** Confirm SPF, DKIM and DMARC for iboadvisors.com in HubSpot's email sending domain settings before turning on daily automated sends.

### 7.2 Workflows

- **W0 - Paid-social intake router.** Enrollment: contact created AND (Original Traffic Source = Paid Social OR record source = LinkedIn/Facebook lead ad sync). Actions: map band, set `ibo_qualified`, set `ibo_segment`, set marketing status, create the call task, then enroll in W1-W5 by segment. Re-enrollment on.
- **W1 - Owner fast lane (Track A).** Goal: "Date of last meeting booked in meetings tool is known". Unenrollment triggers as in 4.2. Delays: 1, 2, 3, 3, 4, 5 days between Emails 1-7. Use "delay until a specific day/time" so steps land Tue-Thu 7:30am contact time. Then hand off to W6.
- **W2 - Abandoned scheduler (Track A2).** Enrollment: form submission on the site form with a qualifying band; 60-minute delay; if/then on meeting booked; Email 1b; then W1 from Email 2.
- **W3 / W4 - Under threshold (Tracks B, C).** Quarterly re-qualify step ends with an if/then on `ibo_ebitda_band`; if it has moved to 3m+, enroll in W1.
- **W5 - Advisors (Track D).**
- **W6 - Long tail.** Enrollment from W1/W3/W4/W5 hand-off; monthly delay; goal and unenrollment as above; re-enrollment on new form submission or new paid-social session.
- **W7 - Booked (Track F).** Enrollment: meeting booked; T-24h and T-2h steps keyed off the meeting start; branch on outcome = No show (the "No Show" lead status already exists) into the recovery emails.

Email type: **Automated** (not batch). Subscription type: use "Marketing Information" (id 2167994256) for W1-W6, or create a dedicated "Owner exit notes" subscription so unsubscribing from the drip doesn't also block future one-off announcements. Reply-to must be the sender's real inbox so replies land with Edmund/Michael, and connect that inbox to HubSpot so replies log and trigger unenrollment.

Prefer HubSpot **Sequences** (Sales Hub) over marketing workflows only if the team wants every step to be a true 1:1 email in Edmund's Gmail thread; the trade-off is manual enrollment and no time-zone sending. The workflow approach above, with plain-text automated emails, gets 90% of the effect with none of the manual step.

### 7.3 Attribution so "meetings from the drip" is measurable

- Every scheduler link in email: `https://meetings-na2.hubspot.com/michael-chasen/discussing-the-ibo?utm_source=hubspot&utm_medium=email&utm_campaign=nurture-owner-a&utm_content=e2&email={{contact.email}}&firstName={{contact.firstname}}&lastName={{contact.lastname}}`.
- HubSpot writes the UTMs into `engagements_last_meeting_booked_source/medium/campaign`, and the existing `tracking.js` already stamps `IBO Meeting *` properties when the booking happens through the site. That gives a clean report: meetings booked where campaign starts with `nurture-`, by email (`utm_content`).
- Build a dashboard: enrolled by segment and week; booked within 7/30 days; time to first engagement (`hs_time_to_first_engagement`, stored in milliseconds); reply rate; unsubscribe and spam rates per email.

### 7.4 Upstream fixes on the ad platforms (larger than any email)

1. **LinkedIn Lead Gen Form thank-you CTA.** Set the CTA to "Book a 20-minute call" with the scheduler URL (with `utm_source=linkedin&utm_medium=leadgen_thankyou`). This alone gives LinkedIn leads what Meta leads get today.
2. **A/B a website-conversion LinkedIn campaign** landing on `/?learn-more=1` (auto-opens the qualify modal and redirects qualified owners to the scheduler) against the Lead Gen Form campaign, at equal spend for 4 weeks. Judge on cost per meeting booked, not cost per lead.
3. **Meta Instant Form in-app booking.** When the HubSpot scheduler is supported in Meta's "Book time" CTA, turn it on; until then, keep Meta on the site flow, which is working.
4. **Lead sync latency.** LinkedIn's sync to HubSpot can take minutes to two hours. If the median sync delay exceeds ~10 minutes in the ads dashboard, route LinkedIn leads through a webhook (Zapier/LeadsBridge) into the Forms API so Email 1 truly fires in seconds.

---

## 8. Measurement and targets

| KPI | Baseline (Feb-Sep 2026) | 90-day target |
|---|---|---|
| Qualified LinkedIn form leads that book within 30 days | 7.6% | 20% (stretch 30%) |
| Qualified Meta leads that book | 80% | hold above 70% while volume grows |
| Leads with a first automated touch within 5 minutes | ~2% | 100% |
| Leads with a human touch within 1 business hour | ~2% | 80% |
| Never-contacted leads | 39% | 0% |
| Reply rate across the 7-email fast lane | not measured | 12-18% |
| Unsubscribe rate per email | not measured | under 0.5% |
| Spam complaint rate | not measured | under 0.1% |
| No-show rate on booked meetings | not measured | under 15% |

Review weekly for the first 8 weeks (open/click/reply/booking per email step, by source), then monthly. Kill or rewrite any step whose reply rate is below a third of the sequence median after 100 sends.

**Tests worth running, in order:**
1. Email 1 sender: Edmund vs Michael (expect Michael to win on opens, Edmund on replies; the meeting rate decides).
2. Email 2 timing: Day 1 vs Day 2.
3. SMS on vs off for leads with phones (Meta leads all have one).
4. Email 1 subject: *Your IBO question* vs *Re: Independent Buyout* vs *{{firstname}}, quick one from IBO Advisors*.
5. Long tail: Tuesday morning vs Sunday evening.

---

## 9. Sequence at a glance

```
Lead syncs from LinkedIn / Meta
  |
  +- W0 router: map EBITDA band, role -> segment; set marketing status; call task (due +1h)
  |
  +- A  Qualified owner ($3M+)      E1 now  E2 d1  E3 d3  E4 d6  E5 d9  E6 d13  E7 d18  -> monthly, quarterly re-ask
  +- A2 Qualified, no booking +60m  E1b +1h -> join A at E2
  +- B  Owner $1M-$3M               E1 now  E2 d7  E3 d21  E4 d45  -> quarterly re-qualify (-> A if band moves)
  +- C  Owner <$1M                  E1 now -> quarterly re-qualify
  +- D  Advisor                     E1 now  E2 d3  E3 d10  E4 d20 -> monthly
  |
  Goal on every track: meeting booked  -> F: T-24h prep, T-2h SMS, no-show recovery
  Exits: reply, unsubscribe, Unqualified / Not Interested / Contact In a Year, rep-logged connected call
```

---

## Sources

Speed to lead: [LeanData](https://www.leandata.com/blog/speed-to-lead-speed-is-the-key-to-lead-conversion/), [aimdoc.ai (Optifai/Blazeo benchmarks)](https://aimdoc.ai/blog/speed-to-lead-and-why-it-matters), [GreetNow](https://greetnow.com/blog/speed-to-lead-statistics), [outsales.ai](https://outsales.ai/blog/lead-response-time-statistics), [caseyresponse](https://caseyresponse.com/blog/lead-response-time-statistics), [digitalapplied](https://www.digitalapplied.com/blog/speed-to-lead-response-time-benchmarks-2026-data-playbook).
Nurture cadence and sequence length: [martal.ca lead nurturing](https://martal.ca/lead-nurturing-lb/), [martal.ca drip campaigns](https://martal.ca/email-drip-campaigns-lb/), [LeadsuiteNow](https://leadsuitenow.com/blog/email-automation-lead-nurturing-2026), [prospeo](https://prospeo.io/s/lead-nurturing-email-best-practices), [outboundpros](https://outboundpros.io/blog/cold-email-follow-up-sequences-that-convert), [Nutshell](https://www.nutshell.com/blog/follow-up-email-sequence-sales).
Breakup email: [growleads.io](https://growleads.io/blog/breakup-email-templates-outbound-email-outreach/), [sendr.ai](https://www.sendr.ai/blog/break-up-email-sales-sequence-tips), [prospeo breakup](https://prospeo.io/s/breakup-email).
LinkedIn / Meta lead forms: [b2bads.com](https://b2bads.com/linkedin-lead-gen-forms), [kiin.co](https://kiin.co/blog/linkedin-lead-gen-forms), [Zephra](https://zephraai.com/guides/linkedin-ads-academy/lead-gen-forms-lead-quality), [gracker.ai](https://gracker.ai/blog/linkedin-lead-gen-forms-quality), [LinkedIn Help - Lead Gen Form best practices](https://www.linkedin.com/help/lms/answer/a421181), [Search Engine Land - Meta lead gen](https://searchengineland.com/meta-ads-lead-gen-what-you-need-to-know-456269), [Meta in-app appointment booking (socialsamosa)](https://www.socialsamosa.com/news-2/meta-in-app-appointment-booking-facebook-lead-ads-12103721), [easyinsights](https://easyinsights.ai/blog/meta-in-app-appointment-booking-lead-ads/), [HubSpot KB - sync leads from lead ad forms](https://knowledge.hubspot.com/ads/sync-leads-from-your-facebook-page-or-linkedin-ads-account-to-hubspot), [NAV43 LinkedIn-HubSpot routing](https://nav43.com/blog/hubspot-linkedin-lead-gen-integration-routing-workflows/).
Plain text vs HTML: [warmforge.ai](https://www.warmforge.ai/blog/plain-text-vs-html-in-cold-emails), [gameplanmarketing](https://www.gameplanmarketing.ca/blog/the-case-for-plain-text-emails-in-b2b), [sendcheckit](https://sendcheckit.com/blog/email-deliverability-plain-text-vs-html), [Stripo](https://stripo.email/blog/plain-text-vs-html-email-statistics-benchmarks-and-what-the-data-shows/).
HNW / owner audiences: [danishleadco](https://danishleadco.io/blog/how-to-reach-high-net-worth-individuals-via-email), [TTGC](https://ttgcreatives.com/articles/marketing-to-hnw-uhnw-audiences), [Select Advisors Institute](https://www.selectadvisorsinstitute.com/our-perspective/wealth-management-email-newsletter-best-practices), [Exit Planning Institute](https://blog.exit-planning-institute.org/how-advisors-retain-business-owner-clients-after-exit), [FIH founder exit psychology](https://fih.com/founder-exit-psychology).
Send timing and benchmarks: [zeliq](https://www.zeliq.com/blog/best-days-email-open-rates), [Superhuman](https://blog.superhuman.com/best-time-to-send-sales-emails/), [sevenatoms](https://www.sevenatoms.com/blog/best-time-to-send-email-blast-and-marketing-emails), [WOLF Financial](https://wolf.financial/blog/financial-services-email-marketing-kpis-benchmarks), [WebFX benchmarks](https://www.webfx.com/blog/marketing/email-marketing-benchmarks/).
HubSpot workflows: [HubSpot KB - goals in contact workflows](https://knowledge.hubspot.com/workflows/use-goals-in-contact-based-workflows), [HubSpot Community - exit workflow when meeting booked](https://community.hubspot.com/t5/Lists-Lead-Scoring-Workflows/Exit-workflow-when-meeting-booked/m-p/340926), [hublead.io workflow best practices](https://www.hublead.io/blog/hubspot-workflow-best-practices), [Pedowitz Group](https://www.pedowitzgroup.com/blog/hubspot-lead-nurturing-blog), [thewebplant](https://www.thewebplant.com/blog/hubspot-workflows-explained-triggers-branches-best-practices-in-2025).
Deliverability: [Litmus](https://www.litmus.com/blog/new-yahoo-gmail-email-deliverability-rules), [Mailgun](https://www.mailgun.com/state-of-email-deliverability/chapter/yahoogle-bulk-senders/), [DeBounce](https://debounce.com/blog/google-yahoo-delivery-guidelines/), [truelist subject lines](https://truelist.io/blog/email-subject-line-best-practices).
