import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

function load() {
  const ctx = vm.createContext({ window: {}, FileReader: class {
    readAsDataURL(file) { this.result = `data:${file.type};base64,${Buffer.from(file.bytes || '%PDF-test').toString('base64')}`; this.onload(); }
  } });
  if (existsSync('components/upload-arquivos.js')) vm.runInContext(readFileSync('components/upload-arquivos.js', 'utf8'), ctx);
  assert.ok(ctx.window.UploadDocumentos, 'componente UploadDocumentos deve existir');
  return ctx.window.UploadDocumentos;
}
const file = (overrides = {}) => ({ name: 'documento.pdf', type: 'application/pdf', size: 9, ...overrides });
function section() {
  const slots = [0, 1].map(() => {
    const input = { files: [], value: '', disabled: false, required: false, dataset: {}, listeners: {}, addEventListener(k, fn) { this.listeners[k] = fn; }, setCustomValidity(v) { this.validity = v; } };
    const label = { textContent: '' }; const message = { textContent: '' }; const remove = { disabled: false, hidden: true, addEventListener(k, fn) { this[k] = fn; } };
    return { input, label, message, remove, querySelector(s) { return ({ 'input': input, '[data-documento-rotulo]': label, '[data-documento-status]': message, '[data-documento-remover]': remove })[s]; } };
  });
  return { hidden: true, slots, querySelectorAll: () => slots };
}
test('limite exato aceito e excesso, arquivo vazio ou MIME errado rejeitados', () => {
  const api = load(); assert.doesNotThrow(() => api.validarArquivo(file({ size: 5242880 })));
  for (const f of [file({ size: 5242881 }), file({ size: 0 }), file({ type: 'image/svg+xml', name: 'foto.svg' }), file({ name: 'foto.exe' }), file({ type: 'image/png' })]) assert.throws(() => api.validarArquivo(f));
});
test('serializacao retorna conteudo Base64 e categoria sem guardar arquivo no storage', async () => {
  const api = load(); const result = await api.serializarArquivo(file(), 'DOCUMENTO_FOTO');
  assert.equal(result.categoria, 'DOCUMENTO_FOTO'); assert.equal(result.base64, Buffer.from('%PDF-test').toString('base64')); assert.equal(result.tamanho, 9);
});
test('PF e PJ mostram duas categorias distintas e limpam selecao na troca', () => {
  const api = load(); const sec = section(); const control = api.criar(sec);
  control.atualizar('FISICA', true); assert.equal(sec.hidden, false); assert.equal(sec.slots[0].input.dataset.documentoCategoria, 'DOCUMENTO_FOTO'); assert.equal(sec.slots[1].input.required, true);
  sec.slots[0].input.value = 'fake'; sec.slots[0].input.files = [file()];
  control.atualizar('JURIDICA', true); assert.equal(sec.slots[0].input.value, ''); assert.equal(sec.slots[0].input.dataset.documentoCategoria, 'DOCUMENTO_RT'); assert.equal(sec.slots[1].input.dataset.documentoCategoria, 'ART');
});
test('colaborador oculta documentos e desabilita obrigatoriedade', () => {
  const sec = section(); const control = load().criar(sec); control.atualizar('FISICA', true); control.atualizar('FISICA', false);
  assert.equal(sec.hidden, true); for (const slot of sec.slots) { assert.equal(slot.input.disabled, true); assert.equal(slot.input.required, false); }
});
test('coleta exige exatamente um arquivo em cada campo', async () => {
  const sec = section(); const control = load().criar(sec); control.atualizar('FISICA', true); await assert.rejects(control.coletar());
  sec.slots[0].input.files = [file()]; sec.slots[1].input.files = [file()]; const docs = await control.coletar(); assert.equal(docs.length, 2);
  sec.slots[0].input.files.push(file()); await assert.rejects(control.coletar());
});
