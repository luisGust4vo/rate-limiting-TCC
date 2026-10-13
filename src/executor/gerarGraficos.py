"""
Gera os gráficos comparativos do capítulo de Resultados do TCC a partir
do arquivo resultados/resumo_medias.csv (saída de analisarResultados.js).

Uso:
    python3 src/executor/gerarGraficos.py

Gera, dentro de resultados/graficos/:
    01_throughput_por_carga.png
    02_taxa_bloqueio_por_carga.png
    03_latencia_media_por_carga.png
    04_cpu_medio_por_carga.png
    05_memoria_media_por_carga.png
"""

import csv
import os
from collections import defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

DIRETORIO_BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CAMINHO_CSV = os.path.join(DIRETORIO_BASE, "resultados", "resumo_medias.csv")
DIRETORIO_GRAFICOS = os.path.join(DIRETORIO_BASE, "resultados", "graficos")

# Ordem e rótulos amigáveis para o eixo X (níveis de carga)
ORDEM_NIVEIS = ["baixa", "noLimite", "alta", "estresse"]
ROTULOS_NIVEIS = {
    "baixa": "Baixa\n(20 req/s)",
    "noLimite": "No limite\n(50 req/s)",
    "alta": "Alta\n(100 req/s)",
    "estresse": "Estresse\n(300 req/s)",
}

# Ordem e rótulos amigáveis para as estratégias
ORDEM_ESTRATEGIAS = ["janelaFixa", "janelaDeslizante", "tokenBucket", "leakyBucket"]
ROTULOS_ESTRATEGIAS = {
    "janelaFixa": "Janela Fixa",
    "janelaDeslizante": "Janela Deslizante",
    "tokenBucket": "Token Bucket",
    "leakyBucket": "Leaky Bucket",
}

CORES = {
    "janelaFixa": "#4C72B0",
    "janelaDeslizante": "#DD8452",
    "tokenBucket": "#55A868",
    "leakyBucket": "#C44E52",
}


def carregar_dados():
    dados = defaultdict(dict)
    with open(CAMINHO_CSV, newline="", encoding="utf-8") as arquivo:
        leitor = csv.DictReader(arquivo)
        for linha in leitor:
            estrategia = linha["estrategia"]
            nivel = linha["nivelDeCarga"]
            dados[estrategia][nivel] = linha
    return dados


def grafico_barras_agrupadas(dados, campo, campo_erro, titulo, rotulo_y, nome_arquivo, formato_percentual=False):
    fig, eixo = plt.subplots(figsize=(9, 5.5))

    largura_barra = 0.19
    posicoes_x = range(len(ORDEM_NIVEIS))

    for indice, estrategia in enumerate(ORDEM_ESTRATEGIAS):
        valores = []
        erros = []
        for nivel in ORDEM_NIVEIS:
            linha = dados.get(estrategia, {}).get(nivel)
            valores.append(float(linha[campo]) if linha else 0)
            erros.append(float(linha[campo_erro]) if linha and campo_erro in linha else 0)

        deslocamento = (indice - 1.5) * largura_barra
        posicoes = [p + deslocamento for p in posicoes_x]

        eixo.bar(
            posicoes,
            valores,
            largura_barra,
            yerr=erros,
            capsize=3,
            label=ROTULOS_ESTRATEGIAS[estrategia],
            color=CORES[estrategia],
        )

    eixo.set_xticks(list(posicoes_x))
    eixo.set_xticklabels([ROTULOS_NIVEIS[n] for n in ORDEM_NIVEIS])
    eixo.set_ylabel(rotulo_y)
    eixo.set_title(titulo)
    eixo.legend(loc="upper left", fontsize=9)
    eixo.grid(axis="y", linestyle="--", alpha=0.4)

    if formato_percentual:
        eixo.set_ylim(bottom=0)

    fig.tight_layout()
    caminho_saida = os.path.join(DIRETORIO_GRAFICOS, nome_arquivo)
    fig.savefig(caminho_saida, dpi=150)
    plt.close(fig)
    print(f"Gerado: {caminho_saida}")


def main():
    os.makedirs(DIRETORIO_GRAFICOS, exist_ok=True)
    dados = carregar_dados()

    grafico_barras_agrupadas(
        dados,
        campo="throughputReqPorSegundo",
        campo_erro="throughputDesvioPadrao",
        titulo="Throughput médio por estratégia e nível de carga",
        rotulo_y="Requisições processadas por segundo",
        nome_arquivo="01_throughput_por_carga.png",
    )

    grafico_barras_agrupadas(
        dados,
        campo="taxaBloqueioPercentual",
        campo_erro="taxaBloqueioDesvioPadrao",
        titulo="Taxa de bloqueio média por estratégia e nível de carga",
        rotulo_y="Requisições bloqueadas (%)",
        nome_arquivo="02_taxa_bloqueio_por_carga.png",
        formato_percentual=True,
    )

    grafico_barras_agrupadas(
        dados,
        campo="latenciaMediaMs",
        campo_erro="latenciaMediaDesvioPadrao",
        titulo="Latência média por estratégia e nível de carga",
        rotulo_y="Latência (ms)",
        nome_arquivo="03_latencia_media_por_carga.png",
    )

    grafico_barras_agrupadas(
        dados,
        campo="cpuMedioPercentual",
        campo_erro="cpuDesvioPadrao",
        titulo="Uso médio de CPU por estratégia e nível de carga",
        rotulo_y="CPU (%)",
        nome_arquivo="04_cpu_medio_por_carga.png",
    )

    grafico_barras_agrupadas(
        dados,
        campo="memoriaMediaMb",
        campo_erro=None,
        titulo="Uso médio de memória por estratégia e nível de carga",
        rotulo_y="Memória (MB)",
        nome_arquivo="05_memoria_media_por_carga.png",
    )

    print("\nTodos os gráficos foram gerados em resultados/graficos/")


if __name__ == "__main__":
    main()
