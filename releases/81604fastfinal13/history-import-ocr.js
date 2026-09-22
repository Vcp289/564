/* History image import OCR reliability patch. Scoped to the History importer. */
(() => {
  "use strict";

  const VERSION = "5.1.1";
  const SOURCES = [
    {
      script: `https://cdn.jsdelivr.net/npm/tesseract.js@${VERSION}/dist/tesseract.min.js`,
      workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@${VERSION}/dist/worker.min.js`,
      corePath: `https://cdn.jsdelivr.net/npm/tesseract.js-core@${VERSION}`,
      langPath: "https://tessdata.projectnaptha.com/4.0.0"
    },
    {
      script: `https://unpkg.com/tesseract.js@${VERSION}/dist/tesseract.min.js`,
      workerPath: `https://unpkg.com/tesseract.js@${VERSION}/dist/worker.min.js`,
      corePath: `https://unpkg.com/tesseract.js-core@${VERSION}`,
      langPath: "https://tessdata.projectnaptha.com/4.0.0"
    }
  ];
  const TALL_IMAGE_RATIO = 1.28;
  const MIN_TALL_IMAGE_HEIGHT = 1200;
  const TILE_OVERLAP = 120;

  let libraryPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      document.querySelector('script[data-import-ocr="tesseract"]')?.remove();
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      script.dataset.importOcr = "tesseract";
      script.onload = () => window.Tesseract?.createWorker
        ? resolve(window.Tesseract)
        : reject(new Error("ไลบรารี OCR ที่ดาวน์โหลดมาไม่สมบูรณ์"));
      script.onerror = () => {
        script.remove();
        reject(new Error("ดาวน์โหลดไลบรารี OCR ไม่สำเร็จ"));
      };
      document.head.appendChild(script);
    });
  }

  async function loadLibrary() {
    if (window.Tesseract?.createWorker) return window.Tesseract;
    if (libraryPromise) return libraryPromise;
    libraryPromise = (async () => {
      let lastError;
      for (const source of SOURCES) {
        try {
          return await loadScript(source.script);
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error("โหลดระบบ OCR ไม่สำเร็จ");
    })().catch(error => {
      libraryPromise = null;
      throw error;
    });
    return libraryPromise;
  }

  function isTallImage(image) {
    const width = Number(image?.width || image?.naturalWidth || 0);
    const height = Number(image?.height || image?.naturalHeight || 0);
    return {
      width,
      height,
      tall: image instanceof HTMLCanvasElement
        && height >= MIN_TALL_IMAGE_HEIGHT
        && height / Math.max(width, 1) >= TALL_IMAGE_RATIO
    };
  }

  // Tesseract's automatic page segmentation can return only one row from a
  // very tall screenshot (a long scrolling table capture). Read overlapping
  // horizontal strips instead and join the text; the row parser below
  // groups by recognized date, so duplicate text in the overlap band is
  // harmless as long as each date's own line is present in at least one tile.
  async function recognizeTiled(worker, image, width, height) {
    const tileHeight = Math.max(640, Math.min(960, Math.round(width * 0.82)));
    const step = Math.max(320, tileHeight - TILE_OVERLAP);
    const starts = [];
    for (let top = 0; top < height; top += step) {
      const clampedTop = Math.min(top, Math.max(0, height - tileHeight));
      if (starts[starts.length - 1] !== clampedTop) starts.push(clampedTop);
      if (clampedTop + tileHeight >= height) break;
    }
    const texts = [];
    const tileStats = [];
    for (let index = 0; index < starts.length; index++) {
      const top = starts[index];
      const cropHeight = Math.min(tileHeight, height - top);
      const tile = document.createElement("canvas");
      tile.width = width;
      tile.height = cropHeight;
      const context = tile.getContext("2d", { alpha: false, willReadFrequently: true });
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, cropHeight);
      context.drawImage(image, 0, top, width, cropHeight, 0, 0, width, cropHeight);
      const result = await worker.recognize(tile);
      const tileText = String(result?.data?.text || "").trim();
      texts.push(tileText);
      tileStats.push({ top, height: cropHeight, characters: tileText.length });
      tile.width = 1;
      tile.height = 1;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return {
      data: {
        text: texts.filter(Boolean).join("\n"),
        __historyImportTiled: true,
        __historyImportTileCount: starts.length,
        __historyImportSourceSize: { width, height }
      }
    };
  }

  async function recognize(image, language, options = {}) {
    const Tesseract = await loadLibrary();
    const { width, height, tall } = isTallImage(image);
    let lastError;
    for (const source of SOURCES) {
      let worker;
      try {
        worker = await Tesseract.createWorker(language || "tha", Tesseract.OEM?.LSTM_ONLY ?? 1, {
          workerPath: source.workerPath,
          corePath: source.corePath,
          langPath: source.langPath,
          logger: options.logger
        });
        await worker.setParameters({ preserve_interword_spaces: "1" });
        return tall ? await recognizeTiled(worker, image, width, height) : await worker.recognize(image);
      } catch (error) {
        lastError = error;
      } finally {
        try { await worker?.terminate(); } catch (_) {}
      }
    }
    throw new Error(`เริ่ม OCR ไม่สำเร็จ: ${lastError?.message || "โหลด Worker/Core/ภาษาไทยไม่ได้"}`);
  }

  window.loadTesseractSandbox = async function loadTesseractSandbox() {
    await loadLibrary();
    return { recognize };
  };
})();

/* Recover History import rows that OCR split across adjacent visual lines.
   A block begins at one recognized date and ends before the next date, so
   values can never leak from the following day. No-result phrases always
   win over digits. Wraps window.parseImportSandboxRows additively — falls
   back to it untouched when its own helpers are unavailable. */
(() => {
  "use strict";

  const originalParseImportRows = window.parseImportSandboxRows;

  function normalized(text) {
    return typeof window.normalizeOcrDigits === "function"
      ? window.normalizeOcrDigits(text)
      : String(text || "");
  }

  function isNoResultBlock(text) {
    if (typeof window.isImportNoResultText === "function" && window.isImportNoResultText(text)) return true;
    const compact = normalized(text).toLowerCase().replace(/[\s._,;:|/\\()[\]{}'"`~!@#$%^&*+=?\-–—]/g, "");
    return ["งดออกผล", "งดการออกผล", "งดประกาศผล", "ไม่มีผล", "ไม่มีผลออก", "ไม่ออกผล", "ยังไม่ออกผล", "เลื่อนออกผล"]
      .some(token => compact.includes(token));
  }

  function spatialLinesFrom(data) {
    if (typeof window.collectSpatialOcrLines === "function") {
      try { return window.collectSpatialOcrLines(data) || []; } catch (_) {}
    }
    return [];
  }

  // Anchor the date to a Thai month token. OCR often inserts stray digits
  // between the profile name and the real day (for example "ง1!0 1 21 ก.ย."),
  // and sometimes even inserts a stray character INSIDE the month token
  // itself (for example "ก.ยข." or "ก.๎ย" for ก.ย.). Tolerate a couple of
  // stray characters between the two consonants and after them — the exact
  // consonant pair still has to appear in order, so this can never invent a
  // month that was not actually printed. Once a candidate is found, rebuild
  // a clean "<day> <canonical month>. <year>" fragment from the KNOWN pair
  // (never the noisy raw text) before handing it to the date parser, so any
  // junk characters caught inside the match can never leak into the date.
  const THAI_MONTH_PAIRS = [
    ["ม", "ค"], ["ก", "พ"], ["มี", "ค"], ["เม", "ย"], ["พ", "ค"], ["มิ", "ย"],
    ["ก", "ค"], ["ส", "ค"], ["ก", "ย"], ["ต", "ค"], ["พ", "ย"], ["ธ", "ค"]
  ];
  const THAI_MONTH_TOKEN = "(?:" + THAI_MONTH_PAIRS.map(([a, b]) => `${a}.{0,2}?${b}`).join("|") + ").{0,2}?";
  const THAI_DATE_ANCHOR = new RegExp(`(?<!\\d)(\\d{1,2})\\s*(${THAI_MONTH_TOKEN}).{0,3}?(\\d{2,4})(?!\\d)`, "gi");

  function canonicalThaiMonthAbbrev(rawToken) {
    const text = String(rawToken || "");
    for (const [a, b] of THAI_MONTH_PAIRS) {
      const start = text.indexOf(a);
      if (start === -1) continue;
      if (text.slice(start + a.length).includes(b)) return `${a}.${b}.`;
    }
    return null;
  }

  function anchoredThaiDateMatch(line) {
    if (typeof window.parseImportDateMatch !== "function") return null;
    const value = normalized(line).replace(/\s+/g, " ").trim();
    THAI_DATE_ANCHOR.lastIndex = 0;
    let match;
    while ((match = THAI_DATE_ANCHOR.exec(value))) {
      const day = Number(match[1]);
      if (day < 1 || day > 31) continue;
      const monthAbbrev = canonicalThaiMonthAbbrev(match[2]);
      if (!monthAbbrev) continue;
      const fragment = `${match[1]} ${monthAbbrev} ${match[3]}`;
      const parsed = window.parseImportDateMatch(fragment);
      if (!parsed?.date) continue;
      return {
        ...parsed,
        raw: match[0],
        sourceStart: match.index,
        sourceEnd: match.index + match[0].length,
        remainder: value.slice(match.index + match[0].length).trim()
      };
    }
    return null;
  }

  function recoverDateBlocks(lines, sourceName) {
    if (typeof window.parseImportDateMatch !== "function") return { rows: [], noResultDates: [] };
    const rows = [];
    const noResultDates = new Set();
    let active = null;

    const flush = () => {
      if (!active) return;
      const blockText = active.lines.join(" ");
      if (isNoResultBlock(blockText)) {
        noResultDates.add(active.date);
        active = null;
        return;
      }

      const cleanedLines = active.lines.map((line, index) => {
        const value = normalized(line).replace(/\s+/g, " ").trim();
        if (index !== 0) return value;
        // For an anchored Thai date, discard the entire noisy prefix and the
        // date itself. Only the result columns to the right of the year remain.
        if (typeof active.remainder === "string") return active.remainder;
        return active.raw ? value.replace(active.raw, " ") : value;
      });
      const sameLineGroups = [...cleanedLines[0].matchAll(/(?<!\d)(\d{1,5})(?!\d)/g)].map(match => match[1]);
      const blockGroups = [...cleanedLines.join(" ").matchAll(/(?<!\d)(\d{1,5})(?!\d)/g)].map(match => match[1]);
      const choose = groups => ({
        three: groups.filter(value => /^\d{3}$/.test(value)),
        two: groups.filter(value => /^\d{2}$/.test(value))
      });
      const same = choose(sameLineGroups);
      const whole = choose(blockGroups);
      const exactSameLine = same.three.length === 1 && same.two.length === 1;
      const exactBlock = whole.three.length === 1 && whole.two.length === 1;
      const number = exactSameLine ? same.three[0] : exactBlock ? whole.three[0] : "";
      const twoDigit = exactSameLine ? same.two[0] : exactBlock ? whole.two[0] : "";

      rows.push({
        id: `import-block-${sourceName}-${active.date}-${rows.length}`,
        date: active.date,
        number,
        twoDigit,
        enabled: Boolean(number && twoDigit),
        sourceLine: blockText,
        parsePriority: exactSameLine ? 6 : exactBlock ? 5 : 1,
        strictNumeric: Boolean(number && twoDigit),
        needsReview: !(number && twoDigit)
      });
      active = null;
    };

    lines.map(line => normalized(line).replace(/\s+/g, " ").trim()).filter(Boolean).forEach(line => {
      const dateMatch = anchoredThaiDateMatch(line) || window.parseImportDateMatch(line);
      if (dateMatch?.date) {
        flush();
        active = {
          date: dateMatch.date,
          raw: dateMatch.raw,
          remainder: typeof dateMatch.remainder === "string" ? dateMatch.remainder : null,
          lines: [line]
        };
      } else if (active) {
        active.lines.push(line);
      }
    });
    flush();
    return { rows, noResultDates: [...noResultDates] };
  }

  window.parseImportSandboxRows = function parseImportSandboxRowsDetailed(text, ocrData = null) {
    const base = typeof originalParseImportRows === "function"
      ? originalParseImportRows(text, ocrData)
      : { rows: [], rawText: normalized(text), noResultDates: [] };
    const textLines = normalized(text).split(/\r?\n/);
    const spatialLines = spatialLinesFrom(ocrData);
    const textRecovered = recoverDateBlocks(textLines, "text");
    const spatialRecovered = recoverDateBlocks(spatialLines, "spatial");
    const noResultDates = new Set([
      ...(base.noResultDates || []),
      ...textRecovered.noResultDates,
      ...spatialRecovered.noResultDates
    ]);
    const byDate = new Map();
    [...(base.rows || []), ...textRecovered.rows, ...spatialRecovered.rows].forEach(row => {
      if (!row?.date || noResultDates.has(row.date)) return;
      const current = byDate.get(row.date);
      const score = Number(row.parsePriority || 0) + (/^\d{3}$/.test(row.number || "") ? 2 : 0) + (/^\d{2}$/.test(row.twoDigit || "") ? 2 : 0);
      const currentScore = current
        ? Number(current.parsePriority || 0) + (/^\d{3}$/.test(current.number || "") ? 2 : 0) + (/^\d{2}$/.test(current.twoDigit || "") ? 2 : 0)
        : -1;
      if (!current || score > currentScore) byDate.set(row.date, row);
    });
    const rows = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

    // A tiled (tall-screenshot) read that still yields very few rows relative
    // to its tile count likely missed most of the table. Never silently
    // accept that old failure mode (one or two dates from a screenshot
    // containing many); keep the recovered values visible for review, but
    // require the user to explicitly confirm them before saving.
    const isTallTiledImage = Boolean(ocrData?.__historyImportTiled);
    const suspiciousCoverage = isTallTiledImage
      && Number(ocrData?.__historyImportTileCount || 0) >= 2
      && rows.filter(row => row.enabled).length < Math.min(4, Number(ocrData.__historyImportTileCount) * 2);
    if (suspiciousCoverage) {
      rows.forEach(row => {
        row.enabled = false;
        row.needsReview = true;
      });
    }

    const reviewDates = rows.filter(row => row.needsReview).map(row => row.date);
    const reviewNote = reviewDates.length
      ? `\n\n[ตรวจเอง] วันที่อ่านตัวเลขไม่ครบ: ${reviewDates.join(", ")}`
      : "";
    const coverageNote = suspiciousCoverage
      ? `\n\n[ป้องกันข้อมูลตกหล่น] รูปยาว ${ocrData.__historyImportTileCount} ส่วน แต่อ่านได้เพียง ${rows.length} วัน ระบบจึงไม่เลือกบันทึกอัตโนมัติ กรุณาตรวจรูปหรือเลือกรายการด้วยตนเอง`
      : "";
    return {
      rows,
      rawText: `${base.rawText || normalized(text)}${reviewNote}${coverageNote}`,
      noResultDates: [...noResultDates].sort()
    };
  };
})();
