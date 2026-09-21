/* Lista solicitações do usuário e exibe detalhes sem campos laboratoriais. */
(function () {
  AppAuth.configurarCabecalho();

  const corpo = document.querySelector('#history-body');
  if (!corpo) return;

  const status = document.querySelector('#history-status');
  const vazio = document.querySelector('#history-empty');
  const busca = document.querySelector('#history-search');
  const detalhe = document.querySelector('#history-detail');
  let solicitacoes = [];

  function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caractere) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[caractere]));
  }

  function dataFormatada(valor) {
    if (!valor) return 'Não informado';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR');
  }

  function mostrarStatus(mensagem, tipo = 'loading') {
    status.textContent = mensagem;
    status.className = `status show ${tipo}`;
  }

  function renderizarTabela() {
    const filtro = busca.value.trim().toLowerCase();
    const filtradas = solicitacoes.filter((item) => [
      item.solicitacaoId, item.titulo, item.tipo, item.usuario, item.status
    ].some((valor) => String(valor || '').toLowerCase().includes(filtro)));

    corpo.innerHTML = filtradas.map((item) => `
      <tr>
        <td data-label="Solicitação">${escapar(item.solicitacaoId)}</td>
        <td data-label="Tipo">${escapar(item.titulo)}</td>
        <td data-label="Data de envio">${escapar(dataFormatada(item.dataEnvio))}</td>
        <td data-label="Usuário">${escapar(item.usuario)}</td>
        <td data-label="Status"><span class="history-status-pill">${escapar(item.status)}</span></td>
        <td data-label="Ação"><button class="button primary history-detail-button" data-tipo="${escapar(item.tipo)}" data-id="${escapar(item.solicitacaoId)}" type="button">Visualizar</button></td>
      </tr>
    `).join('');
    vazio.hidden = filtradas.length > 0;

    corpo.querySelectorAll('.history-detail-button').forEach((botao) => {
      botao.addEventListener('click', () => carregarDetalhes(botao.dataset.tipo, botao.dataset.id));
    });
  }

  function renderizarDetalhes(dados) {
    document.querySelector('#history-detail-title').textContent = `${dados.titulo} - ${dados.solicitacaoId}`;
    document.querySelector('#history-detail-meta').innerHTML = `
      <span><strong>Data:</strong> ${escapar(dataFormatada(dados.dataEnvio))}</span>
      <span><strong>Status:</strong> ${escapar(dados.status)}</span>`;
    document.querySelector('#history-detail-fields').innerHTML = dados.campos.map((campo) => `
      <div><span>${escapar(campo.rotulo)}</span><strong>${escapar(campo.valor)}</strong></div>
    `).join('');
    document.querySelector('#history-detail-related').innerHTML = dados.relacionados.length
      ? `<h3>Itens relacionados</h3>${dados.relacionados.map((item) => `
        <article class="history-related-item"><h4>Item ${escapar(item.numero)}</h4>${item.campos.map((campo) => `<span><strong>${escapar(campo.rotulo)}:</strong> ${escapar(campo.valor)}</span>`).join('')}</article>
      `).join('')}`
      : '';
    detalhe.hidden = false;
    detalhe.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function carregarDetalhes(tipo, solicitacaoId) {
    mostrarStatus('Carregando detalhes…');
    try {
      const resultado = await AppAuth.requisitarApi('obterDetalhesSolicitacao', { dados: { tipo, solicitacaoId } });
      renderizarDetalhes(resultado.dados);
      mostrarStatus('Detalhes carregados.', 'success');
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
  }

  async function carregarHistorico() {
    mostrarStatus('Carregando histórico…');
    try {
      const resultado = await AppAuth.requisitarApi('listarHistoricoSolicitacoes');
      solicitacoes = resultado.dados.solicitacoes || [];
      renderizarTabela();
      mostrarStatus(`${solicitacoes.length} solicitação(ões) encontrada(s).`, 'success');
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
      solicitacoes = [];
      renderizarTabela();
    }
  }

  busca.addEventListener('input', renderizarTabela);
  document.querySelector('#history-refresh').addEventListener('click', carregarHistorico);
  document.querySelector('#history-detail-close').addEventListener('click', () => {
    detalhe.hidden = true;
  });
  carregarHistorico();
})();
