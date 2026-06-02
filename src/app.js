const pdfInput = document.querySelector("#pdfInput");
const readPdfButton = document.querySelector("#readPdfButton");
const pdfStatus = document.querySelector("#pdfStatus");
const documentText = document.querySelector("#documentText");
const useTextButton = document.querySelector("#useTextButton");
const summaryButton = document.querySelector("#summaryButton");
const questionForm = document.querySelector("#questionForm");
const questionInput = document.querySelector("#questionInput");
const answerText = document.querySelector("#answerText");
const sourcesList = document.querySelector("#sourcesList");
const chunkCount = document.querySelector("#chunkCount");

let chunks = [];

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitIntoChunks(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 35)
    .map((part, index) => ({ id: index + 1, text: part }));
}

function updateChunks(text) {
  chunks = splitIntoChunks(text);
  chunkCount.textContent = `${chunks.length} ${chunks.length === 1 ? "trecho" : "trechos"}`;
  sourcesList.innerHTML = "";
  answerText.textContent = chunks.length
    ? "Documento pronto. Faca uma pergunta para buscar trechos relevantes."
    : "O documento precisa de mais texto para gerar trechos.";
}

function termsFrom(question) {
  return question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);
}

function scoreChunk(chunk, terms) {
  const text = chunk.text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function findSources(question) {
  const terms = termsFrom(question);
  if (!terms.length) return [];

  return chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk, terms) }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function renderSources(sources) {
  if (!sources.length) {
    sourcesList.innerHTML = '<p class="status">Nenhum trecho relevante encontrado.</p>';
    return;
  }

  sourcesList.innerHTML = sources
    .map(
      (source) =>
        `<article class="source-item"><strong>Trecho ${source.id}</strong><br>${escapeHtml(source.text)}</article>`
    )
    .join("");
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF.js nao carregou. Verifique a conexao com a internet.");
  }

  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

readPdfButton.addEventListener("click", async () => {
  const file = pdfInput.files[0];
  if (!file) {
    pdfStatus.textContent = "Escolha um arquivo PDF primeiro.";
    return;
  }

  try {
    pdfStatus.textContent = "Lendo PDF...";
    const text = await extractPdfText(file);
    documentText.value = text;
    updateChunks(text);
    pdfStatus.textContent = `PDF lido: ${file.name}`;
  } catch (error) {
    pdfStatus.textContent = error.message;
  }
});

useTextButton.addEventListener("click", () => {
  updateChunks(documentText.value);
});

summaryButton.addEventListener("click", () => {
  updateChunks(documentText.value);
  const firstChunks = chunks.slice(0, 3);
  renderSources(firstChunks);
  answerText.innerHTML = firstChunks.length
    ? `Resumo simples: ${firstChunks.map((chunk) => escapeHtml(chunk.text)).join(" ")}`
    : "Nao ha trechos suficientes para resumir.";
});

questionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!chunks.length) updateChunks(documentText.value);

  const question = questionInput.value.trim();
  if (!question) return;

  const sources = findSources(question);
  renderSources(sources);

  if (!sources.length) {
    answerText.textContent =
      "Nao encontrei uma resposta forte no documento. Tente perguntar usando palavras que aparecem no texto.";
    return;
  }

  answerText.innerHTML = `Com base nos trechos encontrados, a melhor resposta e: ${escapeHtml(
    sources[0].text
  )} Esta demo mostra a fonte para o aluno conferir se a resposta faz sentido.`;
});

updateChunks(documentText.value);
