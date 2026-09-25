# IBO Advisors - Drip sequence emails, in send order

Companion to `DRIP_SEQUENCE_STRATEGY.md`. Every email in every track, ready to paste into HubSpot, with a short note on why that content belongs at that point.

Conventions used in all emails:

- **Plain text, no images, no buttons.** One link per email.
- `[scheduler]` = `https://meetings-na2.hubspot.com/michael-chasen/discussing-the-ibo?utm_source=hubspot&utm_medium=email&utm_campaign=<track>&utm_content=<email id>&email={{contact.email}}&firstName={{contact.firstname}}&lastName={{contact.lastname}}`. Set `utm_campaign` to `nurture-owner-a`, `nurture-owner-b`, `nurture-owner-c`, `nurture-advisor-d`, `nurture-booked-f` or `nurture-longtail`, and `utm_content` to the email id below (e.g. `a2`). HubSpot writes these into the "last meeting booked" source/medium/campaign properties, which is how meetings get attributed to a specific email.
- `{{firstname}}` = `{{ contact.firstname }}` with default "there". Fix the existing "Hi there,," double comma.
- Sender: Edmund Breitling (reply-to edmund@iboadvisors.com) unless marked "from Michael".
- Signature block on every email (not repeated below):

```
Edmund Breitling
Partner, IBO Advisors
[direct phone]
iboadvisors.com
```

- Footer: IBO Advisors, 2099 First Street SW, Suite 220, Washington, DC 20024 plus the one-click unsubscribe. Required by law and by Gmail/Yahoo.
- Nothing below references a real IBO Advisors transaction, client, count, size or timeline. The $50M example is the homepage's own worked hypothetical.

---

## Track A - Qualified owner ($3M+ EBITDA), no meeting booked

Send window: A1 is instant, any hour. A2-A7 go at 7:30am recipient local time on Tue, Wed or Thu; if the delay lands on Fri-Mon, hold to Tuesday. Goal on the workflow: meeting booked. Exits: any reply, unsubscribe, lead status set to Unqualified / Not Interested / Contact In a Year.

### A1 - Instant (within 60 seconds of the lead syncing)

**Subject:** Your IBO question
**Preview:** A 20-minute, confidential conversation with Michael.

```
Hi {{firstname}},

Thanks for asking about the Independent Buyout on LinkedIn. I'm Edmund Breitling, a partner at IBO Advisors.

Short version: an IBO gives you private-equity-level liquidity and valuation without selling to private equity, without giving up control, and in most structures without capital gains tax on the proceeds.

The fastest way to see whether it fits your company is 20 confidential minutes with our managing partner, Michael Chasen. Pick a time here:
[scheduler]

If you'd rather I call, reply with a good number and a time that suits you.

Edmund
```

**Why this, here:** The lead just raised their hand on an ad titled "IBO discussion", so the ask goes in the first email, not the third. Speed is the point: a reply inside five minutes is worth several multiples in qualification rate, and today the median first touch is 31 hours. The body does three jobs only: prove a person saw it, restate the promise in one sentence, hand over the calendar. The "reply with a number" line gives phone-first owners a path that isn't a form.

**Paired SMS (0-5 min, only where a phone exists and the form disclosed texting):**
```
Edmund from IBO Advisors here. I've just emailed you a link to grab 20 minutes with Michael Chasen about the Independent Buyout. Reply STOP to opt out.
```

**Paired call task:** high priority, due in 60 minutes (8am-7pm recipient time, otherwise next morning at 8am). Voicemail script: "Hi {{firstname}}, Edmund Breitling at IBO Advisors following up on your LinkedIn note about the Independent Buyout. I've emailed you a link to 20 minutes with Michael Chasen; happy to talk now as well. My number is ..."

### A1b - Abandoned scheduler only (60 minutes after a qualifying site-form submit with no meeting)

**Subject:** Your calendar link
**Preview:** In case the page closed before you picked a time.

```
Hi {{firstname}},

You qualified for a conversation with Michael a little while ago, but I don't see a time on the calendar yet. Pages close, phones ring; here is the link again, with your details already filled in:
[scheduler]

Nothing to prepare. Twenty minutes, confidential, and you'll know by the end whether an IBO is worth exploring for your company.

Edmund
```

**Why this, here:** Site-form leads were redirected to the scheduler and got that far; the only thing between them and a booking is a closed tab. This is the highest-intent moment in the whole funnel (qualified Meta leads book at 80%), so the email does nothing except put the link back in front of them, pre-filled. It replaces A1 for this segment; they then join Track A at A2.

### A2 - Day 1

**Subject:** The $26M difference
**Preview:** Same company, same value, two outcomes.

```
{{firstname}}, one number explains why owners look at this.

Take a company worth $50M. Sold to a PE firm, after federal and state capital gains the owner typically nets about $37.8M, plus a required rollover and a board that now outvotes them.

The same company, at the same $50M, structured as an IBO, nets about $64.2M: the sale proceeds are tax-free, and the owner keeps warrants on the future upside and keeps running the business.

That's $26.4M on the same enterprise value. The full comparison, line by line, is here:
https://www.iboadvisors.com/blog/ibo-vs-pe-numbers-comparison

Worth 20 minutes to run your numbers?
[scheduler]

Edmund
```

**Why this, here:** Day 1 is still inside the window where half of all bookings happen, so the email has to give the single strongest reason to act. For a $3M+ owner that reason is arithmetic, not philosophy. The figures match the homepage exactly so nothing contradicts what they'll see when they click through. One link to the post, one link to the calendar, no third thing.

### A3 - Day 3

**Subject:** How an IBO actually works
**Preview:** Five sentences, no jargon.

```
{{firstname}},

The mechanics, in five sentences.

The company borrows against its own cash flow, the way a PE buyer would. Instead of a PE fund, the buyer is an employee trust the company sets up. You sell some or all of your shares to it, and under Section 1042 the gain can be deferred indefinitely. The company's income becomes largely tax-exempt, which is what makes the debt affordable. You keep the CEO seat, the board, and warrants that pay out as the company grows.

It is the transaction PE firms run on companies like yours, done without the PE firm. Longer version:
https://www.iboadvisors.com/blog/independent-buyout-explained

Questions are normal at this point. That is what the 20 minutes is for:
[scheduler]

Edmund
```

**Why this, here:** After the number in A2, the natural objection is "that sounds too good; what's the catch?" A3 answers it by showing the machinery before they have to ask, which is what a careful owner does before booking anything. It also pre-empts "isn't this just an ESOP?" by naming the trust plainly and putting it inside a leveraged-buyout frame. Day 3 keeps the two-a-week rhythm without crowding A2.

### A4 - Day 6 (from Michael Chasen)

**Subject:** A note from Michael Chasen
**Preview:** Three questions I'd ask about your company.

```
{{firstname}},

Edmund mentioned you'd asked about the IBO. I co-founded Blackboard, took it public and sold it for $1.8 billion, and I've been on one side or the other of more than sixty M&A transactions since. I started IBO Advisors because most owners are only ever shown two doors: sell to private equity or sell to a strategic.

If we spoke, I'd ask three things: roughly what EBITDA you're running, how much of the company you want to keep, and what you'd do with the proceeds. From those I can usually tell you in 20 minutes whether an IBO is worth exploring.

Reply with any of the three, or grab a time here:
[scheduler]

Michael
```

**Why this, here:** By day 6 the lead has had the offer, the number and the mechanism. What's missing is a reason to trust the people. A short note from the founder, in his own voice, with public credentials, does that; it is also the one email in the sequence that changes sender, which restarts attention in a crowded inbox. Asking three concrete questions lowers the bar from "book a call" to "type two numbers", and a reply exits the sequence into a human conversation.

### A5 - Day 9

**Subject:** What PE hopes you never learn
**Preview:** Control, rollover, and the "second bite".

```
{{firstname}},

Three things that don't appear on the summary page of a PE term sheet:

- the minority-stake veto list that lets a 30% investor run your board
- the 10-30% rollover that means you haven't really sold
- the earn-out that only pays if you hit numbers you no longer control

We wrote them up plainly:
https://www.iboadvisors.com/blog/minority-pe-stake-board-control-veto-rights
https://www.iboadvisors.com/blog/what-happens-after-private-equity-buys-your-company

None of those exist in an IBO, which is the point. If a PE letter is sitting on your desk, it's worth 20 minutes before you answer it:
[scheduler]

Edmund
```

**Why this, here:** Leads still unbooked at day 9 are usually comparing, not ignoring: most $3M+ owners are being approached by PE regularly. This email arms them against the alternative rather than re-selling the IBO, which reads as advice instead of pitch. It also catches the timing-driven lead ("a letter on your desk") with a concrete trigger to act now. Two links to posts is the one exception to the single-link rule, because both are objection content and they sit together.

### A6 - Day 13

**Subject:** Three options, pick one
**Preview:** Reply with a number.

```
{{firstname}}, to save us both time, reply with a number:

1 - I'd like to talk in the next couple of weeks (I'll send times).
2 - Interesting, but not for 6-12 months (I'll check back then, nothing in between).
3 - Just learning for now (I'll send one useful note a month, no calls).

Edmund
```

**Why this, here:** After two weeks, a self-serve booking is less likely than a reply, so the email is built to be answered in three seconds from a phone. It also does the sequence's sorting for it: "1" goes to Edmund, "2" sets lead status to Contact In a Year and exits, "3" moves them straight to the long tail. Owners appreciate being given a way to say "not now" that isn't unsubscribing.

### A7 - Day 18 (breakup)

**Subject:** Should I close your file?
**Preview:** No hard feelings either way.

```
{{firstname}},

I haven't heard back, which usually means one of two things: the timing is wrong, or the emails are. Either is fine.

If it's the timing, I'll leave you alone apart from a short note once a month with one thing worth knowing about owner exits. If you'd rather not get those, reply "no" and I'll stop entirely.

If I misread it and you do want the 20 minutes, the link still works:
[scheduler]

Edmund
```

**Why this, here:** The breakup is consistently one of the two best-replying emails in any sequence (10-33% in published data) because it removes the pressure and gives permission to answer honestly. It also sets the contract for the long tail so the monthly note doesn't feel like more chasing. Day 18 is past the 14-day window in which 83% of bookings occurred, so nothing is lost by stepping back.

**Catch-up variant** for the 140 never-contacted leads and the unbooked qualified LinkedIn leads from Jul-Sep: replace the first line with "You asked about the Independent Buyout a while ago and we never followed up properly; that's on us." Everything else stays.

---

## Long tail - all tracks, monthly from day 45

Send: first Tuesday of the month, 7:30am recipient time (test Sunday 6pm after two months). One insight, one link, one soft close. Rotate the ten notes below; skip any the contact has already clicked. Every note ends with the same close and the same [scheduler] link.

Standard close:
```
If any of this is live for you right now, 20 minutes with Michael is the quickest way to know where you stand:
[scheduler]

Edmund
```

### L1 - Day 45

**Subject:** The pros and cons, honestly

```
{{firstname}},

Selling to private equity is the right answer for some owners. The trouble is that the people explaining it are usually the buyers.

Here is the version we'd want a friend to read before signing a letter of intent: what PE does well, what it costs you, and the questions to ask before you're in exclusivity.
https://www.iboadvisors.com/blog/selling-to-private-equity-pros-and-cons
```

**Why this, here:** The first long-tail note should prove the monthly emails are genuinely even-handed, or the owner will tune them out. Leading with "PE is right for some owners" earns the right to be read next month.

### L2 - Month 2

**Subject:** How they'll value your company

```
{{firstname}},

Before any buyer names a number, they've already decided the multiple. Here's how PE firms build it, what they quietly deduct, and why two firms can land 2x apart on the same company.
https://www.iboadvisors.com/blog/how-pe-firms-value-a-company

If you want a rough range for your own numbers, the calculator uses the same industry multiples:
https://www.iboadvisors.com/business-valuation-calculator
```

**Why this, here:** Valuation is the question every owner has and nobody answers plainly; it is the most-clicked topic in this category. Pointing to the calculator also puts a fresh EBITDA figure into HubSpot if they use it, which can re-qualify or re-rank them.

### L3 - Month 3

**Subject:** The second bite, explained

```
{{firstname}},

"You'll roll 20% and get a second bite of the apple" is the most persuasive line in private equity. Sometimes it's true. Here's how the rollover actually works, who controls the exit that produces the second bite, and the two clauses that decide whether you ever see it.
https://www.iboadvisors.com/blog/rollover-equity-second-bite-explained
```

**Why this, here:** By month three the lead may be in an actual PE process. The rollover is where owners lose the most and understand the least, so this is the note most likely to prompt a "can we talk before I sign?" reply.

### L4-L10 - Months 4-10 (same format, rotate)

| # | Subject | Post |
|---|---|---|
| L4 | Why the exit conversation is broken | `/blog/the-broken-owner-exit-conversation` |
| L5 | Seven doors other than PE | `/blog/alternatives-to-selling-to-private-equity` |
| L6 | If the next owner is family | `/blog/family-business-succession-planning` |
| L7 | Cost-plus contracts and the IBO (gov-con leads only) | `/blog/ibo-government-contractors` |
| L8 | Industry note (healthcare or restaurant leads, by campaign name) | `/blog/healthcare-services-ma`, `/blog/restaurant-ma` |
| L9 | Picking an advisor at $3M+ | `/blog/choosing-an-ma-advisory-firm` |
| L10 | MBO or PE? | `/blog/management-buyout-vs-private-equity` |

**Why this order:** Alternates "protect yourself from a bad deal" notes with "here's another path" notes so the series never reads as ten reasons to hire IBO Advisors. Industry notes go only to leads whose campaign name carries the industry (`..._healthcare $10m-$100m owner`), which is the one personalisation the data supports today.

### Q - Every 90 days (in addition to the monthly note)

**Subject:** Still the right time to talk?

```
{{firstname}},

Quick one. It's been about three months since you first asked about the Independent Buyout. Things change: EBITDA, a PE approach, a partner who wants out, a health scare.

If any of that has happened, the 20 minutes is still here, still confidential:
[scheduler]

If not, ignore this and I'll keep the monthly notes coming.

Edmund
```

**Why this, here:** The monthly notes deliberately don't push. Once a quarter the sequence needs to ask directly, because 11% of bookings in the data came 14+ days after the lead and some came months later. Naming the real triggers (PE approach, partner, health) is what makes an owner realise the timing has changed.

---

## Track B - Owner, $1M-$3M EBITDA

Goal: stay warm, earn the referral, re-qualify when EBITDA crosses $3M. Exits as Track A.

### B1 - Instant

**Subject:** Honest answer on fit
**Preview:** What $3M of EBITDA has to do with it.

```
Hi {{firstname}},

Thanks for asking about the Independent Buyout. I'd rather be straight with you: the structure works when a company is at roughly $3M of EBITDA or more, because the company's own cash flow has to carry the buyout. You told us you're in the $1M-$3M range, so it may not be the right tool today.

Two things that might still help. Our calculator shows how many years of growth get a company across that line:
https://www.iboadvisors.com/business-valuation-calculator

And this covers the options that do work at your size:
https://www.iboadvisors.com/blog/business-exit-planning-every-option

If your numbers are closer to $3M than the form suggested, reply and tell me, and I'll set up a call.

Edmund
```

**Why this, here:** An under-threshold owner who gets the same pitch as a $10M owner will book a meeting that goes nowhere, or feel misled. Saying "probably not today" immediately is the most credible thing the firm can do, and it is the only email in the track that asks for a reply, because a meaningful share of self-reported bands are wrong.

### B2 - Day 7

**Subject:** The four levers that move EBITDA

```
{{firstname}},

Most companies in the $1M-$3M range are closer to $3M than their P&L says. Four things buyers will add back or reprice, and that you can move on purpose:

1. Owner compensation above market rate.
2. One-off costs: litigation, a bad hire, a system migration.
3. Pricing that hasn't kept pace with your costs.
4. Product or customer mix: the low-margin work that fills the schedule.

Worth an hour with your CPA to restate the last three years on that basis. If it lands you above $3M, reply and we'll talk.

Edmund
```

**Why this, here:** The most useful thing to send someone below the line is a way over it. Add-backs are the fastest, and they often reveal the owner was qualified all along. Practical, no link, no sell.

### B3 - Day 21

**Subject:** Exit planning, eight steps

```
{{firstname}},

Whatever the exit ends up being, the owners who do best start two to five years out. Here's the sequence we'd follow, in order, with what each step is worth at the closing table:
https://www.iboadvisors.com/blog/exit-planning-for-business-owners

Step one is the one most owners skip.

Edmund
```

**Why this, here:** Positions the firm as the adviser for the years before the exit, which is exactly where a $1M-$3M owner sits. Three weeks in is late enough that the email feels like advice, not follow-up.

### B4 - Day 45

**Subject:** Other doors: MBO, minority recap

```
{{firstname}},

Two structures that do work below $3M of EBITDA, and that PE firms rarely mention because they don't need a PE firm:

A management buyout, and how it's financed:
https://www.iboadvisors.com/blog/management-buyout-financing

A minority recapitalisation, taking some money off the table without selling control:
https://www.iboadvisors.com/blog/minority-recapitalization-explained

If either sounds like your situation, reply and I'll point you to the right kind of adviser.

Edmund
```

**Why this, here:** Keeps the firm useful to a lead it can't serve yet, and stops them taking a bad PE deal in the meantime. Offering to point to another adviser is the referral relationship starting in the other direction.

### B5 - Day 90, then every 90 days

**Subject:** Has EBITDA crossed $3M?

```
{{firstname}},

Quarterly check-in, one question: is the company at or near $3M of EBITDA now, or on a clear path there in the next 12 months?

If yes, reply "yes" and I'll set up 20 minutes with Michael. If not, no need to answer; I'll check again in a few months.

Edmund
```

**Why this, here:** Re-qualification by reply is cheaper and more accurate than any form. A "yes" routes the contact to Track A; silence costs nothing.

Between B5 sends, Track B contacts receive the monthly long-tail notes.

---

## Track C - Owner, under $1M EBITDA

### C1 - Instant

**Subject:** Honest answer on fit

```
Hi {{firstname}},

Thanks for asking about the Independent Buyout. Straight answer: it's built for companies at roughly $3M of EBITDA and up, so it isn't the right tool for you today, and I'd rather say so than waste your time.

What might help now: a plain comparison of every exit route at every size, and a calculator that shows the growth it takes to reach the range where an IBO works.
https://www.iboadvisors.com/blog/business-exit-planning-every-option
https://www.iboadvisors.com/business-valuation-calculator

I'll send one useful note a month on owner exits. If you'd rather not, unsubscribe below and no hard feelings.

Edmund
```

**Why this, here:** Same honesty as B1 with no reply ask, because the gap is too large to close by restating add-backs. One email, then the long tail and the quarterly B5 re-qualify; anything more would be spend without return.

---

## Track D - Advisors (CPAs, wealth advisors, attorneys)

Goal: intro call and a referral relationship. Exits as Track A.

### D1 - Instant

**Subject:** Thanks, and a quick question
**Preview:** Do you have a client in mind?

```
Hi {{firstname}},

Thanks for reaching out about the Independent Buyout. Most of our best conversations start with an adviser who has an owner client being courted by private equity.

Do you have a specific client in mind, or are you learning the structure for your practice? Either way, 20 minutes with Michael Chasen is the quickest way in:
[scheduler]

Everything is confidential, and we're happy to describe how we work with referring advisers on the call.

Edmund
```

**Why this, here:** Advisers convert through a different question: not "is my company a fit?" but "do I have a client who is?" Asking it first lets Edmund prioritise the reply, and the calendar link is there for the ones who already know.

### D2 - Day 3

**Subject:** How to spot an IBO candidate in your book

```
{{firstname}},

The profile that tends to fit, so you can scan your client list in five minutes:

- $3M+ of EBITDA, steady or growing
- Owner in their mid-50s or older, or a partner who wants out
- Already receiving private equity approaches
- A management team that could run the company without the founder
- Bonus: cost-plus government contracts (the tax treatment is unusually favourable)

If two or more of those describe a client, it's worth a conversation before their next PE letter:
[scheduler]

Edmund
```

**Why this, here:** Gives the adviser a tool they can act on immediately, which is what makes a referral source useful rather than merely interested. The checklist doubles as qualification criteria so the referrals that come back are the right ones.

### D3 - Day 10

**Subject:** What we do for referring advisers

```
{{firstname}},

Three things advisers usually want to know before introducing a client:

1. Confidentiality: the owner's first conversation is with Michael, off the record, with nothing sent to anyone.
2. Your role: you stay the client's adviser throughout; we work alongside the CPA, wealth adviser and counsel, not around them.
3. Content for your clients: we co-write short guides and run private briefings for adviser client groups on the IBO and on reading a PE term sheet.

If the third one is useful, reply and I'll send an example.

Edmund
```

**Why this, here:** Addresses the adviser's real objection (losing the client relationship) and offers something they can use with clients, which is the currency advisers respond to. The reply ask is deliberately about content, a low-stakes yes.

### D4 - Day 20 (breakup)

**Subject:** Close the loop?

```
{{firstname}},

I'll stop here unless you tell me otherwise. If a client of yours ever gets a PE approach and wants a second path, the 20 minutes with Michael is a standing offer:
[scheduler]

I'll send a short note once a month on owner exits; reply "no" if you'd rather not.

Edmund
```

**Why this, here:** Same logic as A7: permission-based exit, sets up the long tail, keeps the offer standing for the day a client calls.

---

## Track F - Booked: protect the meeting

Enrollment: meeting booked through the scheduler. HubSpot's own confirmation email stays on.

### F1 - 24 hours before the meeting

**Subject:** Tomorrow: three things to have handy
**Preview:** Nothing to prepare, just have these to hand.

```
{{firstname}},

Looking forward to tomorrow. To make the 20 minutes count, it helps to have three things in your head (no documents needed):

1. Roughly what EBITDA the company is running this year.
2. How ownership is split today, and how much of the company you'd want to keep.
3. What you'd want the proceeds to do for you.

Michael will take it from there. If the time no longer works, reschedule here rather than no-showing:
[reschedule link]

Edmund
```

**Why this, here:** No-shows are the leak after the booking. A concrete, low-effort prep list raises the perceived value of the meeting, and offering the reschedule link explicitly converts would-be no-shows into moved meetings the data can still track.

### F2 - SMS, 2 hours before

```
Reminder: your 20 minutes with Michael Chasen (IBO Advisors) is at {{meeting time}}. Video link: {{meeting link}}. Need to move it? {{reschedule link}}
```

**Why this, here:** Two hours is close enough to be acted on, far enough to reschedule. SMS reaches the owner who is between meetings and not in their inbox.

### F3 - No-show, 30 minutes after the start time

**Subject:** Missed you, grab another slot

```
{{firstname}},

Looks like today didn't work; it happens. Here's the link to pick another time:
[scheduler]

If something has changed and it's no longer the right moment, just reply and tell me.

Edmund
```

**Why this, here:** Sent while the missed slot is still fresh, with no guilt, so rebooking is the path of least resistance.

### F4 - No-show, day 2

**Subject:** Still worth the 20 minutes?

```
{{firstname}},

One more try. You booked the call for a reason, and that reason probably hasn't gone away. The calendar is here:
[scheduler]

If you'd prefer a quick phone call instead, reply with a number and a time.

Edmund
```

**Why this, here:** Reminds the owner of their own intent without repeating the pitch, and offers the phone alternative for the ones who found the video format the barrier.

### F5 - No-show, day 7

Send Track A email A6 ("Three options, pick one"), then hand back to Track A at A7 and the long tail.

**Why this, here:** After a week the contact should be treated like any other warm-but-unbooked lead, and A6 is the fastest way to find out which kind they are.

---

## Send-order summary

| Track | Emails in order | Days |
|---|---|---|
| A - Qualified owner | A1 (or A1b), A2, A3, A4, A5, A6, A7, then L1-L10 monthly, Q every 90 days | 0, 1, 3, 6, 9, 13, 18, 45+ |
| B - Owner $1M-$3M | B1, B2, B3, B4, B5 (repeats quarterly), L notes monthly | 0, 7, 21, 45, 90+ |
| C - Owner <$1M | C1, L notes monthly, B5 quarterly | 0, 45+ |
| D - Advisor | D1, D2, D3, D4, then L notes monthly | 0, 3, 10, 20, 45+ |
| F - Booked | F1, F2 (SMS), then on no-show F3, F4, F5 | T-24h, T-2h, +30min, +2d, +7d |
