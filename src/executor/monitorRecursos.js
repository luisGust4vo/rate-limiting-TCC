const pidusage = require("pidusage");

/**
 * Amostra o uso de CPU (%) e memória (MB) de um processo em
 * intervalos regulares, enquanto o teste de carga está em execução.
 *
 * @param {number} pid - id do processo do servidor (processo filho)
 * @param {number} intervaloMs - intervalo entre amostras
 * @returns {{ parar: () => Array<{cpu:number, memoriaMb:number}> }}
 */
function iniciarMonitoramento(pid, intervaloMs = 200) {
  const amostras = [];

  const intervalo = setInterval(async () => {
    try {
      const estatisticas = await pidusage(pid);
      amostras.push({
        cpu: estatisticas.cpu, // percentual de uso de CPU (pode passar de 100% em multi-core)
        memoriaMb: estatisticas.memory / (1024 * 1024),
      });
    } catch (erro) {
      // O processo pode já ter encerrado entre uma amostra e outra;
      // nesse caso simplesmente ignoramos a amostra.
    }
  }, intervaloMs);

  return {
    parar() {
      clearInterval(intervalo);
      return amostras;
    },
  };
}

function calcularMedia(valores) {
  if (valores.length === 0) return 0;
  const soma = valores.reduce((acumulado, valor) => acumulado + valor, 0);
  return soma / valores.length;
}

module.exports = { iniciarMonitoramento, calcularMedia };
