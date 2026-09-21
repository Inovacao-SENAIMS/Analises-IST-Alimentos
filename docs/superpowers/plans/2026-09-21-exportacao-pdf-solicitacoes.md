# Exportação de PDFs de solicitações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** disponibilizar comprovante PDF após os quatro envios e relatórios resumido e individual no histórico.

**Architecture:** `components/pdf-relatorios.js` encapsulará a interação com jsPDF e receberá somente objetos públicos fornecidos pelas páginas. Os scripts dos formulários mostrarão o comprovante apenas após uma gravação bem-sucedida; o histórico exportará a lista filtrada e os detalhes já retornados pela API protegida. Não haverá mudança no Apps Script ou nas planilhas.

**Tech Stack:** HTML5, CSS3, JavaScript ES2020, jsPDF 2.5.1 por CDN, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-21-exportacao-pdf-solicitacoes-design.md`

## Global Constraints

- Usar jsPDF 2.5.1 por CDN; não instalar dependências nem introduzir frameworks.
- Gerar PDFs inteiramente no navegador; não criar endpoint, aba, gravação ou armazenamento de PDF.
- Exportar somente dados públicos e nunca campos reservados ao laboratório.
- Preservar os filtros e permissões vigentes do histórico (`Client_User` vê apenas suas solicitações).
- Falhas de carregamento da biblioteca devem informar o usuário e não desfazer um envio já concluído.
- Manter textos e comentários em português, botões responsivos e o padrão de componentes existente.

## Review Focus

- CDN indisponível: clique em exportar deve exibir mensagem amigável e não interromper formulário ou histórico.
- Histórico vazio: relatório resumido não deve ser baixado e deve explicar que não há itens filtrados.
- Busca ativa: o resumo deve conter somente as linhas atualmente filtradas, não a lista integral em memória.
- Solicitação recém-enviada: o comprovante precisa trazer o ID retornado pela API, sem depender de consulta posterior.
- Dados laboratoriais: nenhum rótulo reservado como `data_recebimento`, `resultado` ou `peso_amostra_g` pode integrar os PDFs.

---

### Task 1: Módulo compartilhado de relatórios PDF

**Files:**
- Create: `components/pdf-relatorios.js`
- Modify: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: `window.jspdf.jsPDF` exposto pelo CDN.
- Produces: `window.RelatoriosPdf` com `baixarComprovante({ solicitacaoId, titulo, dataEnvio, campos, relacionados })`, `baixarIndividual(detalhes)` e `baixarResumo(solicitacoes, filtros)`.

- [ ] **Step 1: Write the failing test**

Adicione ao teste de contrato a exigência do novo arquivo e da API pública:

```js
const pdf = readFileSync(join(root, 'components/pdf-relatorios.js'), 'utf8');
for (const nome of ['RelatoriosPdf', 'baixarComprovante', 'baixarIndividual', 'baixarResumo', 'jsPDF']) {
  assert.match(pdf, new RegExp(nome));
}
assert.doesNotMatch(pdf, /data_recebimento|peso_amostra_g|observacoes_laboratorio/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract.test.mjs`

Expected: FAIL indicando que `components/pdf-relatorios.js` ainda não existe.

- [ ] **Step 3: Write minimal implementation**

Crie o módulo com validação de biblioteca e dados, helpers internos para texto seguro, paginação e nomes de arquivo. A interface deve seguir este formato:

```js
window.RelatoriosPdf = {
  baixarComprovante(dados) {
    return gerarDocumento('Comprovante de solicitação', dados);
  },
  baixarIndividual(detalhes) {
    return gerarDocumento('Relatório individual da solicitação', detalhes);
  },
  baixarResumo(solicitacoes, filtros) {
    if (!solicitacoes.length) throw new Error('Não há solicitações para exportar.');
    return gerarResumo(solicitacoes, filtros);
  }
};
```

O módulo deve lançar `Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.` quando `window.jspdf?.jsPDF` não estiver disponível. As funções devem usar somente os arrays `campos` e `relacionados` recebidos, e rodapé com paginação.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --check components/pdf-relatorios.js; node tests/contract.test.mjs`

Expected: sintaxe válida e contrato PASS.

- [ ] **Step 5: Commit**

```bash
git add components/pdf-relatorios.js tests/contract.test.mjs
git commit -m "feat: adicionar módulo de relatórios PDF"
```

### Task 2: Componentes, dependência e estilos de exportação

**Files:**
- Modify: `components/componentes.js`
- Modify: `css/style.css`
- Modify: `pages/formulario-analise-sementes.html`
- Modify: `pages/formulario-analise-microbiologica.html`
- Modify: `pages/formulario-amostras-fiscais.html`
- Modify: `pages/formulario-analise-sementes-r08.html`
- Modify: `pages/historico-solicitacoes.html`
- Modify: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: `RelatoriosPdf` definido em `components/pdf-relatorios.js`.
- Produces: pontos `data-componente="botao-baixar-pdf"`, `data-componente="botao-exportar-resumo"` e elementos de status associados para os scripts de página.

- [ ] **Step 1: Write the failing test**

Inclua uma asserção para os cinco documentos, CDN e ordem de scripts:

```js
for (const file of [...formularios, 'pages/historico-solicitacoes.html']) {
  const html = readFileSync(join(root, file), 'utf8');
  assert.match(html, /cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf\/2\.5\.1/);
  assert.match(html, /\.\.\/components\/pdf-relatorios\.js/);
}
assert.match(readFileSync(join(root, 'components/componentes.js'), 'utf8'), /renderizarBotaoBaixarPdf/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract.test.mjs`

Expected: FAIL porque o CDN, o módulo e os pontos de montagem ainda não foram referenciados nas páginas.

- [ ] **Step 3: Write minimal implementation**

Adicione dois renderizadores em `componentes.js`:

```js
function renderizarBotaoBaixarPdf(id, texto = 'Baixar comprovante em PDF') {
  return `<button id="${id}" class="button pdf-download-button" type="button" hidden>${texto}</button>`;
}

function renderizarBotaoExportarResumo(id) {
  return `<button id="${id}" class="button success pdf-summary-button" type="button">Exportar relatório resumido</button>`;
}
```

Monte-os com atributos declarativos. Inclua o CDN antes de `pdf-relatorios.js`, e este antes do script específico de cada página. Use estilos para manter área de ações legível em desktop e mobile, sem substituir as cores padronizadas de enviar, limpar e voltar.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract.test.mjs`

Expected: PASS, com cada página referenciando o CDN e módulo antes do seu script de fluxo.

- [ ] **Step 5: Commit**

```bash
git add components/componentes.js css/style.css pages tests/contract.test.mjs
git commit -m "feat: adicionar controles de exportação PDF"
```

### Task 3: Comprovante após o envio das quatro análises

**Files:**
- Modify: `js/form-analise-sementes.js`
- Modify: `js/form-analise-microbiologica.js`
- Modify: `js/form-amostras-fiscais.js`
- Modify: `js/form-analise-sementes-r08.js`
- Modify: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: `RelatoriosPdf.baixarComprovante(dados)` e botão renderizado com identificador próprio em cada página.
- Produces: comprovante individual local, ativado somente após `resultado.dados.solicitacaoId`.

- [ ] **Step 1: Write the failing test**

Inclua para cada script a checagem de criação do resumo e chamada após sucesso:

```js
for (const file of scriptsDosFormularios) {
  const script = readFileSync(join(root, file), 'utf8');
  assert.match(script, /RelatoriosPdf\.baixarComprovante/);
  assert.match(script, /solicitacaoId/);
  assert.match(script, /Baixar comprovante/);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract.test.mjs`

Expected: FAIL, pois os scripts ainda não acionam o módulo PDF.

- [ ] **Step 3: Write minimal implementation**

Em cada script, mantenha em memória somente o objeto público do último envio bem-sucedido e revele o botão correspondente. O listener deve seguir o padrão:

```js
botaoPdf.addEventListener('click', () => {
  try {
    RelatoriosPdf.baixarComprovante(ultimoComprovante);
  } catch (erro) {
    exibirStatus(erro.message, 'error');
  }
});
```

Após sucesso, construa `ultimoComprovante` com `solicitacaoId`, título da análise, horário do navegador, campos enviados e itens/ensaios públicos. Ao limpar o formulário, o botão volta a ficar oculto. Não armazene nem mostre quaisquer campos internos de laboratório.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --check js/form-analise-sementes.js; node --check js/form-analise-microbiologica.js; node --check js/form-amostras-fiscais.js; node --check js/form-analise-sementes-r08.js; node tests/contract.test.mjs`

Expected: todos os scripts com sintaxe válida e contrato PASS.

- [ ] **Step 5: Commit**

```bash
git add js/form-analise-sementes.js js/form-analise-microbiologica.js js/form-amostras-fiscais.js js/form-analise-sementes-r08.js tests/contract.test.mjs
git commit -m "feat: disponibilizar comprovantes PDF após envio"
```

### Task 4: Relatórios resumido e individual no histórico

**Files:**
- Modify: `js/historico-solicitacoes.js`
- Modify: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: `RelatoriosPdf.baixarResumo(filtradas, { termoBusca })` e `RelatoriosPdf.baixarIndividual(detalhes)`.
- Produces: exportação da lista filtrada e exportação dos dados públicos já carregados no painel de detalhes.

- [ ] **Step 1: Write the failing test**

Amplie o teste do histórico:

```js
assert.match(script, /RelatoriosPdf\.baixarResumo/);
assert.match(script, /RelatoriosPdf\.baixarIndividual/);
assert.match(script, /history-export-summary/);
assert.match(script, /history-export-individual/);
assert.doesNotMatch(script, /data_recebimento|peso_amostra_g|senha/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract.test.mjs`

Expected: FAIL, pois a exportação ainda não é ligada ao histórico.

- [ ] **Step 3: Write minimal implementation**

Extraia a função de filtragem para que tabela e PDF usem a mesma lista:

```js
function solicitacoesFiltradas() {
  const termo = busca.value.trim().toLowerCase();
  return solicitacoes.filter((item) => camposPesquisaveis(item).some((valor) => valor.includes(termo)));
}
```

O botão resumido deve abortar com mensagem amigável se `solicitacoesFiltradas()` estiver vazia. Armazene `detalhesAtuais` somente depois de `obterDetalhesSolicitacao` concluir; o botão individual permanecerá oculto até esse momento. Chame o módulo com `detalhesAtuais`, nunca com linhas brutas ou campos da planilha.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --check js/historico-solicitacoes.js; node tests/contract.test.mjs`

Expected: sintaxe válida e contrato PASS, sem nomes de campos laboratoriais no frontend.

- [ ] **Step 5: Commit**

```bash
git add js/historico-solicitacoes.js tests/contract.test.mjs
git commit -m "feat: exportar relatórios do histórico"
```

### Task 5: Validação integrada e documentação de entrega

**Files:**
- Modify: `README.md`
- Modify: `tests/contract.test.mjs` somente se alguma referência pública requerida ainda não estiver coberta.

**Interfaces:**
- Consumes: páginas e módulos concluídos nas Tasks 1 a 4.
- Produces: instrução de que PDF é gerado localmente, depende do CDN e não altera a planilha.

- [ ] **Step 1: Write the failing test**

Inclua a exigência de documentação:

```js
const readme = readFileSync(join(root, 'README.md'), 'utf8');
assert.match(readme, /PDF/);
assert.match(readme, /jsPDF/);
assert.match(readme, /não são gravados|nao sao gravados/i);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract.test.mjs`

Expected: FAIL enquanto o README não explicar a exportação local.

- [ ] **Step 3: Write minimal implementation**

Documente no README:

```markdown
## Exportação em PDF

Os comprovantes e relatórios são gerados localmente no navegador com jsPDF. Eles não são enviados ou gravados no Google Sheets. Para gerar PDFs, o navegador deve conseguir acessar o CDN da biblioteca.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract.test.mjs; node tests/validacoes.test.mjs; node --check components/pdf-relatorios.js; node --check components/componentes.js; node --check js/historico-solicitacoes.js; git diff --check`

Expected: todos os testes PASS, scripts com sintaxe válida e nenhuma falha de espaços no diff.

- [ ] **Step 5: Run local resource check and commit**

Run: `python -m http.server 8000`

Em outro terminal, abra `http://127.0.0.1:8000/pages/historico-solicitacoes.html` e as quatro rotas de formulário; confirme visualmente os controles e, com dados de teste, os downloads. Pare o servidor após a verificação.

```bash
git add README.md tests/contract.test.mjs
git commit -m "docs: documentar exportação local de PDFs"
```

## Self-review

- Cobertura da especificação: Tasks 1 e 2 implementam módulo/CDN/componentes; Task 3 cobre comprovante dos quatro fluxos; Task 4 cobre ambos relatórios do histórico; Task 5 documenta e valida o comportamento.
- Sem placeholders: cada task contém arquivos, contratos, comandos, asserções e implementação mínima concreta.
- Consistência: todas as páginas consomem `RelatoriosPdf`; os formulários usam `baixarComprovante`, e o histórico usa `baixarResumo` e `baixarIndividual`.
- Review Focus coberto: CDN em Task 1/3, lista vazia e busca em Task 4, ID pós-envio em Task 3 e campos internos em Tasks 1/4.
