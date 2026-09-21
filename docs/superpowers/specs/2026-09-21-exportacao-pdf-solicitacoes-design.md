# Exportação de PDFs de solicitações

## Objetivo

Permitir que o solicitante guarde um comprovante em PDF após cada envio e consulte, no histórico, um relatório individual ou resumido das solicitações que pode visualizar.

## Escopo e privacidade

- A geração ocorrerá exclusivamente no navegador com a biblioteca `jsPDF` carregada por CDN.
- Não haverá nova aba, endpoint, escrita na planilha ou armazenamento de PDFs.
- Os documentos usarão somente dados públicos obtidos do formulário recém-enviado ou da API de histórico.
- Campos reservados ao laboratório permanecem fora de todos os documentos.
- `Client_User` continua limitado às próprias solicitações; gerentes e administradores seguem o contrato atual do histórico.

## Componentes

### `components/pdf-relatorios.js`

Módulo global reutilizável `RelatoriosPdf` com três operações:

1. `baixarComprovante(dados)` cria o comprovante individual após o envio, com identificação, data, tipo de análise e resumo informado pelo usuário.
2. `baixarIndividual(detalhes)` cria o relatório individual a partir da resposta protegida `obterDetalhesSolicitacao`.
3. `baixarResumo(solicitacoes, filtros)` cria o relatório da lista atualmente filtrada no histórico.

O módulo centraliza título, cabeçalho institucional, rodapé, quebra de páginas, normalização de textos e nome seguro dos arquivos. Os arquivos receberão um nome previsível baseado no tipo e no identificador da solicitação.

### Componentes de interface

`components/componentes.js` disponibilizará pontos de montagem para os botões de download. As páginas continuarão declarativas por meio de atributos `data-componente`, preservando o padrão existente de botões.

## Fluxo

1. Cada formulário envia os dados normalmente.
2. Depois da resposta de sucesso, o respectivo script monta um resumo público e revela o botão de comprovante.
3. O clique chama `RelatoriosPdf.baixarComprovante`; falhas de carregamento da biblioteca serão informadas de modo amigável, sem afetar a solicitação já salva.
4. No histórico, o usuário exporta a lista filtrada como relatório resumido.
5. Ao abrir detalhes, o usuário pode exportar o relatório individual; a exportação usa os mesmos dados públicos retornados ao modal, sem nova chamada nem dados privados.

## Compatibilidade e erros

- O CDN do `jsPDF` será carregado antes do módulo de relatórios nas páginas relevantes.
- Caso o CDN esteja indisponível, o botão exibirá uma mensagem clara e o restante do sistema continuará utilizável.
- Listas vazias não gerarão PDF resumido: a página explicará que não há solicitações a exportar.
- O recurso será responsivo e os botões seguirão a paleta e os estilos já existentes.

## Validação

- Testes de contrato confirmarão a presença do módulo, CDN, ações de download e pontos de montagem nas quatro páginas e no histórico.
- Checagem de sintaxe em todos os scripts modificados.
- Servidor HTTP local para garantir que os recursos sejam encontrados pelas páginas.
- A geração visual do PDF será validada no navegador quando o ambiente local permitir; a API/planilha não será alterada por este recurso.
