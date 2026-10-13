/**
 * Estratégia: Balde Furado (Leaky Bucket)
 *
 * Funcionamento:
 * Cada cliente possui um "balde" que representa a fila de
 * requisições pendentes. Cada requisição adiciona volume ao balde;
 * o balde "vaza" (libera volume) continuamente a uma taxa fixa,
 * simulando o processamento das requisições a um ritmo constante.
 * Se uma nova requisição faria o balde transbordar (ultrapassar a
 * capacidade), ela é rejeitada.
 *
 * Diferença conceitual em relação ao Token Bucket:
 * o Token Bucket controla quantas requisições PODEM ENTRAR (rajadas
 * permitidas), enquanto o Leaky Bucket controla a taxa com que as
 * requisições SAEM/são processadas, suavizando rajadas em um fluxo
 * de saída constante.
 *
 * Vantagem: garante uma taxa de processamento estável e previsível,
 * suavizando picos de tráfego (traffic shaping).
 * Desvantagem: não acomoda rajadas — mesmo com capacidade ociosa
 * recente, o sistema não "poupa" capacidade para picos futuros.
 */
class LimitadorLeakyBucket {
  constructor({ capacidade, taxaVazamentoPorSegundo }) {
    this.capacidade = capacidade;
    this.taxaVazamentoPorSegundo = taxaVazamentoPorSegundo;

    // Mapa: identificadorCliente -> { nivelAtual, ultimaAtualizacao }
    this.baldesPorCliente = new Map();
  }

  permitir(identificadorCliente) {
    const agora = Date.now();
    let balde = this.baldesPorCliente.get(identificadorCliente);

    if (!balde) {
      balde = { nivelAtual: 0, ultimaAtualizacao: agora };
      this.baldesPorCliente.set(identificadorCliente, balde);
    }

    const segundosDecorridos = (agora - balde.ultimaAtualizacao) / 1000;
    const volumeVazado = segundosDecorridos * this.taxaVazamentoPorSegundo;

    balde.nivelAtual = Math.max(0, balde.nivelAtual - volumeVazado);
    balde.ultimaAtualizacao = agora;

    if (balde.nivelAtual + 1 <= this.capacidade) {
      balde.nivelAtual += 1;
      return true;
    }

    return false;
  }
}

module.exports = LimitadorLeakyBucket;
