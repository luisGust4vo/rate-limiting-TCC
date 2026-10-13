const LimitadorJanelaFixa = require("./janelaFixa");
const LimitadorJanelaDeslizante = require("./janelaDeslizante");
const LimitadorTokenBucket = require("./tokenBucket");
const LimitadorLeakyBucket = require("./leakyBucket");

/**
 * Fábrica de estratégias de Rate Limiting.
 *
 * Todas as estratégias implementam a mesma interface:
 *   permitir(identificadorCliente) -> boolean
 *
 * Isso permite trocar a estratégia usada pelo servidor apenas
 * mudando um parâmetro de configuração, sem alterar nenhuma outra
 * parte do sistema (princípio de baixo acoplamento / Strategy Pattern).
 */
function criarLimitador(nomeEstrategia, parametros) {
  switch (nomeEstrategia) {
    case "janelaFixa":
      return new LimitadorJanelaFixa(parametros);
    case "janelaDeslizante":
      return new LimitadorJanelaDeslizante(parametros);
    case "tokenBucket":
      return new LimitadorTokenBucket(parametros);
    case "leakyBucket":
      return new LimitadorLeakyBucket(parametros);
    default:
      throw new Error(
        `Estratégia de Rate Limiting desconhecida: "${nomeEstrategia}". ` +
          `Use uma das opções: janelaFixa, janelaDeslizante, tokenBucket, leakyBucket.`
      );
  }
}

module.exports = { criarLimitador };
