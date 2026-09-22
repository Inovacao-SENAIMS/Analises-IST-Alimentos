# Análise Físico-Química Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma solicitação físico-química completa, do catálogo ao comprovante e histórico.

**Architecture:** A página estática e seu controlador usam o contrato dos formulários existentes. O catálogo de ensaios fica em APP_CONFIG; o Apps Script grava solicitação e ensaios em abas próprias, e o histórico trata a nova fonte como lista de ensaios relacionados.

**Tech Stack:** HTML/CSS/JavaScript vanilla, Google Apps Script, Google Sheets, jsPDF e node:test.

**Spec:** docs/superpowers/specs/2026-09-22-analise-fisico-quimica-design.md

## Global Constraints

- Não adicionar dependências nem alterar a URL do Web App.
- Preservar componentes e a paleta existente; somente Baixar PDF usa vermelho.
- Não expor dados internos de laboratório.
- Executar o contrato com node tests\contract.test.mjs, nunca node --test, neste ambiente Windows.

## Review Focus

- Alterar a matriz deve descartar os ensaios selecionados anteriormente.
- Matriz Outros exige descrição e não exige ensaio predefinido.
- Origem e finalidade Outros exigem descrição somente quando visíveis.
- Sessão inválida retorna o erro atual de sessão expirada.
- PDF só é liberado após resposta bem-sucedida do Web App.

---

### Task 1: Contrato, catálogo e modelo de dados

**Files:**

- Modify: tests/contract.test.mjs
- Modify: js/config.js
- Modify: apps-script/Code.gs
- Modify: README.md

**Interfaces:**

- Produces: APP_CONFIG.ensaiosFisicoQuimicos, salvarSolicitacaoFisicoQuimica(dados, token), SolicitaçõesFisicoQuimicas e EnsaiosFisicoQuimicos.
- Consumes: valoresComCabecalho_, validarToken_, sucesso_, falha_, FONTES_HISTORICO e salvarSolicitacaoMicrobiologica.

- [ ] **Step 1: Write the failing test**

~~~js
test('análise físico-química possui catálogo, ação e abas próprias', () => {
  const config = readFileSync(join(root, 'js/config.js'), 'utf8');
  const api = readFileSync(join(root, 'apps-script/Code.gs'), 'utf8');
  assert.match(config, /analise-fisico-quimica/);
  assert.match(config, /ensaiosFisicoQuimicos/);
  for (const token of ['salvarSolicitacaoFisicoQuimica', 'SolicitacoesFisicoQuimicas', 'EnsaiosFisicoQuimicos', 'FQ-']) {
    assert.match(api, new RegExp(token));
  }
});
~~~

- [ ] **Step 2: Run test to verify it fails**

Run: node tests\contract.test.mjs

Expected: FAIL because the physical-chemical catalog and action do not exist.

- [ ] **Step 3: Write minimal implementation**

~~~js
Object.assign(ABAS, {
  SOLICITACOES_FISICO_QUIMICAS: 'SolicitacoesFisicoQuimicas',
  ENSAIOS_FISICO_QUIMICOS: 'EnsaiosFisicoQuimicos'
});

FONTES_HISTORICO.push(
  { tipo: 'analise-fisico-quimica', titulo: 'Análise Físico-Química', solicitacoes: ABAS.SOLICITACOES_FISICO_QUIMICAS, ensaios: ABAS.ENSAIOS_FISICO_QUIMICOS }
);
~~~

Add the catalog card and ensaiosFisicoQuimicos with groups aguaGelo, carnesPescados, leiteOvos, melApicolas and alimentosBebidas. Transcribe every code/name from forms/forms.md; subcontratado entries have an empty code. Implement salvarSolicitacaoFisicoQuimica with FQ- timestamp/UUID ID, session/client/matrix/confirmation/authorizations validation, and one row per selected assay. Document both exact headers in README.

- [ ] **Step 4: Run test to verify it passes**

Run: node tests\contract.test.mjs

Expected: PASS.

- [ ] **Step 5: Commit**

~~~powershell
git add apps-script/Code.gs js/config.js README.md tests/contract.test.mjs
git commit -m "feat: adicionar contrato físico-químico"
~~~

### Task 2: Página da solicitação

**Files:**

- Create: pages/formulario-analise-fisico-quimica.html
- Modify: tests/contract.test.mjs

**Interfaces:**

- Consumes: componentes, APP_CONFIG, AppAuth, Validacoes and jsPDF.
- Produces: #fisico-quimico-form and named controls origem, razaoSocial, cpfCnpj, email, telefone, matriz, ensaiosFisicoQuimicos, confirmacao, autorizaTempo and autorizaTemperatura.

- [ ] **Step 1: Write the failing test**

~~~js
test('página físico-química contém matriz dependente, confirmação e PDF', () => {
  const html = readFileSync(join(root, 'pages/formulario-analise-fisico-quimica.html'), 'utf8');
  for (const texto of ['Água e Gelo', 'Carnes, Pescados e Derivados', 'SEBRAETEC', 'Confirmação de Envio', 'data-componente="botao-baixar-pdf"']) {
    assert.match(html, new RegExp(texto));
  }
});
~~~

- [ ] **Step 2: Run test to verify it fails**

Run: node tests\contract.test.mjs

Expected: FAIL because the page is absent.

- [ ] **Step 3: Write minimal implementation**

Create the HTML following formulario-analise-microbiologica.html: shared header/footer/back button/status; sections for origin, client, sample/finality/SEBRAETEC, matrix/assays, observations, confirmation and authorizations; shared send/PDF/clear/back actions; scripts in the existing order. Use radios for one-choice controls; hide three Outros specification fields; reserve #fisico-quimico-ensaios and #fisico-quimico-ensaios-error for runtime rendering.

- [ ] **Step 4: Run test to verify it passes**

Run: node tests\contract.test.mjs

Expected: PASS.

- [ ] **Step 5: Commit**

~~~powershell
git add pages/formulario-analise-fisico-quimica.html tests/contract.test.mjs
git commit -m "feat: criar formulário físico-químico"
~~~

### Task 3: Controlador e comprovante

**Files:**

- Create: js/form-analise-fisico-quimica.js
- Modify: tests/contract.test.mjs

**Interfaces:**

- Consumes: APP_CONFIG.ensaiosFisicoQuimicos, AppAuth.requisitarApi('salvarSolicitacaoFisicoQuimica', { dados }), Validacoes and RelatoriosPdf.baixarComprovante.
- Produces: request data containing client/sample/finality/SEBRAETEC/matrix/assays/observations/confirmation/authorizations.

- [ ] **Step 1: Write the failing test**

~~~js
test('controlador físico-químico usa ação, matriz dependente e comprovante', () => {
  const script = readFileSync(join(root, 'js/form-analise-fisico-quimica.js'), 'utf8');
  for (const token of ['salvarSolicitacaoFisicoQuimica', 'ensaiosFisicoQuimicos', 'RelatoriosPdf.baixarComprovante', 'botaoPdf.hidden = false', 'matrizOutros']) {
    assert.match(script, new RegExp(token));
  }
});
~~~

- [ ] **Step 2: Run test to verify it fails**

Run: node tests\contract.test.mjs

Expected: FAIL because the controller is absent.

- [ ] **Step 3: Write minimal implementation**

Implement renderizarEnsaios(matriz), alternarOutros(), validar(), coletar(), prepararComprovante(dados, id) and limparStatus(). Rebuild the assay area on matrix change; boxes use name ensaiosFisicoQuimicos and data-codigo/data-ensaio/data-grupo. Validate CPF/CNPJ, visible required fields, email, confirmation, both authorization radios and an assay for predefined matrices. Submit to the physical-chemical action, reveal PDF only after success, and on clear reset all hidden states and hide PDF.

- [ ] **Step 4: Run test to verify it passes**

Run: node tests\contract.test.mjs

Expected: PASS.

- [ ] **Step 5: Commit**

~~~powershell
git add js/form-analise-fisico-quimica.js tests/contract.test.mjs
git commit -m "feat: enviar solicitação físico-química"
~~~

### Task 4: Histórico público e revisão integrada

**Files:**

- Modify: apps-script/Code.gs
- Modify: tests/contract.test.mjs

**Interfaces:**

- Consumes: analise-fisico-quimica source and its two Sheets.
- Produces: public detail fields plus group/code/assay related records.

- [ ] **Step 1: Write the failing test**

~~~js
test('histórico expõe detalhes públicos da análise físico-química', () => {
  const api = readFileSync(join(root, 'apps-script/Code.gs'), 'utf8');
  assert.match(api, /'analise-fisico-quimica': \[/);
  assert.match(api, /\['Matriz', 'matriz'\]/);
});
~~~

- [ ] **Step 2: Run test to verify it fails**

Run: node tests\contract.test.mjs

Expected: FAIL because camposPublicos_ lacks this source.

- [ ] **Step 3: Write minimal implementation**

~~~js
'analise-fisico-quimica': [
  ['Razão Social', 'razao_social'], ['CNPJ/CPF', 'cpf_cnpj'],
  ['Tipo de amostra', 'tipo_amostra'], ['Finalidade', 'finalidade'],
  ['SEBRAETEC', 'sebraetec'], ['Matriz', 'matriz']
]
~~~

Keep detalhesRelacionados_ on the fonte.ensaios branch because the physical-chemical assay columns are group, codigo and ensaio.

- [ ] **Step 4: Run final verification**

Run: node tests\contract.test.mjs; git diff --check

Expected: all tests pass and git diff --check has no output.

- [ ] **Step 5: Commit**

~~~powershell
git add apps-script/Code.gs tests/contract.test.mjs
git commit -m "feat: exibir análise físico-química no histórico"
~~~
