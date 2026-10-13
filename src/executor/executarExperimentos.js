const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const autocannon = require("autocannon");

const configuracao = require("../../config/configuracao.json");
const { aguardarServidorPronto } = require("./aguardarServidor");
const { iniciarMonitoramento, calcularMedia } = require("./monitorRecursos");

const CAMINHO_SERVIDOR = path.join(__dirname, "..", "servidor.js");

/**
 * Busca as métricas de aceitas/bloqueadas expostas pelo servidor.
 */
function buscarMetricas(porta) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:${porta}/metricas`, (resposta) => {
        let dados = "";
        resposta.on("data", (pedaco) => (dados += pedaco));
        resposta.on("end", () => {
          try {
            resolve(JSON.parse(dados));
          } catch (erro) {
            reject(erro);
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Sobe um servidor isolado (processo filho) com a estratégia e
 * parâmetros indicados, aplica um teste de carga com autocannon,
 * monitora CPU/memória durante o teste, coleta as métricas do
 * servidor e finaliza o processo filho.
 */
async function executarUmaRodada({ nomeEstrategia, parametrosEstrategia, nivelDeCarga, porta, repeticao }) {
  const processoFilho = spawn("node", [CAMINHO_SERVIDOR], {
    env: {
      ...process.env,
      PORTA: String(porta),
      ESTRATEGIA: nomeEstrategia,
      PARAMETROS: JSON.stringify(parametrosEstrategia),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  processoFilho.stderr.on("data", (dado) => {
    console.error(`  [erro do servidor] ${dado.toString().trim()}`);
  });

  try {
    await aguardarServidorPronto(porta);

    const monitor = iniciarMonitoramento(processoFilho.pid);

    const resultadoCarga = await autocannon({
      url: `http://localhost:${porta}/api/recurso`,
      connections: nivelDeCarga.conexoes,
      duration: nivelDeCarga.duracaoSegundos,
      pipelining: nivelDeCarga.pipelining || 1,
      // overallRate faz o autocannon enviar exatamente essa taxa de
      // requisições/segundo (e não o máximo que a máquina aguentar),
      // permitindo comparar a carga enviada com o limite configurado
      // em cada estratégia de forma controlada e reproduzível.
      overallRate: nivelDeCarga.taxaRequisicoesPorSegundo,
    });

    const amostrasRecursos = monitor.parar();
    const metricas = await buscarMetricas(porta);

    const totalRequisicoes = metricas.aceitas + metricas.bloqueadas;
    const taxaBloqueio =
      totalRequisicoes > 0 ? (metricas.bloqueadas / totalRequisicoes) * 100 : 0;

    return {
      estrategia: nomeEstrategia,
      nivelDeCarga: nivelDeCarga.nome,
      conexoes: nivelDeCarga.conexoes,
      duracaoSegundos: nivelDeCarga.duracaoSegundos,
      repeticao,
      latenciaMediaMs: Number(resultadoCarga.latency.average.toFixed(2)),
      latenciaP50Ms: Number(resultadoCarga.latency.p50.toFixed(2)),
      latenciaP99Ms: Number(resultadoCarga.latency.p99.toFixed(2)),
      throughputReqPorSegundo: Number(resultadoCarga.requests.average.toFixed(2)),
      totalRequisicoesEnviadas: resultadoCarga.requests.total,
      requisicoesAceitas: metricas.aceitas,
      requisicoesBloqueadas: metricas.bloqueadas,
      taxaBloqueioPercentual: Number(taxaBloqueio.toFixed(2)),
      cpuMedioPercentual: Number(
        calcularMedia(amostrasRecursos.map((a) => a.cpu)).toFixed(2)
      ),
      memoriaMediaMb: Number(
        calcularMedia(amostrasRecursos.map((a) => a.memoriaMb)).toFixed(2)
      ),
      errosConexao: resultadoCarga.errors,
      timeouts: resultadoCarga.timeouts,
    };
  } finally {
    processoFilho.kill();
  }
}

function gerarCabecalhoCsv(colunas) {
  return colunas.join(",") + "\n";
}

function linhaParaCsv(objeto, colunas) {
  return colunas.map((coluna) => objeto[coluna]).join(",") + "\n";
}

async function executarTodosOsExperimentos() {
  const colunas = [
    "estrategia",
    "nivelDeCarga",
    "conexoes",
    "duracaoSegundos",
    "repeticao",
    "latenciaMediaMs",
    "latenciaP50Ms",
    "latenciaP99Ms",
    "throughputReqPorSegundo",
    "totalRequisicoesEnviadas",
    "requisicoesAceitas",
    "requisicoesBloqueadas",
    "taxaBloqueioPercentual",
    "cpuMedioPercentual",
    "memoriaMediaMb",
    "errosConexao",
    "timeouts",
  ];

  const diretorioResultados = path.join(__dirname, "..", "..", configuracao.diretorioResultados);
  if (!fs.existsSync(diretorioResultados)) {
    fs.mkdirSync(diretorioResultados, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const caminhoCsv = path.join(diretorioResultados, `resultados_${timestamp}.csv`);
  fs.writeFileSync(caminhoCsv, gerarCabecalhoCsv(colunas));

  const porta = configuracao.porta;
  const totalExperimentos =
    configuracao.estrategias.length *
    configuracao.niveisDeCarga.length *
    configuracao.repeticoes;
  let experimentoAtual = 0;

  console.log(`Iniciando ${totalExperimentos} rodadas de experimento...`);
  console.log(`Resultados serão salvos em: ${caminhoCsv}\n`);

  for (const nomeEstrategia of configuracao.estrategias) {
    const parametrosEstrategia = configuracao.parametrosEstrategias[nomeEstrategia];

    for (const nivelDeCarga of configuracao.niveisDeCarga) {
      for (let repeticao = 1; repeticao <= configuracao.repeticoes; repeticao++) {
        experimentoAtual += 1;

        console.log(
          `[${experimentoAtual}/${totalExperimentos}] estrategia=${nomeEstrategia} ` +
            `carga=${nivelDeCarga.nome} (${nivelDeCarga.conexoes} conexões) repeticao=${repeticao}`
        );

        const resultado = await executarUmaRodada({
          nomeEstrategia,
          parametrosEstrategia,
          nivelDeCarga,
          porta,
          repeticao,
        });

        fs.appendFileSync(caminhoCsv, linhaParaCsv(resultado, colunas));

        console.log(
          `   -> throughput=${resultado.throughputReqPorSegundo} req/s | ` +
            `latencia_media=${resultado.latenciaMediaMs}ms | ` +
            `bloqueio=${resultado.taxaBloqueioPercentual}% | ` +
            `cpu=${resultado.cpuMedioPercentual}% | mem=${resultado.memoriaMediaMb}MB`
        );

        // Pequena pausa entre rodadas para o sistema operacional
        // liberar a porta e estabilizar antes do próximo teste.
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  console.log(`\nTodos os experimentos foram concluídos.`);
  console.log(`Arquivo de resultados: ${caminhoCsv}`);

  return caminhoCsv;
}

if (require.main === module) {
  executarTodosOsExperimentos().catch((erro) => {
    console.error("Falha ao executar os experimentos:", erro);
    process.exit(1);
  });
}

module.exports = { executarTodosOsExperimentos };
