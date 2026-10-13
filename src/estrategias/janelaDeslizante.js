/**
 * Estratégia: Janela Deslizante (Sliding Window Counter)
 *
 * Funcionamento:
 * Combina o contador da janela atual com uma fração ponderada do
 * contador da janela anterior, com base em quanto tempo já passou
 * dentro da janela atual. Isso suaviza o problema de picos nas
 * bordas que existe na Janela Fixa, sem o custo de memória de
 * guardar o timestamp de cada requisição individual (como faria
 * uma sliding window log "pura").
 *
 * Fórmula da estimativa de requisições na janela deslizante:
 *   estimativa = contagemAnterior * fracaoRestanteDaJanelaAnterior
 *              + contagemAtual
 *
 * Vantagem: distribuição mais suave do limite ao longo do tempo.
 * Desvantagem: maior complexidade e custo computacional em relação
 * à Janela Fixa (mais cálculos por requisição).
 */
class LimitadorJanelaDeslizante {
  constructor({ duracaoJanelaMs, maxRequisicoes }) {
    this.duracaoJanelaMs = duracaoJanelaMs;
    this.maxRequisicoes = maxRequisicoes;

    // Mapa: identificadorCliente -> { inicioJanelaAtual, contagemAtual, contagemAnterior }
    this.registrosPorCliente = new Map();
  }

  permitir(identificadorCliente) {
    const agora = Date.now();
    let registro = this.registrosPorCliente.get(identificadorCliente);

    if (!registro) {
      registro = {
        inicioJanelaAtual: agora,
        contagemAtual: 0,
        contagemAnterior: 0,
      };
      this.registrosPorCliente.set(identificadorCliente, registro);
    }

    const tempoDecorrido = agora - registro.inicioJanelaAtual;

    if (tempoDecorrido >= this.duracaoJanelaMs) {
      const janelasCompletasPassadas = Math.floor(
        tempoDecorrido / this.duracaoJanelaMs
      );

      // Se passou exatamente uma janela, a contagem atual vira a "anterior".
      // Se passou mais de uma janela (período ocioso longo), não há
      // continuidade e a contagem anterior é zerada.
      registro.contagemAnterior =
        janelasCompletasPassadas === 1 ? registro.contagemAtual : 0;

      registro.contagemAtual = 0;
      registro.inicioJanelaAtual +=
        janelasCompletasPassadas * this.duracaoJanelaMs;
    }

    const tempoDentroJanelaAtual = agora - registro.inicioJanelaAtual;
    const fracaoRestanteAnterior = Math.max(
      0,
      1 - tempoDentroJanelaAtual / this.duracaoJanelaMs
    );

    const estimativaRequisicoes =
      registro.contagemAnterior * fracaoRestanteAnterior +
      registro.contagemAtual;

    if (estimativaRequisicoes < this.maxRequisicoes) {
      registro.contagemAtual += 1;
      return true;
    }

    return false;
  }
}

module.exports = LimitadorJanelaDeslizante;
