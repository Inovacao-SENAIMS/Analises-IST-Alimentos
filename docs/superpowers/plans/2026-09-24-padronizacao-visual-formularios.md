# Padronização Visual dos Formulários Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer com que as quatro páginas de solicitação restantes compartilhem o refinamento visual da página físico-química sem alterar seu comportamento.

**Architecture:** Criar um escopo CSS semântico `.page--form` em `css/style.css`, substituindo o escopo específico `.page--fq` apenas para os estilos de apresentação. Aplicar essa classe às cinco páginas de formulário; não alterar IDs, nomes, scripts, payloads ou regras de validação.

**Tech Stack:** HTML5 semântico, CSS3 existente, JavaScript existente, componentes compartilhados em `components/componentes.js`.

## Global Constraints

- Preservar campos, IDs, nomes de controles, scripts, validações e comportamento de envio.
- Não criar novos campos, endpoints, payloads ou fluxos de navegação.
- Preservar a aparência da página físico-química.
- Não adicionar comentários ao código.
- Não alterar arquivos JavaScript.

---

### Task 1: Extrair e nomear o escopo visual compartilhado

**Files:**
- Modify: `css/style.css:85-96`

**Interfaces:**
- Produces: o seletor `.page--form`, que estiliza camposets, opções, seções e blocos de ensaios dos formulários.

- [ ] **Step 1: Alterar o seletor do escopo existente**

Substituir os seletores `.page--fq` das regras visuais das linhas 85–96 por `.page--form`, preservando integralmente as declarações de estilo e a responsividade já existente. Não alterar as regras globais de campos, botões, cards ou tabelas.

- [ ] **Step 2: Preservar o comportamento da referência**

Confirmar que a página `pages/formulario-analise-fisico-quimica.html` recebe `class="app-shell page page--form"` e que nenhum seletor funcional depende de `page--fq`.

- [ ] **Step 3: Verificar a transformação do CSS**

Executar:

```powershell
rg -n "page--fq|page--form" css/style.css pages
```

Esperado: referências de apresentação em `css/style.css` usam `page--form`; não deve haver `page--fq` remanescente.

---

### Task 2: Aplicar o escopo às quatro páginas restantes

**Files:**
- Modify: `pages/formulario-analise-sementes.html:14`
- Modify: `pages/formulario-analise-microbiologica.html:12`
- Modify: `pages/formulario-amostras-fiscais.html:12`
- Modify: `pages/formulario-analise-sementes-r08.html:14`

**Interfaces:**
- Consumes: o seletor `.page--form` produzido pela Task 1.
- Produces: quatro formulários visualmente consistentes com a página físico-química.

- [ ] **Step 1: Adicionar a classe ao container principal**

Em cada uma das quatro páginas, alterar apenas o `class` do elemento `main` de `app-shell page` para `app-shell page page--form`.

- [ ] **Step 2: Conferir a lista completa de páginas**

Confirmar que exatamente estas cinco páginas usam o escopo compartilhado:

```text
pages/formulario-analise-fisico-quimica.html
pages/formulario-analise-sementes.html
pages/formulario-analise-sementes-r08.html
pages/formulario-analise-microbiologica.html
pages/formulario-amostras-fiscais.html
```

- [ ] **Step 3: Conferir que o markup funcional não mudou**

Executar:

```powershell
git diff --word-diff=porcelain -- pages
```

Esperado: o diff dos quatro HTMLs contém apenas a classe `page--form` adicionada ao `main`; nenhuma tag, ID, atributo `name`, `data-*`, URL de script ou texto de formulário deve ter sido alterado.

---

### Task 3: Verificar qualidade e ausência de regressões

**Files:**
- Test: `css/style.css`
- Test: `pages/formulario-analise-fisico-quimica.html`
- Test: `pages/formulario-analise-sementes.html`
- Test: `pages/formulario-analise-sementes-r08.html`
- Test: `pages/formulario-analise-microbiologica.html`
- Test: `pages/formulario-amostras-fiscais.html`

**Interfaces:**
- Consumes: as mudanças das Tasks 1 e 2.
- Produces: evidência de que o estilo foi aplicado sem alterações funcionais.

- [ ] **Step 1: Verificar o status e o diff**

Executar:

```powershell
git status --short
git diff --check
git diff --stat
git diff -- css/style.css pages
```

Esperado: somente `css/style.css`, os quatro HTMLs e o plano/especificação desta alteração aparecem no diff; `git diff --check` não reporta whitespace inválido.

- [ ] **Step 2: Procurar comandos de qualidade do projeto**

Executar:

```powershell
Get-ChildItem -Name
```

Procurar `package.json`, `pyproject.toml`, `Makefile` ou documentação equivalente. Executar os scripts de lint e typecheck encontrados; se o projeto não os possuir, registrar isso na validação final sem inventar comandos.

- [ ] **Step 3: Validar a estrutura dos cinco formulários**

Confirmar por busca que cada página contém `class="app-shell page page--form"` e que cada formulário mantém seu `id` original (`fisico-quimico-form`, `seed-form`, `micro-form` ou `fiscal-form`) e seu script original.

- [ ] **Step 4: Revisar o resultado final**

Executar novamente:

```powershell
rg -n "page--fq|page--form|style=|border:0|color:var\(--erro\)" css/style.css pages/formulario-analise-fisico-quimica.html pages/formulario-analise-sementes.html pages/formulario-analise-sementes-r08.html pages/formulario-analise-microbiologica.html pages/formulario-amostras-fiscais.html
```

Confirmar que `page--fq` não existe mais, que as cinco classes `page--form` existem e que os estilos inline existentes não foram introduzidos ou removidos nesta tarefa.

## Self-review

- O plano cobre o objetivo, o escopo, a abordagem escolhida, os arquivos afetados e a verificação.
- Não há placeholders, TBDs ou instruções sem comando/código executável.
- Não há alteração de JavaScript, validação, IDs ou contratos de dados.
- A dependência entre Task 1 e Task 2 está explícita.
