# Análise físico-química de alimentos

## Objetivo

Disponibilizar uma nova solicitação de análise físico-química no portal SENAI FIEMS. O fluxo deve manter a experiência das análises existentes: autenticação, componentes compartilhados, validação no navegador, gravação no Web App, comprovante PDF e consulta no histórico.

## Escopo

### Página e catálogo

- Adicionar `pages/formulario-analise-fisico-quimica.html` ao catálogo público com o título `Solicitação de Análise Físico-Química`.
- Manter a tipografia, cores, seções, botões e componentes reutilizáveis existentes.
- Criar `js/form-analise-fisico-quimica.js` para controlar a página.

### Dados e regras de formulário

1. Origem: WhatsApp, QR Code (Recepção), E-mail ou Outros. A opção Outros revela uma especificação obrigatória.
2. Cliente: razão social, CPF/CNPJ, e-mail e telefone são obrigatórios.
3. Amostra: tipo, lote, lacre, produção, validade, local/data/hora/temperatura/responsável da coleta. Esses campos seguem o formulário recebido; campos sem marcação explícita de obrigatoriedade não bloqueiam o envio.
4. Finalidade: controle de qualidade, amostra fiscal ou outros; outros revela uma especificação obrigatória.
5. SEBRAETEC: SIM ou NÃO, de seleção única.
6. Matriz: uma única seleção entre água e gelo, carnes/pescados/derivados, leite/ovos/derivados, mel/produtos apícolas, alimentos/bebidas/matéria-prima para alimentação animal ou outros. Apenas os ensaios do grupo selecionado são exibidos. Outros revela a descrição da matriz e não oferece ensaios predefinidos.
7. Ensaios: ao menos um ensaio do grupo da matriz é obrigatório quando a matriz possuir catálogo predefinido. Cada item preserva código e nome; os ensaios subcontratados usam o texto como nome e código vazio.
8. Observações adicionais são opcionais.
9. A confirmação de envio é obrigatória. As autorizações de tempo e temperatura são rádios obrigatórios, cada uma com SIM ou NÃO.

## Persistência e contrato

O Apps Script receberá a ação `salvarSolicitacaoFisicoQuimica` e criará um identificador `FQ-...`.

As abas necessárias no Google Sheets são:

```text
SolicitacoesFisicoQuimicas
solicitacao_id | data_hora_envio | usuario | origem | origem_outros | razao_social | cpf_cnpj | email | telefone | tipo_amostra | lote | lacre | data_producao | hora_producao | data_validade | local_coleta | data_coleta | hora_coleta | temperatura_coleta | responsavel_coleta | finalidade | finalidade_outros | sebraetec | matriz | matriz_outros | observacoes | confirmacao | autoriza_tempo | autoriza_temperatura | status

EnsaiosFisicoQuimicos
solicitacao_id | numero | grupo | codigo | ensaio
```

O script grava apenas colunas que existirem nos cabeçalhos da planilha, seguindo o padrão atual. A nova fonte do histórico usa `analise-fisico-quimica`, o título público correspondente e as duas novas abas.

## Histórico e comprovante

- O histórico exibirá a nova análise, respeitando as permissões atuais por usuário/grupo.
- O detalhe público exibirá cliente, amostra, finalidade, SEBRAETEC e matriz; os itens relacionados exibirão grupo, código e ensaio.
- Após resposta de sucesso, a página habilitará `Baixar PDF`, com identificação da solicitação, dados principais e ensaios escolhidos.

## Segurança e falhas

- A rota exige sessão válida, como os fluxos existentes.
- O backend valida cliente, matriz, confirmação, ambas as autorizações e ensaios quando houver matriz com catálogo.
- Falhas do Web App preservam os dados do formulário e exibem a mensagem de erro. O comprovante só fica disponível após a gravação confirmada.

## Verificação

- Cobrir no contrato a página, script, catálogo, ação, abas e fonte do histórico.
- Cobrir a presença das opções/matrizes e o comportamento esperado de ensaios/PDF por inspeção de contrato.
- Executar o contrato Node diretamente, pois `node --test` pode falhar com `spawn EPERM` neste ambiente.
