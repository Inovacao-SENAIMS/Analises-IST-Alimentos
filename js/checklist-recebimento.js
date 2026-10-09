/* Seção opcional "Checklist de Recebimento de Amostra", compartilhada pelos formulários. */
(function () {
  const raiz = document.querySelector('#checklist-recebimento');
  if (!raiz) return;

  const referencia = raiz.querySelector('#checklist-referencia');
  const usuario = raiz.querySelector('#checklist-usuario');
  const requerente = raiz.querySelector('#checklist-requerente');
  const numeroAnalise = raiz.querySelector('#checklist-numero-analise');
  const erro = raiz.querySelector('#checklist-error');
  let solicitacoes = null;

  function limparErro() {
    erro.textContent = '';
    raiz.querySelectorAll('.invalid').forEach((campo) => {
      if (window.Validacoes) Validacoes.limparErro(campo);
    });
  }

  function preencher(select, itens, vazio, valorAtual) {
    if (!itens.length) {
      select.innerHTML = `<option value="">${vazio}</option>`;
      select.disabled = true;
      return;
    }
    select.innerHTML = [
      '<option value="">Selecione</option>',
      ...itens.map((item) => `<option value="${item.valor}">${item.rotulo}</option>`)
    ].join('');
    select.disabled = false;
    if (valorAtual && itens.some((item) => item.valor === valorAtual)) select.value = valorAtual;
  }

  function base() {
    const tipo = referencia.value;
    return tipo ? (solicitacoes || []).filter((item) => item.tipo === tipo) : [];
  }

  function distintos(lista, chave, chaveRotulo) {
    const vistos = new Set();
    const itens = [];
    lista.forEach((item) => {
      const valor = String(item[chave] || '').trim();
      if (!valor || vistos.has(valor)) return;
      vistos.add(valor);
      itens.push({ valor, rotulo: String(item[chaveRotulo || chave] || valor).trim() || valor });
    });
    return itens.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  }

  function atualizarNumero() {
    const filtradas = base().filter((item) =>
      (!usuario.value || String(item.usuario) === usuario.value) &&
      (!requerente.value || String(item.requerente) === requerente.value));
    preencher(numeroAnalise, filtradas.map((item) => ({ valor: item.solicitacaoId, rotulo: item.solicitacaoId })), 'Nenhuma solicitação encontrada', '');
  }

  function atualizarUsuario() {
    const filtradas = base().filter((item) => !requerente.value || String(item.requerente) === requerente.value);
    preencher(usuario, distintos(filtradas, 'usuario', 'usuarioNome'), 'Nenhum usuário', usuario.value);
  }

  function atualizarRequerente() {
    const filtradas = base().filter((item) => !usuario.value || String(item.usuario) === usuario.value);
    preencher(requerente, distintos(filtradas, 'requerente'), 'Nenhum requerente', requerente.value);
  }

  function refrescar() {
    atualizarUsuario();
    atualizarRequerente();
    atualizarNumero();
  }

  async function carregar() {
    usuario.value = '';
    requerente.value = '';
    numeroAnalise.value = '';
    if (!referencia.value) {
      preencher(usuario, [], 'Selecione a referência', '');
      preencher(requerente, [], 'Selecione a referência', '');
      preencher(numeroAnalise, [], 'Selecione a referência', '');
      return;
    }
    preencher(usuario, [], 'Carregando…', '');
    preencher(requerente, [], 'Carregando…', '');
    preencher(numeroAnalise, [], 'Carregando…', '');
    try {
      if (!solicitacoes) {
        const resultado = await AppAuth.requisitarApi('listarHistoricoSolicitacoes');
        solicitacoes = resultado.dados?.solicitacoes || [];
      }
      refrescar();
    } catch (e) {
      preencher(usuario, [], 'Erro ao carregar', '');
      preencher(requerente, [], 'Erro ao carregar', '');
      preencher(numeroAnalise, [], 'Erro ao carregar', '');
      erro.textContent = e.message;
    }
  }

  function valor(nome) {
    const campo = raiz.querySelector(`[name="${nome}"]`);
    return campo ? String(campo.value || '').trim() : '';
  }

  function coletar() {
    const situacao = raiz.querySelector('[name="checklistSituacao"]:checked');
    const dados = {
      tipoReferencia: referencia.value,
      usuarioAmostra: usuario.value,
      requerenteCliente: requerente.value,
      solicitacaoId: numeroAnalise.value,
      dataRecebimento: valor('checklistDataRecebimento'),
      hora: valor('checklistHora'),
      temperatura: valor('checklistTemperatura'),
      quantidade: valor('checklistQuantidade'),
      pesoVolume: valor('checklistPesoVolume'),
      numeroAmostra: valor('checklistNumeroAmostra'),
      situacao: situacao ? situacao.value : '',
      responsavel: valor('checklistResponsavel'),
      observacoes: valor('checklistObservacoes')
    };
    return Object.values(dados).some((item) => item !== '') ? dados : null;
  }

  function validar(dados) {
    if (!dados) return '';
    if (!dados.tipoReferencia) return 'Selecione a Referência do checklist de recebimento.';
    if (!dados.solicitacaoId) return 'Selecione o Número da Análise do checklist de recebimento.';
    return '';
  }

  function mostrarErro(mensagem) {
    erro.textContent = mensagem;
    erro.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function enviar(dados) {
    return AppAuth.requisitarApi('salvarChecklistRecebimento', { dados });
  }

  referencia.addEventListener('change', () => {
    limparErro();
    carregar();
  });
  usuario.addEventListener('change', () => {
    limparErro();
    atualizarRequerente();
    atualizarNumero();
  });
  requerente.addEventListener('change', () => {
    limparErro();
    atualizarUsuario();
    atualizarNumero();
  });
  numeroAnalise.addEventListener('change', limparErro);

  window.ChecklistRecebimento = { coletar, validar, mostrarErro, enviar };
})();
