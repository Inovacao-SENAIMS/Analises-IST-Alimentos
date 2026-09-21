/**
 * API do aplicativo IST Alimentos.
 * Configure as abas e cabeçalhos exatamente como descrito no README antes de publicar.
 */
const ABAS = { USUARIOS: 'Usuarios', CONFIG: 'Config', SOLICITACOES: 'Solicitacoes', AMOSTRAS: 'Amostras' };
const EXPIRACAO_MS = 8 * 60 * 60 * 1000;

function doPost(e) {
  try {
    const entrada = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (entrada.acao) {
      case 'login': return responder_(login(entrada.email, entrada.senha));
      case 'listarOpcoes': return responder_(listarOpcoes(entrada.token));
      case 'salvarSolicitacao': return responder_(salvarSolicitacao(entrada.dados, entrada.token));
      default: return responder_({ sucesso: false, mensagem: 'Operação não reconhecida.', dados: null });
    }
  } catch (erro) { return responder_({ sucesso: false, mensagem: 'Não foi possível processar a solicitação.', dados: null }); }
}

function responder_(resultado) { return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON); }
function sucesso_(mensagem, dados) { return { sucesso: true, mensagem: mensagem, dados: dados || null }; }
function falha_(mensagem) { return { sucesso: false, mensagem: mensagem, dados: null }; }
function planilha_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function valoresComCabecalho_(nomeAba) { const aba = planilha_().getSheetByName(nomeAba); if (!aba) throw new Error('Aba ausente'); const valores = aba.getDataRange().getValues(); return { aba: aba, cabecalho: valores.shift().map(String), linhas: valores }; }

function login(email, senha) {
  if (!email || !senha) return falha_('Informe e-mail e senha.');
  const tabela = valoresComCabecalho_(ABAS.USUARIOS); const emailCol = tabela.cabecalho.indexOf('email'); const senhaCol = tabela.cabecalho.indexOf('senha'); const nomeCol = tabela.cabecalho.indexOf('nome'); const ativoCol = tabela.cabecalho.indexOf('ativo');
  const linha = tabela.linhas.find(function (item) { return String(item[emailCol]).toLowerCase().trim() === String(email).toLowerCase().trim() && String(item[senhaCol]) === String(senha) && String(item[ativoCol]).toLowerCase() !== 'false' && String(item[ativoCol]).toLowerCase() !== 'não'; });
  if (!linha) return falha_('E-mail ou senha inválidos.');
  const token = criarToken_(String(linha[emailCol]).trim(), String(linha[nomeCol]).trim()); return sucesso_('Login realizado.', { token: token, email: String(linha[emailCol]).trim(), nome: String(linha[nomeCol]).trim() });
}

function segredo_() { const propriedades = PropertiesService.getScriptProperties(); let segredo = propriedades.getProperty('TOKEN_SECRET'); if (!segredo) { segredo = Utilities.getUuid() + Utilities.getUuid(); propriedades.setProperty('TOKEN_SECRET', segredo); } return segredo; }
function criarToken_(email, nome) { const dados = { email: email, nome: nome, exp: Date.now() + EXPIRACAO_MS, nonce: Utilities.getUuid() }; const corpo = Utilities.base64EncodeWebSafe(JSON.stringify(dados)); const assinatura = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(corpo, segredo_())); return corpo + '.' + assinatura; }
function validarToken_(token) { try { const partes = String(token || '').split('.'); if (partes.length !== 2) return null; const assinatura = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(partes[0], segredo_())); if (assinatura !== partes[1]) return null; const dados = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(partes[0])).getDataAsString()); if (!dados.email || Number(dados.exp) <= Date.now()) return null; return dados; } catch (_) { return null; } }

function listarOpcoes(token) { if (!validarToken_(token)) return falha_('Sessão expirada. Faça login novamente.'); const tabela = valoresComCabecalho_(ABAS.CONFIG); const tipoCol = tabela.cabecalho.indexOf('tipo'); const valorCol = tabela.cabecalho.indexOf('valor'); const resultado = { peneiras: [], categorias: [] }; tabela.linhas.forEach(function (linha) { const tipo = String(linha[tipoCol]).toLowerCase().trim(); const valor = String(linha[valorCol]).trim(); if (valor && resultado[tipo + 's']) resultado[tipo + 's'].push(valor); }); return sucesso_('Opções carregadas.', resultado); }

function salvarSolicitacao(dados, token) {
  const usuario = validarToken_(token); if (!usuario) return falha_('Sessão expirada. Faça login novamente.');
  if (!dados || !dados.requerente || !dados.finalidade || !dados.amostras || !dados.amostras.length) return falha_('Preencha os campos obrigatórios antes de enviar.');
  if (dados.amostras.length > 8) return falha_('O limite de 8 amostras foi excedido.');
  const id = 'IST-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Cuiaba', 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase(); const agora = new Date();
  const solicitacoes = valoresComCabecalho_(ABAS.SOLICITACOES); const linhaSolicitacao = solicitacoes.cabecalho.map(function (coluna) { const mapa = { solicitacao_id: id, data_hora_envio: agora, usuario: usuario.email, requerente: dados.requerente, renasem_requerente: dados.renasemRequerente, pagante: dados.pagante, cpf_cnpj: dados.cpfCnpj, endereco: dados.endereco, data_amostragem: dados.dataAmostragem, procedencia: dados.procedencia, amostrador: dados.amostrador, renasem_amostrador: dados.renasemAmostrador, num_proposta: dados.numProposta, finalidade: dados.finalidade, finalidade_outros: dados.finalidadeOutros, observacoes: dados.observacoes, ensaio_pureza: dados.ensaios?.pureza, ensaio_pms: dados.ensaios?.pms, ensaio_outras_sementes: dados.ensaios?.outrasSementes, ensaio_infestadas: dados.ensaios?.infestadas, ensaio_germinacao: dados.ensaios?.germinacao, ensaio_vigor_ea: dados.ensaios?.vigorEa, ensaio_tetrazolio: dados.ensaios?.tetrazolio, ensaio_frio: dados.ensaios?.frio, ensaio_emergencia: dados.ensaios?.emergencia }; return mapa[coluna] === undefined ? '' : mapa[coluna]; }); solicitacoes.aba.appendRow(linhaSolicitacao);
  const amostras = valoresComCabecalho_(ABAS.AMOSTRAS); dados.amostras.forEach(function (amostra, indice) { const mapa = { solicitacao_id: id, numero: indice + 1, especie: amostra.especie, cultivar: amostra.cultivar, safra: amostra.safra, peneira: amostra.peneira, lote: amostra.lote, representatividade: amostra.representatividade, categoria: amostra.categoria, tratamento: amostra.tratamento, trat_produto: amostra.tratProduto, trat_principio_ativo: amostra.tratPrincipioAtivo, trat_dosagem: amostra.tratDosagem }; amostras.aba.appendRow(amostras.cabecalho.map(function (coluna) { return mapa[coluna] === undefined ? '' : mapa[coluna]; })); }); return sucesso_('Solicitação salva.', { solicitacaoId: id });
}
