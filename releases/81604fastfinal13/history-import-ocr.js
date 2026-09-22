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

  async function recognize(image, language, options = {}) {
    const Tesseract = await loadLibrary();
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
        return await worker.recognize(image);
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
        return index === 0 && active.raw ? value.replace(active.raw, " ") : value;
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
      const dateMatch = window.parseImportDateMatch(line);
      if (dateMatch?.date) {
        flush();
        active = { date: dateMatch.date, raw: dateMatch.raw, lines: [line] };
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
    const reviewDates = rows.filter(row => row.needsReview).map(row => row.date);
    const reviewNote = reviewDates.length
      ? `\n\n[ตรวจเอง] วันที่อ่านตัวเลขไม่ครบ: ${reviewDates.join(", ")}`
      : "";
    return {
      rows,
      rawText: `${base.rawText || normalized(text)}${reviewNote}`,
      noResultDates: [...noResultDates].sort()
    };
  };
})();
