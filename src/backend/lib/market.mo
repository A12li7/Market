import Array "mo:core/Array";
import Char "mo:core/Char";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import { JSON; type Candid } "mo:serde-core";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/market";

module {
  // ---------------------------------------------------------------------------
  // HTTP outcall plumbing
  // ---------------------------------------------------------------------------

  /// Percent-encode a value for safe inclusion in a URL query string.
  func encodeComponent(value : Text) : Text {
    let hex = "0123456789ABCDEF".toArray();
    var out = "";
    for (c in value.toIter()) {
      let code = c.toNat32().toNat();
      if (
        (code >= 0x41 and code <= 0x5A) or // A-Z
        (code >= 0x61 and code <= 0x7A) or // a-z
        (code >= 0x30 and code <= 0x39) or // 0-9
        code == 0x2D or code == 0x5F or code == 0x2E or code == 0x7E
      ) {
        out #= c.toText();
      } else {
        let hi = code / 16;
        let lo = code % 16;
        out #= "%" # hex[hi].toText() # hex[lo].toText();
      };
    };
    out;
  };

  /// Perform a bounded GET and return the decoded body, or `null` on any
  /// transport/decoding failure. Yahoo Finance rejects requests without a
  /// browser-like User-Agent, so one is always sent.
  func httpGet(url : Text, transform : OutCall.Transform) : async ?Text {
    let headers : [OutCall.Header] = [
      { name = "User-Agent"; value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" },
      { name = "Accept"; value = "application/json" },
    ];
    try {
      let body = await OutCall.httpGetRequest(url, headers, transform);
      ?body;
    } catch (_) {
      null;
    };
  };

  // ---------------------------------------------------------------------------
  // JSON traversal helpers over the serde-core Candid tree
  // ---------------------------------------------------------------------------

  func field(record : [(Text, Candid)], key : Text) : ?Candid {
    switch (record.find(func((k, _)) = k == key)) {
      case (?(_, value)) ?value;
      case null null;
    };
  };

  func asRecord(value : Candid) : ?[(Text, Candid)] {
    switch (value) {
      case (#Record(fields)) ?fields;
      case _ null;
    };
  };

  func asArray(value : Candid) : ?[Candid] {
    switch (value) {
      case (#Array(items)) ?items;
      case _ null;
    };
  };

  func asText(value : Candid) : ?Text {
    switch (value) {
      case (#Text(text)) ?text;
      case _ null;
    };
  };

  func asFloat(value : Candid) : ?Float {
    switch (value) {
      case (#Float(number)) ?number;
      case (#Int(number)) ?number.toFloat();
      case (#Nat(number)) ?number.toFloat();
      case _ null;
    };
  };

  func asNat(value : Candid) : ?Nat {
    switch (value) {
      case (#Nat(number)) ?number;
      case (#Int(number)) { if (number >= 0) { ?number.toNat() } else { null } };
      case (#Float(number)) { if (number >= 0.0) { ?number.toInt().toNat() } else { null } };
      case _ null;
    };
  };

  /// Parse a JSON document into its Candid tree, or `null` when malformed.
  func parseJson(body : Text) : ?Candid {
    switch (JSON.toCandid(body)) {
      case (#ok(value)) ?value;
      case (#err(_)) null;
    };
  };

  // ---------------------------------------------------------------------------
  // Interval mapping
  // ---------------------------------------------------------------------------

  func yahooInterval(interval : Types.Interval) : (Text, Text) {
    switch (interval) {
      case (#daily) ("1d", "1mo");
      case (#weekly) ("1wk", "6mo");
      case (#monthly) ("1mo", "2y");
    };
  };

  func coinGeckoDays(interval : Types.Interval) : Text {
    switch (interval) {
      case (#daily) "30";
      case (#weekly) "180";
      case (#monthly) "365";
    };
  };

  // ---------------------------------------------------------------------------
  // Yahoo Finance
  // ---------------------------------------------------------------------------

  /// Parse a Yahoo Finance chart response into candles.
  func parseYahooChart(body : Text) : [Types.Candle] {
    let root = parseJson(body) ?? return [];
    let chart = asRecord(root) ?? return [];
    let resultValue = field(chart, "chart") ?? return [];
    let chartRecord = asRecord(resultValue) ?? return [];
    let resultsValue = field(chartRecord, "result") ?? return [];
    let results = asArray(resultsValue) ?? return [];
    if (results.size() == 0) { return [] };
    let first = asRecord(results[0]) ?? return [];
    let timestampsValue = field(first, "timestamp") ?? return [];
    let timestamps = asArray(timestampsValue) ?? return [];
    let indicatorsValue = field(first, "indicators") ?? return [];
    let indicators = asRecord(indicatorsValue) ?? return [];
    let quotesValue = field(indicators, "quote") ?? return [];
    let quotes = asArray(quotesValue) ?? return [];
    if (quotes.size() == 0) { return [] };
    let quote = asRecord(quotes[0]) ?? return [];
    let opens = asArray(field(quote, "open") ?? return []) ?? return [];
    let highs = asArray(field(quote, "high") ?? return []) ?? return [];
    let lows = asArray(field(quote, "low") ?? return []) ?? return [];
    let closes = asArray(field(quote, "close") ?? return []) ?? return [];
    let volumes = asArray(field(quote, "volume") ?? return []) ?? return [];

    let candles = List.empty<Types.Candle>();
    var i = 0;
    while (i < timestamps.size()) {
      let open = if (i < opens.size()) { asFloat(opens[i]) } else { null };
      let high = if (i < highs.size()) { asFloat(highs[i]) } else { null };
      let low = if (i < lows.size()) { asFloat(lows[i]) } else { null };
      let close = if (i < closes.size()) { asFloat(closes[i]) } else { null };
      switch (asNat(timestamps[i]), open, high, low, close) {
        case (?ts, ?o, ?h, ?l, ?c) {
          let volume = if (i < volumes.size()) { asFloat(volumes[i]) ?? 0.0 } else { 0.0 };
          candles.add({
            timestamp = ts * 1000;
            open = o;
            high = h;
            low = l;
            close = c;
            volume;
          });
        };
        case _ {};
      };
      i += 1;
    };
    candles.toArray();
  };

  /// Fetch OHLC candles for a US stock from Yahoo Finance.
  public func fetchStockCandles(symbol : Text, interval : Types.Interval, transform : OutCall.Transform) : async [Types.Candle] {
    let (range, span) = yahooInterval(interval);
    let url = "https://query1.finance.yahoo.com/v8/finance/chart/" # encodeComponent(symbol)
      # "?range=" # range # "&interval=" # span;
    switch (await httpGet(url, transform)) {
      case (?body) parseYahooChart(body);
      case null [];
    };
  };

  /// Fetch OHLC candles for a forex currency pair from Yahoo Finance.
  /// `symbol` is the Yahoo pair symbol (e.g. "EURUSD=X").
  public func fetchForexCandles(symbol : Text, interval : Types.Interval, transform : OutCall.Transform) : async [Types.Candle] {
    await fetchStockCandles(symbol, interval, transform);
  };

  /// Fetch OHLC candles for a precious metal from Yahoo Finance.
  /// `symbol` is the Yahoo metal symbol (e.g. "XAUUSD=X" or "XAGUSD=X").
  public func fetchMetalCandles(symbol : Text, interval : Types.Interval, transform : OutCall.Transform) : async [Types.Candle] {
    await fetchStockCandles(symbol, interval, transform);
  };

  // ---------------------------------------------------------------------------
  // CoinGecko
  // ---------------------------------------------------------------------------

  /// Fetch OHLC candles for a cryptocurrency from CoinGecko. `symbol` is the
  /// CoinGecko coin id (e.g. "bitcoin"), which is what `searchAssets` returns.
  public func fetchCryptoCandles(symbol : Text, interval : Types.Interval, transform : OutCall.Transform) : async [Types.Candle] {
    let days = coinGeckoDays(interval);
    let url = "https://api.coingecko.com/api/v3/coins/" # encodeComponent(symbol)
      # "/ohlc?vs_currency=usd&days=" # days;
    switch (await httpGet(url, transform)) {
      case (?body) {
        let root = parseJson(body) ?? return [];
        let rows = asArray(root) ?? return [];
        let candles = List.empty<Types.Candle>();
        for (row in rows.values()) {
          switch (asArray(row)) {
            case (?values) {
              if (values.size() >= 5) {
                switch (asNat(values[0]), asFloat(values[1]), asFloat(values[2]), asFloat(values[3]), asFloat(values[4])) {
                  case (?ts, ?o, ?h, ?l, ?c) {
                    candles.add({
                      timestamp = ts;
                      open = o;
                      high = h;
                      low = l;
                      close = c;
                      volume = 0.0;
                    });
                  };
                  case _ {};
                };
              };
            };
            case null {};
          };
        };
        candles.toArray();
      };
      case null [];
    };
  };

  // ---------------------------------------------------------------------------
  // Financial news
  // ---------------------------------------------------------------------------

  /// Parse an ISO-8601 UTC timestamp (e.g. "2026-10-05T10:39:09.000Z") into
  /// milliseconds since the Unix epoch. Returns `null` when the shape is not
  /// recognised so the caller can skip the item.
  func parseIso8601(value : Text) : ?Nat {
    // Expected: YYYY-MM-DDTHH:MM:SS(.sss)?Z, or the RSS variant with a space
    // separator and no trailing "Z" (e.g. "2026-09-23 01:52:26").
    let normalized = value.trim(#predicate(Char.isWhitespace)).replace(#text " ", "T");
    let parts = normalized.split(#char 'T').toArray();
    if (parts.size() != 2) { return null };
    let dateFields = parts[0].split(#char '-').toArray();
    if (dateFields.size() != 3) { return null };
    let year = dateFields[0].toNat() ?? return null;
    let month = dateFields[1].toNat() ?? return null;
    let day = dateFields[2].toNat() ?? return null;
    // Strip the trailing "Z" and any fractional seconds.
    let timeText = parts[1].trimEnd(#char 'Z');
    let timeFields = timeText.split(#char ':').toArray();
    if (timeFields.size() != 3) { return null };
    let hour = timeFields[0].toNat() ?? return null;
    let minute = timeFields[1].toNat() ?? return null;
    let secondFields = timeFields[2].split(#char '.').toArray();
    let secondText = if (secondFields.size() > 0) { secondFields[0] } else { timeFields[2] };
    let second = secondText.toNat() ?? return null;
    let days = daysFromCivil(year, month, day);
    let seconds = days * 86_400 + hour * 3_600 + minute * 60 + second;
    ?(seconds * 1000);
  };

  /// Days since 1970-01-01 for a proleptic Gregorian date (Howard Hinnant's
  /// `days_from_civil` algorithm). Uses `Int` internally so no intermediate
  /// subtraction can underflow.
  func daysFromCivil(year : Nat, month : Nat, day : Nat) : Nat {
    let y = if (month <= 2) { year.toInt() - 1 } else { year.toInt() };
    let era = y / 400;
    let yoe = y - era * 400;
    let m = month.toInt();
    let doy = (153 * (if (m > 2) { m - 3 } else { m + 9 }) + 2) / 5 + day.toInt() - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    (era * 146_097 + doe - 719_468).toNat();
  };

  /// Parse a cryptocurrency.cv news response into news items.
  func parseNews(body : Text) : [Types.NewsItem] {
    let root = parseJson(body) ?? return [];
    let rootRecord = asRecord(root) ?? return [];
    let articlesValue = field(rootRecord, "articles") ?? return [];
    let articles = asArray(articlesValue) ?? return [];
    let items = List.empty<Types.NewsItem>();
    for (article in articles.values()) {
      switch (asRecord(article)) {
        case (?entry) {
          let title = switch (field(entry, "title")) {
            case (?value) asText(value) ?? "";
            case null "";
          };
          let url = switch (field(entry, "link")) {
            case (?value) asText(value) ?? "";
            case null "";
          };
          if (title != "" and url != "") {
            let source = switch (field(entry, "source")) {
              case (?value) asText(value) ?? "";
              case null "";
            };
            let summary = switch (field(entry, "description")) {
              case (?value) asText(value);
              case null null;
            };
            let publishedAt = switch (field(entry, "pubDate")) {
              case (?value) {
                switch (asText(value)) {
                  case (?text) parseIso8601(text) ?? 0;
                  case null 0;
                };
              };
              case null 0;
            };
            items.add({ title; source; url; publishedAt; summary });
          };
        };
        case null {};
      };
    };
    items.toArray();
  };

  /// Parse an RSS 2.0 feed (as returned by the rss2json bridge) into news
  /// items. The bridge exposes `items[]` with `title`, `link`, `pubDate`,
  /// `description` and `author`; the channel title is used as the source.
  func parseRssFeed(body : Text) : [Types.NewsItem] {
    let root = parseJson(body) ?? return [];
    let rootRecord = asRecord(root) ?? return [];
    let feedValue = field(rootRecord, "feed") ?? return [];
    let feed = asRecord(feedValue) ?? return [];
    let source = switch (field(feed, "title")) {
      case (?value) asText(value) ?? "";
      case null "";
    };
    let itemsValue = field(rootRecord, "items") ?? return [];
    let articles = asArray(itemsValue) ?? return [];
    let items = List.empty<Types.NewsItem>();
    for (article in articles.values()) {
      switch (asRecord(article)) {
        case (?entry) {
          let title = switch (field(entry, "title")) {
            case (?value) asText(value) ?? "";
            case null "";
          };
          let url = switch (field(entry, "link")) {
            case (?value) asText(value) ?? "";
            case null "";
          };
          if (title != "" and url != "") {
            let summary = switch (field(entry, "description")) {
              case (?value) asText(value);
              case null null;
            };
            let publishedAt = switch (field(entry, "pubDate")) {
              case (?value) {
                switch (asText(value)) {
                  case (?text) parseIso8601(text) ?? 0;
                  case null 0;
                };
              };
              case null 0;
            };
            items.add({ title; source; url; publishedAt; summary });
          };
        };
        case null {};
      };
    };
    items.toArray();
  };

  /// Fetch the latest financial news, optionally filtered by a case-insensitive
  /// keyword match against the title and summary and capped at `limit` items.
  /// Results are merged from cryptocurrency.cv (crypto coverage) and a public
  /// RSS-to-JSON financial feed (commodities/gold coverage) so keyword searches
  /// such as "gold" can match.
  public func fetchMarketNews(keyword : ?Text, limit : Nat, transform : OutCall.Transform) : async ?[Types.NewsItem] {
    // `limit` is the caller's cap; 0 means "use the default". The upstream
    // request is bounded server-side by the same count.
    let cap = if (limit == 0) { 50 } else if (limit > 100) { 100 } else { limit };
    let cryptoUrl = "https://cryptocurrency.cv/api/news?limit=" # cap.toText();
    // The rss2json free tier rejects a `count` parameter with HTTP 422, so the
    // request is left unbounded; the feed returns its default 10 items.
    let rssUrl = "https://api.rss2json.com/v1/api.json?rss_url="
      # encodeComponent("https://finance.yahoo.com/news/rssindex");
    let crypto = switch (await httpGet(cryptoUrl, transform)) {
      case (?body) parseNews(body);
      case null [];
    };
    let rss = switch (await httpGet(rssUrl, transform)) {
      case (?body) parseRssFeed(body);
      case null [];
    };
    let all = List.empty<Types.NewsItem>();
    for (item in crypto.values()) { all.add(item) };
    for (item in rss.values()) { all.add(item) };
    let merged = all.toArray();
    let needle = switch (keyword) {
      case (?value) value.trim(#predicate(Char.isWhitespace)).toLower();
      case null "";
    };
    let filtered = if (needle == "") {
      merged;
    } else {
      merged.filter(func(item) {
        item.title.toLower().contains(#text needle) or (
          switch (item.summary) {
            case (?summary) summary.toLower().contains(#text needle);
            case null false;
          }
        );
      });
    };
    let capped = if (filtered.size() > cap) {
      filtered.sliceToArray(0, cap.toInt());
    } else {
      filtered;
    };
    ?capped;
  };

  // ---------------------------------------------------------------------------
  // Exchange hours
  // ---------------------------------------------------------------------------

  func exchangeStatus(value : Text) : Types.ExchangeStatus {
    switch (value) {
      case ("open") #open;
      case ("pre-market") #preMarket;
      case ("after-hours") #afterHours;
      case ("break") #sessionBreak;
      case ("holiday") #holiday;
      case _ #closed;
    };
  };

  func exchangeEvent(value : Text) : Types.ExchangeEvent {
    if (value == "closes") { #close } else { #open };
  };

  func eventLabel(event : Types.ExchangeEvent) : Text {
    switch (event) {
      case (#open) "يفتح";
      case (#close) "يغلق";
    };
  };

  /// Parse a bellhour.com markets response into exchange hours.
  func parseExchangeHours(body : Text) : [Types.ExchangeHours] {
    let root = parseJson(body) ?? return [];
    let markets = asArray(root) ?? return [];
    let result = List.empty<Types.ExchangeHours>();
    for (market in markets.values()) {
      switch (asRecord(market)) {
        case (?entry) {
          let name = switch (field(entry, "name")) {
            case (?value) asText(value) ?? "";
            case null "";
          };
          if (name != "") {
            let code = switch (field(entry, "shortName")) {
              case (?value) asText(value) ?? "";
              case null "";
            };
            let country = switch (field(entry, "country")) {
              case (?value) asText(value) ?? "";
              case null "";
            };
            let localTime = switch (field(entry, "localTime")) {
              case (?value) asText(value) ?? "";
              case null "";
            };
            let sessionOpen = switch (field(entry, "regularOpenTime")) {
              case (?value) asText(value) ?? "";
              case null "";
            };
            let sessionClose = switch (field(entry, "regularCloseTime")) {
              case (?value) asText(value) ?? "";
              case null "";
            };
            let statusText = switch (field(entry, "status")) {
              case (?value) asText(value) ?? "";
              case null "";
            };
            let nextEventText = switch (field(entry, "nextEvent")) {
              case (?value) asText(value) ?? "";
              case null "";
            };
            let countdown = switch (field(entry, "countdownMs")) {
              case (?value) asNat(value) ?? 0;
              case null 0;
            };
            let nextEvent = exchangeEvent(nextEventText);
            result.add({
              name;
              code;
              country;
              localTime;
              sessionOpen;
              sessionClose;
              status = exchangeStatus(statusText);
              nextEvent;
              nextEventLabel = eventLabel(nextEvent);
              countdownSeconds = countdown / 1000;
            });
          };
        };
        case null {};
      };
    };
    result.toArray();
  };

  /// Fetch the world's major exchanges with their current trading status and
  /// the next scheduled open/close event.
  public func fetchExchangeHours(transform : OutCall.Transform) : async ?[Types.ExchangeHours] {
    let url = "https://bellhour.com/api/markets";
    switch (await httpGet(url, transform)) {
      case (?body) ?parseExchangeHours(body);
      case null null;
    };
  };

  // ---------------------------------------------------------------------------
  // Asset search
  // ---------------------------------------------------------------------------

  /// Fixed catalogue of supported forex pairs.
  let forexCatalogue : [Types.AssetSuggestion] = [
    { symbol = "EURUSD=X"; name = "EUR/USD"; assetType = #forex },
    { symbol = "GBPUSD=X"; name = "GBP/USD"; assetType = #forex },
    { symbol = "USDJPY=X"; name = "USD/JPY"; assetType = #forex },
    { symbol = "USDCHF=X"; name = "USD/CHF"; assetType = #forex },
    { symbol = "AUDUSD=X"; name = "AUD/USD"; assetType = #forex },
    { symbol = "USDCAD=X"; name = "USD/CAD"; assetType = #forex },
    { symbol = "NZDUSD=X"; name = "NZD/USD"; assetType = #forex },
    { symbol = "EURGBP=X"; name = "EUR/GBP"; assetType = #forex },
    { symbol = "EURJPY=X"; name = "EUR/JPY"; assetType = #forex },
    { symbol = "GBPJPY=X"; name = "GBP/JPY"; assetType = #forex },
  ];

  /// Fixed catalogue of supported precious metals. Yahoo has no spot
  /// `XAUUSD=X`/`XAGUSD=X` chart, so the COMEX futures symbols are used.
  let metalCatalogue : [Types.AssetSuggestion] = [
    { symbol = "GC=F"; name = "الذهب (XAU/USD)"; assetType = #gold },
    { symbol = "SI=F"; name = "الفضة (XAG/USD)"; assetType = #gold },
  ];

  /// Search all sources for assets matching a free-text query.
  public func searchAssets(term : Text, transform : OutCall.Transform) : async [Types.AssetSuggestion] {
    let stocks = await searchStocks(term, transform);
    let cryptos = await searchCryptos(term, transform);
    let forex = searchForex(term);
    let metals = searchMetals(term);
    let combined = List.empty<Types.AssetSuggestion>();
    for (item in forex.values()) { combined.add(item) };
    for (item in metals.values()) { combined.add(item) };
    for (item in stocks.values()) { combined.add(item) };
    for (item in cryptos.values()) { combined.add(item) };
    combined.toArray();
  };

  /// Resolve the full display name for a symbol by searching the matching
  /// source and preferring an exact symbol match. Falls back to the symbol
  /// itself when no name is available.
  public func lookupAssetName(symbol : Text, assetType : Types.AssetType, transform : OutCall.Transform) : async Text {
    switch (assetType) {
      case (#forex) {
        switch (forexCatalogue.find(func(item) = item.symbol == symbol)) {
          case (?item) item.name;
          case null symbol;
        };
      };
      case (#gold) {
        switch (metalCatalogue.find(func(item) = item.symbol == symbol)) {
          case (?item) item.name;
          case null symbol;
        };
      };
      case (#stock) {
        let results = await searchStocks(symbol, transform);
        switch (results.find(func(item) = item.symbol == symbol)) {
          case (?item) item.name;
          case null symbol;
        };
      };
      case (#crypto) {
        let results = await searchCryptos(symbol, transform);
        switch (results.find(func(item) = item.symbol == symbol)) {
          case (?item) item.name;
          case null symbol;
        };
      };
    };
  };

  func searchStocks(term : Text, transform : OutCall.Transform) : async [Types.AssetSuggestion] {
    let url = "https://query1.finance.yahoo.com/v1/finance/lookup?query="
      # encodeComponent(term) # "&type=equity&count=10";
    switch (await httpGet(url, transform)) {
      case (?body) {
        let root = parseJson(body) ?? return [];
        let rootRecord = asRecord(root) ?? return [];
        let financeValue = field(rootRecord, "finance") ?? return [];
        let finance = asRecord(financeValue) ?? return [];
        let resultValue = field(finance, "result") ?? return [];
        let results = asArray(resultValue) ?? return [];
        if (results.size() == 0) { return [] };
        let first = asRecord(results[0]) ?? return [];
        let documentsValue = field(first, "documents") ?? return [];
        let documents = asArray(documentsValue) ?? return [];
        let suggestions = List.empty<Types.AssetSuggestion>();
        for (document in documents.values()) {
          switch (asRecord(document)) {
            case (?doc) {
              let symbol = switch (field(doc, "symbol")) {
                case (?value) asText(value) ?? "";
                case null "";
              };
              let name = switch (field(doc, "shortName")) {
                case (?value) asText(value) ?? symbol;
                case null symbol;
              };
              if (symbol != "") {
                suggestions.add({ symbol; name; assetType = #stock });
              };
            };
            case null {};
          };
        };
        suggestions.toArray();
      };
      case null [];
    };
  };

  func searchCryptos(term : Text, transform : OutCall.Transform) : async [Types.AssetSuggestion] {
    let url = "https://api.coingecko.com/api/v3/search?query=" # encodeComponent(term);
    switch (await httpGet(url, transform)) {
      case (?body) {
        let root = parseJson(body) ?? return [];
        let rootRecord = asRecord(root) ?? return [];
        let coinsValue = field(rootRecord, "coins") ?? return [];
        let coins = asArray(coinsValue) ?? return [];
        let suggestions = List.empty<Types.AssetSuggestion>();
        var count = 0;
        for (coin in coins.values()) {
          if (count < 10) {
            switch (asRecord(coin)) {
              case (?entry) {
                let id = switch (field(entry, "id")) {
                  case (?value) asText(value) ?? "";
                  case null "";
                };
                let name = switch (field(entry, "name")) {
                  case (?value) asText(value) ?? id;
                  case null id;
                };
                if (id != "") {
                  suggestions.add({ symbol = id; name; assetType = #crypto });
                  count += 1;
                };
              };
              case null {};
            };
          };
        };
        suggestions.toArray();
      };
      case null [];
    };
  };

  /// Search the fixed forex pair catalogue for a matching pair.
  func searchForex(term : Text) : [Types.AssetSuggestion] {
    let needle = term.toLower();
    if (needle == "") { return forexCatalogue };
    forexCatalogue.filter(func(item) {
      item.symbol.toLower().contains(#text needle) or item.name.toLower().contains(#text needle);
    });
  };

  /// Search the fixed precious-metals catalogue for a matching metal.
  func searchMetals(term : Text) : [Types.AssetSuggestion] {
    let needle = term.toLower();
    if (needle == "") { return metalCatalogue };
    metalCatalogue.filter(func(item) {
      item.symbol.toLower().contains(#text needle) or item.name.toLower().contains(#text needle);
    });
  };

  // ---------------------------------------------------------------------------
  // Technical indicators
  // ---------------------------------------------------------------------------

  func sma(values : [Float], period : Nat) : ?Float {
    if (period == 0 or values.size() < period) { return null };
    var sum = 0.0;
    var i = values.size() - period;
    while (i < values.size()) {
      sum += values[i];
      i += 1;
    };
    ?(sum / period.toFloat());
  };

  /// Simple-average RSI over the last `period` close-to-close changes.
  func rsi(values : [Float], period : Nat) : ?Float {
    if (period == 0 or values.size() < period + 1) { return null };
    var gains = 0.0;
    var losses = 0.0;
    var i = values.size() - period;
    while (i < values.size()) {
      let change = values[i] - values[i - 1];
      if (change > 0.0) { gains += change } else { losses += (-change) };
      i += 1;
    };
    let averageGain = gains / period.toFloat();
    let averageLoss = losses / period.toFloat();
    if (averageLoss == 0.0) {
      if (averageGain == 0.0) { return ?50.0 };
      return ?100.0;
    };
    let rs = averageGain / averageLoss;
    ?(100.0 - (100.0 / (1.0 + rs)));
  };

  /// Compute SMA(20), SMA(50), RSI(14) and MACD(12,26,9) over a candle series.
  public func computeIndicators(candles : [Types.Candle]) : Types.IndicatorSet {
    let closes = candles.map(func(candle) = candle.close);
    let macdLine = macdSeries(closes);
    let signalLine = emaSeries(macdLine, 9);
    let macdValue = if (macdLine.size() > 0) { ?macdLine[macdLine.size() - 1] } else { null };
    let signalValue = if (signalLine.size() > 0) { ?signalLine[signalLine.size() - 1] } else { null };
    let histogram = switch (macdValue, signalValue) {
      case (?m, ?s) ?(m - s);
      case _ null;
    };
    let crossover = switch (macdValue, signalValue) {
      case (?m, ?s) {
        if (m > s) { ?#bullish } else if (m < s) { ?#bearish } else { ?#none };
      };
      case _ null;
    };
    {
      sma20 = sma(closes, 20);
      sma50 = sma(closes, 50);
      rsi14 = rsi(closes, 14);
      macd = macdValue;
      macdSignal = signalValue;
      macdHistogram = histogram;
      macdCrossover = crossover;
    };
  };

  /// Build the full MACD line series (EMA12 - EMA26) so its EMA(9) signal can
  /// be computed over the series rather than from a single point.
  func macdSeries(closes : [Float]) : [Float] {
    let fast = emaSeries(closes, 12);
    let slow = emaSeries(closes, 26);
    let length = Nat.min(fast.size(), slow.size());
    if (length == 0) { return [] };
    let offset = closes.size() - length;
    Array.tabulate(length, func(i) = fast[offset + i] - slow[offset + i]);
  };

  /// EMA series aligned so index `i` holds the EMA of `values[0..=i]`.
  func emaSeries(values : [Float], period : Nat) : [Float] {
    if (period == 0 or values.size() < period) { return [] };
    let multiplier = 2.0 / (period.toFloat() + 1.0);
    var seed = 0.0;
    var i = 0;
    while (i < period) {
      seed += values[i];
      i += 1;
    };
    var current = seed / period.toFloat();
    let result = List.empty<Float>();
    result.add(current);
    i := period;
    while (i < values.size()) {
      current := (values[i] - current) * multiplier + current;
      result.add(current);
      i += 1;
    };
    result.toArray();
  };

  // ---------------------------------------------------------------------------
  // Prompt building and response parsing
  // ---------------------------------------------------------------------------

  func intervalLabel(interval : Types.Interval) : Text {
    switch (interval) {
      case (#daily) "يومي";
      case (#weekly) "أسبوعي";
      case (#monthly) "شهري";
    };
  };

  func formatFloat(value : Float) : Text {
    value.toText();
  };

  func formatOptional(value : ?Float) : Text {
    switch (value) {
      case (?number) formatFloat(number);
      case null "غير متاح";
    };
  };

  /// Build the Arabic analysis prompt from price data and indicators.
  public func buildAnalysisPrompt(
    symbol : Text,
    assetName : Text,
    interval : Types.Interval,
    candles : [Types.Candle],
    indicators : Types.IndicatorSet,
  ) : Text {
    let recent = if (candles.size() > 30) {
      candles.sliceToArray((candles.size() - 30).toInt(), candles.size().toInt());
    } else {
      candles;
    };
    var priceLines = "";
    for (candle in recent.values()) {
      priceLines #= candle.timestamp.toText() # ": open=" # formatFloat(candle.open)
        # " high=" # formatFloat(candle.high) # " low=" # formatFloat(candle.low)
        # " close=" # formatFloat(candle.close) # "\n";
    };
    let lastClose = if (candles.size() > 0) { formatFloat(candles[candles.size() - 1].close) } else { "غير متاح" };
    "أنت محلل فني خبير في الأسواق المالية. حلّل الشارت التالي وقدّم توصية واضحة.\n\n"
      # "الأصل: " # assetName # " (" # symbol # ")\n"
      # "الإطار الزمني: " # intervalLabel(interval) # "\n"
      # "آخر سعر إغلاق: " # lastClose # "\n\n"
      # "المؤشرات الفنية:\n"
      # "- SMA(20): " # formatOptional(indicators.sma20) # "\n"
      # "- SMA(50): " # formatOptional(indicators.sma50) # "\n"
      # "- RSI(14): " # formatOptional(indicators.rsi14) # "\n"
      # "- MACD: " # formatOptional(indicators.macd) # "\n"
      # "- MACD Signal: " # formatOptional(indicators.macdSignal) # "\n"
      # "- MACD Histogram: " # formatOptional(indicators.macdHistogram) # "\n\n"
      # "بيانات آخر الشموع (الطابع الزمني بالمللي ثانية):\n" # priceLines # "\n"
      # "اكتب تحليلاً باللغة العربية يتضمن:\n"
      # "1. الاتجاه العام ومستويات الدعم والمقاومة.\n"
      # "2. قراءة المؤشرات الفنية.\n"
      # "3. توصية نهائية.\n\n"
      # "أنهِ ردّك بالأسطر التالية بالضبط:\n"
      # "التوصية: شراء أو بيع أو انتظار\n"
      # "الثقة: رقم من 0 إلى 100\n";
  };

  /// Parse the AI response into a recommendation, confidence and analysis text.
  public func parseAnalysisResponse(response : Text) : (Types.Recommendation, Nat, Text) {
    var recommendation : Types.Recommendation = #wait;
    var confidence : Nat = 50;
    for (line in response.split(#char '\n')) {
      let trimmed = line.trim(#predicate(Char.isWhitespace));
      if (trimmed.startsWith(#text "التوصية:")) {
        recommendation := parseRecommendation(trimmed);
      } else if (trimmed.startsWith(#text "الثقة:")) {
        confidence := parseConfidence(trimmed);
      };
    };
    (recommendation, confidence, response);
  };

  func parseRecommendation(line : Text) : Types.Recommendation {
    let value = stripLabel(line, "التوصية:");
    if (value.contains(#text "شراء")) { #buy }
    else if (value.contains(#text "بيع")) { #sell }
    else { #wait };
  };

  func parseConfidence(line : Text) : Nat {
    let value = stripLabel(line, "الثقة:");
    var digits = "";
    for (c in value.toIter()) {
      if (c.isDigit()) { digits #= c.toText() };
    };
    if (digits == "") { return 50 };
    let parsed = digits.toNat() ?? 50;
    if (parsed > 100) { 100 } else { parsed };
  };

  func stripLabel(line : Text, prefix : Text) : Text {
    if (line.startsWith(#text prefix)) {
      line.trimStart(#text prefix).trim(#predicate(Char.isWhitespace));
    } else {
      line;
    };
  };
};
