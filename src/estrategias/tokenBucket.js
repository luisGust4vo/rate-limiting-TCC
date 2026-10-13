/**
 * Estratégia: Balde de Fichas (Token Bucket)
 *
 * Funcionamento:
 * Cada cliente possui um "balde" com capacidade máxima de fichas
 * (tokens). O balde é recarregado continuamente a uma taxa fixa
 * (fichas por segundo). Cada requisição consome uma ficha; se não
 * houver fichas disponíveis, a requisição é bloqueada.
 *
 * Vantagem: permite rajadas (bursts) de requisições até o limite da
 * capacidade do balde, ao mesmo tempo em que impõe uma taxa média
 * sustentada de longo prazo — comportamento próximo do que serviços
 * reais de API costumam expor (ex.: limite "X requisições por
 * segundo, com rajadas de até Y").
 * Desvantagem: mais parâmetros para calibrar (capacidade e taxa de
 * recarga) e leve overhead pelo cálculo de recarga a cada chamada.
 */
class LimitadorTokenBucket {
  constructor({ capacidade, taxaRecargaPorSegundo }) {
    this.capacidade = capacidade;
    this.taxaRecargaPorSegundo = taxaRecargaPorSegundo;

    // Mapa: identificadorCliente -> { fichasDisponiveis, ultimaAtualizacao }
    this.baldesPorCliente = new Map();
  }

  permitir(identificadorCliente) {
    const agora = Date.now();
    let balde = this.baldesPorCliente.get(identificadorCliente);

    if (!balde) {
      balde = { fichasDisponiveis: this.capacidade, ultimaAtualizacao: agora };
      this.baldesPorCliente.set(identificadorCliente, balde);
    }

    const segundosDecorridos = (agora - balde.ultimaAtualizacao) / 1000;
    const fichasRecarregadas = segundosDecorridos * this.taxaRecargaPorSegundo;

    balde.fichasDisponiveis = Math.min(
      this.capacidade,
      balde.fichasDisponiveis + fichasRecarregadas
    );
    balde.ultimaAtualizacao = agora;

    if (balde.fichasDisponiveis >= 1) {
      balde.fichasDisponiveis -= 1;
      return true;
    }

    return false;
  }
}

module.exports = LimitadorTokenBucket;
