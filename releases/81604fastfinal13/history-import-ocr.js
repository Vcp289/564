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
