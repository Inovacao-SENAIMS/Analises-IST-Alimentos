# Documentos no cadastro - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** concluir cadastros de clientes somente apos armazenar os dois documentos obrigatorios.

**Architecture:** reutilizar o POST JSON do portal para enviar dois arquivos Base64. O Apps Script valida documentos, armazena no Drive privado e controla um cadastro idempotente PENDENTE/CONCLUIDO no Sheets. Um componente de upload concentra os limites e a serializacao no navegador.

**Tech Stack:** JavaScript nativo, HTML/CSS, Google Apps Script, Drive e Sheets; node:test com servicos Google simulados.

**Spec:** docs/superpowers/specs/2026-10-01-documentos-cadastro-design.md

## Global Constraints

- Exatamente dois documentos: um por categoria, PDF/JPEG/PNG, ate 5.242.880 bytes cada.
- PF: DOCUMENTO_FOTO e COMPROVANTE_RESIDENCIA. PJ: DOCUMENTO_RT e ART.
- Sem documentos para colaboradores; preservar clientes legados e permissoes atuais.
- Secao Documentos depois da confirmacao de senha, antes de Criar acesso.
- Sem links publicos ou download de documentos no historico.
- Nenhuma implantacao externa ou exclusao de dados reais na validacao.

## Review Focus

- Falha apos gravar arquivo e antes do metadata: compensar o arquivo criado e manter conta bloqueada.
- Resposta perdida apos sucesso: repetir tentativa com mesma identidade e documentos sem duplicar dados.
- Administrador tenta ativar cadastro PENDENTE: rejeitar operacao.
- Troca PF/PJ ou Cliente/Colaborador: limpar arquivos e reavaliar campos obrigatorios.
- Tipo, tamanho ou assinatura adulterados: rejeitar no servidor antes de persistir.

### Task 1: Backend e recuperacao

**Files:** modificar apps-script/Code.gs; criar apps-script/Documentos.gs e tests/cadastro-documentos.test.mjs.

**Interfaces:** cadastrarUsuario(dados) recebe tipoPessoa (FISICA/JURIDICA), cadastroId UUID e documentos [{categoria,nome,mimeType,tamanho,base64}]. validarDocumentosCadastro_(documentos,tipoPessoa) devolve documentos decodificados ou gera erro de validacao. usuarioPorEmail_ inclui estadoDocumental e cadastroId.

- [x] Escrever testes de comportamento para documentos obrigatorios, formatos, limites e PF/PJ com Drive/Sheets em memoria.
- [x] Executar node --test tests/cadastro-documentos.test.mjs e confirmar falha por funcionalidade ausente.
- [x] Implementar validacao, pasta privada por cadastro e aba DocumentosUsuarios; ampliar colunas sem alterar as existentes.
- [x] Implementar conta PENDENTE, retomada autorizada pela senha e cadastroId, gravacao idempotente de perfil/contatos e ativacao final.
- [x] Testar falhas de Drive/Sheets, compensacao, resposta perdida, alteracao de identidade e bloqueio de ativacao/login.
- [x] Executar suite focal e contrato legado; ajustar somente expectativas cujo comportamento mudou por requisito aprovado.

### Task 2: Formulario e componente

**Files:** criar components/upload-arquivos.js e tests/upload-arquivos.test.mjs; modificar pages/cadastro.html, js/cadastro.js e css/style.css.

**Interfaces:** window.UploadDocumentos expõe validarArquivo(arquivo), serializarArquivo(arquivo,categoria) e criar(secao), retornando atualizar(tipoPessoa,ativo), coletar() e limpar(). Campos usam data-documento-categoria e rotulos condicionais.

- [x] Escrever testes para arquivos vazios, formatos, tamanho, serializacao e rejeicao de categorias ausentes.
- [x] Confirmar falhas antes da implementacao.
- [x] Implementar componente de upload com mensagens acessiveis e substituicao/remocao.
- [x] Adicionar tipoPessoa, campos condicionais PF/PJ e secao Documentos; preservar cidades, contatos e componentes existentes.
- [x] Integrar cadastroId por tentativa, bloquear duplo envio, validar formulario e apresentar erros visiveis.
- [x] Verificar troca de tipo e que colaborador nao envia documentos; executar testes e sintaxe.

### Task 3: Documentacao e verificacao final

**Files:** modificar README.md, testes de integracao e este plano.

- [x] Documentar Script Properties, pasta privada, novas abas/colunas, estados, limites e nova implantacao /exec.
- [x] Executar node --test tests/*.test.mjs, node --check em JS e sintaxe do Apps Script via vm.Script.
- [x] Conferir formulario por HTTP local e navegador quando disponivel, sem cadastro real.
- [x] Revisar diff e permissoes; registrar limites da verificacao local e concluir checklist.

## Execucao autorizada

O usuario aprovou o desenho e pediu planejamento seguido da implementacao nesta mesma sessao. Execucao nativa, sem nova pausa para aprovar este plano e sem publicacao externa. Manter alteracoes revisaveis no checkout.

## Registro de conclusao local

- Task 1: concluida. Cadastro PF/PJ obrigatorio com Drive privado, retomada e bloqueios de login/ativacao.
- Task 2: concluida. Campos condicionais e secao Documentos integrados ao formulario com limites e mensagens.
- Task 3: concluida para validacao local. README atualizado; 74 testes passaram; sintaxe de 17 arquivos JS/Apps Script validada; pagina e recursos servidos por HTTP local.
- Revisao independente: corrigidos bloqueio de Web App, arquivos compensados/na lixeira e independencia do fingerprint em relacao ao segredo de tokens.
- Decisao: modulo Documentos.gs separado de Code.gs para manter limites claros. Ambos devem ser publicados juntos.
- Decisao: ScriptLock compartilhado por cadastro e alteracoes administrativas em Usuarios; nenhum dado real foi excluido durante a validacao.
- Verificacao visual: CUA e navegador integrado indisponiveis nesta sessao; desktop/mobile precisam de conferencia visual posterior.
- Validacao externa: pasta, autorizacao do Drive, nova versao /exec e viabilidade do payload maximo nao foram verificados em ambiente hospedado.
