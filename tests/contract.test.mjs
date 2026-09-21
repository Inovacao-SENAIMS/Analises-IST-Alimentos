import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const requiredFiles = [
  'index.html', 'menu.html', 'formulario-analise-sementes.html',
  'css/style.css', 'js/config.js', 'js/auth.js', 'js/menu.js',
  'js/validacoes.js', 'js/form-analise-sementes.js',
  'apps-script/Code.gs', 'README.md'
];

test('entrega todos os arquivos públicos do aplicativo', () => {
  for (const file of requiredFiles) assert.equal(existsSync(join(root, file)), true, file);
});

test('contrato contém as ações e abas do fluxo', () => {
  const source = readFileSync(join(root, 'apps-script/Code.gs'), 'utf8');
  for (const token of ['doPost', 'login', 'salvarSolicitacao', 'listarOpcoes', 'Usuarios', 'Solicitacoes', 'Amostras']) {
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
