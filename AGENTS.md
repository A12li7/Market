# Project Guidance

## User Preferences

- الواجهة باللغة العربية بالكامل مع اتجاه من اليمين إلى اليسار
- تصميم متجاوب يعمل على الجوال وسطح المكتب
- الموقع يعمل بذكاء اصطناعي لتحليل الشارت
- يدعم الأسهم والعملات الرقمية والفوركس والذهب والمعادن
- الشارت الحالي يبقى كما هو (lightweight-charts) ولا يُستبدل بمكتبة أخرى

## Verified Commands

[Filled after first successful build]

## Learnings

- lightweight-charts ColorParser rejects oklch()/var()/color-mix(); chart colors must be hex or rgb/rgba literals or the chart throws and takes down the route.
- Backend timestamps are milliseconds: divide by 1000 for lightweight-charts seconds and pass directly to new Date(Number(ms)).
- A shared function cannot be declared inside a Motoko module; the IC HTTP outcall transform must be a public field of the actor and threaded as an OutCall.Transform parameter.
- Ownership-gated CRUD must write the owners map in the same save path that assigns the id, or list/get/delete silently fail.
- Yahoo Finance rejects requests without a browser-like User-Agent header; CoinGecko OHLC rows are [timestamp, open, high, low, close] with no volume and require the coin id, not the ticker.
- Caffeine Inference uses caffeineai-inference-client with Config.fromEnv<system>() and model = "router"; no API key or model picker is needed.
- OQL manual mode is required when a row's owner lives in a separate map: promote it with .payload("owner", ...) then .ownedBy("owner") + .controllerOrScoped().
- Yahoo Finance has no spot XAUUSD=X/XAGUSD=X chart (404); use COMEX futures symbols GC=F (gold) and SI=F (silver).
- Motoko Text.Pattern variant constructors require a parenthesized argument: #predicate(Char.isWhitespace), not #predicate Char.isWhitespace.
- Time.now() returns Int; assigning it to a Nat field needs an explicit .toNat().
- serde-core JSON decoding uses JSON.toCandid(text) : Result<Candid, Text>; JSON.fromText returns raw Blob bytes.
- TanStack Router useSearch({ strict: false }) reads search params without validateSearch; navigate({ to, search }) writes them for deep-linking.
- Layout NAV_ITEMS entries carry a stable id field consumed by data-ocid markers; AssetSearch maps each AssetType to an icon+color via a Record so a new asset class is a single map entry.
- cryptocurrency.cv free tier caps responses at 3 crypto-only articles and ignores search params; merge it with a public Yahoo Finance RSS feed via rss2json (omit the count param, which 422s) and filter title OR summary to cover commodities like gold.
- bellhour.com /api/markets returns a 'holiday' status; ExchangeStatus must include all six states (open/closed/preMarket/afterHours/sessionBreak/holiday) or holidays are mislabeled as closed.
- break is a reserved Motoko keyword and cannot be a variant tag; use sessionBreak. Text.replace takes a Text pattern (#text " "), not a Char pattern.
- The frontend mock backend (src/mocks/backend.ts) is the visual-verification data source: it must mirror the real backend's data cardinality, filter fields, and mutation persistence or visual QA fails criteria the real backend would pass.
- AssetSearch is rendered both on the chart page and inside the comprehensive analysis dialog; derive its input id from React useId so instances do not collide.
