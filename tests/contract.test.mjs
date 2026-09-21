import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const requiredFiles = [
  'index.html', 'pages/index.html', 'pages/menu.html', 'pages/formulario-analise-sementes.html',
  'pages/formulario-analise-microbiologica.html',
  'pages/cadastro.html', 'pages/dados-pessoais.html',
  'css/style.css', 'js/config.js', 'js/auth.js', 'js/menu.js',
  'js/validacoes.js', 'js/form-analise-sementes.js', 'js/cadastro.js', 'js/perfil.js',
  'components/componentes.js',
  'apps-script/Code.gs', 'README.md'
];

test('entrega todos os arquivos públicos do aplicativo', () => {
  for (const file of requiredFiles) assert.equal(existsSync(join(root, file)), true, file);
});

test('contrato contém as ações e abas do fluxo', () => {
  const source = readFileSync(join(root, 'apps-script/Code.gs'), 'utf8');
  for (const token of ['doPost', 'login', 'cadastrarUsuario', 'obterPerfil', 'salvarSolicitacao', 'salvarSolicitacaoMicrobiologica', 'listarOpcoes', 'Usuarios', 'Solicitacoes', 'Amostras', 'SolicitacoesMicrobiologicas', 'EnsaiosMicrobiologicos', 'Client_User', 'Manager_User', 'Administrator_User']) {
    assert.match(source, new RegExp(token));
  }
});

test('frontend mantém os requisitos de segurança e coleta', () => {
  const auth = readFileSync(join(root, 'js/auth.js'), 'utf8');
  const form = readFileSync(join(root, 'js/form-analise-sementes.js'), 'utf8');
  const html = readFileSync(join(root, 'pages/formulario-analise-sementes.html'), 'utf8');
  assert.match(auth, /localStorage/);
  assert.match(auth, /8/);
  assert.match(html, /Adicionar amostra/);
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

test('catálogo centralizado expõe os dois serviços de análise', () => {
  const config = readFileSync(join(root, 'js/config.js'), 'utf8');
  assert.match(config, /analise-sementes/);
  assert.match(config, /analise-microbiologica/);
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

test('páginas organizadas e entrada do GitHub Pages preservada', () => {
  const entrada = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(entrada, /pages\/index\.html/);
  assert.match(readFileSync(join(root, 'components/componentes.js'), 'utf8'), /<svg/);
  assert.match(readFileSync(join(root, 'css/style.css'), 'utf8'), /form-card::before/);
});
