const express = require("express");
const { criarLimitador } = require("./estrategias");
const { criarMiddlewareLimitador } = require("./middleware/limitadorRequisicoes");

/**
 * Servidor alvo dos experimentos.
 *
 * Recebe a estratégia e os parâmetros via variáveis de ambiente,
 * o que permite que o executor de experimentos suba uma instância
 * nova e isolada (processo filho) para cada combinação
 * estratégia x nível de carga, garantindo que os testes não
 * interfiram uns nos outros.
 *
 * Variáveis de ambiente esperadas:
 *   PORTA       - porta em que o servidor vai escutar (padrão 3000)
 *   ESTRATEGIA  - nome da estratégia: janelaFixa | janelaDeslizante | tokenBucket | leakyBucket
 *   PARAMETROS  - JSON string com os parâmetros da estratégia
 */

const porta = process.env.PORTA || 3000;
const nomeEstrategia = process.env.ESTRATEGIA || "tokenBucket";
const parametros = JSON.parse(
  process.env.PARAMETROS ||
    JSON.stringify({ capacidade: 50, taxaRecargaPorSegundo: 50 })
);

const limitador = criarLimitador(nomeEstrategia, parametros);

// Contadores globais de requisições, usados para calcular a taxa de
// bloqueio ao final de cada experimento.
const contadores = { aceitas: 0, bloqueadas: 0 };

const app = express();

// Endpoint "protegido": representa a API/recurso que queremos
// controlar. Não faz nada de útil de propósito — o objetivo é medir
// o comportamento do limitador, não da lógica de negócio.
app.get(
  "/api/recurso",
  criarMiddlewareLimitador(limitador, contadores),
  (req, res) => {
    res.status(200).json({ mensagem: "Requisição processada com sucesso." });
  }
);

// Endpoint de verificação de saúde, usado pelo executor de
// experimentos para saber quando o servidor terminou de subir.
app.get("/saude", (req, res) => {
  res.status(200).send("ok");
});

// Endpoint de métricas: expõe os contadores acumulados desde o
// último reinício (ou desde que o servidor subiu).
app.get("/metricas", (req, res) => {
  res.status(200).json({ ...contadores });
});

// Permite zerar os contadores sem precisar reiniciar o processo
// (útil em testes manuais/rápidos).
app.post("/reiniciarMetricas", (req, res) => {
  contadores.aceitas = 0;
  contadores.bloqueadas = 0;
  res.status(200).json({ ok: true });
});

app.listen(porta, () => {
  // Esta linha é usada pelo executor de experimentos apenas como
  // registro em log — a detecção de "pronto" é feita via /saude.
  console.log(
    `SERVIDOR_PRONTO porta=${porta} estrategia=${nomeEstrategia} parametros=${JSON.stringify(
      parametros
    )}`
  );
});
