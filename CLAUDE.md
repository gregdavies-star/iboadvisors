# IBO Advisors site: standing rules

Static HTML/CSS/JS on Vercel (project `iboadvisors`), no build step. See README.md for structure and tooling.

## Standing rules (from Greg Davies; apply to every change)

1. Michael Chasen is **General Partner** only. Never "Founder", "Managing Partner" or any other title, in copy, alt text, structured data or anything else that describes him. (The `founder-portrait.*` asset filenames and `founder*` CSS class names are internal and may stay.)
2. The call with Michael is **30 minutes**, everywhere it is mentioned.
3. The /book confirmation does **not** ask where the visitor will take the call and does **not** ask them to commit to rescheduling. The optional "Anything you'd like Michael to know?" note **stays**; the note goes to the HubSpot contact record and to Michael, never to the prospect.
4. No code is deployed until Greg says build.

## HubSpot facts

- Portal `245308986`, on the **NA2** data center (tracking script `//js-na2.hs-scripts.com/245308986.js`).
- The scheduler embed origin is `https://meetings-na2.hubspot.com`. postMessage listeners must check that exact origin; samples that check `meetings.hubspot.com` never fire here. HubSpot's embed script does not auto-resize the iframe for the NA2 host, so `/book/book.js` applies the iframe's `{height}` messages itself.
- `/book` is the only scheduler entry point. Site links and nurture emails point at `/book` (with a `src` parameter: `modal`, `ibo-exit`, `calculator`, `pdf`, `email`), not at the hosted meetings-na2 page.
- The scheduling page's "redirect after booking" setting must stay **OFF**. Inside the /book embed it would navigate the whole page away from the on-site confirmation.
- The pre-call note posts to the "Pre-call note" HubSpot form (fields `email`, `pre_call_note`). Its GUID goes in `PRECALL_NOTE_FORM_GUID` in `book/book.js`; while that is empty the note card is not rendered.

## SEO regeneration

After adding or editing any page by hand, run this before committing:

```
npm run seo:jsonld && npm run seo:sitemap
```

`npm run seo:check` is the CI form (fails if derived files are stale or the audit has errors). The JSON-LD source of truth is `scripts/ensure-jsonld.mjs`; edit it there, not in the generated `data-seo="auto"` blocks. Pages with `<meta name="robots" content="noindex, ...">` are left out of the sitemap and JSON-LD automatically.
