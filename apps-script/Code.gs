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
  ENSAIOS_MICRO: 'EnsaiosMicrobiologicos'
};

const GRUPOS = {
  CLIENTE: 'Client_User',
  GESTOR: 'Manager_User',
  ADMIN: 'Administrator_User'
};

const EXPIRACAO_MS = 8 * 60 * 60 * 1000;

function doPost(e) {
  try {
    const entrada = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    switch (entrada.acao) {
      case 'login':
        return responder_(login(entrada.email, entrada.senha));
      case 'cadastrarUsuario':
        return responder_(cadastrarUsuario(entrada.nome, entrada.email, entrada.senha));
      case 'obterPerfil':
        return responder_(obterPerfil(entrada.token));
      case 'listarOpcoes':
        return responder_(listarOpcoes(entrada.token));
      case 'salvarSolicitacao':
        return responder_(salvarSolicitacao(entrada.dados, entrada.token));
      case 'salvarSolicitacaoMicrobiologica':
        return responder_(salvarSolicitacaoMicrobiologica(entrada.dados, entrada.token));
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

function ativo_(valor) {
  const normalizado = String(valor).toLowerCase().trim();
  return normalizado !== 'false' && normalizado !== 'não' && normalizado !== 'nao' && normalizado !== '0';
}

function grupoValido_(grupo) {
  return [GRUPOS.CLIENTE, GRUPOS.GESTOR, GRUPOS.ADMIN].indexOf(grupo) >= 0;
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
    ativo: ativo_(linha[coluna_(tabela.cabecalho, 'ativo')]),
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

function cadastrarUsuario(nome, email, senha) {
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
  const usuario = validarToken_(token);
  if (!usuario) return falha_('Sessão expirada. Faça login novamente.');

  if (!dados || !dados.requerente || !dados.finalidade || !dados.amostras || !dados.amostras.length) {
    return falha_('Preencha os campos obrigatórios antes de enviar.');
  }
  if (dados.amostras.length > 8) return falha_('O limite de 8 amostras foi excedido.');

  const agora = new Date();
  const id = 'IST-' + Utilities.formatDate(
    agora,
    Session.getScriptTimeZone() || 'America/Cuiaba',
    'yyyyMMdd-HHmmss'
  ) + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();

  const solicitacoes = valoresComCabecalho_(ABAS.SOLICITACOES);
  const dadosSolicitacao = {
    solicitacao_id: id,
    data_hora_envio: agora,
    usuario: usuario.email,
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

  const amostras = valoresComCabecalho_(ABAS.AMOSTRAS);
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

  return sucesso_('Solicitação salva.', { solicitacaoId: id });
}

function salvarSolicitacaoMicrobiologica(dados, token) {
  const usuario = validarToken_(token);
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

  return sucesso_('Solicitação microbiológica salva.', { solicitacaoId: id });
}
