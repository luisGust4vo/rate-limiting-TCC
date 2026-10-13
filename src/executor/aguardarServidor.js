const http = require("http");

/**
 * Faz polling no endpoint /saude até o servidor responder 200,
 * ou desiste após certo número de tentativas.
 */
function aguardarServidorPronto(porta, tentativasMaximas = 50, intervaloMs = 100) {
  return new Promise((resolve, reject) => {
    let tentativas = 0;

    function tentar() {
      tentativas += 1;

      const requisicao = http.get(`http://localhost:${porta}/saude`, (resposta) => {
        if (resposta.statusCode === 200) {
          resposta.resume(); // descarta o corpo da resposta
          resolve();
        } else {
          proximaTentativa();
        }
      });

      requisicao.on("error", proximaTentativa);
    }

    function proximaTentativa() {
      if (tentativas >= tentativasMaximas) {
        reject(new Error("O servidor não respondeu a tempo em /saude."));
        return;
      }
      setTimeout(tentar, intervaloMs);
    }

    tentar();
  });
}

module.exports = { aguardarServidorPronto };
