## What's Changed

### New: Precious Metals Prices
* Added a new **Metals** card tracking Dubai Lira, Palm Silver, and Copper 9999 (price per mithqal, in USD and IQD), sourced live from Telegram - Yar Gold.
* Parsing is resilient to how the channel actually posts — items can arrive individually or bundled, and Telegram's RTL/LTR text ordering no longer breaks extraction.
* If an item hasn't been posted recently, its card shows "Awaiting update" instead of hiding the whole section.

### New: Live Market Ticker
* Added a scrolling news-ticker style banner showing the market rate, CBI rate, EUR/GBP/TRY/IRT-to-IQD, and all available metal prices in one continuous strip.
* Pauses on hover, and skips anything not currently available rather than leaving a gap.

### Accuracy
* The USD "Market Rate" card is now correctly labeled as the **Sell Price** — Iraq Borsa and Bazari Dolaraka only ever published the sell side, so this was a mislabel rather than missing data. Buy price will follow once a real source is confirmed.
* Fixed HTML numeric entity decoding (`&#036;` etc.) that was silently breaking price extraction from certain Telegram posts.
* Fixed a parsing gap that dropped Telegram posts formatted as photo captions rather than plain text.

### UI & Accessibility
* Removed a duplicate Central Bank rate card that appeared twice on the page.
* Added `prefers-reduced-motion` support site-wide, while keeping the ticker and header's rotating conversion text working correctly for everyone (reduced-motion animations used to collapse straight to their invisible end-state instead of just slowing down).
* Restored visible keyboard focus rings on several buttons that had `focus:outline-none` with no replacement (theme toggle, language selector, calculator swap links, modal buttons).
* Replaced leftover blue accents (spinner, pull-to-refresh, live-updating dot) with the site's monochrome theme, left over from before the black-and-white redesign.
* Refined hover/press micro-interactions across rate cards with an eased transition curve and tactile press feedback.
* Differentiated the trend indicator (up/down) without relying on color, consistent with the black-and-white design.
* Removed three empty, unreferenced component files.

**Full Changelog**: https://github.com/Vikhorz/DinarLive/compare/v1.4...v1.5
