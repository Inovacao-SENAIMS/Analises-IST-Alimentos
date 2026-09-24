import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const requiredFiles = [
  'index.html', 'pages/index.html', 'pages/menu.html', 'pages/formulario-analise-sementes.html',
  'pages/formulario-analise-microbiologica.html',
  'pages/formulario-amostras-fiscais.html', 'pages/formulario-analise-sementes-r08.html',
  'pages/cadastro.html', 'pages/dados-pessoais.html',
  'pages/administracao-usuarios.html',
  'pages/historico-solicitacoes.html',
  'css/style.css', 'js/config.js', 'js/auth.js', 'js/menu.js',
  'js/validacoes.js', 'js/form-analise-sementes.js', 'js/form-amostras-fiscais.js', 'js/cadastro.js', 'js/perfil.js',
  'components/componentes.js', 'components/pdf-relatorios.js',
  'apps-script/Code.gs', 'README.md'
];

test('entrega todos os arquivos públicos do aplicativo', () => {
  for (const file of requiredFiles) assert.equal(existsSync(join(root, file)), true, file);
});

test('módulo compartilhado expõe relatórios PDF sem dados laboratoriais', () => {
  const pdf = readFileSync(join(root, 'components/pdf-relatorios.js'), 'utf8');
  for (const nome of ['RelatoriosPdf', 'baixarComprovante', 'baixarIndividual', 'baixarResumo', 'jsPDF']) {
    assert.match(pdf, new RegExp(nome));
  }
  assert.doesNotMatch(pdf, /data_recebimento|peso_amostra_g|observacoes_laboratorio/);
});

test('somente o botão de PDF usa a paleta vermelha', () => {
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  const css = readFileSync(join(root, 'css/style.css'), 'utf8');
  assert.match(componentes, /texto = 'Baixar PDF'/);
  assert.match(css, /\.pdf-download-button[^}]*var\(--botao-vermelho/);
  assert.match(css, /\.pdf-download-button:hover[^}]*var\(--botao-vermelho-hover/);
  for (const seletor of ['.button.primary', '.button.secondary', '.form-clear-button', '.pdf-summary-button', '.form-menu-button', '.sample-add-button', '.logout-button', '.admin-refresh-button']) {
    assert.doesNotMatch(css, new RegExp(`${seletor.replace(/\./g, '\\.')}[^}]*var\\(--botao-vermelho`));
  }
});

test('análise físico-química possui catálogo, página, ação e abas próprias', () => {
  const config = readFileSync(join(root, 'js/config.js'), 'utf8');
  const api = readFileSync(join(root, 'apps-script/Code.gs'), 'utf8');
  assert.equal(existsSync(join(root, 'pages/formulario-analise-fisico-quimica.html')), true);
  assert.match(config, /analise-fisico-quimica/);
  assert.match(config, /ensaiosFisicoQuimicos/);
  for (const token of ['salvarSolicitacaoFisicoQuimica', 'SolicitacoesFisicoQuimicas', 'EnsaiosFisicoQuimicos', 'FQ-']) assert.match(api, new RegExp(token));
});

test('origem físico-química oferece somente os três canais definidos', () => {
  const html = readFileSync(join(root, 'pages/formulario-analise-fisico-quimica.html'), 'utf8');
  assert.match(html, /name="origem" value="WhatsApp"/);
  assert.match(html, /name="origem" value="QR Code \(Recepção\)"/);
  assert.match(html, /name="origem" value="E-mail"/);
  assert.doesNotMatch(html, /name="origem" value="Outros"/);
});

test('contrato contém as ações e abas do fluxo', () => {
  const source = readFileSync(join(root, 'apps-script/Code.gs'), 'utf8');
  for (const token of ['doPost', 'login', 'cadastrarUsuario', 'obterPerfil', 'listarUsuariosAdmin', 'atualizarUsuarioAdmin', 'listarHistoricoSolicitacoes', 'obterDetalhesSolicitacao', 'salvarSolicitacao', 'salvarSolicitacaoSementesR08', 'salvarSolicitacaoMicrobiologica', 'salvarSolicitacaoAmostrasFiscais', 'listarOpcoes', 'Usuarios', 'Solicitacoes', 'Amostras', 'SolicitacoesMicrobiologicas', 'EnsaiosMicrobiologicos', 'SolicitacoesAmostrasFiscais', 'AmostrasFiscais', 'SolicitacoesSementesR08', 'AmostrasSementesR08', 'Client_User', 'Manager_User', 'Administrator_User']) {
    assert.match(source, new RegExp(token));
  }
});

test('frontend mantém os requisitos de segurança e coleta', () => {
  const auth = readFileSync(join(root, 'js/auth.js'), 'utf8');
  const form = readFileSync(join(root, 'js/form-analise-sementes.js'), 'utf8');
  const html = readFileSync(join(root, 'pages/formulario-analise-sementes.html'), 'utf8');
  assert.match(auth, /localStorage/);
  assert.match(auth, /8/);
  assert.match(html, /data-componente="botao-adicionar-amostra"/);
  assert.match(html, /Para emissão de BAS devem ser solicitados os ensaios definitivos/);
  assert.match(form, /data-definitivo/);
  assert.match(form, /tratamento/);
});

test('cadastro e navegação usam logo, sidebar e grupos', () => {
  const cadastro = readFileSync(join(root, 'pages/cadastro.html'), 'utf8');
  const cadastroScript = readFileSync(join(root, 'js/cadastro.js'), 'utf8');
  const menu = readFileSync(join(root, 'pages/menu.html'), 'utf8');
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  const perfil = readFileSync(join(root, 'pages/dados-pessoais.html'), 'utf8');
  assert.match(cadastroScript, /cadastrarUsuario/);
  assert.match(cadastro, /logo_senai_fiems\.png/);
  assert.match(menu, /sidebar/);
  assert.match(componentes, /dados-pessoais\.html/);
  assert.match(perfil, /data-perfil-grupo/);
});

test('catálogo centralizado expõe os quatro serviços de análise', () => {
  const config = readFileSync(join(root, 'js/config.js'), 'utf8');
  assert.match(config, /analise-sementes/);
  assert.match(config, /analise-microbiologica/);
  assert.match(config, /amostras-fiscais/);
  assert.match(config, /analise-sementes-r08/);
});

test('catálogo de cards não contém texto com encoding corrompido', () => {
  const config = readFileSync(join(root, 'js/config.js'), 'utf8');
  assert.doesNotMatch(config, /[\u00C3\u00C2][\u0080-\u00BF]/);
});

test('páginas usam pontos de montagem dos componentes reutilizáveis', () => {
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  for (const nome of ['renderizarSidebar', 'renderizarRodape', 'renderizarCabecalhoFormulario', 'renderizarBotao', 'renderizarIcone']) {
    assert.match(componentes, new RegExp(nome));
  }
  for (const file of ['pages/menu.html', 'pages/dados-pessoais.html', 'pages/formulario-analise-sementes.html']) {
    const html = readFileSync(join(root, file), 'utf8');
    assert.match(html, /data-componente/);
    assert.match(html, /\.\.\/components\/componentes\.js/);
  }
});

test('análise microbiológica mantém o formulário e os campos laboratoriais separados', () => {
  const html = readFileSync(join(root, 'pages/formulario-analise-microbiologica.html'), 'utf8');
  const script = readFileSync(join(root, 'js/form-analise-microbiologica.js'), 'utf8');
  const config = readFileSync(join(root, 'js/config.js'), 'utf8');
  assert.match(html, /Razão Social/);
  assert.match(html, /Amostra Fiscal/);
  assert.match(script, /salvarSolicitacaoMicrobiologica/);
  assert.match(config, /M04/);
  assert.doesNotMatch(html, /Data de recebimento|Temperatura de recebimento|Análise Crítica|Situação da amostra/);
});

test('novas análises mantêm páginas, contratos e campos laboratoriais separados', () => {
  const fiscal = readFileSync(join(root, 'pages/formulario-amostras-fiscais.html'), 'utf8');
  const fiscalScript = readFileSync(join(root, 'js/form-amostras-fiscais.js'), 'utf8');
  const r08 = readFileSync(join(root, 'pages/formulario-analise-sementes-r08.html'), 'utf8');
  assert.match(fiscal, /Razão Social|RazÃ£o Social/);
  assert.match(fiscal, /Fiscal Representativo|Fiscal Representativo/);
  assert.match(fiscalScript, /salvarSolicitacaoAmostrasFiscais/);
  assert.match(r08, /data-api-action="salvarSolicitacaoSementesR08"/);
  assert.doesNotMatch(fiscal, /Data do Recebimento|Hora do Recebimento|Responsável pelo Recebimento/);
  assert.doesNotMatch(r08, /Peso amostra|Análise crítica|Protocolo da amostra/);
});

test('administração de usuários possui rota protegida e não expõe senhas', () => {
  const pagina = readFileSync(join(root, 'pages/administracao-usuarios.html'), 'utf8');
  const script = readFileSync(join(root, 'js/admin-usuarios.js'), 'utf8');
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  const auth = readFileSync(join(root, 'js/auth.js'), 'utf8');
  const css = readFileSync(join(root, 'css/style.css'), 'utf8');
  assert.match(pagina, /data-pagina-ativa="administracao"/);
  assert.match(script, /listarUsuariosAdmin/);
  assert.match(script, /atualizarUsuarioAdmin/);
  assert.doesNotMatch(script, /senha/);
  assert.match(componentes, /data-admin-only hidden/);
  assert.match(auth, /Administrator_User/);
  assert.match(css, /sidebar-nav a\[data-admin-only\]\[hidden\][^}]*display: none/);
  assert.match(pagina, /admin-refresh-button/);
  assert.match(css, /\.admin-refresh-button/);
});

test('histórico possui rota, filtro protegido e detalhes públicos', () => {
  const pagina = readFileSync(join(root, 'pages/historico-solicitacoes.html'), 'utf8');
  const script = readFileSync(join(root, 'js/historico-solicitacoes.js'), 'utf8');
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  const api = readFileSync(join(root, 'apps-script/Code.gs'), 'utf8');
  assert.match(pagina, /data-pagina-ativa="historico"/);
  assert.match(script, /listarHistoricoSolicitacoes/);
  assert.match(script, /obterDetalhesSolicitacao/);
  assert.match(componentes, /data-historico/);
  assert.match(api, /SolicitacoesSementesR08/);
  assert.match(api, /SolicitacoesAmostrasFiscais/);
  assert.doesNotMatch(script, /data_recebimento|peso_amostra_g|senha/);
});

test('histórico exporta relatórios resumido e individual com dados públicos', () => {
  const script = readFileSync(join(root, 'js/historico-solicitacoes.js'), 'utf8');
  for (const token of ['RelatoriosPdf.baixarResumo', 'RelatoriosPdf.baixarIndividual', 'history-export-summary', 'history-export-individual']) {
    assert.match(script, new RegExp(token.replace('.', '\\.')));
  }
  assert.doesNotMatch(script, /data_recebimento|peso_amostra_g|senha/);
});

test('botão da tabela baixa o relatório individual da solicitação', () => {
  const script = readFileSync(join(root, 'js/historico-solicitacoes.js'), 'utf8');
  assert.match(script, />Baixar PDF<\/button>/);
  assert.match(script, /baixarRelatorio[\s\S]*RelatoriosPdf\.baixarIndividual/);
  assert.doesNotMatch(script, /carregarDetalhes\(botao\.dataset\.tipo, botao\.dataset\.id\)/);
});

test('páginas organizadas e entrada do GitHub Pages preservada', () => {
  const entrada = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(entrada, /pages\/index\.html/);
  assert.match(readFileSync(join(root, 'components/componentes.js'), 'utf8'), /<svg/);
  assert.match(readFileSync(join(root, 'css/style.css'), 'utf8'), /form-card::before/);
});

test('formulário de sementes mantém contraste e ações visuais do cabeçalho', () => {
  const html = readFileSync(join(root, 'pages/formulario-analise-sementes.html'), 'utf8');
  const css = readFileSync(join(root, 'css/style.css'), 'utf8');
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  assert.match(html, /data-componente="botao-voltar-menu" data-classe="form-back-button"/);
  assert.match(html, /data-componente="botao-limpar" data-id="clear-button"/);
  assert.match(componentes, /form-menu-button/);
  assert.match(css, /\.form-menu-button/);
  assert.match(css, /\.form-header-light/);
  assert.match(css, /\.form-header-light \.brand-subtitle/);
  assert.match(css, /\.form-header-light \.user-name/);
  assert.match(css, /\.form-header-light \.button\.secondary/);
  assert.match(componentes, /class="app-header form-header-light"/);
  assert.doesNotMatch(componentes, /form-sementes-page/);
  for (const nome of ['renderizarBotaoVoltarMenu', 'renderizarBotaoAdicionarAmostra']) {
    assert.match(componentes, new RegExp(nome));
  }
  assert.match(componentes, /logout-button/);
  assert.match(css, /\.sample-add-button/);
  assert.match(css, /\.logout-button/);
  for (const file of ['pages/formulario-analise-sementes.html', 'pages/formulario-analise-microbiologica.html']) {
    const pagina = readFileSync(join(root, file), 'utf8');
    assert.match(pagina, /data-componente="botao-voltar-menu"/);
  }
});

test('footer compartilhado permanece no rodapé sem sobrepor conteúdo', () => {
  const css = readFileSync(join(root, 'css/style.css'), 'utf8');
  assert.match(css, /\.content-area \{[^}]*display: flex/);
  assert.match(css, /\.content-inner \{[^}]*display: flex/);
  assert.match(css, /\.content-inner > \.app-footer \{[^}]*margin-top: auto/);
  assert.match(css, /\.page > \.app-footer \{[^}]*margin-top: auto/);
  assert.doesNotMatch(css, /\.app-footer\s*\{[^}]*position:\s*fixed/);
});

test('ações das análises usam componentes de botões padronizados', () => {
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  assert.match(componentes, /renderizarBotaoEnviar/);
  assert.match(componentes, /renderizarBotaoLimpar/);
  for (const file of [
    'pages/formulario-analise-sementes.html',
    'pages/formulario-analise-microbiologica.html',
    'pages/formulario-amostras-fiscais.html'
  ]) {
    const html = readFileSync(join(root, file), 'utf8');
    assert.match(html, /data-componente="botao-enviar"/);
    assert.match(html, /data-componente="botao-limpar"/);
    assert.match(html, /data-componente="botao-voltar-menu"/);
  }
});

test('páginas de análise e histórico carregam os recursos de relatório PDF', () => {
  const paginas = [
    'pages/formulario-analise-sementes.html',
    'pages/formulario-analise-microbiologica.html',
    'pages/formulario-amostras-fiscais.html',
    'pages/formulario-analise-sementes-r08.html',
    'pages/historico-solicitacoes.html'
  ];
  for (const file of paginas) {
    const html = readFileSync(join(root, file), 'utf8');
    assert.match(html, /cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf\/2\.5\.1/);
    assert.match(html, /sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==/);
    assert.match(html, /\.\.\/components\/pdf-relatorios\.js/);
  }
  assert.match(readFileSync(join(root, 'components/componentes.js'), 'utf8'), /renderizarBotaoBaixarPdf/);
  assert.match(readFileSync(join(root, 'components/componentes.js'), 'utf8'), /renderizarBotaoExportarResumo/);
});

test('formulários liberam comprovante PDF somente após envio bem-sucedido', () => {
  for (const file of [
    'js/form-analise-sementes.js',
    'js/form-analise-microbiologica.js',
    'js/form-amostras-fiscais.js'
  ]) {
    const script = readFileSync(join(root, file), 'utf8');
    assert.match(script, /RelatoriosPdf\.baixarComprovante/);
    assert.match(script, /solicitacaoId/);
    assert.match(script, /botaoPdf\.hidden = false/);
  }
});

test('README documenta a geração local de PDFs', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  assert.match(readme, /PDF/);
  assert.match(readme, /jsPDF/);
  assert.match(readme, /não são enviados ou gravados no Google Sheets/i);
});
