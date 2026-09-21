# IST Alimentos — Coleta de solicitações

Aplicativo estático em HTML, CSS e JavaScript puro para coletar solicitações de análise de sementes. O frontend pode ser publicado no GitHub Pages; o Google Sheets funciona como banco e o Google Apps Script como Web App/API.

## Organização do projeto

- `components/`: componentes visuais reutilizáveis, como sidebar, rodapé, cabeçalhos, botões e ícones.
- `css/`: estilos globais e responsivos.
- `js/`: configuração, autenticação, validações e comportamentos específicos das páginas.
- `design/brand/`: tokens oficiais, tipografia, paleta e arquivos de marca SENAI/FIEMS.
- `apps-script/`: código da API vinculada à planilha.
- `tests/`: verificações de contrato e validações reutilizáveis.

As páginas HTML usam pontos de montagem `data-componente` e carregam `components/componentes.js`. Assim, alterações de navegação, rodapé ou cabeçalho são feitas em um único lugar.

O menu possui dois serviços: análise de sementes e análise microbiológica. A segunda análise usa as abas `SolicitacoesMicrobiologicas` e `EnsaiosMicrobiologicos`.

## 1. Criar a planilha

Crie uma planilha Google e quatro abas com estes nomes e cabeçalhos na primeira linha.

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

## 2. Publicar o Apps Script

1. Na planilha, abra **Extensões → Apps Script**.
2. Substitua o conteúdo do editor por `apps-script/Code.gs` e salve.
3. Em **Implantar → Nova implantação**, escolha **Aplicativo da Web**.
4. Configure **Executar como: Eu** e **Quem tem acesso: Qualquer pessoa**.
5. Implante, autorize o projeto e copie a URL que termina em `/exec`.
6. Cole essa URL em `js/config.js`, no campo `apiUrl`.
7. Se o código do Apps Script mudar depois da implantação, use **Gerenciar implantações → Editar → Nova versão → Implantar**. Editar o arquivo local não atualiza o Web App hospedado.

O cadastro público está em `cadastro.html`; após o sucesso, o usuário volta para `index.html`. O menu autenticado possui a sidebar com Serviços, Dados pessoais e Sair. A página `dados-pessoais.html` mostra o grupo retornado pelo servidor, sem permitir edição de permissões.

O segredo usado para assinar tokens é criado automaticamente em Script Properties na primeira execução. O token expira em 8 horas e é validado em `listarOpcoes` e `salvarSolicitacao`.

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
