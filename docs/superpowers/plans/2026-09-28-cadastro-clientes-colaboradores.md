# Cadastro de clientes e colaboradores SENAI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir cadastro distinto de Cliente e Colaborador SENAI, persistir perfil e contatos de cliente e impedir que colaboradores gravem solicitações.

**Architecture:** O Apps Script permanece a autoridade de autenticação, dados e permissão. `Usuarios` armazena o grupo, enquanto as novas abas `Clientes` e `ContatosClientes` formam uma relação 1:1 e 1:N pelo e-mail normalizado. A interface coleta o perfil e aplica uma camada de bloqueio visual comum, mas cada operação de gravação consulta a guarda do Apps Script.

**Tech Stack:** HTML5, CSS, JavaScript puro, Node.js `node:test`, Google Apps Script e Google Sheets.

**Spec:** `docs/superpowers/specs/2026-09-28-cadastro-clientes-colaboradores-design.md`

## Global Constraints

- O perfil selecionado no navegador e `COLABORADOR_SENAI` ou `CLIENTE`; o grupo e decidido exclusivamente pelo Apps Script.
- `IST_Colaborators` autentica e navega por todas as paginas funcionais, exceto Administracao, mas nunca cria, edita ou envia solicitacoes.
- Todos os campos empresariais sao obrigatorios, exceto RENASEM, que deve indicar aplicabilidade a ensaios de sementes.
- Cada Cliente deve possuir pelo menos um contato com todos os dados e uma ou mais finalidades.
- Nenhum botao oculto ou bloqueio JavaScript substitui a validacao no servidor.
- Nao alterar o modelo de senha legado nesta entrega.
- Nao publicar o Apps Script nem alterar dados reais da planilha; documentar a nova versao `/exec` como etapa posterior.

## Review Focus

- Cliente sem RENASEM deve concluir o cadastro; qualquer outro dado empresarial ausente deve ser rejeitado no navegador e no Apps Script.
- Contato sem finalidade, ou lista vazia apos remover contatos, deve impedir o cadastro mesmo se o navegador enviar o payload manualmente.
- Um e-mail ja existente nao pode criar linhas duplicadas em `Clientes` ou `ContatosClientes`.
- Um token de `IST_Colaborators` em cada uma das cinco acoes `salvarSolicitacao*` deve falhar antes de criar um ID ou gravar uma linha.
- Colaborador abrindo cada formulario ve exatamente `Usuário Sem Permissão` e nao consegue reabilitar o envio pela navegacao normal; Administracao continua inacessivel.

---

### Task 1: Contratos de regressao para grupos, cadastro e bloqueio

**Files:**
- Modify: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: os nomes de abas, grupos, acoes e arquivos definidos no spec.
- Produces: contratos que guiam os nomes exatos usados nas tarefas 2 a 4.

- [ ] **Step 1: Escrever contratos de cadastro e persistencia que falham**

Adicionar assertions para `IST_Colaborators`, `Clientes`, `ContatosClientes`, `COLABORADOR_SENAI`, `CLIENTE`, `tipoUsuario`, `cliente`, `contatos`, `recebe_nota_fiscal_boleto`, `recebe_proposta` e `recebe_relatorio` em `Code.gs`, `cadastro.html` e `cadastro.js`.

- [ ] **Step 2: Executar o contrato para confirmar falha**

Run: `node tests/contract.test.mjs`

Expected: FAIL, pois os novos grupos, abas e payload ainda nao existem.

- [ ] **Step 3: Escrever contratos de permissao que falham**

Acrescentar uma verificacao que exija `podeCriarSolicitacao_` em todas as cinco funcoes de persistencia, e uma verificacao da mensagem literal `Usuário Sem Permissão` e do helper comum de bloqueio nos cinco scripts de formulario.

- [ ] **Step 4: Executar o contrato para confirmar a segunda falha**

Run: `node tests/contract.test.mjs`

Expected: FAIL, indicando as guardas e o bloqueio visual ausentes.

- [ ] **Step 5: Commit**

```powershell
git add tests/contract.test.mjs
git commit -m "test: cobrir cadastro e permissao de colaboradores"
```

### Task 2: API de cadastro normalizado e autorizacao de servidor

**Files:**
- Modify: `apps-script/Code.gs`
- Test: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: `cadastrarUsuario(dados)` do `doPost`, onde `dados` possui `nome`, `email`, `senha`, `tipoUsuario`, `cliente` e `contatos`.
- Produces: `GRUPOS.COLABORADOR`, `ABAS.CLIENTES`, `ABAS.CONTATOS_CLIENTES`, `podeCriarSolicitacao_(usuario)` e cadastro atomico sob bloqueio.

- [ ] **Step 1: Implementar os nomes de grupo e abas e seus contratos de cabeçalho**

Em `apps-script/Code.gs`, declarar `IST_Colaborators`, `Clientes` e `ContatosClientes`; criar um helper que localiza ou cria abas com os cabeçalhos exatos do spec, sem modificar linhas existentes.

- [ ] **Step 2: Adaptar o dispatch e `cadastrarUsuario` para o novo payload**

Trocar a chamada do `doPost` por `cadastrarUsuario(entrada.dados)` e implementar a assinatura `cadastrarUsuario(dados)`. Validar tipo, dados basicos, duplicidade e, para Cliente, dados empresariais, RENASEM opcional, contatos completos e pelo menos uma finalidade por contato. Usar `LockService.getDocumentLock()` envolvendo a nova checagem de duplicidade e as gravacoes; liberar o lock em `finally`.

- [ ] **Step 3: Gravar usuario, perfil e contatos pelo e-mail normalizado**

Para `COLABORADOR_SENAI`, gravar somente `Usuarios` com `GRUPOS.COLABORADOR`. Para `CLIENTE`, gravar `Usuarios` como `GRUPOS.CLIENTE`, uma linha de `Clientes` e N linhas de `ContatosClientes`. Retornar somente `email` e `grupo`.

- [ ] **Step 4: Implementar `podeCriarSolicitacao_(usuario)` e conectar todas as gravacoes**

A funcao retorna `falha_('Usuário Sem Permissão')` para `GRUPOS.COLABORADOR`; as funcoes `salvarSolicitacaoSementes_`, `salvarSolicitacaoAmostrasFiscais`, `salvarSolicitacaoMicrobiologica` e `salvarSolicitacaoFisicoQuimica` devem chamá-la imediatamente apos validar o token. `salvarSolicitacao` e R.08 herdam a protecao pelo helper de sementes.

- [ ] **Step 5: Executar contratos e checagem estrutural**

Run: `node tests/contract.test.mjs; node --check apps-script/Code.gs`

Expected: contratos de API passam; caso `node --check` nao suporte sintaxe Apps Script, registrar isso e usar apenas a checagem estrutural de contrato, sem chamar o resultado de publicacao.

- [ ] **Step 6: Commit**

```powershell
git add apps-script/Code.gs tests/contract.test.mjs
git commit -m "feat: cadastrar clientes e bloquear solicitacoes de colaboradores"
```

### Task 3: Formulario dinamico e administracao de grupos

**Files:**
- Modify: `pages/cadastro.html`
- Modify: `js/cadastro.js`
- Modify: `js/auth.js`
- Modify: `js/admin-usuarios.js`
- Modify: `css/style.css`
- Test: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: `AppAuth.cadastrarUsuario(dados)` e os valores `COLABORADOR_SENAI`/`CLIENTE` da tarefa 2.
- Produces: payload de cadastro sem grupo e uma lista dinamica serializada de contatos validos.

- [ ] **Step 1: Criar os controles acessiveis do cadastro**

Adicionar radios exclusivos `name="tipoUsuario"`, bloco empresarial inicialmente oculto e template/contêiner de contatos em `pages/cadastro.html`. Marcar os campos obrigatorios de cliente, deixar somente RENASEM opcional e adicionar o texto de ajuda para ensaios de sementes. Incluir botoes sem submit para adicionar e remover contatos.

- [ ] **Step 2: Implementar exibicao e validacao no cliente**

Em `js/cadastro.js`, alternar `hidden`, `disabled` e `required` conforme o radio; renderizar contatos por indice; impedir remocao que deixe zero contatos; validar uma finalidade por contato; e chamar `AppAuth.cadastrarUsuario({ nome, email, senha, tipoUsuario, cliente, contatos })`.

- [ ] **Step 3: Atualizar a camada de autenticacao e a administracao**

Mudar `AppAuth.cadastrarUsuario` para receber e transmitir o objeto. Em `js/admin-usuarios.js`, adicionar `IST_Colaborators` ao select sem alterar a guarda que mantem Administracao exclusiva ao administrador.

- [ ] **Step 4: Estilizar sem afetar os formularios existentes**

Adicionar em `css/style.css` apenas seletores dedicados ao cadastro de perfil/contatos, reutilizando `.radio-group`, `.choice`, `.field-grid` e os estados de foco existentes.

- [ ] **Step 5: Executar contratos e sintaxe**

Run: `node tests/contract.test.mjs; node --check js/cadastro.js; node --check js/auth.js; node --check js/admin-usuarios.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add pages/cadastro.html js/cadastro.js js/auth.js js/admin-usuarios.js css/style.css tests/contract.test.mjs
git commit -m "feat: diferenciar cadastro de cliente e colaborador"
```

### Task 4: Bloqueio de entrada para colaboradores em todos os formularios

**Files:**
- Modify: `js/auth.js`
- Modify: `js/form-analise-sementes.js`
- Modify: `js/form-analise-microbiologica.js`
- Modify: `js/form-analise-fisico-quimica.js`
- Modify: `js/form-amostras-fiscais.js`
- Modify: `css/style.css`
- Test: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: grupo de `AppAuth.obterSessao()` e `GRUPOS.COLABORADOR` emitido pela API.
- Produces: `AppAuth.bloquearEntradasSolicitacao(form)` que retorna `true` para colaborador e deixa uma mensagem visivel no formulario.

- [ ] **Step 1: Implementar o helper comum de bloqueio**

Em `js/auth.js`, expor `bloquearEntradasSolicitacao(form)`. Para `IST_Colaborators`, inserir ou atualizar um alerta com o texto literal `Usuário Sem Permissão`, desabilitar `input`, `select`, `textarea` e todos os `button` do formulario, mantendo links de navegacao funcionais, e retornar `true`; para os demais grupos, retornar `false`.

- [ ] **Step 2: Aplicar a guarda antes de listeners mutaveis**

Cada um dos quatro scripts chamara o helper apos localizar o formulario e antes de registrar listeners que adicionam amostras, exibem campos condicionais ou enviam dados. `form-analise-sementes.js` cobre sementes e R.08 pelo `data-api-action` ja existente.

- [ ] **Step 3: Preservar experiencia e acessibilidade**

Estilizar o aviso como alerta de erro/aviso e garantir que controles bloqueados tenham feedback visual claro, sem ocultar formularios, cards, historico ou rotas de leitura.

- [ ] **Step 4: Executar contratos e sintaxe dos scripts de formulario**

Run: `node tests/contract.test.mjs; node --check js/form-analise-sementes.js; node --check js/form-analise-microbiologica.js; node --check js/form-analise-fisico-quimica.js; node --check js/form-amostras-fiscais.js`

Expected: PASS; o contrato prova que os cinco caminhos de solicitacao ficam cobertos (sementes inclui R.08).

- [ ] **Step 5: Commit**

```powershell
git add js/auth.js js/form-analise-sementes.js js/form-analise-microbiologica.js js/form-analise-fisico-quimica.js js/form-amostras-fiscais.js css/style.css tests/contract.test.mjs
git commit -m "feat: bloquear inputs de solicitacao para colaboradores"
```

### Task 5: Documentacao e verificacao final local

**Files:**
- Modify: `README.md`
- Test: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: abas, grupos, payload e regras entregues nas tarefas 2 a 4.
- Produces: instrucoes operacionais precisas para quem prepara a planilha e publica uma revisao do Web App.

- [ ] **Step 1: Atualizar esquema e regras operacionais**

Em `README.md`, documentar os cabeçalhos completos de `Clientes` e `ContatosClientes`, `IST_Colaborators`, os dois tipos de cadastro, RENASEM opcional, finalidades dos contatos, bloqueio de gravacao no backend e bloqueio visual no frontend.

- [ ] **Step 2: Atualizar o contrato de documentacao**

Adicionar assertions que exijam no README os nomes das duas abas, `IST_Colaborators` e a instrucao de implantar nova versao do `/exec` apos copiar `Code.gs`.

- [ ] **Step 3: Executar suite final, verificacoes estaticas e HTTP local**

Run: `node tests/contract.test.mjs; node --check js/auth.js; node --check js/cadastro.js; node --check js/form-analise-sementes.js; node --check js/form-analise-microbiologica.js; node --check js/form-analise-fisico-quimica.js; node --check js/form-amostras-fiscais.js; git diff --check`

Expected: todos os contratos e checks passam sem whitespace errors. Servir com `python -m http.server 8000` e conferir manualmente o radio, o bloco dinamico de Cliente, a lista de contatos e o aviso para uma sessao local de colaborador; registrar que isso nao prova escrita hospedada.

- [ ] **Step 4: Commit**

```powershell
git add README.md tests/contract.test.mjs
git commit -m "docs: orientar cadastro de clientes e colaboradores"
```

## Self-review

- Cobertura do spec: tarefas 2 e 3 atendem perfis, abas, dados e contatos; tarefas 2 e 4 atendem as duas camadas de permissao; tarefa 3 preserva Administracao; tarefa 5 cobre operacao e validacao.
- Consistencia: `IST_Colaborators`, `COLABORADOR_SENAI`, `CLIENTE`, `Clientes`, `ContatosClientes` e `bloquearEntradasSolicitacao(form)` sao os mesmos em todas as tarefas.
- Review Focus: os cinco riscos listados possuem cobertura nas tarefas 1, 2, 3 e 4.
- Proporcao: o plano fixa contratos e interfaces sem transcrever implementacoes.
