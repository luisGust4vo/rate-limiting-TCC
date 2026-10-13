# Análise de Desempenho de Estratégias de Rate Limiting

Projeto experimental desenvolvido para o TCC de Engenharia de Computação
(FUMEC) — *"Análise de desempenho de estratégias de Rate Limiting em
sistemas computacionais distribuídos"*.

Implementa e compara 4 estratégias clássicas de Rate Limiting —
**Janela Fixa**, **Janela Deslizante**, **Token Bucket** e **Leaky
Bucket** — medindo latência, throughput, uso de CPU/memória e taxa de
bloqueio de requisições sob diferentes níveis de carga.

Todo o código foi escrito com nomes de variáveis, funções e comentários
em português para facilitar seu entendimento e a defesa do trabalho.

---

## 1. Estrutura do projeto

```
rate-limiting-tcc/
├── config/
│   └── configuracao.json        # painel de controle de todo o experimento
├── src/
│   ├── estrategias/
│   │   ├── janelaFixa.js        # Fixed Window
│   │   ├── janelaDeslizante.js  # Sliding Window (counter ponderado)
│   │   ├── tokenBucket.js       # Token Bucket
│   │   ├── leakyBucket.js       # Leaky Bucket
│   │   └── index.js             # fábrica: escolhe a estratégia por nome
│   ├── middleware/
│   │   └── limitadorRequisicoes.js   # middleware Express que aplica o limitador
│   ├── executor/
│   │   ├── aguardarServidor.js       # espera o servidor filho subir
│   │   ├── monitorRecursos.js        # amostra CPU/memória durante o teste
│   │   ├── executarExperimentos.js   # RODA TUDO: gera o CSV bruto
│   │   ├── analisarResultados.js     # agrega médias -> CSV resumo
│   │   └── testeRapido.js            # demo de 10 requisições (para a defesa)
│   └── servidor.js              # API alvo, protegida pelo rate limiter
├── resultados/                  # CSVs gerados pelos experimentos (saída)
├── package.json
└── README.md
```

---

## 2. Como rodar

```bash
npm install                 # instala express, autocannon, pidusage
pip install matplotlib      # (ou pip3), necessário só para gerar os gráficos

npm run teste-rapido        # demo visual rápida (10 requisições, ~5s)
npm run experimento         # roda TODA a bateria de experimentos (gera CSV) — ~15-25 min
npm run analisar            # agrega os resultados em médias + desvio padrão (resumo_medias.csv)
npm run graficos            # gera os 5 gráficos comparativos (resultados/graficos/*.png)
npm run artigo               # gera o artigo completo em Word (Artigo_TCC_Rate_Limiting.docx)
npm run iniciar              # sobe o servidor manualmente (útil p/ testes com curl/Postman)
```

Rode os quatro primeiros comandos nessa ordem para ir do zero até o artigo
pronto. O artigo é gerado **inteiramente a partir dos dados reais** do
`resumo_medias.csv` — nenhum número é digitado manualmente no texto —,
então, se você mudar a configuração e rodar o experimento de novo, é só
rodar `npm run analisar && npm run graficos && npm run artigo` de novo
para atualizar o artigo inteiro com os novos dados.

O comando `npm run experimento` é o principal: ele lê
`config/configuracao.json`, executa **todas as combinações de
estratégia × nível de carga × repetição**, e salva um arquivo
`resultados/resultados_<timestamp>.csv` com uma linha por rodada.

Com a configuração padrão (4 estratégias × 4 níveis de carga × 3
repetições × 10s cada), a bateria completa leva cerca de **8 minutos**.

---

## 3. Como o experimento é desenhado (metodologia)

### 3.1 Isolamento entre rodadas

Para cada rodada, o executor **sobe um processo Node.js novo e
isolado** rodando `src/servidor.js` com a estratégia e os parâmetros
daquela rodada específica (passados via variáveis de ambiente). Isso
garante que:

- o estado interno de uma estratégia (contadores, baldes) não vaza
  para a rodada seguinte;
- o uso de CPU/memória medido reflete **apenas** aquele processo, e
  não fica misturado com o processo que está gerando carga.

### 3.2 Geração de carga

A carga é gerada com a biblioteca [`autocannon`](https://github.com/mcollina/autocannon),
usando a opção `overallRate`, que faz o gerador enviar **exatamente**
a taxa de requisições/segundo configurada (e não o máximo que a
máquina aguentar). Isso é o que permite comparar de forma controlada
a carga enviada com o limite configurado em cada estratégia.

Os 4 níveis de carga padrão (configuráveis em `configuracao.json`)
foram desenhados em torno do limite de 50 req/s configurado nas
estratégias:

| Nível     | Taxa enviada | Relação com o limite (50 req/s) |
|-----------|-------------:|----------------------------------|
| baixa     | 20 req/s     | bem abaixo do limite             |
| noLimite  | 50 req/s     | na borda do limite               |
| alta      | 100 req/s    | 2x o limite                      |
| estresse  | 300 req/s    | 6x o limite                      |

### 3.3 Métricas coletadas

Para cada rodada (estratégia × nível de carga × repetição):

| Métrica | Origem | O que representa |
|---|---|---|
| `latenciaMediaMs`, `latenciaP50Ms`, `latenciaP99Ms` | autocannon | tempo de resposta das requisições aceitas |
| `throughputReqPorSegundo` | autocannon | requisições/segundo efetivamente processadas |
| `requisicoesAceitas` / `requisicoesBloqueadas` | contadores do servidor (`/metricas`) | quantas passaram pelo limitador vs. quantas levaram 429 |
| `taxaBloqueioPercentual` | calculado | `bloqueadas / (aceitas + bloqueadas) * 100` |
| `cpuMedioPercentual` | `pidusage`, amostrado a cada 200ms | overhead computacional da estratégia |
| `memoriaMediaMb` | `pidusage` | memória usada pela estrutura de dados da estratégia |

### 3.4 Repetições

Cada combinação é repetida `repeticoes` vezes (padrão: 3) para reduzir
o efeito de ruído/variação do sistema operacional. O script
`analisarResultados.js` calcula a **média entre as repetições** e gera
`resultados/resumo_medias.csv` — esse é o arquivo indicado para virar
tabelas e gráficos no capítulo de resultados do TCC.

---

## 4. Relação com o problema de pesquisa e as hipóteses

Esse desenho experimental foi pensado para testar diretamente as
hipóteses da proposta de TCC:

- **H1** (estratégias se comportam diferente sob diferentes cargas):
  compare as colunas `throughputReqPorSegundo` e
  `taxaBloqueioPercentual` entre as 4 estratégias, para cada nível de
  carga, no `resumo_medias.csv`.
- **H2** (mecanismos mais sofisticados podem ter mais overhead):
  compare `cpuMedioPercentual` e `latenciaMediaMs` da Janela
  Deslizante (mais complexa) contra a Janela Fixa (mais simples).
- **H3** (a estratégia ideal depende da aplicação): observe como cada
  estratégia se comporta diferente em rajada (`estresse`) vs. carga
  constante (`noLimite`) — Token Bucket tende a absorver melhor
  rajadas curtas; Leaky Bucket tende a suavizar mais a saída.

---

## 5. Parametrizando novos experimentos

Tudo é controlado por `config/configuracao.json` — não é necessário
tocar no código para rodar novos cenários:

```jsonc
{
  "repeticoes": 3,                 // quantas vezes repetir cada combinação
  "estrategias": ["janelaFixa", "janelaDeslizante", "tokenBucket", "leakyBucket"],
  "parametrosEstrategias": {
    "tokenBucket": { "capacidade": 50, "taxaRecargaPorSegundo": 50 }
    // ...
  },
  "niveisDeCarga": [
    { "nome": "baixa", "taxaRequisicoesPorSegundo": 20, "conexoes": 10, "duracaoSegundos": 10 }
    // adicione quantos níveis quiser
  ]
}
```

Sugestões de experimentos extras para enriquecer a monografia:

1. **Variar só o limite** (ex.: `maxRequisicoes`/`capacidade` = 10, 50,
   100) mantendo a carga fixa, para discutir sensibilidade a
   parâmetros.
2. **Testar múltiplos clientes simultâneos**: hoje o teste usa um
   único IP de origem (localhost); para simular vários clientes, dá
   para estender `autocannon` com headers diferentes por conexão e
   ajustar o `identificadorCliente` no middleware.
3. **Cenário distribuído**: subir duas instâncias do servidor atrás de
   um balanceador simples, com o estado do limitador compartilhado via
   Redis, para discutir o recorte "distribuído" do título — deixe
   isso como uma seção de "trabalhos futuros" caso não haja tempo
   hábil, e explique essa decisão de escopo na banca.

---

## 6. Para a apresentação/defesa

- `npm run teste-rapido` é uma demonstração ao vivo de ~5 segundos:
  sobe um servidor com Token Bucket (capacidade 5, recarga 1/s) e
  mostra, requisição por requisição, quais são aceitas (`200`) e
  quais são bloqueadas (`429`). Ótimo para abrir a defesa mostrando
  o sistema funcionando de verdade.
- O `resumo_medias.csv` pode ser aberto direto no Excel/Google Sheets
  para gerar os gráficos de barras/linhas comparativos dos slides.
- Cada arquivo de estratégia (`src/estrategias/*.js`) tem um
  comentário no topo explicando o algoritmo, vantagens e desvantagens
  — útil para responder perguntas da banca sobre como cada uma
  funciona internamente.

---

## 7. Limitações conhecidas (para declarar na monografia)

- O experimento roda em uma única máquina, com o servidor e o gerador
  de carga competindo por recursos (embora em processos separados).
  Para resultados de "desempenho absoluto" mais rigorosos, o ideal
  seria rodar em máquinas físicas distintas — isso pode ser
  mencionado como limitação metodológica ou trabalho futuro.
- O identificador de cliente usado é o IP de origem; como os testes
  rodam localmente, todas as requisições de uma rodada compartilham o
  mesmo "cliente" nas estruturas de dados das estratégias — o que é
  adequado para medir o comportamento do limitador sob carga
  agregada, mas não simula múltiplos usuários distintos.
