import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const source = readFileSync('apps-script/Code.gs', 'utf8') + '\n' + readFileSync('apps-script/Documentos.gs', 'utf8');
const uuid = 'db39b85b-35fd-4b50-b143-6337d0840be1';
const headers = {
  Usuarios: ['email', 'senha', 'nome', 'ativo', 'grupo', 'data_cadastro'],
  Clientes: ['usuario_email', 'razao_social', 'nome_fantasia', 'renasem', 'endereco', 'cidade', 'estado', 'cep', 'telefone', 'cpf_cnpj', 'inscricao_estadual_rg', 'ramo_atividade', 'numero_funcionarios', 'data_cadastro'],
  ContatosClientes: ['usuario_email', 'nome', 'cpf', 'email', 'telefone', 'cargo', 'departamento', 'recebe_nota_fiscal_boleto', 'recebe_proposta', 'recebe_relatorio', 'data_cadastro']
};
const document = (categoria, bytes = Buffer.from('%PDF-1.7\nsynthetic'), mimeType = 'application/pdf') => ({ categoria, nome: 'teste.pdf', mimeType, tamanho: bytes.length, base64: bytes.toString('base64') });
function payload(tipoPessoa = 'FISICA') {
  return { nome: 'Cliente Teste', email: 'cliente@example.test', senha: 'senha-sintetica', tipoUsuario: 'CLIENTE', tipoPessoa, cadastroId: uuid,
    cliente: { razaoSocial: 'Empresa Teste', nomeFantasia: 'Teste', endereco: 'Rua Teste', cidade: 'Campo Grande', estado: 'MS', cep: '79000-000', telefone: '67999999999', cpfCnpj: tipoPessoa === 'FISICA' ? '529.982.247-25' : '04.252.011/0001-10', inscricaoEstadualRg: '1234567', ramoAtividade: 'Alimentos', numeroFuncionarios: '2' },
    contatos: [{ nome: 'Contato', cpf: '52998224725', email: 'contato@example.test', telefone: '67999999999', cargo: 'Contato', departamento: 'Atendimento', recebeProposta: true }],
    documentos: tipoPessoa === 'FISICA' ? [document('DOCUMENTO_FOTO'), document('COMPROVANTE_RESIDENCIA')] : [document('DOCUMENTO_RT'), document('ART')] };
}
function environment() {
  const state = { sheets: {}, files: new Map(), fail: '', sharing: 'PRIVATE', props: { DOCUMENTOS_CADASTRO_FOLDER_ID: 'root' } };
  function sheet(name, initial) {
    const data = initial || [[]];
    const obj = { data, getDataRange: () => ({ getValues: () => data.map(row => [...row]) }),
      getRange(r, c, nr = 1, nc = 1) { return { setValue(v) { return this.setValues([[v]]); }, setValues(values) {
        if (state.fail === name + ':set') throw new Error('synthetic write failure');
        for (let i = 0; i < nr; i++) { data[r - 1 + i] ||= []; for (let j = 0; j < nc; j++) data[r - 1 + i][c - 1 + j] = values[i][j]; }
        if (r > 1 && state.fail === name + ':set:after') throw new Error('synthetic response failure');
      } }; },
      appendRow(row) { if (state.fail === name + ':append') throw new Error('synthetic append failure'); data.push([...row]); if (state.fail === name + ':append:after') throw new Error('synthetic response failure'); },
      deleteRow(r) { data.splice(r - 1, 1); } };
    state.sheets[name] = obj; return obj;
  }
  Object.entries(headers).forEach(([name, cols]) => sheet(name, [[...cols]]));
  const iterator = values => { let i = 0; return { hasNext: () => i < values.length, next: () => values[i++] }; };
  let counter = 0;
  function folder(id, name) {
    const children = [];
    return { getId: () => id, getSharingAccess: () => state.sharing, getFoldersByName: n => iterator(children.filter(child => child.name === n).map(child => child.folder)),
      createFolder(n) { if (state.fail === 'folder') throw new Error('synthetic folder failure'); const f = folder('folder-' + ++counter, n); children.push({ name: n, folder: f }); return f; },
      createFile(blob) { if (state.fail === 'Drive') throw new Error('synthetic drive failure'); const fileId = 'file-' + ++counter;
        const file = { folderId: id, name: blob.getName(), getId: () => fileId, isTrashed: () => false, setTrashed(v) { if (v) state.files.delete(fileId); return file; }, getBlob: () => blob };
        state.files.set(fileId, file); if (state.fail === 'Drive:after') throw new Error('synthetic drive response failure'); return file; },
      getFilesByName: n => iterator([...state.files.values()].filter(file => file.folderId === id && file.name === n)) };
  }
  const root = folder('root', 'root');
  const ctx = vm.createContext({ console, Date, JSON, Buffer,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: name => state.sheets[name] || null, insertSheet: name => sheet(name) }), flush() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => state.props[key] || null, setProperty: (key, value) => { state.props[key] = value; } }) },
    LockService: { getDocumentLock: () => null, getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    DriveApp: { Access: { PRIVATE: 'PRIVATE' }, getFolderById: id => { if (id === 'root') return root; return root.getFoldersByName(uuid).next(); }, getFileById: id => { if (!state.files.has(id)) throw new Error('missing file'); return state.files.get(id); } },
    Logger: { log() {} },
    Utilities: { getUuid: () => crypto.randomUUID(), base64Decode: s => [...Buffer.from(s, 'base64')], base64Encode: b => Buffer.from(b).toString('base64'),
      newBlob: (bytes, mime, name) => ({ getBytes: () => bytes, getContentType: () => mime, getName: () => name, getDataAsString: () => Buffer.from(bytes).toString() }),
      DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (_, data) => [...crypto.createHash('sha256').update(typeof data === 'string' ? data : Buffer.from(data)).digest()],
      computeHmacSha256Signature: (data, key) => [...crypto.createHmac('sha256', key).update(data).digest()],
      base64EncodeWebSafe: value => Buffer.from(typeof value === 'string' ? value : value).toString('base64url'), base64DecodeWebSafe: value => [...Buffer.from(value, 'base64url')] }
  });
  vm.runInContext(source, ctx);
  const run = p => ctx.cadastrarUsuario(p);
  const row = (name, index = 1) => Object.fromEntries(state.sheets[name].data[0].map((key, i) => [key, state.sheets[name].data[index]?.[i]]));
  return { state, ctx, run, row };
}

test('cliente sem documentos obrigatorios e rejeitado antes de gravar', () => {
  const e = environment(); const p = payload(); delete p.documentos;
  assert.equal(e.run(p).sucesso, false); assert.equal(e.state.sheets.Usuarios.data.length, 1);
});
test('PF conclui somente com dois documentos e registra metadados privados', () => {
  const e = environment(); const p = payload(); delete p.cliente.razaoSocial; delete p.cliente.nomeFantasia; delete p.cliente.ramoAtividade; delete p.cliente.numeroFuncionarios;
  assert.equal(e.run(p).sucesso, true); assert.equal(e.row('Usuarios').estado_documental, 'CONCLUIDO'); assert.equal(e.row('Usuarios').ativo, true);
  assert.equal(e.state.files.size, 2); assert.equal(e.state.sheets.DocumentosUsuarios.data.length, 3); assert.equal(e.row('Clientes').razao_social, p.nome);
});
test('cliente conclui cadastro sem contatos de referencia', () => {
  for (const contatos of [[], undefined]) {
    const e = environment(); const p = payload();
    if (contatos === undefined) delete p.contatos; else p.contatos = contatos;
    assert.equal(e.run(p).sucesso, true);
    assert.equal(e.row('Usuarios').ativo, true);
    assert.equal(e.state.sheets.Clientes.data.length, 2);
    assert.equal(e.state.sheets.ContatosClientes.data.length, 1);
  }
});
test('cada CPF/CNPJ aceita apenas um cadastro', () => {
  const e = environment();
  assert.equal(e.run(payload()).sucesso, true);
  const repetido = payload(); repetido.email = 'outro@example.test'; repetido.cadastroId = crypto.randomUUID();
  const r = e.run(repetido);
  assert.equal(r.sucesso, false); assert.match(r.mensagem, /CPF\/CNPJ/);
  assert.equal(e.state.sheets.Clientes.data.length, 2);
  assert.equal(e.state.files.size, 2);
  const distinto = payload(); distinto.email = 'terceiro@example.test'; distinto.cadastroId = crypto.randomUUID(); distinto.cliente.cpfCnpj = '111.444.777-35';
  assert.equal(e.run(distinto).sucesso, true);
  assert.equal(e.state.sheets.Clientes.data.length, 3);
});
test('obterPerfil entrega os dados do cadastro do cliente', () => {
  const e = environment(); const p = payload(); assert.equal(e.run(p).sucesso, true);
  const token = e.ctx.login(p.email, p.senha).dados.token;
  const perfil = e.ctx.obterPerfil(token);
  assert.equal(perfil.sucesso, true);
  assert.equal(perfil.dados.cliente.cpfCnpj, p.cliente.cpfCnpj);
  assert.equal(perfil.dados.cliente.cidade, p.cliente.cidade);
  assert.equal(perfil.dados.contatos.length, 1);
  assert.equal(perfil.dados.contatos[0].email, 'contato@example.test');
  assert.equal(perfil.dados.contatos[0].recebeProposta, true);
});
test('gestão de documentos restringe ao IST e entrega o anexo', () => {
  const e = environment(); const p = payload(); assert.equal(e.run(p).sucesso, true);
  const cliente = e.ctx.login(p.email, p.senha).dados.token;
  assert.equal(e.ctx.listarDocumentos(cliente).sucesso, false);
  const usuarios = e.state.sheets.Usuarios;
  usuarios.data[1][usuarios.data[0].indexOf('grupo')] = 'Administrator_User';
  const token = e.ctx.login(p.email, p.senha).dados.token;
  const lista = e.ctx.listarDocumentos(token);
  assert.equal(lista.sucesso, true);
  assert.equal(lista.dados.documentos.length, 2);
  assert.equal(lista.dados.documentos[0].usuarioEmail, p.email);
  const arquivo = e.ctx.obterDocumento({ documentoId: lista.dados.documentos[0].documentoId }, token);
  assert.equal(arquivo.sucesso, true);
  assert.equal(Buffer.from(arquivo.dados.base64, 'base64').subarray(0, 5).toString(), '%PDF-');
});
test('PJ exige documento do RT e ART', () => {
  const e = environment(); const p = payload('JURIDICA'); p.documentos[1].categoria = 'COMPROVANTE_RESIDENCIA';
  assert.equal(e.run(p).sucesso, false); assert.equal(e.state.files.size, 0);
  p.documentos[1].categoria = 'ART'; assert.equal(e.run(p).sucesso, true);
});
test('rejeita quantidade, categorias duplicadas e tipo de pessoa invalido', () => {
  for (const mutate of [p => p.documentos.pop(), p => p.documentos.push(document('ART')), p => p.documentos[1].categoria = 'DOCUMENTO_FOTO', p => p.tipoPessoa = 'OUTRO']) {
    const e = environment(); const p = payload(); mutate(p); assert.equal(e.run(p).sucesso, false); assert.equal(e.state.sheets.Usuarios.data.length, 1);
  }
});
test('rejeita assinatura, MIME, extensao, vazio e tamanho real adulterados', () => {
  for (const mutate of [d => d.base64 = Buffer.from('not a pdf').toString('base64'), d => d.mimeType = 'image/png', d => d.nome = 'teste.exe', d => { d.base64 = ''; d.tamanho = 0; }, d => d.tamanho = 999, d => d.base64 = '%%%']) {
    const e = environment(); const p = payload(); mutate(p.documentos[0]); assert.equal(e.run(p).sucesso, false); assert.equal(e.state.files.size, 0);
  }
});
test('limite exato de 5 MiB aceito e limite excedido rejeitado', () => {
  const bytes = Buffer.alloc(5242880); bytes.write('%PDF-1.7'); const e = environment(); const p = payload(); p.documentos[0] = document('DOCUMENTO_FOTO', bytes);
  assert.equal(e.run(p).sucesso, true);
  const oversized = Buffer.alloc(5242881); oversized.write('%PDF-1.7'); const e2 = environment(); p.documentos[0] = document('DOCUMENTO_FOTO', oversized); assert.equal(e2.run(p).sucesso, false);
});
test('PNG e JPEG validos aceitos', () => {
  const e = environment(); const p = payload(); p.documentos = [
    { ...document('DOCUMENTO_FOTO', Buffer.from([137,80,78,71,13,10,26,10,0]), 'image/png'), nome: 'foto.png' },
    { ...document('COMPROVANTE_RESIDENCIA', Buffer.from([255,216,255,224,0]), 'image/jpeg'), nome: 'foto.jpg' }];
  assert.equal(e.run(p).sucesso, true);
});
test('pasta nao configurada nao cria conta', () => { const e = environment(); e.state.props = {}; assert.equal(e.run(payload()).sucesso, false); assert.equal(e.state.sheets.Usuarios.data.length, 1); });
test('configuracao aceita ID com espacos ou URL completa da pasta', () => {
  for (const valor of ['  root  ', 'https://drive.google.com/drive/folders/root']) {
    const e = environment(); e.state.props.DOCUMENTOS_CADASTRO_FOLDER_ID = valor;
    assert.equal(e.run(payload()).sucesso, true);
    assert.equal(e.state.files.size, 2);
  }
});
test('pasta inacessivel orienta revisar a configuracao', () => {
  const e = environment(); e.state.props.DOCUMENTOS_CADASTRO_FOLDER_ID = 'pasta-inexistente';
  const r = e.run(payload());
  assert.equal(r.sucesso, false);
  assert.match(r.mensagem, /não foi encontrada|não tem acesso/);
  assert.equal(e.state.sheets.Usuarios.data.length, 1);
});
test('falha de Drive bloqueia login e reenvio retoma sem duplicar', () => {
  const e = environment(); const p = payload(); e.state.fail = 'Drive'; assert.equal(e.run(p).sucesso, false);
  assert.equal(e.row('Usuarios').ativo, false); assert.equal(e.row('Usuarios').estado_documental, 'PENDENTE');
  assert.equal(e.ctx.login(p.email, p.senha).sucesso, false);
  e.state.fail = ''; assert.equal(e.run(p).sucesso, true); assert.equal(e.state.sheets.Usuarios.data.length, 2); assert.equal(e.state.files.size, 2);
});
test('falha de metadados compensa arquivo sem liberar acesso', () => {
  const e = environment(); const p = payload(); e.state.fail = 'DocumentosUsuarios:append'; assert.equal(e.run(p).sucesso, false);
  assert.equal(e.state.files.size, 0); assert.equal(e.row('Usuarios').ativo, false); e.state.fail = ''; assert.equal(e.run(p).sucesso, true);
});
test('falha em contatos retoma perfil sem duplicar', () => {
  const e = environment(); const p = payload(); e.state.fail = 'ContatosClientes:append'; assert.equal(e.run(p).sucesso, false); assert.equal(e.row('Usuarios').ativo, false);
  e.state.fail = ''; assert.equal(e.run(p).sucesso, true); assert.equal(e.state.sheets.Clientes.data.length, 2); assert.equal(e.state.sheets.ContatosClientes.data.length, 2); assert.equal(e.state.files.size, 2);
});
test('resposta perdida e repeticao nao duplicam cadastro concluido', () => {
  const e = environment(); const p = payload(); assert.equal(e.run(p).sucesso, true); assert.equal(e.run(p).sucesso, true);
  assert.equal(e.state.files.size, 2); assert.equal(e.state.sheets.Usuarios.data.length, 2); assert.equal(e.state.sheets.ContatosClientes.data.length, 2);
});
test('retomada nao aceita credenciais ou identidade adulteradas', () => {
  const e = environment(); const p = payload(); e.state.fail = 'Drive'; e.run(p); e.state.fail = '';
  for (const mutate of [p => p.senha = 'outra-senha', p => p.cadastroId = crypto.randomUUID(), p => p.nome = 'Outro Cliente', p => p.cliente.cpfCnpj = '11111111111', p => p.documentos[0] = document('DOCUMENTO_FOTO', Buffer.from('%PDF-outro'))]) {
    const clone = structuredClone(p); mutate(clone); assert.equal(e.run(clone).sucesso, false);
  }
  assert.equal(e.state.files.size, 0); assert.equal(e.run(p).sucesso, true);
});
test('administrador nao ativa cliente documentalmente pendente', () => {
  const e = environment(); const p = payload(); e.state.fail = 'Drive'; e.run(p); e.ctx.administrador_ = () => ({ usuario: { email: 'admin@example.test' } });
  assert.equal(e.ctx.atualizarUsuarioAdmin({ email: p.email, ativo: true, grupo: 'Client_User' }, 'synthetic').sucesso, false);
  assert.equal(e.row('Usuarios').ativo, false);
});
test('colaborador preserva fluxo sem documentos ou Drive', () => {
  const e = environment(); e.state.props = {}; const p = { nome: 'Colaborador', email: 'colaborador@example.test', senha: 'senha-sintetica', tipoUsuario: 'COLABORADOR_SENAI' };
  assert.equal(e.run(p).sucesso, true); assert.equal(e.row('Usuarios').grupo, 'IST_Colaborators'); assert.equal(e.state.files.size, 0);
});
test('login legado permanece valido sem estado documental', () => {
  const e = environment(); e.state.sheets.Usuarios.appendRow(['legado@example.test', 'senha-sintetica', 'Legado', true, 'Client_User', new Date()]);
  assert.equal(e.ctx.login('legado@example.test', 'senha-sintetica').sucesso, true);
});
test('retoma metadados de arquivo ausente sem duplicar linha', () => {
  const e=environment(); const p=payload(); e.state.fail='ContatosClientes:append'; e.run(p); const metadataCount=e.state.sheets.DocumentosUsuarios.data.length;
  e.state.files.delete(e.row('DocumentosUsuarios').arquivo_drive_id); e.state.fail=''; assert.equal(e.run(p).sucesso,true);
  assert.equal(e.state.files.size,2); assert.equal(e.state.sheets.DocumentosUsuarios.data.length,metadataCount);
});
test('metadata efetivada antes da excecao nao perde arquivo', () => {
  const e=environment(); const p=payload(); e.state.fail='DocumentosUsuarios:append:after'; e.run(p); e.state.fail='';
  assert.equal(e.run(p).sucesso,true); assert.equal(e.state.files.size,2); assert.equal(e.state.sheets.DocumentosUsuarios.data.length,3);
});
test('falha na resposta de Drive retoma arquivo existente sem duplicar', () => {
  const e=environment(); const p=payload(); e.state.fail='Drive:after'; assert.equal(e.run(p).sucesso,false); assert.equal(e.state.files.size,1);
  e.state.fail=''; assert.equal(e.run(p).sucesso,true); assert.equal(e.state.files.size,2);
});
test('falha no retorno da ativacao concluida e reconhecida', () => {
  const e=environment(); const p=payload(); e.state.fail='Usuarios:set:after'; const first=e.run(p);
  assert.equal(first.sucesso,true); assert.equal(e.row('Usuarios').estado_documental,'CONCLUIDO');
});
test('pasta com compartilhamento publico e rejeitada', () => {
  const e=environment(); e.state.sharing='ANYONE'; assert.equal(e.run(payload()).sucesso,false); assert.equal(e.state.sheets.Usuarios.data.length,1);
});
test('arquivo na lixeira nao libera cadastro e e substituido na retomada', () => {
  const e=environment(); const p=payload(); e.state.fail='ContatosClientes:append'; e.run(p);
  e.state.files.get(e.row('DocumentosUsuarios').arquivo_drive_id).isTrashed=() => true;
  e.state.fail=''; assert.equal(e.run(p).sucesso,true); assert.equal([...e.state.files.values()].filter(f => !f.isTrashed()).length,2);
  assert.equal(e.state.sheets.DocumentosUsuarios.data.length,3);
});
test('mudanca no segredo de tokens nao invalida retomada de cadastro', () => {
  const e=environment(); const p=payload(); e.state.fail='Drive'; e.run(p); e.state.props.TOKEN_SECRET='segredo-sintetico-alterado';
  e.state.fail=''; assert.equal(e.run(p).sucesso,true);
});
