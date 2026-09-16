import * as pdfjs from './node_modules/pdfjs-dist/build/pdf.js';

const pdfjsLib = pdfjs.default || pdfjs;

async function testPdfJsInThread() {
  const url = 'https://res.cloudinary.com/feog2ubh/raw/upload/v1786093634/PrepNest/general/file_t4amgz';
  console.log('--- Fetching arraybuffer ---');
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  console.log('ArrayBuffer bytes:', buf.byteLength);

  console.log('--- Parsing with PDF.js (in-thread / disableWorker: true) ---');
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf), disableWorker: true });
  const pdf = await loadingTask.promise;
  console.log('PDF loaded successfully! Total pages:', pdf.numPages);

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`Page ${i}: width=${viewport.width}, height=${viewport.height}`);
  }
}

testPdfJsInThread();
