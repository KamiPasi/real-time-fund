# app/lib/ — Core Utilities

## OVERVIEW

4 utility modules: local auth, server file storage, request cache, trading calendar, valuation time-series.

## WHERE TO LOOK

| File | Exports | Purpose |
|------|---------|---------|
| `localAuth.js` | `localAuth`, `isPasswordAuthConfigured` | Local account/password auth wrapper |
| `serverFileStorage.js` | `fetchServerConfig()`, `saveServerConfig()`, `isServerFileStorageConfigured` | Browser-side client for `/api/config` |
| `cacheRequest.js` | `cachedRequest()`, `clearCachedRequest()` | In-memory request dedup + TTL cache |
| `tradingCalendar.js` | `loadHolidaysForYear()`, `loadHolidaysForYears()`, `isTradingDay()` | Chinese stock market holiday detection via CDN |
| `valuationTimeseries.js` | `recordValuation()`, `getValuationSeries()`, `clearFund()`, `getAllValuationSeries()` | Fund valuation time-series (localStorage) |

## CONVENTIONS

- **localAuth.js**: stores the login session in localStorage and generates a stable user id from the account
- **serverFileStorage.js**: uses Basic Auth against the self-hosted `/api/config` endpoint
- **cacheRequest.js**: deduplicates concurrent requests for same key; default 10s TTL
- **tradingCalendar.js**: downloads `chinese-days` JSON from cdn.jsdelivr.net; caches per-year in Map
- **valuationTimeseries.js**: localStorage key `fundValuationTimeseries`; auto-clears old dates on new data

## ANTI-PATTERNS (THIS DIRECTORY)

- **No error reporting** — all modules silently fail (console.warn at most)
- **localStorage quota not handled** — valuationTimeseries writes without checking available space
- **Cache only in-memory** — cacheRequest lost on page reload; no persistent cache
- **No request cancellation** — JSONP scripts can't be aborted once injected
