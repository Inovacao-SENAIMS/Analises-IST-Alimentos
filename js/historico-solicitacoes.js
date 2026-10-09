/* Lista solicitações do usuário e exibe detalhes sem campos laboratoriais. */
(function () {
  AppAuth.configurarCabecalho();

  const corpo = document.querySelector('#history-body');
  if (!corpo) return;

  const status = document.querySelector('#history-status');
  const vazio = document.querySelector('#history-empty');
  const busca = document.querySelector('#history-search');
  const detalhe = document.querySelector('#history-detail');
  const botaoResumo = document.querySelector('#history-export-summary');
  const botaoIndividual = document.querySelector('#history-export-individual');
  const ehAdministrador = AppAuth.obterSessao()?.grupo === 'Administrator_User';
  const selecao = document.querySelector('#history-selection');
  const botaoExcluirSelecionadas = document.querySelector('#history-delete-selected');
  const selecionarTodas = document.querySelector('#history-select-all');
  const colunaSelecao = document.querySelector('#history-select-column');
  let solicitacoes = [];
  let detalhesAtuais = null;
  const selecionadas = new Map();

  if (ehAdministrador) {
    selecao.hidden = false;
    colunaSelecao.hidden = false;
  }

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

  function solicitacoesFiltradas() {
    const filtro = busca.value.trim().toLowerCase();
    return solicitacoes.filter((item) => [
      item.solicitacaoId, item.titulo, item.tipo, item.usuario, item.status
    ].some((valor) => String(valor || '').toLowerCase().includes(filtro)));
  }

  function chaveSolicitacao(item) {
    return `${item.tipo}:${item.solicitacaoId}`;
  }

  function atualizarControlesSelecao(filtradas = solicitacoesFiltradas()) {
    if (!ehAdministrador) return;
    const quantidade = selecionadas.size;
    botaoExcluirSelecionadas.disabled = quantidade === 0;
    botaoExcluirSelecionadas.textContent = `Excluir selecionadas (${quantidade})`;
    selecionarTodas.checked = filtradas.length > 0 && filtradas.every((item) => selecionadas.has(chaveSolicitacao(item)));
    selecionarTodas.indeterminate = filtradas.some((item) => selecionadas.has(chaveSolicitacao(item))) && !selecionarTodas.checked;
  }

  function renderizarTabela() {
    const filtradas = solicitacoesFiltradas();

    corpo.innerHTML = filtradas.map((item) => `
      <tr>
        ${ehAdministrador ? `<td class="history-select-cell"><input class="history-select-item" type="checkbox" aria-label="Selecionar ${escapar(item.solicitacaoId)}" data-tipo="${escapar(item.tipo)}" data-id="${escapar(item.solicitacaoId)}" ${selecionadas.has(chaveSolicitacao(item)) ? 'checked' : ''}></td>` : ''}
        <td data-label="Solicitação">${escapar(item.solicitacaoId)}</td>
        <td data-label="Tipo">${escapar(item.titulo)}</td>
        <td data-label="Data de envio">${escapar(dataFormatada(item.dataEnvio))}</td>
        <td data-label="Usuário">${escapar(item.usuario)}</td>
        <td data-label="Status"><span class="history-status-pill">${escapar(item.status)}</span>${item.recebido ? '<span class="history-received-pill">Recebido</span>' : ''}</td>
        <td data-label="Ação" class="history-actions"><button class="button primary history-detail-button" data-tipo="${escapar(item.tipo)}" data-id="${escapar(item.solicitacaoId)}" type="button">Baixar PDF</button>${ehAdministrador ? `<button class="button danger history-delete-button" data-tipo="${escapar(item.tipo)}" data-id="${escapar(item.solicitacaoId)}" type="button">Excluir</button>` : ''}</td>
      </tr>
    `).join('');
    vazio.hidden = filtradas.length > 0;

    corpo.querySelectorAll('.history-detail-button').forEach((botao) => {
      botao.addEventListener('click', () => baixarRelatorio(botao.dataset.tipo, botao.dataset.id));
    });
    corpo.querySelectorAll('.history-select-item').forEach((campo) => {
      campo.addEventListener('change', () => {
        const item = filtradas.find((registro) => registro.tipo === campo.dataset.tipo && registro.solicitacaoId === campo.dataset.id);
        if (campo.checked) selecionadas.set(chaveSolicitacao(item), { tipo: item.tipo, solicitacaoId: item.solicitacaoId });
        else selecionadas.delete(chaveSolicitacao(item));
        atualizarControlesSelecao(filtradas);
      });
    });
    corpo.querySelectorAll('.history-delete-button').forEach((botao) => {
      botao.addEventListener('click', () => excluirSolicitacoes([{ tipo: botao.dataset.tipo, solicitacaoId: botao.dataset.id }]));
    });
    atualizarControlesSelecao(filtradas);
  }

  async function excluirSolicitacoes(itens) {
    if (!itens.length) return;
    const descricao = itens.length === 1
      ? `a solicitação ${itens[0].solicitacaoId}`
      : `${itens.length} solicitações selecionadas`;
    if (!confirm(`Excluir permanentemente ${descricao}? Esta ação não pode ser desfeita.`)) return;

    mostrarStatus('Excluindo solicitações…');
    try {
      const resultado = await AppAuth.requisitarApi('excluirSolicitacoes', { dados: { solicitacoes: itens } });
      selecionadas.clear();
      detalhe.hidden = true;
      botaoIndividual.hidden = true;
      detalhesAtuais = null;
      await carregarHistorico();
      mostrarStatus(resultado.mensagem, 'success');
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
  }

  function renderizarDetalhes(dados) {
    detalhesAtuais = dados;
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
    botaoIndividual.hidden = false;
    detalhe.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function baixarRelatorio(tipo, solicitacaoId) {
    mostrarStatus('Preparando download…');
    try {
      const resultado = await AppAuth.requisitarApi('obterDetalhesSolicitacao', { dados: { tipo, solicitacaoId } });
      RelatoriosPdf.baixarIndividual(resultado.dados);
      mostrarStatus('Download iniciado.', 'success');
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
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
      selecionadas.clear();
      renderizarTabela();
      mostrarStatus(`${solicitacoes.length} solicitação(ões) encontrada(s).`, 'success');
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
      solicitacoes = [];
      renderizarTabela();
    }
  }

  busca.addEventListener('input', () => {
    selecionadas.clear();
    renderizarTabela();
  });
  document.querySelector('#history-refresh').addEventListener('click', carregarHistorico);
  selecionarTodas.addEventListener('change', () => {
    const filtradas = solicitacoesFiltradas();
    filtradas.forEach((item) => {
      if (selecionarTodas.checked) selecionadas.set(chaveSolicitacao(item), { tipo: item.tipo, solicitacaoId: item.solicitacaoId });
      else selecionadas.delete(chaveSolicitacao(item));
    });
    renderizarTabela();
  });
  botaoExcluirSelecionadas.addEventListener('click', () => excluirSolicitacoes([...selecionadas.values()]));
  botaoResumo.addEventListener('click', () => {
    const filtradas = solicitacoesFiltradas();
    if (!filtradas.length) {
      mostrarStatus('Não há solicitações para exportar com o filtro atual.', 'error');
      return;
    }
    try {
      RelatoriosPdf.baixarResumo(filtradas, { termoBusca: busca.value.trim() || 'Todos os registros' });
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
  });
  botaoIndividual.addEventListener('click', () => {
    if (!detalhesAtuais) return;
    try {
      RelatoriosPdf.baixarIndividual(detalhesAtuais);
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
  });
  document.querySelector('#history-detail-close').addEventListener('click', () => {
    detalhe.hidden = true;
    botaoIndividual.hidden = true;
  });
  carregarHistorico();
})();
