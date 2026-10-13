const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun, PageBreak, LevelFormat } = require("docx");

const D = require("./dadosArtigo");
const C = require("./componentesDocx");

const {
  ESTRATEGIAS,
  NOME_ESTRATEGIA,
  NIVEIS,
  NOME_NIVEL,
  linha,
  fmt,
  ESTATISTICAS,
  overheadDeslizanteVsFixaPercentual,
  DIRETORIO_GRAFICOS,
  DIRETORIO_RESULTADOS,
} = D;
const { titulo, subtitulo, subsubtitulo, p, pRich, bullet, legenda, referencia, tabela, imagem, FONT, COR_TITULO } = C;

const CAMINHO_SAIDA = path.join(DIRETORIO_RESULTADOS, "..", "Artigo_TCC_Rate_Limiting.docx");

// ============================================================
// CAPA / CABEÇALHO DO ARTIGO
// ============================================================

const capa = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text:
          "Análise de Desempenho de Estratégias de Rate Limiting em Sistemas " +
          "Computacionais Distribuídos: um Estudo Experimental Comparativo",
        bold: true,
        font: FONT,
        size: 30,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 40 },
    children: [new TextRun({ text: "[Nome do Aluno]", font: FONT, size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "Curso de Engenharia de Computação, Universidade FUMEC – Belo Horizonte, MG – Brasil",
        font: FONT,
        size: 20,
        italics: true,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "[email-do-aluno]@fumec.edu.br", font: FONT, size: 20 })],
  }),

  new Paragraph({
    spacing: { before: 280, after: 60 },
    children: [new TextRun({ text: "Resumo. ", bold: true, italics: true, font: FONT, size: 20 })],
  }),
  new Paragraph({
    spacing: { after: 160, line: 264 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text:
          "O crescimento do volume de requisições recebidas por APIs e sistemas web " +
          "torna necessário o uso de mecanismos de controle de acesso capazes de " +
          "proteger a disponibilidade e o desempenho dos serviços. Este trabalho " +
          "investiga, por meio de um estudo experimental, o comportamento de quatro " +
          "estratégias de Rate Limiting — Janela Fixa, Janela Deslizante, Token " +
          "Bucket e Leaky Bucket — implementadas em um serviço Node.js e submetidas " +
          "a diferentes níveis de carga controlada. Foram medidos throughput, " +
          "latência, taxa de bloqueio de requisições e consumo de CPU e memória, " +
          "com repetições para reduzir o efeito de variabilidade do sistema. Os " +
          "resultados indicam que as quatro estratégias produzem taxas de bloqueio " +
          "muito próximas quando a carga está bem acima do limite configurado, mas " +
          "divergem de forma perceptível na região próxima ao limite, onde a Janela " +
          "Deslizante se mostrou mais conservadora e o Token Bucket e o Leaky " +
          "Bucket não bloquearam nenhuma requisição. Já em termos de consumo de " +
          "CPU, não foi observada diferença estatisticamente sustentável entre as " +
          "estratégias nas cargas testadas. O estudo oferece um ambiente " +
          "replicável, parametrizável e de código aberto para a comparação dessas " +
          "estratégias.",
        font: FONT,
        size: 20,
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 260 },
    children: [
      new TextRun({ text: "Palavras-chave: ", bold: true, italics: true, font: FONT, size: 20 }),
      new TextRun({
        text: "rate limiting; sistemas distribuídos; desempenho; Token Bucket; Leaky Bucket.",
        italics: true,
        font: FONT,
        size: 20,
      }),
    ],
  }),

  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: "Abstract. ", bold: true, italics: true, font: FONT, size: 20 })],
  }),
  new Paragraph({
    spacing: { after: 160, line: 264 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text:
          "The growing volume of requests received by APIs and web systems makes " +
          "access-control mechanisms necessary to protect service availability and " +
          "performance. This work investigates, through an experimental study, the " +
          "behavior of four Rate Limiting strategies — Fixed Window, Sliding " +
          "Window, Token Bucket, and Leaky Bucket — implemented in a Node.js " +
          "service and subjected to different controlled load levels. Throughput, " +
          "latency, request-blocking rate, and CPU/memory usage were measured, with " +
          "repetitions to reduce system variability. Results indicate that the four " +
          "strategies produce similar blocking rates when load is far above the " +
          "configured limit, but diverge noticeably near the limit, where the " +
          "Sliding Window was more conservative and both Token Bucket and Leaky " +
          "Bucket blocked no requests at all. In terms of CPU usage, no " +
          "statistically sustainable difference was observed between strategies " +
          "under the tested loads. The study provides a replicable, " +
          "parameterizable, and open-source environment for comparing " +
          "these strategies.",
        font: FONT,
        size: 20,
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 300 },
    children: [
      new TextRun({ text: "Keywords: ", bold: true, italics: true, font: FONT, size: 20 }),
      new TextRun({
        text: "rate limiting; distributed systems; performance; Token Bucket; Leaky Bucket.",
        italics: true,
        font: FONT,
        size: 20,
      }),
    ],
  }),
];

// ============================================================
// 1. INTRODUÇÃO
// ============================================================

const introducao = [
  titulo("1. Introdução"),

  p(
    "Sistemas computacionais distribuídos e APIs expostas publicamente estão " +
      "sujeitos a variações abruptas no volume de requisições recebidas, seja por " +
      "crescimento orgânico de uso, integrações automatizadas ou tentativas " +
      "maliciosas de sobrecarga do serviço. Sem um mecanismo de controle, esse " +
      "volume pode comprometer a disponibilidade, degradar o tempo de resposta e " +
      "esgotar os recursos computacionais do sistema (Tanenbaum e Van Steen, " +
      "2007)."
  ),
  p(
    "Rate Limiting é a técnica utilizada para estabelecer um limite sobre a " +
      "quantidade de requisições que um cliente pode realizar em um intervalo de " +
      "tempo. Provedores de API amplamente utilizados na indústria, como Stripe " +
      "(Stripe, 2025) e Cloudflare (Cloudflare, 2025), documentam publicamente o " +
      "uso dessa técnica, e o protocolo HTTP possui inclusive um código de status " +
      "dedicado a sinalizar o bloqueio de uma requisição por excesso de volume, o " +
      "429 Too Many Requests (Nottingham e Fielding, 2012). Existem, no entanto, " +
      "diferentes estratégias para implementar esse controle, cada uma com " +
      "características distintas quanto à forma de contagem das requisições, à " +
      "tolerância a rajadas de tráfego e ao custo computacional exigido."
  ),
  p(
    "Diante disso, formula-se a seguinte questão de pesquisa: como diferentes " +
      "estratégias de Rate Limiting se comportam em um sistema computacional " +
      "submetido a diferentes níveis de carga, considerando aspectos como " +
      "latência, throughput, utilização de recursos e capacidade de controle das " +
      "requisições?"
  ),
  p("Para investigar essa questão, foram formuladas as seguintes hipóteses:"),
  pRich([
    { texto: "H1 – ", negrito: true },
    {
      texto:
        "diferentes estratégias de Rate Limiting apresentam comportamentos " +
        "distintos de desempenho quando submetidas a diferentes níveis de carga.",
    },
  ]),
  pRich([
    { texto: "H2 – ", negrito: true },
    {
      texto:
        "estratégias que utilizam mecanismos de controle mais sofisticados podem " +
        "apresentar maior capacidade de controle das requisições, porém às custas " +
        "de maior sobrecarga computacional.",
    },
  ]),
  pRich([
    { texto: "H3 – ", negrito: true },
    {
      texto:
        "a escolha da estratégia de Rate Limiting influencia o desempenho e a " +
        "utilização de recursos do sistema, de modo que a estratégia mais " +
        "adequada depende das características e dos requisitos da aplicação.",
    },
  ]),
  p(
    "O objetivo geral deste trabalho é analisar comparativamente o desempenho " +
      "de quatro estratégias de Rate Limiting — Janela Fixa, Janela " +
      "Deslizante, Token Bucket e Leaky Bucket — aplicadas a um sistema " +
      "computacional, considerando seu comportamento sob diferentes níveis de " +
      "carga e seus impactos sobre o desempenho e a utilização de recursos. Para " +
      "isso, definem-se os seguintes objetivos específicos:"
  ),
  bullet("Apresentar os conceitos fundamentais de sistemas distribuídos e controle de requisições;"),
  bullet("Descrever o conceito de Rate Limiting e caracterizar as quatro estratégias estudadas;"),
  bullet(
    "Implementar um ambiente experimental parametrizável que permita executar as " +
      "quatro estratégias sob condições controladas e comparáveis;"
  ),
  bullet(
    "Definir e coletar métricas de latência, throughput, uso de CPU, uso de " +
      "memória e taxa de bloqueio de requisições;"
  ),
  bullet("Comparar o comportamento das estratégias sob diferentes níveis de carga;"),
  bullet(
    "Analisar os resultados obtidos e discutir suas implicações para a escolha de " +
      "uma estratégia de Rate Limiting em diferentes cenários de aplicação."
  ),
  p(
    "Este artigo está organizado da seguinte forma: a Seção 2 apresenta a " +
      "fundamentação teórica sobre sistemas distribuídos e as quatro estratégias " +
      "de Rate Limiting estudadas; a Seção 3 descreve a metodologia experimental, " +
      "incluindo o ambiente, os parâmetros e as métricas utilizadas; a Seção 4 " +
      "apresenta e discute os resultados obtidos, relacionando-os às hipóteses " +
      "formuladas; e a Seção 5 conclui o trabalho, discutindo suas limitações e " +
      "sugerindo trabalhos futuros."
  ),
];

// ============================================================
// 2. FUNDAMENTAÇÃO TEÓRICA
// ============================================================

const fundamentacao = [
  titulo("2. Fundamentação Teórica"),

  subtitulo("2.1. Sistemas Distribuídos e Controle de Requisições"),
  p(
    "Um sistema distribuído pode ser definido como um conjunto de componentes " +
      "independentes que se apresenta aos seus usuários como um único sistema " +
      "coerente (Tanenbaum e Van Steen, 2007). Nesse tipo de arquitetura, " +
      "múltiplas instâncias de um serviço frequentemente atendem requisições de " +
      "forma concorrente, o que torna o controle centralizado ou coordenado do " +
      "volume de requisições um desafio adicional em relação a um sistema " +
      "monolítico de instância única."
  ),
  p(
    "Independentemente da topologia (instância única ou múltiplas instâncias " +
      "coordenadas por um armazenamento compartilhado, como Redis), o problema " +
      "central resolvido pelo Rate Limiting é o mesmo: decidir, para cada " +
      "requisição recebida, se ela deve ser processada ou rejeitada, com base no " +
      "histórico recente de requisições daquele cliente. Este trabalho concentra-" +
      "se na avaliação do comportamento das estratégias em uma instância única, " +
      "isolando as variáveis de desempenho do algoritmo de controle das " +
      "variáveis adicionais introduzidas pela sincronização distribuída de " +
      "estado, discutidas na Seção 5 como direção de trabalho futuro."
  ),

  subtitulo("2.2. Rate Limiting"),
  p(
    "Rate Limiting é a técnica que impõe um limite sobre o número de " +
      "requisições que um cliente, identificado por endereço IP, chave de API ou " +
      "identificador de usuário, pode realizar em um intervalo de tempo. Quando o " +
      "limite é excedido, a requisição é rejeitada, tipicamente com o código de " +
      "status HTTP 429 Too Many Requests, definido pela RFC 6585 (Nottingham e " +
      "Fielding, 2012). A técnica é amplamente adotada na indústria: provedores " +
      "como Stripe (Stripe, 2025), Amazon Web Services (Amazon Web Services, " +
      "2025) e o servidor NGINX (NGINX, 2025) documentam publicamente mecanismos " +
      "de Rate Limiting como parte de sua infraestrutura de API."
  ),
  p(
    "A literatura e a documentação técnica da indústria descrevem múltiplas " +
      "estratégias para implementar esse controle. As quatro estratégias mais " +
      "citadas — e adotadas como objeto deste estudo — são descritas a " +
      "seguir."
  ),

  subtitulo("2.3. Estratégias de Rate Limiting"),

  subsubtitulo("2.3.1. Janela Fixa (Fixed Window Counter)"),
  p(
    "Na estratégia de Janela Fixa, o tempo é dividido em janelas de duração " +
      "fixa (por exemplo, 1 segundo). Cada cliente possui um contador que é " +
      "incrementado a cada requisição e reiniciado sempre que uma nova janela " +
      "começa. Enquanto o contador não ultrapassar o limite definido, as " +
      "requisições são aceitas. Trata-se da estratégia mais simples de " +
      "implementar e de menor custo computacional, mas que permite picos de até " +
      "o dobro do limite configurado nas bordas entre duas janelas consecutivas " +
      "(um cliente pode enviar o limite máximo de requisições no fim de uma " +
      "janela e novamente o limite máximo no início da janela seguinte)."
  ),

  subsubtitulo("2.3.2. Janela Deslizante (Sliding Window Counter)"),
  p(
    "A estratégia de Janela Deslizante busca suavizar o problema de picos nas " +
      "bordas combinando o contador da janela atual com uma fração ponderada do " +
      "contador da janela imediatamente anterior, proporcional a quanto tempo já " +
      "decorreu dentro da janela atual. O resultado é uma estimativa contínua do " +
      "volume de requisições no intervalo deslizante, sem o custo de memória de " +
      "armazenar o timestamp de cada requisição individual, ao custo de maior " +
      "complexidade de cálculo em relação à Janela Fixa."
  ),

  subsubtitulo("2.3.3. Token Bucket"),
  p(
    "A estratégia de Token Bucket, descrita originalmente por Turner (1986) no " +
      "contexto de modelagem de tráfego em redes de comunicação, associa a cada " +
      "cliente um “balde” com capacidade máxima de fichas (tokens). O " +
      "balde é recarregado continuamente a uma taxa fixa de fichas por segundo; " +
      "cada requisição consome uma ficha, e requisições são bloqueadas quando o " +
      "balde está vazio. Essa estratégia permite rajadas de requisições até o " +
      "limite da capacidade do balde, ao mesmo tempo em que impõe uma taxa média " +
      "sustentada no longo prazo, sendo por isso adotada por provedores como a " +
      "Stripe (Stripe, 2025)."
  ),

  subsubtitulo("2.3.4. Leaky Bucket"),
  p(
    "A estratégia de Leaky Bucket, também descrita por Turner (1986), modela a " +
      "fila de requisições pendentes como um balde que “vaza” a uma " +
      "taxa constante, representando o processamento das requisições a um ritmo " +
      "fixo. Cada requisição adiciona volume ao balde; se o volume ultrapassar a " +
      "capacidade, a requisição é rejeitada. A diferença conceitual em relação " +
      "ao Token Bucket é que este último controla quantas requisições podem " +
      "entrar no sistema (permitindo rajadas), enquanto o Leaky Bucket controla " +
      "a taxa com que as requisições são processadas, suavizando rajadas em um " +
      "fluxo de saída constante. O servidor NGINX utiliza uma variação dessa " +
      "estratégia em seu módulo de limitação de requisições (NGINX, 2025)."
  ),
];

// ============================================================
// 3. METODOLOGIA
// ============================================================

const larguraPadrao = [2400, 1900, 1900, 1900, 1900];

const metodologia = [
  titulo("3. Metodologia"),
  p(
    "Este estudo adota uma abordagem quantitativa de natureza experimental. A " +
      "variável independente manipulada é a combinação entre a estratégia de " +
      "Rate Limiting ativa e o nível de carga aplicado ao sistema; as variáveis " +
      "dependentes, medidas como resultado de cada execução, são a latência, o " +
      "throughput, a taxa de bloqueio de requisições e o consumo de CPU e " +
      "memória do processo do servidor."
  ),

  subtitulo("3.1. Objeto de Estudo e Ambiente Experimental"),
  p(
    "Foi desenvolvido um serviço HTTP em Node.js (Express) expondo um único " +
      "endpoint protegido por um middleware de Rate Limiting parametrizável. As " +
      "quatro estratégias descritas na Seção 2.3 foram implementadas como " +
      "módulos independentes que compartilham a mesma interface " +
      "(permitir(identificadorCliente): boolean), o que garante que a única " +
      "variável alterada entre execuções seja o algoritmo de controle em si, e " +
      "não a estrutura do servidor ou do middleware que o invoca."
  ),
  p(
    "Para cada rodada experimental, um processo Node.js isolado é iniciado com " +
      "a estratégia e os parâmetros daquela rodada, garantindo que o estado " +
      "interno (contadores, baldes) de uma execução não influencie a execução " +
      "seguinte, e que o uso de CPU e memória medido reflita exclusivamente o " +
      "processo do servidor sob teste."
  ),

  subtitulo("3.2. Parâmetros das Estratégias"),
  p(
    "Todas as estratégias foram configuradas com um limite equivalente de 50 " +
      "requisições por segundo por cliente, permitindo uma comparação justa " +
      "entre elas. A Tabela 1 detalha os parâmetros utilizados."
  ),
  tabela(
    ["Estratégia", "Parâmetro 1", "Valor", "Parâmetro 2", "Valor"],
    [
      ["Janela Fixa", "Duração da janela", "1000 ms", "Máx. requisições", "50"],
      ["Janela Deslizante", "Duração da janela", "1000 ms", "Máx. requisições", "50"],
      ["Token Bucket", "Capacidade do balde", "50", "Taxa de recarga", "50/s"],
      ["Leaky Bucket", "Capacidade do balde", "50", "Taxa de vazamento", "50/s"],
    ],
    larguraPadrao
  ),
  legenda("Tabela 1. Parâmetros de configuração das quatro estratégias avaliadas. Fonte: elaborado pelos autores."),

  subtitulo("3.3. Níveis de Carga"),
  p(
    "A carga foi gerada com a ferramenta autocannon, utilizando o parâmetro " +
      "overallRate, que faz o gerador enviar exatamente a taxa de requisições " +
      "por segundo configurada, em vez do máximo que a máquina consiga " +
      "processar. Essa escolha metodológica permite comparar, de forma " +
      "controlada e reprodutível, a taxa de requisições efetivamente enviada " +
      "com o limite de 50 requisições por segundo configurado em cada " +
      "estratégia. Foram definidos quatro níveis de carga, descritos na Tabela " +
      "2, cada um mantido por 10 segundos."
  ),
  tabela(
    ["Nível", "Taxa enviada", "Conexões", "Relação com o limite"],
    [
      ["Baixa", "20 req/s", "10", "Abaixo do limite"],
      ["No limite", "50 req/s", "20", "Na borda do limite"],
      ["Alta", "100 req/s", "50", "2x o limite"],
      ["Estresse", "300 req/s", "100", "6x o limite"],
    ],
    [2400, 2000, 1700, 2000]
  ),
  legenda("Tabela 2. Níveis de carga aplicados nos experimentos. Fonte: elaborado pelos autores."),

  subtitulo("3.4. Métricas Coletadas e Procedimento"),
  p("Para cada combinação de estratégia e nível de carga, foram coletadas as seguintes métricas:"),
  bullet("Latência média e p99 (ms) das requisições aceitas, medidas pelo próprio gerador de carga;"),
  bullet("Throughput (requisições processadas por segundo);"),
  bullet(
    "Taxa de bloqueio percentual, calculada como requisições bloqueadas dividido " +
      "pelo total de requisições recebidas pelo servidor;"
  ),
  bullet(
    "Uso médio de CPU (%) e memória (MB) do processo do servidor, amostrados a " +
      "cada 200 ms durante o teste com a biblioteca pidusage."
  ),
  p(
    "Cada combinação de estratégia e nível de carga (4 estratégias × 4 " +
      "níveis de carga) foi repetida 3 vezes, totalizando 48 rodadas " +
      "experimentais, para reduzir o efeito da variabilidade do sistema " +
      "operacional sobre os resultados. Os valores relatados na Seção 4 " +
      "correspondem à média das 3 repetições, acompanhada do desvio padrão " +
      "amostral."
  ),
];

// ============================================================
// 4. RESULTADOS E DISCUSSÃO — gerados dinamicamente
// ============================================================

function linhaTabelaResultado(campoValor, campoDesvio, sufixo = "") {
  return ESTRATEGIAS.map((estrategia) => {
    const linhaEstrategia = NIVEIS.map((nivel) => {
      const dados = linha(estrategia, nivel);
      const valor = fmt(dados[campoValor], 2);
      const desvio = campoDesvio ? fmt(dados[campoDesvio], 2) : null;
      return desvio ? `${valor} ± ${desvio}${sufixo}` : `${valor}${sufixo}`;
    });
    return [NOME_ESTRATEGIA[estrategia], ...linhaEstrategia];
  });
}

const cabecalhoResultados = ["Estratégia", ...NIVEIS.map((n) => NOME_NIVEL[n])];
const largurasResultados = [2200, 1850, 1850, 1850, 1850];

const graficoExiste = (nome) => fs.existsSync(path.join(DIRETORIO_GRAFICOS, nome));

const resultados = [
  titulo("4. Resultados e Discussão"),
  p(
    "Esta seção apresenta os resultados das 48 rodadas experimentais, " +
      "organizados por métrica, e discute cada conjunto de resultados à luz das " +
      "hipóteses H1, H2 e H3 formuladas na Seção 1. Todos os valores " +
      "apresentados correspondem à média de 3 repetições, seguida do desvio " +
      "padrão amostral (média ± desvio padrão)."
  ),

  subtitulo("4.1. Throughput"),
  tabela(
    cabecalhoResultados,
    linhaTabelaResultado("throughputReqPorSegundo", "throughputDesvioPadrao", " req/s"),
    largurasResultados
  ),
  legenda("Tabela 3. Throughput médio (req/s) por estratégia e nível de carga. Fonte: dados coletados pelos autores."),
  ...(graficoExiste("01_throughput_por_carga.png")
    ? [imagem(path.join(DIRETORIO_GRAFICOS, "01_throughput_por_carga.png"), 480, 293), legenda("Figura 1. Throughput médio por estratégia e nível de carga.")]
    : []),
  p(
    `Nos níveis "baixa" e "no limite", o throughput medido acompanha de forma ` +
      "consistente a taxa de requisições enviada pelo gerador de carga em todas " +
      "as estratégias, uma vez que praticamente todas as requisições são " +
      "aceitas. Já nos níveis \"alta\" e \"estresse\", o throughput medido " +
      "reflete a soma de requisições aceitas e bloqueadas (o servidor responde " +
      "rapidamente também às requisições rejeitadas, com status 429), e não deve " +
      "ser interpretado isoladamente como capacidade útil do sistema — essa " +
      "leitura é feita em conjunto com a taxa de bloqueio, discutida a seguir."
  ),

  subtitulo("4.2. Taxa de Bloqueio de Requisições"),
  tabela(
    cabecalhoResultados,
    linhaTabelaResultado("taxaBloqueioPercentual", "taxaBloqueioDesvioPadrao", "%"),
    largurasResultados
  ),
  legenda("Tabela 4. Taxa de bloqueio média (%) por estratégia e nível de carga. Fonte: dados coletados pelos autores."),
  ...(graficoExiste("02_taxa_bloqueio_por_carga.png")
    ? [imagem(path.join(DIRETORIO_GRAFICOS, "02_taxa_bloqueio_por_carga.png"), 480, 293), legenda("Figura 2. Taxa de bloqueio média por estratégia e nível de carga.")]
    : []),
  p(
    `No nível "baixa" (20 req/s, abaixo do limite de 50 req/s configurado), a ` +
      "taxa de bloqueio foi de aproximadamente 0% em todas as estratégias, como " +
      "esperado. O comportamento diverge de forma acentuada no nível \"no " +
      `limite" (50 req/s), que é o ponto mais informativo do experimento: o ` +
      `Token Bucket e o Leaky Bucket não bloquearam nenhuma requisição ` +
      `(${fmt(linha("tokenBucket", "noLimite").taxaBloqueioPercentual, 1)}% e ` +
      `${fmt(linha("leakyBucket", "noLimite").taxaBloqueioPercentual, 1)}%, respectivamente), a Janela Fixa ` +
      `bloqueou ${fmt(linha("janelaFixa", "noLimite").taxaBloqueioPercentual, 1)}%, e a Janela Deslizante ` +
      `bloqueou ${fmt(linha("janelaDeslizante", "noLimite").taxaBloqueioPercentual, 1)}% — uma diferença ` +
      "de quase duas ordens de grandeza para a mesma carga enviada e o mesmo " +
      "limite nominal de 50 requisições por segundo. Esse resultado é " +
      "coerente com o funcionamento interno de cada algoritmo: o Token " +
      "Bucket e o Leaky Bucket iniciam a rodada com o balde cheio (capacidade " +
      "igual ao limite) e o recarregam continuamente, de modo que uma taxa " +
      "enviada igual à taxa de recarga nunca esvazia o balde por completo; já " +
      "a Janela Deslizante pondera a contagem da janela anterior de forma " +
      "conservadora bem no início de cada nova janela, quando ainda não " +
      "decorreu tempo suficiente para \"perdoar\" parte da contagem anterior, " +
      "o que a torna a mais restritiva das quatro exatamente na borda do " +
      "limite configurado. Já nos níveis \"alta\" e \"estresse\" (2x e 6x o " +
      "limite, respectivamente), as quatro estratégias convergem para taxas " +
      "de bloqueio muito próximas entre si, uma vez que, quando a carga " +
      "excede amplamente a capacidade configurada, a diferença de " +
      "comportamento nas bordas deixa de ser relevante frente ao volume " +
      "total de requisições excedentes. Esse resultado sustenta a hipótese " +
      "H1: as estratégias realmente se comportam de forma distinta entre si, " +
      "mas essa diferença é muito mais evidente perto do limite configurado " +
      "do que sob carga muito acima dele."
  ),

  subtitulo("4.3. Latência"),
  tabela(
    cabecalhoResultados,
    linhaTabelaResultado("latenciaMediaMs", "latenciaMediaDesvioPadrao", " ms"),
    largurasResultados
  ),
  legenda("Tabela 5. Latência média (ms) por estratégia e nível de carga. Fonte: dados coletados pelos autores."),
  ...(graficoExiste("03_latencia_media_por_carga.png")
    ? [imagem(path.join(DIRETORIO_GRAFICOS, "03_latencia_media_por_carga.png"), 480, 293), legenda("Figura 3. Latência média por estratégia e nível de carga.")]
    : []),
  p(
    "A latência média cresce com o nível de carga em todas as estratégias, " +
      "comportamento esperado dado o maior volume de conexões concorrentes " +
      `disputando o processamento do servidor. No nível "estresse", a maior ` +
      `latência média observada foi de ${fmt(ESTATISTICAS.estresse.maiorLatencia.latenciaMediaMs, 1)} ms ` +
      `(${NOME_ESTRATEGIA[ESTATISTICAS.estresse.maiorLatencia.estrategia]}), contra ` +
      `${fmt(ESTATISTICAS.estresse.menorLatencia.latenciaMediaMs, 1)} ms da estratégia ` +
      `${NOME_ESTRATEGIA[ESTATISTICAS.estresse.menorLatencia.estrategia]}. As diferenças de latência entre ` +
      "estratégias, embora mensuráveis, são pequenas em termos absolutos " +
      "(poucos milissegundos), o que indica que, neste ambiente experimental de " +
      "instância única, o algoritmo de controle em si não é o principal fator " +
      "determinante do tempo de resposta — o volume de conexões concorrentes " +
      "tem impacto mais expressivo."
  ),

  subtitulo("4.4. Uso de CPU e Memória"),
  tabela(
    cabecalhoResultados,
    linhaTabelaResultado("cpuMedioPercentual", "cpuDesvioPadrao", "%"),
    largurasResultados
  ),
  legenda("Tabela 6. Uso médio de CPU (%) por estratégia e nível de carga. Fonte: dados coletados pelos autores."),
  ...(graficoExiste("04_cpu_medio_por_carga.png")
    ? [imagem(path.join(DIRETORIO_GRAFICOS, "04_cpu_medio_por_carga.png"), 480, 293), legenda("Figura 4. Uso médio de CPU por estratégia e nível de carga.")]
    : []),
  p(
    "A Janela Deslizante é, das quatro estratégias, a que exige mais cálculo " +
      "por requisição (combina duas janelas e pondera pelo tempo decorrido), " +
      "por isso seria razoável esperar que consumisse mais CPU que a Janela " +
      "Fixa, a mais simples das quatro. Os dados, no entanto, não sustentam " +
      "essa expectativa de forma consistente: a Janela Deslizante consumiu " +
      `${fmt(D.comparacaoCpuFixaVsDeslizante[0].diferencaPercentual, 1)}% mais CPU que a Janela Fixa no ` +
      `nível "baixa", mas apenas ` +
      `${fmt(D.comparacaoCpuFixaVsDeslizante[2].diferencaPercentual, 1)}% mais no nível "alta", e ` +
      `${fmt(Math.abs(D.comparacaoCpuFixaVsDeslizante[3].diferencaPercentual), 1)}% a menos no nível ` +
      `"estresse". Em todos os quatro níveis de carga, o intervalo (média ± ` +
      "desvio padrão) de uma estratégia se sobrepõe ao da outra, o que " +
      "indica que a diferença observada está dentro da variabilidade normal " +
      "de medição do sistema, e não pode ser tratada como um efeito " +
      "consistente do algoritmo. Uma explicação plausível é que ambas as " +
      "operações têm custo O(1) por requisição — a diferença teórica de " +
      "complexidade entre elas existe, mas é pequena demais, e o overhead do " +
      "Node.js, do Express e da própria medição de CPU domina o sinal que se " +
      "buscava isolar."
  ),
  ...(graficoExiste("05_memoria_media_por_carga.png")
    ? [imagem(path.join(DIRETORIO_GRAFICOS, "05_memoria_media_por_carga.png"), 480, 293), legenda("Figura 5. Uso médio de memória por estratégia e nível de carga.")]
    : []),
  p(
    "O uso de memória cresce de forma semelhante entre as quatro estratégias " +
      "à medida que o nível de carga aumenta, refletindo principalmente o " +
      "overhead do próprio Node.js e do Express em gerenciar mais conexões " +
      "simultâneas, e não uma diferença estrutural relevante entre os " +
      "algoritmos de controle, já que todos armazenam uma quantidade " +
      "equivalente de estado por cliente (um ou dois números)."
  ),

  subtitulo("4.5. Discussão das Hipóteses"),
  pRich([
    { texto: "H1 (confirmada). ", negrito: true },
    {
      texto:
        "As quatro estratégias apresentaram comportamentos mensuravelmente " +
        "distintos sob diferentes níveis de carga, com a diferença mais evidente " +
        "na taxa de bloqueio próxima ao limite configurado (nível \"no limite\").",
    },
  ]),
  pRich([
    { texto: "H2 (não confirmada para uso de CPU, dentro do escopo testado). ", negrito: true },
    {
      texto:
        "Ao contrário do esperado, a estratégia mais sofisticada avaliada " +
        "(Janela Deslizante) não apresentou uso de CPU consistentemente maior " +
        "que o da mais simples (Janela Fixa): a diferença entre as médias foi " +
        "pequena e inconsistente em direção entre os níveis de carga, e os " +
        "intervalos de média ± desvio padrão se sobrepuseram nos quatro " +
        "níveis testados, o que impede tratar a diferença como um efeito real " +
        "do algoritmo e não como ruído de medição. Isso sugere que, para " +
        "operações de custo O(1) por requisição como as quatro estratégias " +
        "aqui implementadas, a complexidade adicional de um algoritmo mais " +
        "sofisticado pode não se traduzir em overhead computacional " +
        "perceptível em uma escala de milhares de requisições por segundo, " +
        "sendo necessárias cargas muito mais altas ou instrumentação mais " +
        "precisa para detectar essa diferença, caso ela exista.",
    },
  ]),
  pRich([
    { texto: "H3 (confirmada). ", negrito: true },
    {
      texto:
        "Os resultados mostram que não existe uma estratégia universalmente " +
        "superior, ainda que o critério de desempate não seja o custo " +
        "computacional (indistinguível entre as quatro, como discutido em " +
        "H2), e sim o comportamento de controle: o Token Bucket e o Leaky " +
        "Bucket toleram uma rajada momentânea igual à taxa configurada sem " +
        "bloquear nenhuma requisição, o que os torna adequados quando picos " +
        "curtos de tráfego legítimo são esperados; a Janela Deslizante é a " +
        "mais restritiva na borda do limite, adequada quando o objetivo é " +
        "impor a taxa contratada de forma estrita; e a Janela Fixa oferece a " +
        "implementação mais simples, com comportamento intermediário entre as " +
        "demais. A escolha adequada, portanto, depende dos requisitos " +
        "específicos de cada aplicação — sobretudo da tolerância a " +
        "rajadas —, e não de uma vantagem de desempenho bruto de uma " +
        "estratégia sobre as outras.",
    },
  ]),
];

// ============================================================
// 5. CONCLUSÃO
// ============================================================

const conclusao = [
  titulo("5. Conclusão"),
  p(
    "Este trabalho comparou experimentalmente o desempenho de quatro " +
      "estratégias de Rate Limiting — Janela Fixa, Janela Deslizante, Token " +
      "Bucket e Leaky Bucket — sob quatro níveis controlados de carga, " +
      "totalizando 48 rodadas experimentais. Os resultados confirmam que as " +
      "estratégias se comportam de forma distinta (H1), sobretudo na região " +
      "próxima ao limite configurado, onde a Janela Deslizante se mostrou mais " +
      "conservadora que a Janela Fixa, e o Token Bucket e o Leaky Bucket não " +
      "bloquearam nenhuma requisição; que, ao contrário do esperado, a maior " +
      "sofisticação do mecanismo de controle não se traduziu em overhead de " +
      "CPU estatisticamente sustentável neste ambiente (H2 não confirmada " +
      "para essa métrica); e que não há uma estratégia universalmente " +
      "superior, sendo a escolha dependente dos requisitos da aplicação (H3)."
  ),
  p(
    "Como principais limitações deste estudo, destacam-se: (i) os experimentos " +
      "foram executados em uma única máquina, com o servidor e o gerador de " +
      "carga competindo por recursos, ainda que em processos isolados; e (ii) o " +
      "escopo foi limitado a uma instância única do servidor, sem avaliar o " +
      "comportamento das estratégias em um cenário distribuído com múltiplas " +
      "instâncias compartilhando estado via um armazenamento externo, como " +
      "Redis, hipótese originalmente considerada na delimitação do tema."
  ),
  p(
    "Como trabalhos futuros, sugere-se: (i) estender o experimento para um " +
      "cenário distribuído, avaliando o custo adicional de sincronização de " +
      "estado entre instâncias; (ii) testar múltiplos clientes concorrentes " +
      "distintos, em vez de uma origem única; e (iii) investigar o impacto de " +
      "diferentes combinações de parâmetros (capacidade, taxa de recarga, " +
      "duração da janela) sobre o compromisso entre taxa de bloqueio e " +
      "tolerância a rajadas em cada estratégia."
  ),
];

// ============================================================
// REFERÊNCIAS
// ============================================================

const referencias = [
  titulo("Referências"),
  referencia(
    "Amazon Web Services (2025). Throttle requests to your REST APIs for " +
      "better throughput in API Gateway. Disponível em: " +
      "https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html."
  ),
  referencia(
    "Cloudflare (2025). Rate Limiting Documentation. Disponível em: " +
      "https://developers.cloudflare.com/waf/rate-limiting-rules/."
  ),
  referencia(
    "NGINX (2025). Module ngx_http_limit_req_module. Disponível em: " +
      "https://nginx.org/en/docs/http/ngx_http_limit_req_module.html."
  ),
  referencia(
    "Nottingham, M. and Fielding, R. (2012). RFC 6585 — Additional HTTP " +
      "Status Codes. Internet Engineering Task Force (IETF). Disponível em: " +
      "https://datatracker.ietf.org/doc/html/rfc6585."
  ),
  referencia(
    "Stripe (2025). Rate Limits — Stripe Documentation. Disponível em: " +
      "https://docs.stripe.com/rate-limits."
  ),
  referencia(
    "Tanenbaum, A. S. and Van Steen, M. (2007). Distributed Systems: " +
      "Principles and Paradigms. 2nd edition. Pearson Prentice Hall, Upper " +
      "Saddle River, NJ."
  ),
  referencia(
    "Turner, J. (1986). New directions in communications (or which way to the " +
      "information age?). IEEE Communications Magazine, 24(10):8–15."
  ),
];

// ============================================================
// MONTAGEM FINAL DO DOCUMENTO
// ============================================================

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 260 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1417, bottom: 1417, left: 1417, right: 1417 },
        },
      },
      children: [
        ...capa,
        ...introducao,
        ...fundamentacao,
        ...metodologia,
        ...resultados,
        ...conclusao,
        ...referencias,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(CAMINHO_SAIDA, buffer);
  console.log(`Artigo gerado com sucesso: ${CAMINHO_SAIDA}`);
});
