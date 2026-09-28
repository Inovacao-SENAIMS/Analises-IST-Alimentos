# Cadastro de clientes e colaboradores SENAI

**Data:** 2026-09-28  
**Status:** desenho aprovado para revisao

## Objetivo

Separar o cadastro publico do Portal IST Alimentos em dois perfis:

- `COLABORADOR_SENAI`, associado automaticamente ao grupo `IST_Colaborators`;
- `CLIENTE`, associado automaticamente ao grupo existente `Client_User` e ao seu cadastro empresarial.

Colaboradores SENAI autenticam e podem navegar por todas as paginas funcionais, mas nao pela administracao. Eles nao podem inserir, editar ou enviar solicitacoes. Essa restricao deve existir no navegador e no Apps Script, que e a autoridade para gravacoes.

## Contexto e limites

O projeto e um frontend estatico que usa Google Sheets como persistencia e Google Apps Script Web App como API. Portanto, nao ha models Django. A separacao equivalente a `User -> CustomerProfile -> Contacts` sera feita em abas normalizadas, vinculadas pelo e-mail normalizado do usuario.

O escopo nao altera o modelo de autenticacao legado, inclusive o armazenamento atual de senha na aba `Usuarios`. Essa limitacao fica registrada, mas nao sera modificada nesta entrega.

## Dados persistidos

### Usuarios

A aba existente continua sendo a fonte de autenticacao e grupos. `grupo` aceitara tambem `IST_Colaborators`. O cliente nunca fornece o grupo; o Apps Script o escolhe a partir de `tipoUsuario`.

### Clientes

Nova aba com uma linha por cliente, identificada por `usuario_email`:

```text
usuario_email | razao_social | nome_fantasia | renasem | endereco | cidade | estado | cep | telefone | cpf_cnpj | inscricao_estadual_rg | ramo_atividade | numero_funcionarios | data_cadastro
```

Todos os dados empresariais sao obrigatorios, exceto `renasem`. A interface deixa claro que RENASEM e aplicavel aos ensaios de sementes.

### ContatosClientes

Nova aba relacional com N contatos por cliente:

```text
usuario_email | nome | cpf | email | telefone | cargo | departamento | recebe_nota_fiscal_boleto | recebe_proposta | recebe_relatorio | data_cadastro
```

Cada contato exige todos os dados pessoais/profissionais e pelo menos uma finalidade. As tres finalidades sao booleanas independentes, permitindo qualquer combinacao.

## Contrato de cadastro

A acao `cadastrarUsuario` passa a receber um objeto unico:

```text
{
  nome, email, senha,
  tipoUsuario: 'COLABORADOR_SENAI' | 'CLIENTE',
  cliente: { ...dados empresariais },
  contatos: [{ ...dados e finalidades }]
}
```

Para colaborador, `cliente` e `contatos` devem estar ausentes. Para cliente, o Apps Script valida integralmente os campos, cria/assegura as abas, grava `Usuarios`, `Clientes` e as linhas de `ContatosClientes` sob bloqueio de documento. Qualquer validacao ou duplicidade falha antes da confirmacao de um novo acesso. A resposta retorna somente dados nao sensiveis, como e-mail e grupo.

## Permissoes

`IST_Colaborators` pode autenticar, carregar perfil, configuracoes, historico e detalhes conforme as permissoes de leitura atuais. A pagina de administracao continua restrita a `Administrator_User`.

Uma funcao unica de autorizacao no Apps Script sera chamada antes de qualquer escrita nas cinco familias de solicitacao:

- `salvarSolicitacao`;
- `salvarSolicitacaoSementesR08`;
- `salvarSolicitacaoMicrobiologica`;
- `salvarSolicitacaoFisicoQuimica`;
- `salvarSolicitacaoAmostrasFiscais`.

Ela rejeita explicitamente `IST_Colaborators` com mensagem de permissao, antes de criar IDs ou gravar em abas. Assim, alterar JavaScript ou chamar a API manualmente nao contorna a regra.

No frontend, cards e paginas de servico permanecem acessiveis a colaboradores. Ao abrir uma pagina de solicitacao, todos os inputs, selects, textareas, radios, checkboxes e botoes de alteracao/envio ficam desabilitados, e aparece um aviso visivel: `Usuario Sem Permissao`. Esse comportamento e camada de experiencia; nao substitui a verificacao do servidor.

## Interface de cadastro

A pagina de cadastro tera radios exclusivos para `Colaborador SENAI` e `Cliente` e mantera os dados basicos para ambos. Quando o perfil for Cliente, sera revelado um bloco empresarial e uma colecao dinamica de contatos. Ela comeca com um contato, permite adicionar/remover contatos e nao permite concluir sem pelo menos uma linha valida.

Quando o perfil for Colaborador SENAI, esses blocos ficam ocultos e seus campos deixam de participar da validacao do navegador. A validacao do Apps Script continua sendo definitiva.

## Administracao e documentacao

A tela administrativa listara e permitira selecionar `IST_Colaborators`, mantendo sua propria restricao de acesso. O README documentara os novos cabecalhos, os grupos, a regra de bloqueio e que a atualizacao de `apps-script/Code.gs` exige nova versao publicada do Web App `/exec`.

## Arquivos e validacao

Arquivos provaveis: `apps-script/Code.gs`, `pages/cadastro.html`, `js/cadastro.js`, `js/auth.js`, `js/menu.js`, os cinco scripts de formulario, `js/admin-usuarios.js`, `css/style.css`, `README.md` e `tests/contract.test.mjs`.

A verificacao inclui contrato textual/estrutural das abas, payload, grupo e guardas de todas as gravacoes; sintaxe JavaScript; checagem do Apps Script; fluxo de interface em HTTP local; e `git diff --check`. A validacao real contra a planilha e o endpoint hospedado depende de publicar uma nova versao do Apps Script e fica fora do que este checkout permite provar.
