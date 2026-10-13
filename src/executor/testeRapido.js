const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const { aguardarServidorPronto } = require("./aguardarServidor");

/**
 * Demonstração rápida e visual: sobe um servidor com Token Bucket
 * (capacidade 5, recarga de 1 ficha/segundo) e dispara 10
 * requisições em sequência imediata, mostrando quais são aceitas e
 * quais são bloqueadas. Bom para mostrar ao vivo na apresentação do TCC.
 *
 * Uso: npm run teste-rapido
 */
async function principal() {
  const porta = 3999;
  const caminhoServidor = path.join(__dirname, "..", "servidor.js");

  console.log("Subindo servidor de demonstração (Token Bucket, capacidade=5, recarga=1/s)...\n");

  const processoFilho = spawn("node", [caminhoServidor], {
    env: {
      ...process.env,
      PORTA: String(porta),
      ESTRATEGIA: "tokenBucket",
      PARAMETROS: JSON.stringify({ capacidade: 5, taxaRecargaPorSegundo: 1 }),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await aguardarServidorPronto(porta);

  const fazerRequisicao = (indice) =>
    new Promise((resolve) => {
      http.get(`http://localhost:${porta}/api/recurso`, (resposta) => {
        const status = resposta.statusCode === 200 ? "ACEITA " : "BLOQUEADA";
        console.log(`Requisição ${indice + 1}/10 -> ${resposta.statusCode} (${status})`);
        resposta.resume();
        resolve();
      });
    });

  for (let i = 0; i < 10; i++) {
    await fazerRequisicao(i);
  }

  console.log(
    "\nComo o balde tem capacidade 5, as 5 primeiras requisições (disparadas quase" +
      "\ninstantaneamente) foram aceitas e as 5 seguintes foram bloqueadas, pois" +
      "\nnão houve tempo hábil para recarregar fichas (taxa de 1 ficha/segundo)."
  );

  processoFilho.kill();
}

principal().catch((erro) => {
  console.error("Erro no teste rápido:", erro);
  process.exit(1);
});
