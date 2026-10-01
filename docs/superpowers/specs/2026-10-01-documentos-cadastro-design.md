# Documentos obrigatorios no cadastro de clientes

Data: 2026-10-01
Status: aprovado pelo usuario; implementacao local concluida, validacao hospedada pendente

## Objetivo e escopo

Permitir que clientes enviem documentos PDF ou imagens durante o cadastro e impedir a conclusao do cadastro sem os dois documentos correspondentes ao tipo de pessoa. Os arquivos pertencem ao cadastro do cliente, sem vinculo com solicitacoes ou amostras.

Requisitos confirmados: documentos obrigatorios; secao Documentos ao final do formulario; limites de tamanho e quantidade.

Decisoes propostas para revisao: um arquivo por categoria, dois arquivos por cadastro, ate 5 MiB (5.242.880 bytes) por arquivo; formatos PDF, JPEG/JPG e PNG; seletor Pessoa fisica / Pessoa juridica dentro do perfil Cliente. Colaborador SENAI permanece com o cadastro atual, sem exigencia desses documentos. Clientes existentes nao precisam reenviar documentos nesta entrega.

## Interface

Adicionar o seletor de tipo de pessoa ao cadastro de Cliente. A secao Documentos fica depois da confirmacao de senha e antes do botao Criar acesso. Exibir os documentos exigidos e seus limites, com dois campos de selecao independentes:

| Tipo de pessoa | Primeiro documento | Segundo documento |
| --- | --- | --- |
| Fisica | Documento com foto | Comprovante de residencia |
| Juridica | Documento com foto do RT (responsavel tecnico) | ART - Anotacao de Responsabilidade Tecnica |

Cada campo aceita apenas um arquivo e mostra nome, tamanho e acao para substituir/remover a selecao. Trocar o tipo de pessoa limpa os arquivos selecionados para evitar associar um documento a outra categoria. O backend exige exatamente as duas categorias aplicaveis, sem repeticoes.

Adaptar os dados do Cliente para permitir cadastro de pessoa fisica: nome civil utiliza o nome de usuario ja solicitado; CPF e RG substituem CNPJ e Inscricao Estadual. Razao social, nome fantasia, ramo de atividade e numero de funcionarios sao campos de pessoa juridica. Endereco, cidade, estado, CEP e telefone continuam obrigatorios para ambos. Preservar o fluxo de contatos e o RENASEM opcional.

Nao adicionar campos pessoais novos para identificar o RT nesta entrega: sua identificacao documental sera o arquivo solicitado. A autenticidade ou validade profissional dos documentos nao sera verificada automaticamente.

## Armazenamento

Usar Google Drive privado, com pasta raiz configurada por DOCUMENTOS_CADASTRO_FOLDER_ID em Script Properties. Criar subpasta com identificador interno de cadastro, evitando CPF/CNPJ no nome da pasta. O identificador da pasta nao sera aceito do navegador.

Criar a aba DocumentosUsuarios, vinculada ao email normalizado e a um cadastro_id:

```text
documento_id | cadastro_id | usuario_email | tipo_pessoa | categoria_documento | arquivo_drive_id | nome_original | mime_type | tamanho_bytes | data_upload
```

Registrar tipo_pessoa na aba Clientes e cadastro_id nos registros novos para identificacao e recuperacao. Acrescentar colunas sem alterar a ordem das existentes. Base64 sera usado apenas no transporte, nunca gravado na planilha.

## Contrato e conclusao do cadastro

Manter cadastrarUsuario como entrada publica. Para Cliente, incluir tipoPessoa, cadastroId e os dois documentos categorizados no payload. O navegador gera cadastroId uma vez por tentativa e o reutiliza em reenvios. O servidor valida identidade, campos, categorias, quantidade, tamanho real dos bytes, formato informado e assinatura binaria basica dos arquivos antes de persistir o cadastro.

Receber os dois arquivos no mesmo pedido de cadastro para limitar a complexidade de uploads publicos independentes. A proposta de dois arquivos de 5 MiB resulta em aproximadamente 13,4 MiB de Base64 no pior caso, alem do JSON. A viabilidade deste tamanho precisa ser verificada no Web App hospedado; o limite sera reduzido se a validacao real exigir.

Sequencia:

1. Validar dados, documentos e configuracao da pasta.
2. Sob bloqueio de documento, verificar duplicidade de email e cadastroId.
3. Preparar uma conta inativa identificada por cadastroId e um estado documental PENDENTE; esse estado deve impedir login e ativacao administrativa.
4. Armazenar documentos no Drive e registrar os metadados; somente gravar novos arquivos quando nao houver documento ja associado a essa categoria e cadastroId.
5. Persistir o perfil do cliente e os contatos sem duplicacao em reenvios.
6. Marcar o cadastro documental CONCLUIDO e ativar a conta somente apos confirmar os dois documentos e os registros relacionais.
7. Retornar sucesso e redirecionar ao login.

Drive e Sheets nao oferecem transacao conjunta. O estado PENDENTE e o cadastroId permitem identificar uma gravacao parcial. Uma tentativa incompleta nao retorna sucesso nem libera acesso. Reenvios precisam validar a identidade e as credenciais da mesma tentativa antes de retomar um cadastro pendente; conhecer somente cadastroId ou email nao autoriza alteracao.

Se a resposta se perder depois da conclusao, uma repeticao valida da mesma tentativa retorna a conclusao existente sem duplicar conta, contatos ou documentos. Falhas devem produzir mensagem visivel no formulario e permitir nova tentativa. A rotina deve compensar arquivos criados sem metadados quando possivel e registrar falhas de compensacao para recuperacao.

Aplicar validacao de tamanho antes de decodificar todo o Base64 quando possivel e limitar quantidade/categorias antes de qualquer acesso de escrita ao Drive. Nomes e MIME fornecidos pelo navegador nao sao suficientes para aceitar um arquivo.

## Permissoes e ciclo de vida

Documentos permanecem privados no Drive. Nesta entrega, nao adicionar links publicos, download no historico ou compartilhamento automatico. A equipe autorizada podera consultar os arquivos na pasta institucional com acesso restrito. Uma futura consulta pelo portal exigira endpoints autenticados e permissao por cadastro.

Preservar o bloqueio de solicitacoes de IST_Colaborators. Cadastros legados continuam funcionando sem estado documental. Contas novas com estado PENDENTE nao podem ser ativadas por atualizarUsuarioAdmin nem autenticar.

A exclusao administrativa existente nao recebera nova exclusao automatica de arquivos nesta entrega. A politica de retencao documental permanece pendente de definicao; essa limitacao deve aparecer na documentacao. Nao executar exclusoes reais durante validacao.

## Arquivos previstos

- pages/cadastro.html: tipo de pessoa e secao Documentos.
- components/upload-arquivos.js: selecao, limites e serializacao dos dois arquivos.
- js/cadastro.js: campos condicionais, validacao, payload e recuperacao de falhas.
- css/style.css: layout da secao seguindo os componentes e tokens existentes.
- apps-script/Code.gs: Drive, metadados, validacao e finalizacao protegida do cadastro.
- apps-script/Documentos.gs: modulo de documentos e retomada, no mesmo projeto Apps Script de Code.gs.
- README.md: configuracao da pasta, novas colunas, permissoes, limites e publicacao.
- tests/contract.test.mjs e testes focados de cadastro: regras de documentos e falhas parciais com servicos simulados.

## Validacao

Verificar PF e PJ com documentos completos; rejeicao de documento ausente, categoria incorreta, arquivo vazio, formato invalido, limite excedido e duplicacao. Confirmar que falhas em Drive ou Sheets deixam a conta sem acesso; reenvio nao duplica registros; administrador nao ativa cadastro incompleto; colaborador e clientes legados preservam seu fluxo.

Verificar interface em desktop/mobile, mensagens acessiveis, troca de tipo de pessoa e substituicao de arquivo. Conferir sintaxe JavaScript e Apps Script e executar testes proporcionais ao fluxo.

Validacao hospedada exige pasta real, autorizacao de Drive e nova versao do Web App /exec. Testes locais nao comprovam upload real ou viabilidade do payload maximo. Usar arquivos sinteticos identificaveis na validacao externa.

## Decisoes de execucao e revisao

- Separar documentos em Documentos.gs para manter cada unidade focada; a publicacao deve incluir ambos os arquivos.
- Usar ScriptLock compartilhado pelos cadastros e operacoes administrativas que alteram Usuarios: DocumentLock retorna null em Web Apps.
- Usar SHA-256 do pedido para a identidade da tentativa; senha e cadastroId continuam obrigatorios para retomar. O fingerprint nao depende da inicializacao concorrente do segredo de tokens.
- Verificar pasta raiz e subpasta com compartilhamento Restrito; sem publicacao automatica de arquivos.
- Conferir metadados apos falha de escrita antes de compensar arquivo; recuperar arquivos ausentes/na lixeira atualizando a linha existente. Reutilizar arquivo de conteudo igual quando a resposta de criacao do Drive se perde.
- Reconhecer conclusao ja persistida quando a resposta do commit final falha.
- CUA informou que nenhum navegador estava disponivel; verificacao visual desktop/mobile permanece pendente, com verificacao HTTP local e testes comportamentais realizados.
