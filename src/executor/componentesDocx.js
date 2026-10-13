const fs = require("fs");
const path = require("path");

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  LevelFormat,
  ImageRun,
  PageBreak,
  VerticalAlign,
} = require("docx");

const D = require("./dadosArtigo");
const { ESTRATEGIAS, NOME_ESTRATEGIA, NIVEIS, NOME_NIVEL, linha, fmt, ESTATISTICAS, overheadDeslizanteVsFixaPercentual } = D;

const FONT = "Calibri";
const COR_TITULO = "1F3864";
const COR_TEXTO_CLARO = "FFFFFF";

// ============================================================
// HELPERS DE FORMATAÇÃO
// ============================================================

function titulo(texto, nivel = HeadingLevel.HEADING_1, tamanho = 26) {
  return new Paragraph({
    heading: nivel,
    spacing: { before: 320, after: 180 },
    children: [new TextRun({ text: texto, bold: true, font: FONT, size: tamanho, color: COR_TITULO })],
  });
}

function subtitulo(texto) {
  return titulo(texto, HeadingLevel.HEADING_2, 23);
}

function subsubtitulo(texto) {
  return titulo(texto, HeadingLevel.HEADING_3, 21);
}

function p(texto, opts = {}) {
  return new Paragraph({
    spacing: { after: 180, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: opts.semRecuo ? 0 : 400 },
    children: Array.isArray(texto)
      ? texto
      : [new TextRun({ text: texto, font: FONT, size: 22, italics: !!opts.italico })],
  });
}

// Parágrafo com múltiplos trechos (mistura de negrito/itálico/normal)
function pRich(partes, opts = {}) {
  return new Paragraph({
    spacing: { after: 180, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: opts.semRecuo ? 0 : 400 },
    children: partes.map(
      (parte) =>
        new TextRun({
          text: parte.texto,
          bold: !!parte.negrito,
          italics: !!parte.italico,
          font: FONT,
          size: 22,
        })
    ),
  });
}

function bullet(texto) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 120, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text: texto, font: FONT, size: 22 })],
  });
}

function legenda(texto) {
  return new Paragraph({
    spacing: { before: 80, after: 260 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: texto, font: FONT, size: 19, italics: true })],
  });
}

function referencia(texto) {
  return new Paragraph({
    spacing: { after: 160, line: 264 },
    indent: { left: 400, hanging: 400 },
    children: [new TextRun({ text: texto, font: FONT, size: 20 })],
  });
}

// ============================================================
// HELPER DE TABELA
// ============================================================

function celula(texto, { cabecalho = false, largura, alinhamento = AlignmentType.CENTER } = {}) {
  return new TableCell({
    width: { size: largura, type: WidthType.DXA },
    shading: cabecalho ? { type: ShadingType.CLEAR, fill: COR_TITULO } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: alinhamento,
        children: [
          new TextRun({
            text: String(texto),
            bold: cabecalho,
            color: cabecalho ? COR_TEXTO_CLARO : "000000",
            font: FONT,
            size: 19,
          }),
        ],
      }),
    ],
  });
}

function tabela(cabecalhos, linhasDados, larguras) {
  const linhaCabecalho = new TableRow({
    tableHeader: true,
    children: cabecalhos.map((c, i) => celula(c, { cabecalho: true, largura: larguras[i] })),
  });

  const linhasCorpo = linhasDados.map(
    (linhaDados) =>
      new TableRow({
        children: linhaDados.map((valor, i) => celula(valor, { largura: larguras[i] })),
      })
  );

  return new Table({
    columnWidths: larguras,
    width: { size: larguras.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    rows: [linhaCabecalho, ...linhasCorpo],
  });
}

function imagem(caminhoArquivo, largura, altura) {
  const dados = fs.readFileSync(caminhoArquivo);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 60 },
    children: [
      new ImageRun({
        data: dados,
        transformation: { width: largura, height: altura },
        type: "png",
      }),
    ],
  });
}

module.exports = {
  titulo,
  subtitulo,
  subsubtitulo,
  p,
  pRich,
  bullet,
  legenda,
  referencia,
  tabela,
  imagem,
  FONT,
  COR_TITULO,
};
