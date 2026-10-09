/**
 * API do aplicativo IST Alimentos.
 * A aba Usuarios recebe os grupos Client_User, Manager_User ou Administrator_User.
 */
const ABAS = {
  USUARIOS: 'Usuarios',
  CONFIG: 'Config',
  SOLICITACOES: 'Solicitacoes',
  AMOSTRAS: 'Amostras',
  SOLICITACOES_MICRO: 'SolicitacoesMicrobiologicas',
  ENSAIOS_MICRO: 'EnsaiosMicrobiologicos',
  SOLICITACOES_FISICO_QUIMICAS: 'SolicitacoesFisicoQuimicas',
  ENSAIOS_FISICO_QUIMICOS: 'EnsaiosFisicoQuimicos',
  SOLICITACOES_FISCAIS: 'SolicitacoesAmostrasFiscais',
  AMOSTRAS_FISCAIS: 'AmostrasFiscais',
  CLIENTES: 'Clientes',
  CONTATOS_CLIENTES: 'ContatosClientes',
  DOCUMENTOS_USUARIOS: 'DocumentosUsuarios',
  CHECKLISTS_RECEBIMENTO: 'ChecklistsRecebimento'
};

const FONTES_HISTORICO = [
  { tipo: 'analise-sementes', titulo: 'Análise de Sementes', solicitacoes: ABAS.SOLICITACOES, amostras: ABAS.AMOSTRAS },
  { tipo: 'analise-microbiologica', titulo: 'Análise Microbiológica', solicitacoes: ABAS.SOLICITACOES_MICRO, ensaios: ABAS.ENSAIOS_MICRO },
  { tipo: 'analise-fisico-quimica', titulo: 'Análise Físico-Química', solicitacoes: ABAS.SOLICITACOES_FISICO_QUIMICAS, ensaios: ABAS.ENSAIOS_FISICO_QUIMICOS },
  { tipo: 'amostras-fiscais', titulo: 'Análise de Alimentos', solicitacoes: ABAS.SOLICITACOES_FISCAIS, amostras: ABAS.AMOSTRAS_FISCAIS }
];

const GRUPOS = {
  CLIENTE: 'Client_User',
  COLABORADOR: 'IST_Colaborators',
  GESTOR: 'Manager_User',
  ADMIN: 'Administrator_User'
};

const EXPIRACAO_MS = 8 * 60 * 60 * 1000;
const DESTINATARIOS_NOVAS_SOLICITACOES = [
  'atendimentolabalimentos@ms.senai.br',
  'larissa.romao@ms.senai.br'
];

function notificarNovaSolicitacao_(id, tipo, usuarioEmail, dataEnvio) {
  const assunto = 'Nova solicitação: ' + id;
  const corpo = [
    'Uma nova solicitação foi registrada no Portal IST Alimentos.',
    '',
    'Tipo: ' + tipo,
    'ID: ' + id,
    'Solicitante: ' + usuarioEmail,
    'Data/hora: ' + Utilities.formatDate(dataEnvio, Session.getScriptTimeZone() || 'America/Cuiaba', 'dd/MM/yyyy HH:mm')
  ].join('\n');
  try {
    MailApp.sendEmail({ to: DESTINATARIOS_NOVAS_SOLICITACOES.join(','), subject: assunto, body: corpo });
  } catch (erro) {
    Logger.log('Falha ao notificar a solicitação ' + id + ': ' + erro);
  }
}

function doPost(e) {
  try {
    const entrada = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    switch (entrada.acao) {
      case 'login':
        return responder_(login(entrada.email, entrada.senha));
      case 'cadastrarUsuario':
        return responder_(cadastrarUsuario(entrada.dados));
      case 'obterPerfil':
        return responder_(obterPerfil(entrada.token));
      case 'listarUsuariosAdmin':
        return responder_(listarUsuariosAdmin(entrada.token));
      case 'atualizarUsuarioAdmin':
        return responder_(atualizarUsuarioAdmin(entrada.dados, entrada.token));
      case 'excluirUsuarioAdmin':
        return responder_(excluirUsuarioAdmin(entrada.dados, entrada.token));
      case 'listarHistoricoSolicitacoes':
        return responder_(listarHistoricoSolicitacoes(entrada.token));
      case 'obterDetalhesSolicitacao':
        return responder_(obterDetalhesSolicitacao(entrada.dados, entrada.token));
      case 'excluirSolicitacoes':
        return responder_(excluirSolicitacoes(entrada.dados, entrada.token));
      case 'listarOpcoes':
        return responder_(listarOpcoes(entrada.token));
      case 'salvarSolicitacao':
        return responder_(salvarSolicitacao(entrada.dados, entrada.token));
      case 'salvarSolicitacaoMicrobiologica':
        return responder_(salvarSolicitacaoMicrobiologica(entrada.dados, entrada.token));
      case 'salvarSolicitacaoFisicoQuimica':
        return responder_(salvarSolicitacaoFisicoQuimica(entrada.dados, entrada.token));
      case 'salvarSolicitacaoAmostrasFiscais':
        return responder_(salvarSolicitacaoAmostrasFiscais(entrada.dados, entrada.token));
      case 'salvarChecklistRecebimento':
        return responder_(salvarChecklistRecebimento(entrada.dados, entrada.token));
      case 'listarChecklists':
        return responder_(listarChecklists(entrada.token));
      default:
        return responder_(falha_('Operação não reconhecida.'));
    }
  } catch (erro) {
    return responder_(falha_('Não foi possível processar a solicitação.'));
  }
}

function responder_(resultado) {
  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

function sucesso_(mensagem, dados) {
  return { sucesso: true, mensagem: mensagem, dados: dados || null };
}

function falha_(mensagem) {
  return { sucesso: false, mensagem: mensagem, dados: null };
}

function planilha_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function valoresComCabecalho_(nomeAba) {
  const aba = planilha_().getSheetByName(nomeAba);
  if (!aba) throw new Error('Aba ausente');

  const valores = aba.getDataRange().getValues();
  return {
    aba: aba,
    cabecalho: valores.shift().map(String),
    linhas: valores
  };
}

function coluna_(cabecalho, nome) {
  return cabecalho.indexOf(nome);
}

function garantirAba_(nomeAba, cabecalhoEsperado) {
  let aba = planilha_().getSheetByName(nomeAba);
  if (!aba) {
    aba = planilha_().insertSheet(nomeAba);
    aba.getRange(1, 1, 1, cabecalhoEsperado.length).setValues([cabecalhoEsperado]);
  }
  return aba;
}

function ativo_(valor) {
  const normalizado = String(valor).toLowerCase().trim();
  return normalizado !== 'false' && normalizado !== 'não' && normalizado !== 'nao' && normalizado !== '0';
}

function grupoValido_(grupo) {
  return [GRUPOS.CLIENTE, GRUPOS.COLABORADOR, GRUPOS.GESTOR, GRUPOS.ADMIN].indexOf(grupo) >= 0;
}

function usuarioPorEmail_(email) {
  const tabela = valoresComCabecalho_(ABAS.USUARIOS);
  const emailColuna = coluna_(tabela.cabecalho, 'email');
  const linha = tabela.linhas.find(function (item) {
    return String(item[emailColuna]).toLowerCase().trim() === String(email || '').toLowerCase().trim();
  });

  if (!linha) return null;

  const grupoColuna = coluna_(tabela.cabecalho, 'grupo');
  const grupo = grupoColuna >= 0 && grupoValido_(String(linha[grupoColuna]).trim())
    ? String(linha[grupoColuna]).trim()
    : GRUPOS.CLIENTE;

  return {
    tabela: tabela,
    linha: linha,
    email: String(linha[emailColuna]).trim(),
    nome: String(linha[coluna_(tabela.cabecalho, 'nome')]).trim(),
    senha: String(linha[coluna_(tabela.cabecalho, 'senha')]),
    ativo: ativo_(linha[coluna_(tabela.cabecalho, 'ativo')]) && (!valorLinha_(tabela, linha, 'estado_documental') || valorLinha_(tabela, linha, 'estado_documental') === 'CONCLUIDO'),
    estadoDocumental: String(valorLinha_(tabela, linha, 'estado_documental')),
    cadastroId: String(valorLinha_(tabela, linha, 'cadastro_id')),
    grupo: grupo
  };
}

function login(email, senha) {
  if (!email || !senha) return falha_('Informe e-mail e senha.');

  const usuario = usuarioPorEmail_(email);
  if (!usuario || !usuario.ativo || usuario.senha !== String(senha)) {
    return falha_('E-mail ou senha inválidos.');
  }

  const token = criarToken_(usuario);
  return sucesso_('Login realizado.', {
    token: token,
    email: usuario.email,
    nome: usuario.nome,
    grupo: usuario.grupo
  });
}

function cadastrarUsuario(dados) {
  return cadastrarUsuarioNovo_(dados);
}

function cadastrarUsuarioLegado_(nome, email, senha) {
  nome = String(nome || '').trim();
  email = String(email || '').trim().toLowerCase();
  senha = String(senha || '');

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (nome.length < 2 || !emailValido || senha.length < 8) {
    return falha_('Informe nome, e-mail válido e senha com pelo menos 8 caracteres.');
  }

  if (usuarioPorEmail_(email)) {
    return falha_('Já existe um cadastro com este e-mail.');
  }

  const tabela = valoresComCabecalho_(ABAS.USUARIOS);
  const cabecalho = tabela.cabecalho;

  ['grupo', 'data_cadastro'].forEach(function (nomeColuna) {
    if (coluna_(cabecalho, nomeColuna) < 0) {
      tabela.aba.getRange(1, cabecalho.length + 1).setValue(nomeColuna);
      cabecalho.push(nomeColuna);
    }
  });

  const mapa = {
    email: email,
    senha: senha,
    nome: nome,
    ativo: true,
    grupo: GRUPOS.CLIENTE,
    data_cadastro: new Date()
  };

  tabela.aba.appendRow(cabecalho.map(function (coluna) {
    return mapa[coluna] === undefined ? '' : mapa[coluna];
  }));

  return sucesso_('Cadastro realizado.', {
    email: email,
    grupo: GRUPOS.CLIENTE
  });
}

function camposPreenchidos_(dados, campos) {
  return campos.every(function (campo) { return String(dados && dados[campo] || '').trim(); });
}

function contatoValido_(contato) {
  return camposPreenchidos_(contato, ['nome', 'cpf', 'email', 'telefone', 'cargo', 'departamento']) &&
    (contato.recebeNotaFiscalBoleto || contato.recebeProposta || contato.recebeRelatorio);
}

function cadastrarUsuarioNovo_(dados) {
  dados = dados || {};
  const nome = String(dados.nome || '').trim();
  const email = String(dados.email || '').trim().toLowerCase();
  const senha = String(dados.senha || '');
  const tipoUsuario = String(dados.tipoUsuario || '').trim();
  if (nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || senha.length < 8) return falha_('Informe nome, e-mail valido e senha com pelo menos 8 caracteres.');
  if (['COLABORADOR_SENAI', 'CLIENTE'].indexOf(tipoUsuario) < 0) return falha_('Selecione o tipo de usuario.');
  const cliente = dados.cliente;
  const contatos = dados.contatos;
  const camposCliente = ['endereco', 'cidade', 'estado', 'cep', 'telefone', 'cpfCnpj', 'inscricaoEstadualRg'];
  if (dados.tipoPessoa === 'JURIDICA') camposCliente.push('razaoSocial', 'nomeFantasia', 'ramoAtividade', 'numeroFuncionarios');
  if (tipoUsuario === 'CLIENTE' && (!camposPreenchidos_(cliente, camposCliente) || !Array.isArray(contatos) || !contatos.length || !contatos.every(contatoValido_))) return falha_('Preencha os dados obrigatorios da empresa e ao menos um contato com finalidade.');
  if (tipoUsuario === 'CLIENTE') return cadastrarClienteDocumentado_(dados, nome, email, senha);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (usuarioPorEmail_(email)) return falha_('Ja existe um cadastro com este e-mail.');
    const tabela = valoresComCabecalho_(ABAS.USUARIOS);
    const cabecalho = tabela.cabecalho;
    ['grupo', 'data_cadastro'].forEach(function (coluna) { if (coluna_(cabecalho, coluna) < 0) { tabela.aba.getRange(1, cabecalho.length + 1).setValue(coluna); cabecalho.push(coluna); } });
    const grupo = GRUPOS.COLABORADOR;
    const agora = new Date();
    const usuario = { email: email, senha: senha, nome: nome, ativo: true, grupo: grupo, data_cadastro: agora };
    tabela.aba.appendRow(cabecalho.map(function (coluna) { return usuario[coluna] === undefined ? '' : usuario[coluna]; }));
    return sucesso_('Cadastro realizado.', { email: email, grupo: grupo });
  } finally { lock.releaseLock(); }
}

function podeCriarSolicitacao_(usuario) {
  return usuario && usuario.grupo === GRUPOS.COLABORADOR ? falha_('Usuário Sem Permissão') : null;
}

function segredo_() {
  const propriedades = PropertiesService.getScriptProperties();
  let segredo = propriedades.getProperty('TOKEN_SECRET');

  if (!segredo) {
    segredo = Utilities.getUuid() + Utilities.getUuid();
    propriedades.setProperty('TOKEN_SECRET', segredo);
  }

  return segredo;
}

function criarToken_(usuario) {
  const dados = {
    email: usuario.email,
    nome: usuario.nome,
    grupo: usuario.grupo,
    exp: Date.now() + EXPIRACAO_MS,
    nonce: Utilities.getUuid()
  };
  const corpo = Utilities.base64EncodeWebSafe(JSON.stringify(dados));
  const assinatura = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(corpo, segredo_())
  );

  return corpo + '.' + assinatura;
}

function validarToken_(token) {
  try {
    const partes = String(token || '').split('.');
    if (partes.length !== 2) return null;

    const assinatura = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(partes[0], segredo_())
    );
    if (assinatura !== partes[1]) return null;

    const dados = JSON.parse(
      Utilities.newBlob(Utilities.base64DecodeWebSafe(partes[0])).getDataAsString()
    );
    if (!dados.email || Number(dados.exp) <= Date.now()) return null;

    const usuario = usuarioPorEmail_(dados.email);
    if (!usuario || !usuario.ativo) return null;
    return usuario;
  } catch (_) {
    return null;
  }
}

function obterPerfil(token) {
  const usuario = validarToken_(token);
  if (!usuario) return falha_('Sessão expirada. Faça login novamente.');

  return sucesso_('Perfil carregado.', {
    email: usuario.email,
    nome: usuario.nome,
    grupo: usuario.grupo
  });
}

function administrador_(token) {
  const usuario = validarToken_(token);
  if (!usuario) return { erro: falha_('SessÃ£o expirada. FaÃ§a login novamente.') };
  if (usuario.grupo !== GRUPOS.ADMIN) return { erro: falha_('Acesso restrito ao administrador.') };
  return { usuario: usuario };
}

function listarUsuariosAdmin(token) {
  const acesso = administrador_(token);
  if (acesso.erro) return acesso.erro;

  const tabela = valoresComCabecalho_(ABAS.USUARIOS);
  const emailColuna = coluna_(tabela.cabecalho, 'email');
  const nomeColuna = coluna_(tabela.cabecalho, 'nome');
  const ativoColuna = coluna_(tabela.cabecalho, 'ativo');
  const grupoColuna = coluna_(tabela.cabecalho, 'grupo');
  const dataColuna = coluna_(tabela.cabecalho, 'data_cadastro');

  const usuarios = tabela.linhas.map(function (linha) {
    return {
      email: String(linha[emailColuna] || '').trim(),
      nome: String(linha[nomeColuna] || '').trim(),
      ativo: ativo_(linha[ativoColuna]),
      grupo: grupoValido_(String(linha[grupoColuna] || '').trim())
        ? String(linha[grupoColuna]).trim()
        : GRUPOS.CLIENTE,
      dataCadastro: dataColuna >= 0 && linha[dataColuna] ? linha[dataColuna] : null
    };
  }).filter(function (usuario) {
    return usuario.email;
  });

  return sucesso_('UsuÃ¡rios carregados.', { usuarios: usuarios });
}

function atualizarUsuarioAdmin(dados, token) {
  const acesso = administrador_(token);
  if (acesso.erro) return acesso.erro;

  const email = String(dados && dados.email || '').trim().toLowerCase();
  const grupo = String(dados && dados.grupo || '').trim();
  const ativo = dados && (dados.ativo === true || String(dados.ativo).toLowerCase() === 'true');

  if (!email || !grupoValido_(grupo)) return falha_('Informe um e-mail e um grupo vÃ¡lido.');
  if (email === acesso.usuario.email.toLowerCase() && (!ativo || grupo !== GRUPOS.ADMIN)) {
    return falha_('O administrador atual nÃ£o pode remover o prÃ³prio acesso.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const tabela = valoresComCabecalho_(ABAS.USUARIOS);
    const emailColuna = coluna_(tabela.cabecalho, 'email');
    const ativoColuna = coluna_(tabela.cabecalho, 'ativo');
    const grupoColuna = coluna_(tabela.cabecalho, 'grupo');
    if (ativoColuna < 0 || grupoColuna < 0) return falha_('A aba Usuarios precisa das colunas ativo e grupo.');
    const indice = tabela.linhas.findIndex(function (linha) {
      return String(linha[emailColuna] || '').trim().toLowerCase() === email;
    });
    if (indice < 0) return falha_('Usuário não encontrado.');
    const estadoDocumental = String(valorLinha_(tabela, tabela.linhas[indice], 'estado_documental'));
    if (ativo && estadoDocumental && estadoDocumental !== 'CONCLUIDO') return falha_('Não é possível ativar um cadastro com documentos pendentes.');
    tabela.aba.getRange(indice + 2, ativoColuna + 1).setValue(ativo);
    tabela.aba.getRange(indice + 2, grupoColuna + 1).setValue(grupo);
    return sucesso_('Usuário atualizado.', { email: email, ativo: ativo, grupo: grupo });
  } finally { lock.releaseLock(); }
}

function apagarLinhasPorEmail_(nomeAba, email, nomeColuna) {
  const aba = planilha_().getSheetByName(nomeAba);
  if (!aba) return 0;
  const tabela = valoresComCabecalho_(nomeAba);
  const colunaEmail = coluna_(tabela.cabecalho, nomeColuna || 'email');
  if (colunaEmail < 0) throw new Error('A aba ' + nomeAba + ' precisa da coluna de e-mail.');

  const linhas = tabela.linhas.reduce(function (resultado, linha, indice) {
    if (String(linha[colunaEmail] || '').trim().toLowerCase() === email) resultado.push(indice + 2);
    return resultado;
  }, []);
  linhas.reverse().forEach(function (linha) { tabela.aba.deleteRow(linha); });
  return linhas.length;
}

function excluirUsuarioAdmin(dados, token) {
  const acesso = administrador_(token);
  if (acesso.erro) return acesso.erro;

  const email = String(dados && dados.email || '').trim().toLowerCase();
  if (!email) return falha_('Informe o e-mail do usuário a excluir.');
  if (email === String(acesso.usuario.email || '').trim().toLowerCase()) {
    return falha_('O administrador atual não pode excluir a própria conta.');
  }

  const usuarios = valoresComCabecalho_(ABAS.USUARIOS);
  const colunaEmail = coluna_(usuarios.cabecalho, 'email');
  if (colunaEmail < 0) return falha_('A aba Usuarios precisa da coluna email.');
  const existe = usuarios.linhas.some(function (linha) {
    return String(linha[colunaEmail] || '').trim().toLowerCase() === email;
  });
  if (!existe) return falha_('Usuário não encontrado.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const clientes = apagarLinhasPorEmail_(ABAS.CLIENTES, email, 'usuario_email');
    const contatos = apagarLinhasPorEmail_(ABAS.CONTATOS_CLIENTES, email, 'usuario_email');
    apagarLinhasPorEmail_(ABAS.USUARIOS, email, 'email');
    return sucesso_('Usuário excluído definitivamente. As solicitações foram preservadas no histórico.', { email: email, clientes: clientes, contatos: contatos });
  } finally {
    lock.releaseLock();
  }
}

function valorLinha_(tabela, linha, nome, padrao) {
  const indice = coluna_(tabela.cabecalho, nome);
  return indice >= 0 && linha[indice] !== undefined && linha[indice] !== ''
    ? linha[indice]
    : (padrao === undefined ? '' : padrao);
}

function usuarioPodeVerSolicitacao_(usuario, linha, tabela) {
  if (usuario.grupo === GRUPOS.GESTOR || usuario.grupo === GRUPOS.ADMIN) return true;
  return String(valorLinha_(tabela, linha, 'usuario')).toLowerCase().trim() === usuario.email.toLowerCase().trim();
}

function nomesUsuarios_() {
  const mapa = {};
  try {
    const tabela = valoresComCabecalho_(ABAS.USUARIOS);
    const emailColuna = coluna_(tabela.cabecalho, 'email');
    const nomeColuna = coluna_(tabela.cabecalho, 'nome');
    if (emailColuna >= 0 && nomeColuna >= 0) {
      tabela.linhas.forEach(function (linha) {
        const email = String(linha[emailColuna] || '').trim().toLowerCase();
        if (email) mapa[email] = String(linha[nomeColuna] || '').trim();
      });
    }
  } catch (_) {}
  return mapa;
}

function requerenteDoHistorico_(fonte, tabela, linha) {
  const coluna = fonte.tipo === 'analise-sementes' ? 'requerente' : 'razao_social';
  return String(valorLinha_(tabela, linha, coluna)).trim();
}

function idsRecebidos_() {
  const conjunto = {};
  const aba = planilha_().getSheetByName(ABAS.CHECKLISTS_RECEBIMENTO);
  if (!aba) return conjunto;
  const tabela = valoresComCabecalho_(ABAS.CHECKLISTS_RECEBIMENTO);
  tabela.linhas.forEach(function (linha) {
    const id = String(valorLinha_(tabela, linha, 'solicitacao_id')).trim();
    if (id) conjunto[id] = true;
  });
  return conjunto;
}

function listarHistoricoSolicitacoes(token) {
  const usuario = validarToken_(token);
  if (!usuario) return falha_('SessÃ£o expirada. FaÃ§a login novamente.');

  const nomes = nomesUsuarios_();
  const recebidos = idsRecebidos_();
  const historico = [];
  FONTES_HISTORICO.forEach(function (fonte) {
    const tabela = valoresComCabecalho_(fonte.solicitacoes);
    tabela.linhas.forEach(function (linha) {
      if (!usuarioPodeVerSolicitacao_(usuario, linha, tabela)) return;

      const email = String(valorLinha_(tabela, linha, 'usuario')).trim();
      historico.push({
        solicitacaoId: String(valorLinha_(tabela, linha, 'solicitacao_id')),
        tipo: fonte.tipo,
        titulo: fonte.titulo,
        dataEnvio: valorLinha_(tabela, linha, 'data_hora_envio', null),
        usuario: email,
        usuarioNome: nomes[email.toLowerCase()] || email,
        requerente: requerenteDoHistorico_(fonte, tabela, linha),
        recebido: Boolean(recebidos[String(valorLinha_(tabela, linha, 'solicitacao_id')).trim()]),
        status: String(valorLinha_(tabela, linha, 'status', 'Enviada') || 'Enviada')
      });
    });
  });

  historico.sort(function (a, b) {
    return new Date(b.dataEnvio || 0).getTime() - new Date(a.dataEnvio || 0).getTime();
  });

  return sucesso_('HistÃ³rico carregado.', { solicitacoes: historico });
}

function fonteHistorico_(tipo) {
  return FONTES_HISTORICO.find(function (fonte) {
    return fonte.tipo === tipo;
  });
}

function camposPublicos_(fonte, tabela, linha) {
  const grupos = {
    'analise-sementes': [
      ['Requerente', 'requerente'], ['RENASEM (Requerente)', 'renasem_requerente'], ['Pagante', 'pagante'],
      ['CPF/CNPJ', 'cpf_cnpj'], ['Finalidade', 'finalidade'], ['Observações', 'observacoes']
    ],
    'analise-microbiologica': [
      ['Razão Social', 'razao_social'], ['CNPJ/CPF', 'cpf_cnpj'], ['Responsável', 'responsavel'],
      ['Tipo de amostra', 'tipo_amostra'], ['Lote', 'lote'], ['Finalidade', 'finalidade']
    ],
    'analise-fisico-quimica': [
      ['Razão Social', 'razao_social'], ['CNPJ/CPF', 'cpf_cnpj'], ['Tipo de amostra', 'tipo_amostra'], ['Finalidade', 'finalidade'], ['SEBRAETEC', 'sebraetec'], ['Matriz', 'matriz']
    ],
    'amostras-fiscais': [
      ['Razão Social', 'razao_social'], ['CNPJ/CPF', 'cpf_cnpj'], ['Nome Fantasia', 'nome_fantasia'],
      ['Produto', 'produto'], ['Objetivo', 'objetivo'], ['Órgão de registro', 'registro_orgao']
    ]
  };

  return (grupos[fonte.tipo] || []).map(function (campo) {
    return { rotulo: campo[0], valor: String(valorLinha_(tabela, linha, campo[1])) };
  }).filter(function (campo) {
    return campo.valor;
  });
}

function detalhesRelacionados_(fonte, id) {
  if (fonte.amostras) {
    const tabela = valoresComCabecalho_(fonte.amostras);
    const amostras = tabela.linhas.filter(function (linha) {
      return String(valorLinha_(tabela, linha, 'solicitacao_id')) === id;
    });

    return amostras.map(function (linha) {
      return {
        numero: valorLinha_(tabela, linha, 'numero'),
        campos: [
          ['Espécie', 'especie'], ['Cultivar', 'cultivar'], ['Safra', 'safra'], ['Peneira', 'peneira'],
          ['Lote', 'lote'], ['Representatividade', 'representatividade'], ['Categoria', 'categoria'],
          ['Tratamento', 'tratamento'], ['Produto do tratamento', 'trat_produto'],
          ['Princípio ativo', 'trat_principio_ativo'], ['Dosagem', 'trat_dosagem'],
          ['Produto', 'produto'], ['Marca', 'marca'], ['Quantidade', 'quantidade'], ['Data de fabricação', 'data_fabricacao'],
          ['Data de validade', 'data_validade'], ['Responsável pela coleta', 'coletor_nome'], ['Data da coleta', 'data_coleta']
        ].map(function (campo) {
          return { rotulo: campo[0], valor: String(valorLinha_(tabela, linha, campo[1])) };
        }).filter(function (campo) { return campo.valor; })
      };
    });
  }

  if (fonte.ensaios) {
    const tabela = valoresComCabecalho_(fonte.ensaios);
    return tabela.linhas.filter(function (linha) {
      return String(valorLinha_(tabela, linha, 'solicitacao_id')) === id;
    }).map(function (linha) {
      return {
        numero: valorLinha_(tabela, linha, 'numero'),
        campos: [['Grupo', 'grupo'], ['Código', 'codigo'], ['Ensaio', 'ensaio']].map(function (campo) {
          return { rotulo: campo[0], valor: String(valorLinha_(tabela, linha, campo[1])) };
        }).filter(function (campo) { return campo.valor; })
      };
    });
  }

  return [];
}

function obterDetalhesSolicitacao(dados, token) {
  const usuario = validarToken_(token);
  if (!usuario) return falha_('SessÃ£o expirada. FaÃ§a login novamente.');

  const fonte = fonteHistorico_(String(dados && dados.tipo || ''));
  const id = String(dados && dados.solicitacaoId || '').trim();
  if (!fonte || !id) return falha_('SolicitaÃ§Ã£o nÃ£o encontrada.');

  const tabela = valoresComCabecalho_(fonte.solicitacoes);
  const indice = tabela.linhas.findIndex(function (linha) {
    return String(valorLinha_(tabela, linha, 'solicitacao_id')) === id;
  });
  if (indice < 0 || !usuarioPodeVerSolicitacao_(usuario, tabela.linhas[indice], tabela)) {
    return falha_('SolicitaÃ§Ã£o nÃ£o encontrada.');
  }

  const linha = tabela.linhas[indice];
  return sucesso_('Detalhes carregados.', {
    solicitacaoId: id,
    tipo: fonte.tipo,
    titulo: fonte.titulo,
    dataEnvio: valorLinha_(tabela, linha, 'data_hora_envio', null),
    status: String(valorLinha_(tabela, linha, 'status', 'Enviada') || 'Enviada'),
    campos: camposPublicos_(fonte, tabela, linha),
    relacionados: detalhesRelacionados_(fonte, id)
  });
}

function apagarLinhasPorSolicitacao_(nomeAba, id) {
  const tabela = valoresComCabecalho_(nomeAba);
  const colunaId = coluna_(tabela.cabecalho, 'solicitacao_id');
  if (colunaId < 0) throw new Error('A aba precisa da coluna solicitacao_id.');

  const linhas = tabela.linhas.reduce(function (resultado, linha, indice) {
    if (String(linha[colunaId]) === id) resultado.push(indice + 2);
    return resultado;
  }, []);

  linhas.reverse().forEach(function (linha) {
    tabela.aba.deleteRow(linha);
  });
  return linhas.length;
}

function excluirSolicitacoes(dados, token) {
  const acesso = administrador_(token);
  if (acesso.erro) return acesso.erro;

  const recebidas = dados && Array.isArray(dados.solicitacoes) ? dados.solicitacoes : [];
  const vistos = {};
  const alvos = [];
  for (let indice = 0; indice < recebidas.length; indice += 1) {
    const tipo = String(recebidas[indice] && recebidas[indice].tipo || '');
    const solicitacaoId = String(recebidas[indice] && recebidas[indice].solicitacaoId || '').trim();
    const chave = tipo + ':' + solicitacaoId;
    const fonte = fonteHistorico_(tipo);
    if (!fonte || !solicitacaoId) return falha_('Solicitação inválida para exclusão.');
    if (!vistos[chave]) {
      const tabela = valoresComCabecalho_(fonte.solicitacoes);
      const existe = tabela.linhas.some(function (linha) {
        return String(valorLinha_(tabela, linha, 'solicitacao_id')) === solicitacaoId;
      });
      if (!existe) return falha_('Solicitação não encontrada para exclusão.');
      vistos[chave] = true;
      alvos.push({ fonte: fonte, solicitacaoId: solicitacaoId });
    }
  }
  if (!alvos.length) return falha_('Selecione ao menos uma solicitação.');

  let relacionados = 0;
  alvos.forEach(function (alvo) {
    const abaRelacionada = alvo.fonte.amostras || alvo.fonte.ensaios;
    if (abaRelacionada) relacionados += apagarLinhasPorSolicitacao_(abaRelacionada, alvo.solicitacaoId);
    apagarLinhasPorSolicitacao_(alvo.fonte.solicitacoes, alvo.solicitacaoId);
  });

  return sucesso_('Solicitação(ões) excluída(s) permanentemente.', { excluidas: alvos.length, relacionados: relacionados });
}

function listarOpcoes(token) {
  if (!validarToken_(token)) return falha_('Sessão expirada. Faça login novamente.');

  const tabela = valoresComCabecalho_(ABAS.CONFIG);
  const tipoColuna = coluna_(tabela.cabecalho, 'tipo');
  const valorColuna = coluna_(tabela.cabecalho, 'valor');
  const resultado = { peneiras: [], categorias: [] };

  tabela.linhas.forEach(function (linha) {
    const tipo = String(linha[tipoColuna]).toLowerCase().trim();
    const valor = String(linha[valorColuna]).trim();
    const destino = resultado[tipo + 's'];

    if (valor && destino) destino.push(valor);
  });

  return sucesso_('Opções carregadas.', resultado);
}

function salvarSolicitacao(dados, token) {
  return salvarSolicitacaoSementes_(dados, token, ABAS.SOLICITACOES, ABAS.AMOSTRAS, 'IST', 'Análise de Sementes');
}

function salvarSolicitacaoSementes_(dados, token, nomeAbaSolicitacoes, nomeAbaAmostras, prefixo, tipoSolicitacao) {
  const usuario = validarToken_(token);
  const permissao = podeCriarSolicitacao_(usuario);
  if (permissao) return permissao;
  if (!usuario) return falha_('Sessão expirada. Faça login novamente.');

  if (!dados || !dados.requerente || !dados.finalidade || !dados.amostras || !dados.amostras.length) {
    return falha_('Preencha os campos obrigatórios antes de enviar.');
  }
  if (dados.amostras.length > 8) return falha_('O limite de 8 amostras foi excedido.');

  const agora = new Date();
  const id = prefixo + '-' + Utilities.formatDate(
    agora,
    Session.getScriptTimeZone() || 'America/Cuiaba',
    'yyyyMMdd-HHmmss'
  ) + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();

  const solicitacoes = valoresComCabecalho_(nomeAbaSolicitacoes);
  const dadosSolicitacao = {
    solicitacao_id: id,
    data_hora_envio: agora,
    usuario: usuario.email,
    origem: dados.origem,
    requerente: dados.requerente,
    renasem_requerente: dados.renasemRequerente,
    pagante: dados.pagante,
    cpf_cnpj: dados.cpfCnpj,
    endereco: dados.endereco,
    data_amostragem: dados.dataAmostragem,
    procedencia: dados.procedencia,
    amostrador: dados.amostrador,
    renasem_amostrador: dados.renasemAmostrador,
    num_proposta: dados.numProposta,
    finalidade: dados.finalidade,
    finalidade_outros: dados.finalidadeOutros,
    observacoes: dados.observacoes,
    ensaio_pureza: dados.ensaios?.pureza,
    ensaio_pms: dados.ensaios?.pms,
    ensaio_outras_sementes: dados.ensaios?.outrasSementes,
    ensaio_infestadas: dados.ensaios?.infestadas,
    ensaio_germinacao: dados.ensaios?.germinacao,
    ensaio_vigor_ea: dados.ensaios?.vigorEa,
    ensaio_tetrazolio: dados.ensaios?.tetrazolio,
    ensaio_frio: dados.ensaios?.frio,
    ensaio_emergencia: dados.ensaios?.emergencia
  };

  solicitacoes.aba.appendRow(solicitacoes.cabecalho.map(function (coluna) {
    return dadosSolicitacao[coluna] === undefined ? '' : dadosSolicitacao[coluna];
  }));

  const amostras = valoresComCabecalho_(nomeAbaAmostras);
  dados.amostras.forEach(function (amostra, indice) {
    const dadosAmostra = {
      solicitacao_id: id,
      numero: indice + 1,
      especie: amostra.especie,
      cultivar: amostra.cultivar,
      safra: amostra.safra,
      peneira: amostra.peneira,
      lote: amostra.lote,
      representatividade: amostra.representatividade,
      categoria: amostra.categoria,
      tratamento: amostra.tratamento,
      trat_produto: amostra.tratProduto,
      trat_principio_ativo: amostra.tratPrincipioAtivo,
      trat_dosagem: amostra.tratDosagem
    };

    amostras.aba.appendRow(amostras.cabecalho.map(function (coluna) {
      return dadosAmostra[coluna] === undefined ? '' : dadosAmostra[coluna];
    }));
  });

  notificarNovaSolicitacao_(id, tipoSolicitacao, usuario.email, agora);
  return sucesso_('Solicitação salva.', { solicitacaoId: id });
}

function salvarSolicitacaoAmostrasFiscais(dados, token) {
  const usuario = validarToken_(token);
  const permissao = podeCriarSolicitacao_(usuario);
  if (permissao) return permissao;
  if (!usuario) return falha_('SessÃ£o expirada. FaÃ§a login novamente.');

  if (!dados || !dados.razaoSocial || !dados.cpfCnpj || !dados.produto || !dados.objetivo || !dados.analises || !dados.analises.length) {
    return falha_('Preencha os campos obrigatÃ³rios antes de enviar.');
  }

  const agora = new Date();
  const id = 'FISCAL-' + Utilities.formatDate(
    agora,
    Session.getScriptTimeZone() || 'America/Cuiaba',
    'yyyyMMdd-HHmmss'
  ) + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();

  const solicitacoes = valoresComCabecalho_(ABAS.SOLICITACOES_FISCAIS);
  const dadosSolicitacao = {
    solicitacao_id: id,
    data_hora_envio: agora,
    usuario: usuario.email,
    origem: dados.origem,
    protocolo_entrada: dados.protocoloEntrada,
    numero_protocolo: dados.numeroProtocolo,
    razao_social: dados.razaoSocial,
    cpf_cnpj: dados.cpfCnpj,
    nome_fantasia: dados.nomeFantasia,
    proprietario: dados.proprietario,
    ie: dados.ie,
    endereco: dados.endereco,
    email: dados.email,
    telefone: dados.telefone,
    fax: dados.fax,
    municipio: dados.municipio,
    cep: dados.cep,
    registro_rotulo: dados.registroRotulo,
    registro_orgao: dados.registroOrgao,
    objetivo: dados.objetivo,
    analise_microbiologica: dados.analises.indexOf('microbiologica') >= 0,
    analise_fisico_quimica: dados.analises.indexOf('fisico-quimica') >= 0,
    observacoes: dados.observacoes
  };

  solicitacoes.aba.appendRow(solicitacoes.cabecalho.map(function (coluna) {
    return dadosSolicitacao[coluna] === undefined ? '' : dadosSolicitacao[coluna];
  }));

  const amostras = valoresComCabecalho_(ABAS.AMOSTRAS_FISCAIS);
  const dadosAmostra = {
    solicitacao_id: id,
    numero: 1,
    produto: dados.produto,
    marca: dados.marca,
    quantidade: dados.quantidade,
    lote: dados.lote,
    data_fabricacao: dados.dataFabricacao,
    data_validade: dados.dataValidade,
    coletor_nome: dados.coletorNome,
    coletor_telefone: dados.coletorTelefone,
    data_coleta: dados.dataColeta,
    hora_coleta: dados.horaColeta,
    observacoes: dados.observacoes
  };

  amostras.aba.appendRow(amostras.cabecalho.map(function (coluna) {
    return dadosAmostra[coluna] === undefined ? '' : dadosAmostra[coluna];
  }));

  notificarNovaSolicitacao_(id, 'Análise de Alimentos', usuario.email, agora);
  return sucesso_('SolicitaÃ§Ã£o fiscal salva.', { solicitacaoId: id });
}

function salvarSolicitacaoMicrobiologica(dados, token) {
  const usuario = validarToken_(token);
  const permissao = podeCriarSolicitacao_(usuario);
  if (permissao) return permissao;
  if (!usuario) return falha_('Sessão expirada. Faça login novamente.');

  if (!dados || !dados.razaoSocial || !dados.tipoAmostra || !dados.finalidade || !dados.ensaios || !dados.ensaios.length) {
    return falha_('Preencha os campos obrigatórios antes de enviar.');
  }

  const agora = new Date();
  const id = 'MICRO-' + Utilities.formatDate(
    agora,
    Session.getScriptTimeZone() || 'America/Cuiaba',
    'yyyyMMdd-HHmmss'
  ) + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();

  const solicitacoes = valoresComCabecalho_(ABAS.SOLICITACOES_MICRO);
  const dadosSolicitacao = {
    solicitacao_id: id,
    data_hora_envio: agora,
    usuario: usuario.email,
    origem: dados.origem,
    razao_social: dados.razaoSocial,
    cpf_cnpj: dados.cpfCnpj,
    responsavel: dados.responsavel,
    tipo_amostra: dados.tipoAmostra,
    lote: dados.lote,
    lacre: dados.lacre,
    data_validade: dados.dataValidade,
    data_producao: dados.dataProducao,
    hora_producao: dados.horaProducao,
    local_coleta: dados.localColeta,
    data_coleta: dados.dataColeta,
    hora_coleta: dados.horaColeta,
    temperatura_coleta: dados.temperaturaColeta,
    responsavel_coleta: dados.responsavelColeta,
    finalidade: dados.finalidade,
    finalidade_outros: dados.finalidadeOutros,
    autoriza_temperatura: dados.autorizacoes?.temperatura,
    autoriza_tempo: dados.autorizacoes?.tempo
  };

  solicitacoes.aba.appendRow(solicitacoes.cabecalho.map(function (coluna) {
    return dadosSolicitacao[coluna] === undefined ? '' : dadosSolicitacao[coluna];
  }));

  const ensaios = valoresComCabecalho_(ABAS.ENSAIOS_MICRO);
  dados.ensaios.forEach(function (ensaio, indice) {
    const dadosEnsaio = {
      solicitacao_id: id,
      numero: indice + 1,
      grupo: ensaio.grupo,
      codigo: ensaio.codigo,
      ensaio: ensaio.ensaio
    };

    ensaios.aba.appendRow(ensaios.cabecalho.map(function (coluna) {
      return dadosEnsaio[coluna] === undefined ? '' : dadosEnsaio[coluna];
    }));
  });

  notificarNovaSolicitacao_(id, 'Análise Microbiológica', usuario.email, agora);
  return sucesso_('Solicitação microbiológica salva.', { solicitacaoId: id });
}

function salvarSolicitacaoFisicoQuimica(dados, token) {
  const usuario = validarToken_(token);
  const permissao = podeCriarSolicitacao_(usuario);
  if (permissao) return permissao;
  if (!usuario) return falha_('Sessão expirada. Faça login novamente.');
  if (!dados || !dados.razaoSocial || !dados.cpfCnpj || !dados.email || !dados.telefone || !dados.matriz || !dados.confirmacao || !dados.autorizacoes || dados.autorizacoes.tempo === undefined || dados.autorizacoes.temperatura === undefined || (dados.matriz !== 'Outros' && !dados.ensaios?.length)) return falha_('Preencha os campos obrigatórios antes de enviar.');
  const agora = new Date();
  const id = 'FQ-' + Utilities.formatDate(agora, Session.getScriptTimeZone() || 'America/Cuiaba', 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
  const solicitacoes = valoresComCabecalho_(ABAS.SOLICITACOES_FISICO_QUIMICAS);
  const registro = Object.assign({ solicitacao_id: id, data_hora_envio: agora, usuario: usuario.email }, dados, { origem_outros: dados.origemOutros, finalidade_outros: dados.finalidadeOutros, matriz_outros: dados.matrizOutros, razao_social: dados.razaoSocial, cpf_cnpj: dados.cpfCnpj, tipo_amostra: dados.tipoAmostra, autoriza_tempo: dados.autorizacoes.tempo, autoriza_temperatura: dados.autorizacoes.temperatura });
  solicitacoes.aba.appendRow(solicitacoes.cabecalho.map(function (coluna) { return registro[coluna] === undefined ? '' : registro[coluna]; }));
  const ensaios = valoresComCabecalho_(ABAS.ENSAIOS_FISICO_QUIMICOS);
  (dados.ensaios || []).forEach(function (ensaio, indice) { ensaios.aba.appendRow(ensaios.cabecalho.map(function (coluna) { return ({ solicitacao_id: id, numero: indice + 1, grupo: ensaio.grupo, codigo: ensaio.codigo, ensaio: ensaio.ensaio })[coluna] || ''; })); });
  notificarNovaSolicitacao_(id, 'Análise Físico-Química', usuario.email, agora);
  return sucesso_('Solicitação físico-química salva.', { solicitacaoId: id });
}

function salvarChecklistRecebimento(dados, token) {
  const usuario = validarToken_(token);
  const permissao = podeCriarSolicitacao_(usuario);
  if (permissao) return permissao;
  if (!usuario) return falha_('Sessão expirada. Faça login novamente.');

  dados = dados || {};
  const tipo = String(dados.tipoReferencia || '').trim();
  const solicitacaoId = String(dados.solicitacaoId || '').trim();
  const fonte = fonteHistorico_(tipo);
  if (!fonte || !solicitacaoId) return falha_('Informe a referência e o número da análise.');

  const tabela = valoresComCabecalho_(fonte.solicitacoes);
  const existe = tabela.linhas.some(function (linha) {
    return String(valorLinha_(tabela, linha, 'solicitacao_id')) === solicitacaoId;
  });
  if (!existe) return falha_('Solicitação vinculada não encontrada.');

  if (idsRecebidos_()[solicitacaoId]) {
    return falha_('Esta amostra já foi recebida. Um checklist já foi registrado para esta solicitação.');
  }

  const agora = new Date();
  const id = 'CHK-' + Utilities.formatDate(agora, Session.getScriptTimeZone() || 'America/Cuiaba', 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
  const cabecalho = ['checklist_id', 'solicitacao_id', 'tipo_referencia', 'usuario_amostra', 'requerente_cliente', 'data_recebimento', 'hora_recebimento', 'temperatura_amostra', 'quantidade_amostra', 'peso_volume', 'numero_amostra', 'situacao_amostra', 'responsavel', 'observacoes', 'usuario', 'data_registro'];
  garantirAba_(ABAS.CHECKLISTS_RECEBIMENTO, cabecalho);
  const registro = {
    checklist_id: id,
    solicitacao_id: solicitacaoId,
    tipo_referencia: tipo,
    usuario_amostra: dados.usuarioAmostra,
    requerente_cliente: dados.requerenteCliente,
    data_recebimento: dados.dataRecebimento,
    hora_recebimento: dados.hora,
    temperatura_amostra: dados.temperatura,
    quantidade_amostra: dados.quantidade,
    peso_volume: dados.pesoVolume,
    numero_amostra: dados.numeroAmostra,
    situacao_amostra: dados.situacao,
    responsavel: dados.responsavel,
    observacoes: dados.observacoes,
    usuario: usuario.email,
    data_registro: agora
  };
  const alvo = valoresComCabecalho_(ABAS.CHECKLISTS_RECEBIMENTO);
  alvo.aba.appendRow(alvo.cabecalho.map(function (coluna) {
    return registro[coluna] === undefined ? '' : registro[coluna];
  }));

  return sucesso_('Checklist de recebimento salvo.', { checklistId: id, solicitacaoId: solicitacaoId });
}

function listarChecklists(token) {
  const usuario = validarToken_(token);
  if (!usuario) return falha_('Sessão expirada. Faça login novamente.');
  if ([GRUPOS.COLABORADOR, GRUPOS.GESTOR, GRUPOS.ADMIN].indexOf(usuario.grupo) < 0) {
    return falha_('Acesso restrito.');
  }

  const aba = planilha_().getSheetByName(ABAS.CHECKLISTS_RECEBIMENTO);
  if (!aba) return sucesso_('Nenhum checklist encontrado.', { checklists: [] });

  const tabela = valoresComCabecalho_(ABAS.CHECKLISTS_RECEBIMENTO);
  const nomes = nomesUsuarios_();
  const checklists = tabela.linhas.map(function (linha) {
    const emailAmostra = String(valorLinha_(tabela, linha, 'usuario_amostra')).trim();
    return {
      checklistId: String(valorLinha_(tabela, linha, 'checklist_id')),
      solicitacaoId: String(valorLinha_(tabela, linha, 'solicitacao_id')),
      tipoReferencia: String(valorLinha_(tabela, linha, 'tipo_referencia')),
      usuarioAmostra: emailAmostra,
      usuarioAmostraNome: nomes[emailAmostra.toLowerCase()] || emailAmostra,
      requerenteCliente: String(valorLinha_(tabela, linha, 'requerente_cliente')),
      dataRecebimento: valorLinha_(tabela, linha, 'data_recebimento'),
      horaRecebimento: valorLinha_(tabela, linha, 'hora_recebimento'),
      temperaturaAmostra: valorLinha_(tabela, linha, 'temperatura_amostra'),
      quantidadeAmostra: valorLinha_(tabela, linha, 'quantidade_amostra'),
      pesoVolume: valorLinha_(tabela, linha, 'peso_volume'),
      numeroAmostra: valorLinha_(tabela, linha, 'numero_amostra'),
      situacaoAmostra: String(valorLinha_(tabela, linha, 'situacao_amostra')),
      responsavel: String(valorLinha_(tabela, linha, 'responsavel')),
      observacoes: String(valorLinha_(tabela, linha, 'observacoes')),
      usuario: String(valorLinha_(tabela, linha, 'usuario')),
      dataRegistro: valorLinha_(tabela, linha, 'data_registro')
    };
  }).filter(function (item) { return item.checklistId; });

  checklists.sort(function (a, b) {
    return new Date(b.dataRegistro || 0).getTime() - new Date(a.dataRegistro || 0).getTime();
  });

  return sucesso_('Checklists carregados.', { checklists: checklists });
}
