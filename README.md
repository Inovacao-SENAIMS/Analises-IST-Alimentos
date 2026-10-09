# IST Alimentos — Coleta de solicitações

Aplicativo estático em HTML, CSS e JavaScript puro para coletar solicitações de análise de sementes. O frontend pode ser publicado no GitHub Pages; o Google Sheets funciona como banco e o Google Apps Script como Web App/API.

## Organização do projeto

- `components/`: componentes visuais reutilizáveis, como sidebar, rodapé, cabeçalhos, botões e ícones.
- `css/`: estilos globais e responsivos.
- `js/`: configuração, autenticação, validações e comportamentos específicos das páginas.
- `design/brand/`: tokens oficiais, tipografia, paleta e arquivos de marca SENAI/FIEMS.
- `apps-script/`: código da API vinculada à planilha.
- `tests/`: verificações de contrato e validações reutilizáveis.

As páginas HTML ficam organizadas em `pages/`, usam pontos de montagem `data-componente` e carregam `components/componentes.js`. O `index.html` da raiz funciona como entrada compatível com o GitHub Pages e redireciona para `pages/index.html`. Assim, alterações de navegação, rodapé, cabeçalho ou ícones SVG são feitas em um único lugar.

O menu agrupa os serviços em duas categorias: **análise** (análise de sementes, análise microbiológica, análise físico-química e análise de alimentos) e **recebimento** (recebimento de amostra, que registra o checklist de recebimento vinculado a uma solicitação existente). Cada fluxo possui suas próprias abas de gravação para preservar o histórico e facilitar futuras revisões. A rota `pages/historico-solicitacoes.html` consolida as solicitações enviadas e permite consultar detalhes públicos.

## 1. Criar a planilha

Crie uma planilha Google e oito abas com estes nomes e cabeçalhos na primeira linha.

### `Usuarios`

`email | senha | nome | ativo | grupo | data_cadastro`

Adicione um usuário inicial, por exemplo `usuario@empresa.com | troque-esta-senha | Nome do Usuário | TRUE | Administrator_User | 2026-09-21`. Usuários criados pela tela pública entram automaticamente como `Client_User`.

Os grupos disponíveis são `Client_User`, `Manager_User` e `Administrator_User`. A atribuição inicial de Manager e Administrator é feita diretamente na coluna `grupo` da aba `Usuarios`; o cliente nunca escolhe o próprio grupo. O Apps Script consulta essa coluna a cada operação protegida, portanto alterações de `ativo` ou `grupo` têm efeito no próximo acesso/operação.

### `Config`

`tipo | valor`

Conteúdo inicial:

```text
tipo | valor
peneira | Não se aplica
peneira | Peneira 1
peneira | Peneira 2
peneira | Peneira 3
categoria | Semente genética
categoria | Semente básica
categoria | Semente certificada
categoria | Semente não certificada
```

Para adicionar uma opção, inclua outra linha nessa aba, sem editar o frontend.

### `Solicitacoes`

```text
solicitacao_id | data_hora_envio | usuario | requerente | renasem_requerente | pagante | cpf_cnpj | endereco | data_amostragem | procedencia | amostrador | renasem_amostrador | num_proposta | finalidade | finalidade_outros | ensaio_pureza | ensaio_pms | ensaio_outras_sementes | ensaio_infestadas | ensaio_germinacao | ensaio_vigor_ea | ensaio_tetrazolio | ensaio_frio | ensaio_emergencia | observacoes | data_recebimento | resp_recebimento
```

As duas últimas colunas são reservadas para preenchimento do laboratório.

### `Amostras`

```text
solicitacao_id | numero | especie | cultivar | safra | peneira | lote | representatividade | categoria | tratamento | trat_produto | trat_principio_ativo | trat_dosagem | peso_amostra_g | analise_critica | protocolo
```

As três últimas colunas são reservadas para preenchimento do laboratório.

### `SolicitacoesMicrobiologicas`

```text
solicitacao_id | data_hora_envio | usuario | razao_social | cpf_cnpj | responsavel | tipo_amostra | lote | lacre | data_validade | data_producao | hora_producao | local_coleta | data_coleta | hora_coleta | temperatura_coleta | responsavel_coleta | finalidade | finalidade_outros | autoriza_temperatura | autoriza_tempo | data_recebimento | temperatura_recebimento | hora_recebimento | quantidade_amostra | peso_volume | numero_amostra | responsavel_recebimento | situacao_amostra | observacoes_laboratorio
```

As colunas a partir de `data_recebimento` são reservadas ao laboratório e não aparecem no formulário público.

### `EnsaiosMicrobiologicos`

```text
solicitacao_id | numero | grupo | codigo | ensaio | resultado | observacoes_laboratorio
```

As duas últimas colunas são reservadas ao laboratório. Os ensaios exibidos ao cliente são definidos em `js/config.js`, preservando os códigos da especificação microbiológica.

### `SolicitacoesAmostrasFiscais`

```text
solicitacao_id | data_hora_envio | usuario | protocolo_entrada | numero_protocolo | razao_social | cpf_cnpj | nome_fantasia | proprietario | ie | endereco | email | telefone | fax | municipio | cep | registro_rotulo | registro_orgao | objetivo | analise_microbiologica | analise_fisico_quimica | observacoes | data_recebimento | hora_recebimento | responsavel_recebimento | condicao_amostra | observacoes_recepcao
```

As colunas a partir de `data_recebimento` são reservadas à recepção/laboratório e não aparecem no formulário público.

### `AmostrasFiscais`

```text
solicitacao_id | numero | produto | marca | quantidade | lote | data_fabricacao | data_validade | coletor_nome | coletor_telefone | data_coleta | hora_coleta | observacoes | resultado | observacoes_laboratorio
```

As colunas `resultado` e `observacoes_laboratorio` são reservadas ao laboratório.

### `ChecklistsRecebimento`

```text
checklist_id | solicitacao_id | tipo_referencia | usuario_amostra | requerente_cliente | data_recebimento | hora_recebimento | temperatura_amostra | quantidade_amostra | peso_volume | numero_amostra | situacao_amostra | responsavel | observacoes | usuario | data_registro
```

Criada automaticamente no primeiro envio do serviço **Recebimento de Amostra** (`pages/recebimento-amostra.html`). Vincula o checklist à solicitação escolhida em `solicitacao_id` (`tipo_referencia` identifica a análise). As ações protegidas são `salvarChecklistRecebimento` (gravação) e `listarChecklists` (consulta). Cada solicitação pode ser recebida uma única vez: o servidor bloqueia um novo checklist para a mesma `solicitacao_id` e as listas de vinculação sinalizam/desabilitam as amostras já recebidas (`— Recebido`). O flag `recebido` também aparece no histórico de solicitações. Após o envio, o comprovante pode ser baixado em PDF. A consulta fica em `pages/historico-checklists.html`, acessível pelo menu lateral apenas aos grupos `IST_Colaborators`, `Manager_User` e `Administrator_User`.

## 2. Publicar o Apps Script

1. Na planilha, abra **Extensões → Apps Script**.
2. Substitua o conteúdo de `Code.gs` por `apps-script/Code.gs`, crie também o arquivo `Documentos.gs` com o conteúdo de `apps-script/Documentos.gs` e salve ambos. Os dois arquivos pertencem ao mesmo projeto Apps Script.
3. Em **Implantar → Nova implantação**, escolha **Aplicativo da Web**.
4. Configure **Executar como: Eu** e **Quem tem acesso: Qualquer pessoa**.
5. Implante, autorize o projeto e copie a URL que termina em `/exec`.
6. Cole essa URL em `js/config.js`, no campo `apiUrl`.
7. Se o código do Apps Script mudar depois da implantação, use **Gerenciar implantações → Editar → Nova versão → Implantar**. Editar o arquivo local não atualiza o Web App hospedado.

O cadastro público está em `pages/cadastro.html`; após o sucesso, o usuário volta para `pages/index.html`. O menu autenticado possui a sidebar com Serviços, Dados pessoais e Sair. A página `pages/dados-pessoais.html` mostra o grupo retornado pelo servidor, sem permitir edição de permissões.

O segredo usado para assinar tokens é criado automaticamente em Script Properties na primeira execução. O token expira em 8 horas e é validado em `listarOpcoes` e `salvarSolicitacao`.

O histórico usa as ações protegidas `listarHistoricoSolicitacoes` e `obterDetalhesSolicitacao`. `Client_User` visualiza apenas solicitações vinculadas ao próprio e-mail; `Manager_User` e `Administrator_User` visualizam o histórico operacional. Campos reservados ao laboratório não são retornados nessa consulta.

## Exportação em PDF

Após o envio de qualquer análise, o usuário pode baixar um comprovante em PDF. No histórico, é possível exportar o relatório resumido das solicitações filtradas e o relatório individual após abrir seus detalhes.

Os documentos são gerados localmente no navegador com jsPDF. Eles não são enviados ou gravados no Google Sheets, não exigem novas abas e contêm somente dados públicos do solicitante. Para gerar PDFs, o navegador deve conseguir acessar o CDN da biblioteca.

### Cadastro de clientes e colaboradores

O cadastro agora exige escolher `COLABORADOR_SENAI` ou `CLIENTE`. Colaboradores recebem automaticamente o grupo `IST_Colaborators`: podem autenticar e navegar, mas nao podem preencher ou enviar solicitacoes. O Apps Script tambem bloqueia cada gravacao, portanto a restricao nao depende do navegador.

Clientes recebem `Client_User` e gravam uma linha em `Clientes` e uma ou mais em `ContatosClientes`:

```text
Clientes: usuario_email | razao_social | nome_fantasia | renasem | endereco | cidade | estado | cep | telefone | cpf_cnpj | inscricao_estadual_rg | ramo_atividade | numero_funcionarios | data_cadastro
ContatosClientes: usuario_email | nome | cpf | email | telefone | cargo | departamento | recebe_nota_fiscal_boleto | recebe_proposta | recebe_relatorio | data_cadastro
```

Clientes escolhem Pessoa física ou Pessoa jurídica. Pessoa física informa nome completo, CPF, RG, endereço e contato; razão social, nome fantasia, ramo de atividade e número de funcionários se aplicam apenas à pessoa jurídica. RENASEM permanece opcional, aplicável a ensaios de sementes. Cada contato precisa ter ao menos uma finalidade. As abas são criadas pelo Apps Script no primeiro cadastro de Cliente; após atualizar os dois arquivos `.gs`, publique uma nova versão do Web App `/exec`.

### Documentos obrigatórios no cadastro

A seção **Documentos** fica ao final do formulário, antes de **Criar acesso**, e aparece apenas para Cliente:

| Tipo de pessoa | Documento principal | Documento complementar |
| --- | --- | --- |
| Física | Documento com foto | Comprovante de residência |
| Jurídica | Documento com foto do RT (responsável técnico) | ART — Anotação de Responsabilidade Técnica |

São obrigatórios **dois arquivos**, um por campo, em **PDF, JPG/JPEG ou PNG**, com até **5 MiB (5.242.880 bytes)** cada. O servidor verifica categorias, tamanho real, extensão, MIME e assinatura binária básica. Isso não é uma verificação automática de autenticidade ou validade profissional do documento.

#### Configurar o armazenamento

1. Crie uma pasta dedicada no Google Drive da conta responsável pelo Web App, com acesso **Restrito**, acessível somente à equipe autorizada. Não habilite acesso público, por link ou para todo o domínio; confira também permissões herdadas de pastas superiores.
2. Copie o ID da pasta (trecho depois de `/folders/` na URL).
3. Em **Configurações do projeto → Propriedades do script**, adicione `DOCUMENTOS_CADASTRO_FOLDER_ID` com esse ID.
4. Atualize `Code.gs` e adicione `Documentos.gs` no mesmo projeto Apps Script. Execute uma função que use Drive para autorizar o acesso; você pode criar temporariamente uma função de configuração que leia essa propriedade e chame `DriveApp.getFolderById(id).getName()`. Não execute cadastro real para obter essa autorização.
5. Publique uma **nova versão** da implantação `/exec`, executando como a conta responsável pelo armazenamento, e atualize também o frontend.

O ID da pasta é configuração do servidor e não deve ser colocado no HTML ou em `js/config.js`. Os arquivos são organizados em subpastas por identificador de cadastro. O portal não gera links públicos nem acrescenta documentos ao histórico de solicitações.

A nova aba `DocumentosUsuarios` é criada automaticamente:

```text
documento_id | cadastro_id | usuario_email | tipo_pessoa | categoria_documento | arquivo_drive_id | nome_original | mime_type | tamanho_bytes | data_upload
```

O backend acrescenta colunas sem reordenar as existentes:

- `Usuarios`: `cadastro_id`, `estado_documental`, `cadastro_fingerprint`.
- `Clientes`: `tipo_pessoa`, `cadastro_id`.
- `ContatosClientes`: `cadastro_id`, `numero_contato`.

Durante a gravação, o cliente fica **PENDENTE** e sem acesso. Somente após armazenar os dois documentos, o perfil e os contatos, o cadastro muda para **CONCLUIDO** e a conta é ativada. Administradores não podem ativar cadastros pendentes pelo portal. Não altere manualmente essas colunas para contornar a conclusão.

Se ocorrer falha, tente novamente na mesma aba com os mesmos dados, credenciais e arquivos. O identificador é preservado na sessão do navegador; senhas e arquivos não são armazenados nesse mecanismo. Se a página for recarregada, será necessário preencher os dados e selecionar os mesmos arquivos novamente. Caso a sessão tenha sido perdida, a equipe deverá recuperar o cadastro pendente de forma controlada; não há ferramenta de recuperação administrativa nesta entrega.

Falhas parciais são retomadas sem duplicar registros. Se a criação de metadados falhar depois do upload, o servidor tenta mover o arquivo recém-criado para a lixeira e registra falhas de compensação nos logs. Não existe transação conjunta entre Drive e Sheets.

Clientes anteriores à mudança e colaboradores mantêm seu fluxo de acesso. A exclusão administrativa de usuário **não exclui automaticamente documentos no Drive ou seus metadados**; a política de retenção e eventual limpeza precisa ser definida separadamente.

#### Verificação

```powershell
node --test tests/*.test.mjs
```

Os testes de cadastro simulam Drive/Sheets e verificam falhas e retomadas sem dados reais. A validação hospedada deve usar arquivos sintéticos: confirme PF, PJ, limite máximo, falha/reenvio e conta bloqueada enquanto pendente. Dois arquivos de 5 MiB geram aproximadamente 13,4 MiB de Base64; a viabilidade desse payload no Web App precisa ser verificada após implantação, reduzindo os limites se necessário.

## 3. Publicar no GitHub Pages

1. Crie um repositório e envie os arquivos deste diretório para a branch principal.
2. Em **Settings → Pages**, selecione a branch e a pasta raiz (`/root`).
3. Aguarde a URL do Pages e teste primeiro o login, depois o carregamento das opções e uma gravação de solicitação.

O GitHub Pages hospeda apenas o frontend. A planilha e o Apps Script continuam sendo serviços separados.

## 4. Desenvolvimento local

Como o projeto é estático, ele pode ser servido com:

```powershell
python -m http.server 8000
```

Abra `http://localhost:8000`. O login e a gravação reais só funcionarão depois de configurar uma URL `/exec` válida e um usuário ativo na aba `Usuarios`.

## 5. Comportamentos implementados

- Sessão no `localStorage` com expiração de 8 horas e redirecionamento ao login.
- POST com `Content-Type: text/plain` para o Apps Script.
- Menu e cards gerados pelo catálogo de `js/config.js`.
- Até oito amostras, tratamento condicional, opções carregadas da aba `Config` e layout de tabela no desktop/cartões no mobile.
- Validação de CPF/CNPJ, safra, finalidade, ensaios, declaração e campos condicionais.
- ID único da solicitação, prevenção de duplo envio e mensagens para erro de rede, sessão expirada e resposta inválida.
- Campos laboratoriais presentes somente como colunas da planilha.

## 6. Limites da validação local

Este checkout não contém uma planilha, credenciais ou implantação pública. Portanto, a validação local cobre estrutura, referências, sintaxe JavaScript e contrato textual do Apps Script. O fluxo hospedado precisa ser validado após a implantação real, especialmente permissões do Web App, cabeçalhos da planilha e gravação nas duas abas.
