import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const contexto = { window: {} };
runInNewContext(readFileSync('js/validacoes.js', 'utf8'), contexto);
const { mascaraCpfCnpj, validarCpfCnpj, validarSafra } = contexto.window.Validacoes;

test('máscara de CNPJ mantém os quatro blocos na ordem correta', () => {
  assert.equal(mascaraCpfCnpj('12345678000195'), '12.345.678/0001-95');
});

test('valida CPF e CNPJ com dígitos verificadores', () => {
  assert.equal(validarCpfCnpj('52998224725'), true);
  assert.equal(validarCpfCnpj('11222333000181'), true);
  assert.equal(validarCpfCnpj('52998224726'), false);
});

test('aceita somente safra no formato ano/ano', () => {
  assert.equal(validarSafra('2023/24'), true);
  assert.equal(validarSafra('2023-24'), false);
});
