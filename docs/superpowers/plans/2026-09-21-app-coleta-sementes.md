# Aplicativo de Coleta de Análises de Sementes — Plano de Implementação

**Objetivo:** criar um aplicativo estático responsivo para login e solicitação de análises de sementes, integrado a Google Sheets por Google Apps Script.

**Arquitetura:** páginas HTML independentes compartilham CSS e módulos JavaScript vanilla. `config.js` centraliza o catálogo de formulários e a URL da API; `auth.js` controla a sessão; o formulário monta amostras dinamicamente e envia um payload JSON. O Apps Script expõe um `doPost` único com ações autenticadas, token assinado e gravação nas abas `Solicitacoes` e `Amostras`.

**Tecnologias:** HTML5, CSS3, JavaScript ES2020, Fetch API, Google Apps Script e Google Sheets.

**Especificação:** requisitos fornecidos na solicitação do usuário e estrutura de referência em `dados.md`.

## Restrições globais

- Usar apenas frontend vanilla, sem frameworks ou dependências externas de execução.
- Enviar requisições com `Content-Type: text/plain` para evitar preflight CORS.
- Validar o token no Apps Script em toda operação protegida.
- Não exibir campos reservados ao laboratório no formulário público.
- Manter comentários e mensagens da interface em português.
- Não afirmar publicação real sem URL do Apps Script, planilha e GitHub Pages configurados.

## Arquivos

- `index.html`: tela de login.
- `menu.html`, `js/menu.js`: menu protegido e cards configuráveis.
- `formulario-analise-sementes.html`, `js/form-analise-sementes.js`: formulário e fluxo de envio.
- `css/style.css`: identidade visual, responsividade e estados de erro.
- `js/config.js`, `js/auth.js`, `js/validacoes.js`: configuração, sessão e regras reutilizáveis.
- `apps-script/Code.gs`: API e persistência no Sheets.
- `README.md`: implantação e cabeçalhos iniciais.
- `tests/contract.test.mjs`: contrato estático dos arquivos entregues.

## Tarefas

1. Criar teste de contrato e verificar falha por arquivos ausentes.
2. Criar configuração, autenticação, validações, HTML e CSS.
3. Criar renderização de menu e formulário dinâmico.
4. Criar Apps Script com token assinado, login, opções e persistência.
5. Documentar criação da planilha, implantação e GitHub Pages.
6. Executar verificações de sintaxe, contrato, referências e revisão final.

## Foco de revisão

- Sessão expirada ou token ausente deve redirecionar ao login.
- Finalidade BAS deve exigir ensaio definitivo e todos os campos.
- Tratamento marcado como Sim deve exigir os três campos condicionais.
- CPF/CNPJ inválido e safra fora do formato devem impedir o envio.
- Resposta de API inválida ou falha de rede deve produzir mensagem amigável.
