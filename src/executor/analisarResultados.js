const fs = require("fs");
const path = require("path");

const configuracao = require("../../config/configuracao.json");

/**
 * Lê um CSV simples (sem vírgulas dentro de campos) e retorna um
 * array de objetos, convertendo campos numéricos automaticamente.
 */
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

function encontrarCsvMaisRecente(diretorioResultados) {
  const arquivos = fs
    .readdirSync(diretorioResultados)
    .filter((nome) => nome.startsWith("resultados_") && nome.endsWith(".csv"))
    .map((nome) => ({
      nome,
      caminhoCompleto: path.join(diretorioResultados, nome),
      mtime: fs.statSync(path.join(diretorioResultados, nome)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (arquivos.length === 0) {
    throw new Error(
      `Nenhum arquivo de resultados encontrado em ${diretorioResultados}. ` +
        `Rode "npm run experimento" primeiro.`
    );
  }

  return arquivos[0].caminhoCompleto;
}

function calcularMedia(valores) {
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

/**
 * Desvio padrão amostral (n-1 no denominador), apropriado quando as
 * repetições são uma amostra do comportamento do sistema, e não a
 * população inteira de execuções possíveis.
 */
function calcularDesvioPadrao(valores) {
  if (valores.length < 2) return 0;
  const media = calcularMedia(valores);
  const somaQuadrados = valores.reduce(
    (soma, valor) => soma + (valor - media) ** 2,
    0
  );
  return Math.sqrt(somaQuadrados / (valores.length - 1));
}

function agruparPorEstrategiaECarga(linhas) {
  const grupos = new Map();

  for (const linha of linhas) {
    const chave = `${linha.estrategia}|${linha.nivelDeCarga}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(linha);
  }

  const resumo = [];
  for (const [, linhasDoGrupo] of grupos) {
    const primeira = linhasDoGrupo[0];
    resumo.push({
      estrategia: primeira.estrategia,
      nivelDeCarga: primeira.nivelDeCarga,
      conexoes: primeira.conexoes,
      repeticoes: linhasDoGrupo.length,
      latenciaMediaMs: Number(
        calcularMedia(linhasDoGrupo.map((l) => l.latenciaMediaMs)).toFixed(2)
      ),
      latenciaMediaDesvioPadrao: Number(
        calcularDesvioPadrao(linhasDoGrupo.map((l) => l.latenciaMediaMs)).toFixed(2)
      ),
      latenciaP99Ms: Number(
        calcularMedia(linhasDoGrupo.map((l) => l.latenciaP99Ms)).toFixed(2)
      ),
      throughputReqPorSegundo: Number(
        calcularMedia(linhasDoGrupo.map((l) => l.throughputReqPorSegundo)).toFixed(2)
      ),
      throughputDesvioPadrao: Number(
        calcularDesvioPadrao(linhasDoGrupo.map((l) => l.throughputReqPorSegundo)).toFixed(2)
      ),
      taxaBloqueioPercentual: Number(
        calcularMedia(linhasDoGrupo.map((l) => l.taxaBloqueioPercentual)).toFixed(2)
      ),
      taxaBloqueioDesvioPadrao: Number(
        calcularDesvioPadrao(linhasDoGrupo.map((l) => l.taxaBloqueioPercentual)).toFixed(2)
      ),
      cpuMedioPercentual: Number(
        calcularMedia(linhasDoGrupo.map((l) => l.cpuMedioPercentual)).toFixed(2)
      ),
      cpuDesvioPadrao: Number(
        calcularDesvioPadrao(linhasDoGrupo.map((l) => l.cpuMedioPercentual)).toFixed(2)
      ),
      memoriaMediaMb: Number(
        calcularMedia(linhasDoGrupo.map((l) => l.memoriaMediaMb)).toFixed(2)
      ),
    });
  }

  // Ordena por estratégia e depois pela ordem dos níveis de carga na config
  const ordemNiveis = configuracao.niveisDeCarga.map((n) => n.nome);
  resumo.sort((a, b) => {
    if (a.estrategia !== b.estrategia) return a.estrategia.localeCompare(b.estrategia);
    return ordemNiveis.indexOf(a.nivelDeCarga) - ordemNiveis.indexOf(b.nivelDeCarga);
  });

  return resumo;
}

function imprimirTabela(resumo) {
  const colunas = [
    "estrategia",
    "nivelDeCarga",
    "conexoes",
    "latenciaMediaMs",
    "latenciaP99Ms",
    "throughputReqPorSegundo",
    "taxaBloqueioPercentual",
    "cpuMedioPercentual",
    "memoriaMediaMb",
  ];

  const larguras = colunas.map((coluna) =>
    Math.max(coluna.length, ...resumo.map((linha) => String(linha[coluna]).length))
  );

  const formatarLinha = (valores) =>
    valores.map((valor, i) => String(valor).padEnd(larguras[i])).join(" | ");

  console.log(formatarLinha(colunas));
  console.log(larguras.map((l) => "-".repeat(l)).join("-|-"));
  for (const linha of resumo) {
    console.log(formatarLinha(colunas.map((coluna) => linha[coluna])));
  }
}

function salvarResumoCsv(resumo, diretorioResultados) {
  const colunas = Object.keys(resumo[0]);
  const cabecalho = colunas.join(",") + "\n";
  const linhas = resumo.map((linha) => colunas.map((c) => linha[c]).join(",")).join("\n");

  const caminhoResumo = path.join(diretorioResultados, "resumo_medias.csv");
  fs.writeFileSync(caminhoResumo, cabecalho + linhas + "\n");
  return caminhoResumo;
}

function principal() {
  const diretorioResultados = path.join(__dirname, "..", "..", configuracao.diretorioResultados);
  const caminhoCsv = encontrarCsvMaisRecente(diretorioResultados);

  console.log(`Analisando: ${caminhoCsv}\n`);

  const linhas = lerCsv(caminhoCsv);
  const resumo = agruparPorEstrategiaECarga(linhas);

  imprimirTabela(resumo);

  const caminhoResumo = salvarResumoCsv(resumo, diretorioResultados);
  console.log(`\nResumo (médias por estratégia x nível de carga) salvo em:\n${caminhoResumo}`);
  console.log(
    `\nEsse é o arquivo indicado para gerar os gráficos comparativos do capítulo de resultados do TCC.`
  );
}

if (require.main === module) {
  principal();
}

module.exports = { agruparPorEstrategiaECarga, lerCsv };
