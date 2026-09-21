import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const requiredFiles = [
  'index.html', 'menu.html', 'formulario-analise-sementes.html',
  'cadastro.html', 'dados-pessoais.html',
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
  for (const token of ['doPost', 'login', 'cadastrarUsuario', 'obterPerfil', 'salvarSolicitacao', 'listarOpcoes', 'Usuarios', 'Solicitacoes', 'Amostras', 'Client_User', 'Manager_User', 'Administrator_User']) {
    assert.match(source, new RegExp(token));
  }
});

test('frontend mantém os requisitos de segurança e coleta', () => {
  const auth = readFileSync(join(root, 'js/auth.js'), 'utf8');
  const form = readFileSync(join(root, 'js/form-analise-sementes.js'), 'utf8');
  const html = readFileSync(join(root, 'formulario-analise-sementes.html'), 'utf8');
  assert.match(auth, /localStorage/);
  assert.match(auth, /8/);
  assert.match(html, /Adicionar amostra/);
  assert.match(html, /Para emissão de BAS devem ser solicitados os ensaios definitivos/);
  assert.match(form, /data-definitivo/);
  assert.match(form, /tratamento/);
});

test('cadastro e navegação usam logo, sidebar e grupos', () => {
  const cadastro = readFileSync(join(root, 'cadastro.html'), 'utf8');
  const cadastroScript = readFileSync(join(root, 'js/cadastro.js'), 'utf8');
  const menu = readFileSync(join(root, 'menu.html'), 'utf8');
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  const perfil = readFileSync(join(root, 'dados-pessoais.html'), 'utf8');
  assert.match(cadastroScript, /cadastrarUsuario/);
  assert.match(cadastro, /logo_senai_fiems\.png/);
  assert.match(menu, /sidebar/);
  assert.match(componentes, /dados-pessoais\.html/);
  assert.match(perfil, /data-perfil-grupo/);
});

test('páginas usam pontos de montagem dos componentes reutilizáveis', () => {
  const componentes = readFileSync(join(root, 'components/componentes.js'), 'utf8');
  for (const nome of ['renderizarSidebar', 'renderizarRodape', 'renderizarCabecalhoFormulario', 'renderizarBotao', 'renderizarIcone']) {
    assert.match(componentes, new RegExp(nome));
  }
  for (const file of ['menu.html', 'dados-pessoais.html', 'formulario-analise-sementes.html']) {
    const html = readFileSync(join(root, file), 'utf8');
    assert.match(html, /data-componente/);
    assert.match(html, /components\/componentes\.js/);
  }
});
