import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

function setup(tipo = 'FISICA', profile = 'CLIENTE') {
  const events = {};
  const inputs = ['nome','email','senha','confirmarSenha','tipoUsuario','tipoPessoa','razaoSocial','nomeFantasia','endereco','cidade','estado','cep','telefone','cpfCnpj','inscricaoEstadualRg','ramoAtividade','numeroFuncionarios','renasem'].map(name => ({ name, value: '', disabled: false, required: false, hidden: false, handlers: {}, addEventListener(k, fn) { this.handlers[k] = fn; }, closest() { return this; } }));
  const fields = Object.assign(inputs, Object.fromEntries(inputs.map(f => [f.name, f])));
  const values = { nome:'Cliente Teste',email:'teste@example.test',senha:'senha-sintetica',confirmarSenha:'senha-sintetica',tipoUsuario:profile,tipoPessoa:tipo,razaoSocial:'Empresa',nomeFantasia:'Teste',endereco:'Rua',cidade:'Campo Grande',estado:'MS',cep:'79000-000',telefone:'67999999999',cpfCnpj:tipo === 'FISICA' ? '52998224725':'04252011000110',inscricaoEstadualRg:'123',ramoAtividade:'Alimentos',numeroFuncionarios:'2' };
  Object.entries(values).forEach(([name, value]) => { fields[name].value = value; });
  const button = { disabled:false }; const status = { textContent:'', className:'', scrollIntoView() {} }; const list = { children:[], appendChild(item) { this.children.push(item); } };
  const block = { hidden:true, querySelectorAll: () => inputs.filter(f => !['nome','email','senha','confirmarSenha','tipoUsuario'].includes(f.name)) };
  const nodes = { '#cadastro-status':status,'#cliente-cadastro':block,'#contatos-cliente':list,'#documentos-cadastro':{}, '#adicionar-contato':{ addEventListener() {} },'#cpf-cnpj-label':{},'#inscricao-label':{},'#cliente-dados-titulo':{} };
  const form = Object.assign({ elements:fields, addEventListener(k, fn) { events[k] = fn; }, closest: () => ({ classList: { toggle() {} } }),
    querySelector: () => button,
    querySelectorAll(selector) { if (selector.includes('tipoUsuario')) return [fields.tipoUsuario]; return selector.includes('.invalid') || selector === '[data-empresa-linha]' ? [] : [...inputs, button]; },
    reportValidity: () => inputs.every(f => f.disabled || !f.required || Boolean(f.value)) }, Object.fromEntries(inputs.map(f => [f.name,f])));
  const uploads = { active:false, tipo:'', count:0, atualizar(t, a) { this.tipo = t; this.active = a; }, async coletar() { this.count++; return [{ categoria:'DOCUMENTO_FOTO' },{ categoria:'COMPROVANTE_RESIDENCIA' }]; } };
  const received = []; let failure = false; const storage = new Map();
  const ctx = vm.createContext({ window:{ location:{ href:'' } }, crypto, sessionStorage:{ getItem:k => storage.get(k) || null, setItem:(k,v) => storage.set(k,v) },
    UploadDocumentos:{ criar:() => uploads },
    AppAuth:{ async cadastrarUsuario(p) { received.push(p); if (failure) throw new Error('Falha sintética de envio'); } },
    document:{ querySelector: selector => selector === '#cadastro-form' ? form : nodes[selector] || null,
      createElement() { const contact = { nome:'Contato',cpf:'52998224725',email:'contato@example.test',telefone:'67999999999',cargo:'Contato',departamento:'Contato' }; const names={ contatoNome:'nome',contatoCpf:'cpf',contatoEmail:'email',contatoTelefone:'telefone',contatoCargo:'cargo',contatoDepartamento:'departamento' };
        const removable={ classList:{add(){}},addEventListener(){} }; const cfields={}; Object.entries(names).forEach(([n,k]) => { cfields[n]={ value:contact[k], addEventListener(){} }; }); ['recebeNotaFiscalBoleto','recebeProposta','recebeRelatorio'].forEach(n => { cfields[n]={ checked:n === 'recebeProposta' }; });
        return { querySelector(s) { return s === '.remover-contato' ? removable : cfields[s.match(/name="([^"]+)"/)?.[1]]; }, querySelectorAll:() => [] }; } }
  });
  vm.runInContext(readFileSync('js/validacoes.js','utf8'),ctx);
  ctx.Validacoes = ctx.window.Validacoes;
  vm.runInContext(readFileSync('js/cadastro.js','utf8'),ctx);
  return { fields, uploads, received, status, ctx, block, list, async submit() { await events.submit({ preventDefault(){}, currentTarget:form }); }, fail(v) { failure=v; } };
}
test('inicializacao adapta PF e torna documentos obrigatorios apenas para cliente', () => {
  const e=setup(); assert.equal(e.fields.razaoSocial.disabled,true); assert.equal(e.fields.cpfCnpj.required,true); assert.equal(e.uploads.active,true);
  const c=setup('FISICA','COLABORADOR_SENAI'); assert.equal(c.uploads.active,false);
});
test('PF envia tipoPessoa cadastroId e documentos sem exigir campos empresariais', async () => {
  const e=setup(); e.fields.razaoSocial.value=''; await e.submit(); assert.equal(e.received.length,1);
  assert.equal(e.received[0].tipoPessoa,'FISICA'); assert.match(e.received[0].cadastroId,/^[a-f0-9-]{36}$/i); assert.equal(e.received[0].documentos.length,2);
});
test('PJ exige CNPJ e campos empresariais', async () => {
  const e=setup('JURIDICA'); e.fields.razaoSocial.value=''; await e.submit(); assert.equal(e.received.length,0); assert.ok(e.status.textContent);
  e.fields.razaoSocial.value='Empresa'; e.fields.cpfCnpj.value='52998224725'; await e.submit(); assert.equal(e.received.length,0);
});
test('falha visivel permite reenvio com mesmo cadastroId sem guardar senha', async () => {
  const e=setup(); e.fail(true); await e.submit(); assert.match(e.status.textContent,/Falha sintética/); const id=e.received[0].cadastroId;
  e.fail(false); await e.submit(); assert.equal(e.received[1].cadastroId,id); assert.match(e.ctx.window.location.href,/cadastro=sucesso/);
});
test('colaborador envia cadastro sem serializar documentos', async () => {
  const e=setup('FISICA','COLABORADOR_SENAI'); await e.submit(); assert.equal(e.received.length,1); assert.equal(e.uploads.count,0); assert.equal(e.received[0].documentos,undefined);
});
test('cliente começa sem contatos e permite adicionar sob demanda', () => {
  const e=setup(); assert.equal(e.list.children.length,0);
});
