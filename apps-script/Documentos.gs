/** Documentos privados e finalizacao recuperavel do cadastro de clientes. */
const DOCUMENTO_MAX_BYTES = 5 * 1024 * 1024;
const CATEGORIAS_DOCUMENTOS = {
  FISICA: ['DOCUMENTO_FOTO', 'COMPROVANTE_RESIDENCIA'],
  JURIDICA: ['DOCUMENTO_RT', 'ART']
};

function validarDocumentosCadastro_(documentos, tipoPessoa) {
  const categorias = CATEGORIAS_DOCUMENTOS[tipoPessoa];
  if (!categorias || !Array.isArray(documentos) || documentos.length !== 2) throw new Error('Envie os dois documentos obrigatórios para o tipo de pessoa selecionado.');
  return categorias.map(function (categoria) {
    const encontrados = documentos.filter(function (item) { return item && item.categoria === categoria; });
    if (encontrados.length !== 1) throw new Error('Envie um arquivo para cada categoria de documento.');
    const doc = encontrados[0];
    const nome = String(doc.nome || '').trim();
    const formato = { 'application/pdf': /\.pdf$/i, 'image/jpeg': /\.jpe?g$/i, 'image/png': /\.png$/i }[doc.mimeType];
    const base64 = doc.base64;
    if (!formato || !formato.test(nome) || nome.length > 180 || /[\x00-\x1f/\\]/.test(nome)) throw new Error('Os documentos devem ser PDF, JPG/JPEG ou PNG.');
    if (typeof base64 !== 'string' || !base64.length || base64.length > 4 * Math.ceil(DOCUMENTO_MAX_BYTES / 3) || base64.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error('Arquivo vazio, inválido ou maior que 5 MB.');
    const bytes = Utilities.base64Decode(base64);
    if (!bytes.length || bytes.length > DOCUMENTO_MAX_BYTES || bytes.length !== doc.tamanho || Utilities.base64Encode(bytes) !== base64) throw new Error('O tamanho real do arquivo é inválido. O limite é 5 MB.');
    const inicio = bytes.slice(0, 8).map(function (b) { return (b + 256) % 256; });
    const pdf = inicio.slice(0, 5).join(',') === '37,80,68,70,45';
    const png = inicio.join(',') === '137,80,78,71,13,10,26,10';
    const jpeg = inicio[0] === 255 && inicio[1] === 216 && inicio[2] === 255;
    if (!(doc.mimeType === 'application/pdf' && pdf || doc.mimeType === 'image/png' && png || doc.mimeType === 'image/jpeg' && jpeg)) throw new Error('O conteúdo do arquivo não corresponde ao formato informado.');
    return { categoria: categoria, nome: nome, mimeType: doc.mimeType, tamanho: bytes.length, bytes: bytes };
  });
}

function cpfCnpjCadastroValido_(valor, tipoPessoa) {
  const numeros = String(valor || '').replace(/\D/g, '');
  if (numeros.length !== (tipoPessoa === 'FISICA' ? 11 : 14) || /^(\d)\1+$/.test(numeros)) return false;
  function validar(comprimento, pesos) {
    let soma = 0;
    for (let i = 0; i < comprimento; i += 1) soma += Number(numeros[i]) * pesos[i];
    const resto = soma % 11;
    return Number(numeros[comprimento]) === (resto < 2 ? 0 : 11 - resto);
  }
  if (tipoPessoa === 'FISICA') return validar(9, [10,9,8,7,6,5,4,3,2]) && validar(10, [11,10,9,8,7,6,5,4,3,2]);
  return validar(12, [5,4,3,2,9,8,7,6,5,4,3,2]) && validar(13, [6,5,4,3,2,9,8,7,6,5,4,3,2]);
}

function tabelaCadastro_(nomeAba, colunas) {
  garantirAba_(nomeAba, colunas);
  const tabela = valoresComCabecalho_(nomeAba);
  colunas.forEach(function (coluna) {
    if (coluna_(tabela.cabecalho, coluna) < 0) {
      tabela.aba.getRange(1, tabela.cabecalho.length + 1).setValue(coluna);
      tabela.cabecalho.push(coluna);
    }
  });
  return tabela;
}

function gravarRegistroCadastro_(tabela, registro, indice) {
  const valores = tabela.cabecalho.map(function (coluna) { return registro[coluna] === undefined ? '' : registro[coluna]; });
  if (indice >= 0) tabela.aba.getRange(indice + 2, 1, 1, valores.length).setValues([valores]);
  else tabela.aba.appendRow(valores);
}

function cadastrarClienteDocumentado_(dados, nome, email, senha) {
  let documentos;
  let raiz;
  const cadastroId = String(dados.cadastroId || '');
  try {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(cadastroId)) throw new Error('Identificador de cadastro inválido. Atualize a página e tente novamente.');
    documentos = validarDocumentosCadastro_(dados.documentos, dados.tipoPessoa);
    if (!cpfCnpjCadastroValido_(dados.cliente.cpfCnpj, dados.tipoPessoa)) throw new Error('Informe um CPF ou CNPJ válido para o tipo de pessoa.');
    const pastaId = PropertiesService.getScriptProperties().getProperty('DOCUMENTOS_CADASTRO_FOLDER_ID');
    if (!pastaId) throw new Error('O armazenamento de documentos ainda não foi configurado. Entre em contato com o laboratório.');
    raiz = DriveApp.getFolderById(pastaId);
    if (raiz.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error('A pasta de documentos deve ter acesso Restrito. Entre em contato com o laboratório.');
  } catch (erro) { return falha_(erro.message || 'Não foi possível validar os documentos.'); }

  // Vincula retomadas aos mesmos dados e arquivos, alem da senha e do cadastroId.
  const pedido = JSON.stringify({ nome: nome, email: email, tipoPessoa: dados.tipoPessoa, cliente: dados.cliente, contatos: dados.contatos,
    documentos: documentos.map(function (doc) { return { categoria: doc.categoria, nome: doc.nome, hash: Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, doc.bytes)) }; }) });
  // Independente da inicializacao do segredo de tokens; senha e ID autorizam retomada.
  const fingerprint = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pedido));
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const usuarios = tabelaCadastro_(ABAS.USUARIOS, ['email', 'senha', 'nome', 'ativo', 'grupo', 'data_cadastro', 'cadastro_id', 'estado_documental', 'cadastro_fingerprint']);
    const indice = usuarios.linhas.findIndex(function (linha) { return String(valorLinha_(usuarios, linha, 'email')).toLowerCase().trim() === email; });
    const idUsado = usuarios.linhas.some(function (linha) { return valorLinha_(usuarios, linha, 'cadastro_id') === cadastroId && String(valorLinha_(usuarios, linha, 'email')).toLowerCase().trim() !== email; });
    if (idUsado) return falha_('Identificador de cadastro já utilizado.');
    if (indice >= 0) {
      const linha = usuarios.linhas[indice];
      if (valorLinha_(usuarios, linha, 'cadastro_id') !== cadastroId || String(valorLinha_(usuarios, linha, 'senha')) !== senha || valorLinha_(usuarios, linha, 'cadastro_fingerprint') !== fingerprint) return falha_('Já existe um cadastro com este e-mail. Para retomar uma tentativa, mantenha os mesmos dados e documentos.');
      if (valorLinha_(usuarios, linha, 'estado_documental') === 'CONCLUIDO') return sucesso_('Cadastro já concluído.', { email: email, grupo: GRUPOS.CLIENTE });
    }
    const agora = new Date();
    const registroUsuario = { email: email, senha: senha, nome: nome, ativo: false, grupo: GRUPOS.CLIENTE, data_cadastro: indice >= 0 ? valorLinha_(usuarios, usuarios.linhas[indice], 'data_cadastro') : agora, cadastro_id: cadastroId, estado_documental: 'PENDENTE', cadastro_fingerprint: fingerprint };
    if (indice < 0) gravarRegistroCadastro_(usuarios, registroUsuario, -1);
    const indiceUsuario = indice < 0 ? usuarios.linhas.length : indice;
    const pastas = raiz.getFoldersByName(cadastroId);
    const pasta = pastas.hasNext() ? pastas.next() : raiz.createFolder(cadastroId);
    if (pasta.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error('Pasta de cadastro com compartilhamento indevido.');
    const anexos = tabelaCadastro_(ABAS.DOCUMENTOS_USUARIOS, ['documento_id', 'cadastro_id', 'usuario_email', 'tipo_pessoa', 'categoria_documento', 'arquivo_drive_id', 'nome_original', 'mime_type', 'tamanho_bytes', 'data_upload']);
    documentos.forEach(function (doc) {
      const indiceAnexo = anexos.linhas.findIndex(function (linha) { return valorLinha_(anexos, linha, 'cadastro_id') === cadastroId && valorLinha_(anexos, linha, 'categoria_documento') === doc.categoria; });
      const existente = indiceAnexo >= 0 ? anexos.linhas[indiceAnexo] : null;
      if (existente) {
        try {
          const salvo = DriveApp.getFileById(String(valorLinha_(anexos, existente, 'arquivo_drive_id')));
          if (!salvo.isTrashed()) return;
        } catch (_) { /* Recria arquivo ausente usando a mesma linha de metadados. */ }
      }
      // Uma resposta perdida do Drive pode ter deixado o arquivo na pasta.
      const candidatos = pasta.getFilesByName(doc.categoria + '-' + doc.nome);
      let arquivo = null;
      const hashEsperado = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, doc.bytes));
      while (candidatos.hasNext()) {
        const candidato = candidatos.next();
        if (!candidato.isTrashed() && Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, candidato.getBlob().getBytes())) === hashEsperado) { arquivo = candidato; break; }
      }
      if (!arquivo) arquivo = pasta.createFile(Utilities.newBlob(doc.bytes, doc.mimeType, doc.categoria + '-' + doc.nome));
      try {
        gravarRegistroCadastro_(anexos, { documento_id: existente ? valorLinha_(anexos, existente, 'documento_id') : Utilities.getUuid(), cadastro_id: cadastroId, usuario_email: email, tipo_pessoa: dados.tipoPessoa, categoria_documento: doc.categoria, arquivo_drive_id: arquivo.getId(), nome_original: doc.nome, mime_type: doc.mimeType, tamanho_bytes: doc.tamanho, data_upload: agora }, indiceAnexo);
      } catch (erro) {
        // Nao apagar um arquivo cuja escrita de metadados efetivou antes da excecao.
        let persistido = false;
        try {
          const atual = valoresComCabecalho_(ABAS.DOCUMENTOS_USUARIOS);
          persistido = atual.linhas.some(function (linha) { return valorLinha_(atual, linha, 'cadastro_id') === cadastroId && valorLinha_(atual, linha, 'categoria_documento') === doc.categoria && valorLinha_(atual, linha, 'arquivo_drive_id') === arquivo.getId(); });
          if (!persistido) arquivo.setTrashed(true);
        } catch (_) { Logger.log('Conferir arquivo/metadados no cadastro ' + cadastroId + ': ' + arquivo.getId()); }
        if (persistido) return;
        throw erro;
      }
    });
    const clientes = tabelaCadastro_(ABAS.CLIENTES, ['usuario_email', 'razao_social', 'nome_fantasia', 'renasem', 'endereco', 'cidade', 'estado', 'cep', 'telefone', 'cpf_cnpj', 'inscricao_estadual_rg', 'ramo_atividade', 'numero_funcionarios', 'data_cadastro', 'tipo_pessoa', 'cadastro_id']);
    const c = dados.cliente;
    if (!clientes.linhas.some(function (linha) { return valorLinha_(clientes, linha, 'cadastro_id') === cadastroId; })) gravarRegistroCadastro_(clientes, { usuario_email: email, razao_social: dados.tipoPessoa === 'FISICA' ? nome : c.razaoSocial, nome_fantasia: dados.tipoPessoa === 'JURIDICA' ? c.nomeFantasia : '', renasem: c.renasem || '', endereco: c.endereco, cidade: c.cidade, estado: c.estado, cep: c.cep, telefone: c.telefone, cpf_cnpj: c.cpfCnpj, inscricao_estadual_rg: c.inscricaoEstadualRg, ramo_atividade: dados.tipoPessoa === 'JURIDICA' ? c.ramoAtividade : '', numero_funcionarios: dados.tipoPessoa === 'JURIDICA' ? c.numeroFuncionarios : '', data_cadastro: agora, tipo_pessoa: dados.tipoPessoa, cadastro_id: cadastroId }, -1);
    const contatos = tabelaCadastro_(ABAS.CONTATOS_CLIENTES, ['usuario_email', 'nome', 'cpf', 'email', 'telefone', 'cargo', 'departamento', 'recebe_nota_fiscal_boleto', 'recebe_proposta', 'recebe_relatorio', 'data_cadastro', 'cadastro_id', 'numero_contato']);
    (Array.isArray(dados.contatos) ? dados.contatos : []).forEach(function (contato, i) {
      if (contatos.linhas.some(function (linha) { return valorLinha_(contatos, linha, 'cadastro_id') === cadastroId && Number(valorLinha_(contatos, linha, 'numero_contato')) === i + 1; })) return;
      gravarRegistroCadastro_(contatos, { usuario_email: email, nome: contato.nome, cpf: contato.cpf, email: contato.email, telefone: contato.telefone, cargo: contato.cargo, departamento: contato.departamento, recebe_nota_fiscal_boleto: Boolean(contato.recebeNotaFiscalBoleto), recebe_proposta: Boolean(contato.recebeProposta), recebe_relatorio: Boolean(contato.recebeRelatorio), data_cadastro: agora, cadastro_id: cadastroId, numero_contato: i + 1 }, -1);
    });
    SpreadsheetApp.flush();
    registroUsuario.ativo = true;
    registroUsuario.estado_documental = 'CONCLUIDO';
    gravarRegistroCadastro_(usuarios, registroUsuario, indiceUsuario);
    return sucesso_('Cadastro realizado com os documentos obrigatórios.', { email: email, grupo: GRUPOS.CLIENTE });
  } catch (erro) {
    // O commit final pode ter efetivado e apenas seu retorno ter falhado.
    try {
      const salvo = usuarioPorEmail_(email);
      if (salvo && salvo.cadastroId === cadastroId && salvo.estadoDocumental === 'CONCLUIDO' && salvo.senha === senha && valorLinha_(salvo.tabela, salvo.linha, 'cadastro_fingerprint') === fingerprint) return sucesso_('Cadastro concluído.', { email: email, grupo: GRUPOS.CLIENTE });
    } catch (_) {}
    Logger.log('Falha ao finalizar cadastro ' + cadastroId + ': ' + erro);
    return falha_('Não foi possível concluir o cadastro. Seu acesso ainda não foi liberado. Tente novamente com os mesmos dados e documentos.');
  } finally { try { lock.releaseLock(); } catch (_) {} }
}
