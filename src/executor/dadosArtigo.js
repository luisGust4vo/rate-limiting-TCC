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

const DIRETORIO_PROJETO = path.join(__dirname, "..", "..");
const DIRETORIO_RESULTADOS = path.join(DIRETORIO_PROJETO, "resultados");
const DIRETORIO_GRAFICOS = path.join(DIRETORIO_RESULTADOS, "graficos");
const CAMINHO_RESUMO = path.join(DIRETORIO_RESULTADOS, "resumo_medias.csv");

const FONT = "Calibri";
const COR_TITULO = "1F3864";

// ============================================================
// 1. LEITURA E PREPARAÇÃO DOS DADOS REAIS
// ============================================================

function lerCsv(caminho) {
  const conteudo = fs.readFileSync(caminho, "utf-8").trim();
  const [linhaCabecalho, ...linhas] = conteudo.split("\n");
  const colunas = linhaCabecalho.split(",");
  return linhas.map((linha) => {
    const valores = linha.split(",");
    const objeto = {};
    colunas.forEach((coluna, indice) => {
      const valorBruto = valores[indice];
      const valorNumerico = Number(valorBruto);
      objeto[coluna] = Number.isNaN(valorNumerico) ? valorBruto : valorNumerico;
    });
    return objeto;
  });
}

if (!fs.existsSync(CAMINHO_RESUMO)) {
  console.error(
    `Arquivo não encontrado: ${CAMINHO_RESUMO}\n` +
      `Rode "npm run experimento" e depois "npm run analisar" antes de gerar o artigo.`
  );
  process.exit(1);
}

const linhasResumo = lerCsv(CAMINHO_RESUMO);

const ESTRATEGIAS = ["janelaFixa", "janelaDeslizante", "tokenBucket", "leakyBucket"];
const NOME_ESTRATEGIA = {
  janelaFixa: "Janela Fixa",
  janelaDeslizante: "Janela Deslizante",
  tokenBucket: "Token Bucket",
  leakyBucket: "Leaky Bucket",
};
const NIVEIS = ["baixa", "noLimite", "alta", "estresse"];
const NOME_NIVEL = {
  baixa: "Baixa (20 req/s)",
  noLimite: "No limite (50 req/s)",
  alta: "Alta (100 req/s)",
  estresse: "Estresse (300 req/s)",
};

function linha(estrategia, nivel) {
  const encontrada = linhasResumo.find(
    (l) => l.estrategia === estrategia && l.nivelDeCarga === nivel
  );
  if (!encontrada) {
    throw new Error(`Dados não encontrados para ${estrategia} / ${nivel}`);
  }
  return encontrada;
}

function fmt(numero, casas = 2) {
  return Number(numero).toFixed(casas);
}

// Estatísticas derivadas, calculadas diretamente dos dados reais
// (nunca digitadas manualmente), para garantir que todo número que
// aparece no texto do artigo é rastreável ao CSV de resultados.
const ESTATISTICAS = {};
for (const nivel of NIVEIS) {
  const linhasDoNivel = ESTRATEGIAS.map((e) => linha(e, nivel));
  ESTATISTICAS[nivel] = {
    maiorThroughput: linhasDoNivel.reduce((a, b) =>
      a.throughputReqPorSegundo > b.throughputReqPorSegundo ? a : b
    ),
    menorThroughput: linhasDoNivel.reduce((a, b) =>
      a.throughputReqPorSegundo < b.throughputReqPorSegundo ? a : b
    ),
    maiorBloqueio: linhasDoNivel.reduce((a, b) =>
      a.taxaBloqueioPercentual > b.taxaBloqueioPercentual ? a : b
    ),
    menorBloqueio: linhasDoNivel.reduce((a, b) =>
      a.taxaBloqueioPercentual < b.taxaBloqueioPercentual ? a : b
    ),
    maiorCpu: linhasDoNivel.reduce((a, b) => (a.cpuMedioPercentual > b.cpuMedioPercentual ? a : b)),
    menorCpu: linhasDoNivel.reduce((a, b) => (a.cpuMedioPercentual < b.cpuMedioPercentual ? a : b)),
    maiorLatencia: linhasDoNivel.reduce((a, b) => (a.latenciaMediaMs > b.latenciaMediaMs ? a : b)),
    menorLatencia: linhasDoNivel.reduce((a, b) => (a.latenciaMediaMs < b.latenciaMediaMs ? a : b)),
  };
}

// Comparação de CPU entre Janela Deslizante e Janela Fixa em cada
// nível de carga, citada na discussão de H2. Em vez de comparar só a
// média, verifica-se também se os intervalos (média ± desvio padrão)
// se sobrepõem — se sim, a diferença não pode ser tratada como um
// efeito consistente, apenas como ruído de medição.
const comparacaoCpuFixaVsDeslizante = NIVEIS.map((nivel) => {
  const fixa = linha("janelaFixa", nivel);
  const deslizante = linha("janelaDeslizante", nivel);
  const diferencaPercentual =
    ((deslizante.cpuMedioPercentual - fixa.cpuMedioPercentual) / fixa.cpuMedioPercentual) * 100;

  // Intervalos [média - desvio, média + desvio] de cada uma
  const fixaMin = fixa.cpuMedioPercentual - fixa.cpuDesvioPadrao;
  const fixaMax = fixa.cpuMedioPercentual + fixa.cpuDesvioPadrao;
  const deslizanteMin = deslizante.cpuMedioPercentual - deslizante.cpuDesvioPadrao;
  const deslizanteMax = deslizante.cpuMedioPercentual + deslizante.cpuDesvioPadrao;
  const intervalosSobrepoem = fixaMin <= deslizanteMax && deslizanteMin <= fixaMax;

  return { nivel, fixa, deslizante, diferencaPercentual, intervalosSobrepoem };
});

const quantidadeNiveisComDeslizanteMaior = comparacaoCpuFixaVsDeslizante.filter(
  (c) => c.diferencaPercentual > 0
).length;
const quantidadeNiveisSemSobreposicao = comparacaoCpuFixaVsDeslizante.filter(
  (c) => !c.intervalosSobrepoem
).length;

console.log("Dados carregados com sucesso. Estatísticas-chave calculadas:");
console.log("  Comparação de CPU (Janela Deslizante vs. Janela Fixa) por nível de carga:");
for (const c of comparacaoCpuFixaVsDeslizante) {
  console.log(
    `    ${c.nivel}: Fixa=${fmt(c.fixa.cpuMedioPercentual)}±${fmt(c.fixa.cpuDesvioPadrao)}  ` +
      `Deslizante=${fmt(c.deslizante.cpuMedioPercentual)}±${fmt(c.deslizante.cpuDesvioPadrao)}  ` +
      `diferença=${fmt(c.diferencaPercentual, 1)}%  sobreposição=${c.intervalosSobrepoem}`
  );
}

module.exports = {
  linhasResumo,
  ESTRATEGIAS,
  NOME_ESTRATEGIA,
  NIVEIS,
  NOME_NIVEL,
  linha,
  fmt,
  ESTATISTICAS,
  comparacaoCpuFixaVsDeslizante,
  quantidadeNiveisComDeslizanteMaior,
  quantidadeNiveisSemSobreposicao,
  DIRETORIO_GRAFICOS,
  DIRETORIO_RESULTADOS,
  FONT,
  COR_TITULO,
};
