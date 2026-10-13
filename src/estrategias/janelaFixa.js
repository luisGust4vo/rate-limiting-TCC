/**
 * Estratégia: Janela Fixa (Fixed Window Counter)
 *
 * Funcionamento:
 * O tempo é dividido em janelas de duração fixa (ex.: 1000ms).
 * Cada cliente possui um contador que é zerado sempre que uma nova
 * janela começa. Enquanto o contador não ultrapassar o limite máximo
 * definido para a janela, as requisições são aceitas.
 *
 * Vantagem: implementação simples e de baixo custo computacional.
 * Desvantagem: permite picos de até 2x o limite nas bordas entre
 * duas janelas consecutivas (ex.: muitas requisições no fim de uma
 * janela seguidas de muitas requisições no início da próxima).
 */
class LimitadorJanelaFixa {
  constructor({ duracaoJanelaMs, maxRequisicoes }) {
    this.duracaoJanelaMs = duracaoJanelaMs;
    this.maxRequisicoes = maxRequisicoes;

    // Mapa: identificadorCliente -> { inicioJanela, contagem }
    this.registrosPorCliente = new Map();
  }

  permitir(identificadorCliente) {
    const agora = Date.now();
    let registro = this.registrosPorCliente.get(identificadorCliente);

    const janelaExpirou =
      !registro || agora - registro.inicioJanela >= this.duracaoJanelaMs;

    if (janelaExpirou) {
      registro = { inicioJanela: agora, contagem: 0 };
      this.registrosPorCliente.set(identificadorCliente, registro);
    }

    if (registro.contagem < this.maxRequisicoes) {
      registro.contagem += 1;
      return true;
    }

    return false;
  }
}

module.exports = LimitadorJanelaFixa;
