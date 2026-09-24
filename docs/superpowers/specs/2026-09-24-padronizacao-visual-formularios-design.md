# Padronização visual dos formulários de solicitação

## Objetivo
Aplicar às páginas de Sementes, Sementes R.08, Microbiológica e Amostras Fiscais o mesmo refinamento visual já usado na página de Análise Físico-Química, sem alterar campos, IDs, nomes de controles, scripts, validações ou comportamento de envio.

## Escopo
- Criar um escopo CSS compartilhado `.page--form` para estilos de formulário.
- Aplicar `.page--form` à página de referência e às quatro páginas-alvo.
- Remover a dependência do nome específico `.page--fq` para os estilos compartilhados.
- Preservar os componentes de cabeçalho, rodapé, botões, status e scripts de cada página.
- Manter camposets, opções de rádio, checkboxes, avisos, tabelas de amostras e ações exatamente como estão.

## Abordagem escolhida
O estilo será definido uma única vez no `css/style.css`, em um seletor semântico compartilhável. A página físico-química continuará visualmente igual, mas passará a usar o mesmo escopo das demais páginas.

## Componentes visuais
- Cabeçalho com título, descrição e retorno ao menu.
- Seções numeradas com título e descrição.
- Campos de formulário com rótulos, obrigatoriedade, estados de foco e mensagens de erro.
- Grupos de opções com aparência consistente e destaque para seleção.
- Avisos e blocos de ensaios.
- Área de ações fixa no rodapé da área do formulário.
- Responsividade preservada para telas menores.

## Fora do escopo
Não serão criados novos campos, regras de validação, endpoints, payloads, componentes de PDF ou fluxos de navegação.

## Verificação
Após a implementação, serão verificados: diff sem alterações em scripts, classes funcionais e IDs; execução dos comandos de lint e typecheck disponíveis; e, se possível, validação estrutural dos quatro HTMLs.
