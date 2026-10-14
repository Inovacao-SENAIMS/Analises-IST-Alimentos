/* Detalhe do cliente: exibe todos os dados do cadastro selecionado na lista. */
(function () {
  AppAuth.configurarCabecalho();
  if (!AppAuth.exigirGrupos(['IST_Colaborators', 'Administrator_User'])) return;

  const ROTULOS_TIPO = { FISICA: 'Pessoa física', JURIDICA: 'Pessoa jurídica' };
  const ROTULOS_CATEGORIA = {
    DOCUMENTO_FOTO: 'Documento com foto',
    COMPROVANTE_RESIDENCIA: 'Comprovante de residência',
    DOCUMENTO_RT: 'Documento do RT',
    ART: 'ART'
  };
  const ROTULOS_CLIENTE = [
    ['razaoSocial', 'Razão social'],
    ['nomeFantasia', 'Nome fantasia'],
    ['cpfCnpj', 'CPF/CNPJ'],
    ['inscricaoEstadualRg', 'Inscrição Estadual / RG'],
    ['renasem', 'RENASEM'],
    ['telefone', 'Telefone'],
    ['endereco', 'Endereço'],
    ['cidade', 'Cidade'],
    ['estado', 'Estado'],
    ['cep', 'CEP'],
    ['ramoAtividade', 'Ramo de atividade'],
    ['numeroFuncionarios', 'Número de funcionários'],
    ['dataCadastro', 'Data do cadastro']
  ];

  const status = document.querySelector('#detalhe-cliente-status');

  function escapar(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, (caractere) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caractere]
    ));
  }

  function formatarData(valor) {
    if (!valor) return '—';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString('pt-BR');
  }

  function formatarTamanho(bytes) {
    const valor = Number(bytes) || 0;
    if (valor < 1024) return `${valor} B`;
    if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(0)} KB`;
    return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
  }

  function mostrarStatus(mensagem, tipoStatus = 'success') {
    status.textContent = mensagem;
    status.className = `status show ${tipoStatus}`;
  }

  function campo(rotulo, valor) {
    return `<div class="data-field"><span>${escapar(rotulo)}</span><strong>${escapar(valor)}</strong></div>`;
  }

  function definirPill(seletor, texto) {
    const elemento = document.querySelector(seletor);
    if (elemento) elemento.textContent = texto;
  }

  function renderizarIdentificacao(cliente) {
    document.querySelector('[data-detalhe-nome]').textContent = cliente.nome;
    document.querySelector('[data-detalhe-email]').textContent = cliente.usuarioEmail;
    document.querySelector('[data-detalhe-ativa]').textContent = cliente.contaAtiva ? 'Ativa' : 'Inativa';
    definirPill('[data-detalhe-tipo]', ROTULOS_TIPO[cliente.tipoPessoa] || cliente.tipoPessoa || '—');
    definirPill('[data-detalhe-grupo]', cliente.grupo || '—');
    definirPill('[data-detalhe-situacao]', cliente.situacao === 'PENDENTE' ? 'Pendente' : 'Concluído');
  }

  function renderizarCadastro(cliente) {
    const campos = ROTULOS_CLIENTE
      .map(([chave, rotulo]) => (chave === 'dataCadastro' ? [rotulo, formatarData(cliente[chave])] : [rotulo, String(cliente[chave] || '').trim()]))
      .filter(([, valor]) => valor && valor !== '—');
    const alvo = document.querySelector('[data-detalhe-cadastro]');
    alvo.innerHTML = campos.length
      ? campos.map(([rotulo, valor]) => campo(rotulo, valor)).join('')
      : '';
  }

  function renderizarContatos(contatos) {
    const corpo = document.querySelector('[data-detalhe-contatos]');
    const vazio = document.querySelector('[data-detalhe-contatos-vazio]');
    definirPill('[data-detalhe-contatos-pill]', `${contatos.length} ${contatos.length === 1 ? 'contato' : 'contatos'}`);
    vazio.hidden = contatos.length > 0;
    corpo.innerHTML = contatos.map((contato) => {
      const celulas = [
        ['Nome', contato.nome],
        ['CPF', contato.cpf],
        ['E-mail', contato.email],
        ['Telefone', contato.telefone],
        ['Cargo', contato.cargo],
        ['Departamento', contato.departamento]
      ].map(([rotulo, valor]) => `<td data-label="${escapar(rotulo)}">${escapar(String(valor || '').trim() || '—')}</td>`).join('');
      const finalidades = [
        [contato.recebeNotaFiscalBoleto, 'Nota fiscal e boleto'],
        [contato.recebeProposta, 'Proposta'],
        [contato.recebeRelatorio, 'Relatório']
      ].filter(([ativo]) => ativo).map(([, rotulo]) => rotulo);
      const propositos = finalidades.length
        ? `<ul class="data-purposes">${finalidades.map((item) => `<li>${escapar(item)}</li>`).join('')}</ul>`
        : '<span>—</span>';
      return `<tr>${celulas}<td data-label="Finalidades">${propositos}</td></tr>`;
    }).join('');
  }

  function renderizarDocumentos(documentos) {
    const corpo = document.querySelector('[data-detalhe-documentos]');
    const vazio = document.querySelector('[data-detalhe-documentos-vazio]');
    definirPill('[data-detalhe-documentos-pill]', `${documentos.length} ${documentos.length === 1 ? 'documento' : 'documentos'}`);
    vazio.hidden = documentos.length > 0;
    corpo.innerHTML = documentos.map((documento) => `
      <tr>
        <td data-label="Categoria">${escapar(ROTULOS_CATEGORIA[documento.categoria] || documento.categoria || '—')}</td>
        <td data-label="Arquivo">${escapar(documento.nomeOriginal || '—')}</td>
        <td data-label="Tamanho">${escapar(formatarTamanho(documento.tamanho))}</td>
        <td data-label="Data">${escapar(formatarData(documento.dataUpload))}</td>
      </tr>
    `).join('');
  }

  function renderizarSolicitacoes(resumo) {
    const alvo = document.querySelector('[data-detalhe-solicitacoes]');
    const total = resumo.reduce((soma, item) => soma + (Number(item.quantidade) || 0), 0);
    alvo.innerHTML = resumo.map((item) => `${campo(item.titulo, String(item.quantidade || 0))}`).join('');
    alvo.insertAdjacentHTML('afterbegin', campo('Total de solicitações', String(total)));
  }

  async function carregar() {
    const email = new URLSearchParams(window.location.search).get('email');
    if (!email) {
      mostrarStatus('Cliente não informado na URL.', 'error');
      return;
    }

    mostrarStatus('Carregando cliente…', 'loading');
    try {
      const resultado = await AppAuth.requisitarApi('obterCliente', { dados: { email } });
      const cliente = resultado.dados.cliente;
      document.title = `Cliente ${cliente.nome} | SENAI FIEMS`;
      document.querySelector('.page-heading').textContent = cliente.nome;
      renderizarIdentificacao(cliente);
      renderizarCadastro(cliente);
      renderizarContatos(cliente.contatos || []);
      renderizarDocumentos(cliente.documentos || []);
      renderizarSolicitacoes(cliente.solicitacoes || []);
      status.className = 'status';
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
  }

  carregar();
})();
