/* Seção opcional "Checklist de Recebimento de Amostra", compartilhada pelos formulários. */
(function () {
  const raiz = document.querySelector('#checklist-recebimento');
  if (!raiz) return;

  const referencia = raiz.querySelector('#checklist-referencia');
  const numeroAnalise = raiz.querySelector('#checklist-numero-analise');
  const erro = raiz.querySelector('#checklist-error');
  let solicitacoes = null;

  function limparErro() {
    erro.textContent = '';
    raiz.querySelectorAll('.invalid').forEach((campo) => {
      if (window.Validacoes) Validacoes.limparErro(campo);
    });
  }

  function preencherNumeros(lista) {
    if (!lista.length) {
      numeroAnalise.innerHTML = '<option value="">Nenhuma solicitação encontrada</option>';
      numeroAnalise.disabled = true;
      return;
    }
    numeroAnalise.innerHTML = [
      '<option value="">Selecione</option>',
      ...lista.map((item) => `<option value="${item.solicitacaoId}">${item.solicitacaoId}</option>`)
    ].join('');
    numeroAnalise.disabled = false;
  }

  async function carregarNumeros() {
    const tipo = referencia.value;
    numeroAnalise.value = '';
    if (!tipo) {
      numeroAnalise.innerHTML = '<option value="">Selecione a referência</option>';
      numeroAnalise.disabled = true;
      return;
    }
    numeroAnalise.innerHTML = '<option value="">Carregando…</option>';
    numeroAnalise.disabled = true;
    try {
      if (!solicitacoes) {
        const resultado = await AppAuth.requisitarApi('listarHistoricoSolicitacoes');
        solicitacoes = resultado.dados?.solicitacoes || [];
      }
      preencherNumeros(solicitacoes.filter((item) => item.tipo === tipo));
    } catch (e) {
      numeroAnalise.innerHTML = '<option value="">Erro ao carregar</option>';
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
      tipoReferencia: valor('checklistReferencia'),
      solicitacaoId: valor('checklistNumeroAnalise'),
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
    carregarNumeros();
  });

  numeroAnalise.addEventListener('change', limparErro);

  window.ChecklistRecebimento = { coletar, validar, mostrarErro, enviar };
})();
