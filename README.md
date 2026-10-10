# Timas Dados — Dashboard de análise de vendas

Dashboard interativo criado para uma atividade da disciplina de Fundamentos de IA e Análise de Dados. A interface investiga a evolução mensal do faturamento, a receita por categoria e a comparação entre regiões.

A base inicial é **fictícia e demonstrativa**: `public/dados-exemplo.csv`, com 200 vendas únicas distribuídas ao longo de 12 meses de 2025. O mesmo conjunto é gerado dentro de `public/script.js`, por isso o dashboard funciona ao abrir o HTML diretamente, sem `fetch` nem servidor local. Se existir uma base real, ela pode ser importada pelo botão **Importar CSV**; o arquivo é processado localmente no navegador.

## Como executar

Abra `public/index.html` diretamente no navegador. A tela de boas-vindas não exige usuário ou senha; clique em **Conhecer o dashboard** para acessar os dados.

O botão **Conheça nosso dashboard** abre a rota separada `public/dashboard.html`, onde ficam as informações, indicadores, gráficos, filtros e tabela de vendas.

Abra `public/login.html` para iniciar. Use usuÃ¡rio `timas` e senha `timas`; apÃ³s a validaÃ§Ã£o, o navegador redireciona para `public/index.html`. O dashboard verifica a chave `hamburgueria_autorizado` no armazenamento local e redireciona acessos diretos para o login.

1. Abra `public/index.html` diretamente no navegador.
2. Na tela de login, use usuário `timas` e senha `timas`.
3. Tenha acesso à internet para carregar Chart.js e Papa Parse pelos CDNs fixados no HTML.
4. Use os filtros, pesquise na tabela, ordene pelas colunas ou importe um CSV próprio.

O painel também exibe três imagens ilustrativas de hambúrgueres carregadas do Unsplash. Essas imagens, assim como as bibliotecas Chart.js, Papa Parse e a fonte da interface, precisam de acesso à internet. Se o site for usado sem internet, substitua os URLs das imagens no bloco `hamburger-gallery` de `public/index.html` por arquivos locais.

A tela de login é uma barreira visual implementada no navegador, sem autenticação em servidor. As credenciais ficam no JavaScript para fins demonstrativos da atividade e não devem ser usadas para proteger dados reais.

A importação exige um cabeçalho com estas colunas:

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id_venda` | texto | Identificador da venda; a contagem considera IDs únicos |
| `data` | data | Data no formato `AAAA-MM-DD` |
| `produto` | texto | Nome do produto |
| `categoria` | texto | Grupo do produto |
| `regiao` | texto | Região da venda |
| `quantidade` | número | Unidades vendidas na linha |
| `preco_unitario` | número | Preço por unidade, sem símbolo de moeda |

Linhas sem campos essenciais, datas inválidas ou valores numéricos negativos/inválidos são descartadas e a quantidade é informada na tela. Linhas repetidas não são removidas automaticamente, porque cada linha pode representar uma venda diferente; a contagem de vendas usa apenas os IDs únicos.

## Indicadores e regras

- Faturamento da linha = `quantidade × preco_unitario`.
- Faturamento total = soma dos faturamentos das linhas filtradas.
- Quantidade de vendas = quantidade de `id_venda` únicos.
- Unidades vendidas = soma das quantidades.
- Ticket médio = faturamento total ÷ quantidade de vendas; quando não há vendas, o resultado é R$ 0,00.
- Pesquisa da tabela também participa da filtragem dos cartões, gráficos e tabela.
- O botão **Exportar dados** baixa somente as linhas filtradas e acrescenta a coluna calculada `faturamento`.

## Publicação no Render

Suba este projeto para um repositório no GitHub e crie um novo serviço **Static Site** no Render com:

- **Branch:** a branch que contém o projeto.
- **Root Directory:** vazio.
- **Build Command:** `echo "Site pronto"`
- **Publish Directory:** `public`.

Depois do deploy, o Render publicará o `index.html` como site estático. Como Chart.js e Papa Parse são carregados por CDN, a página publicada precisa de acesso à internet.

## Verificação da amostra

Para conferir os cálculos, o JavaScript calcula cada indicador a partir das linhas atualmente filtradas. Na amostra, o primeiro registro é `V0001`, em 2025-01-08, com quantidade 2 e preço unitário R$ 14,40, portanto seu faturamento de linha é R$ 28,80. O caso sem resultados pode ser testado escolhendo um período fora de 2025 ou uma pesquisa inexistente; os cartões zeram e a mensagem correspondente aparece.

O projeto usa somente HTML, CSS e JavaScript puro, sem backend, banco de dados ou etapa de compilação.

