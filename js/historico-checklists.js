/* Lista os checklists de recebimento gerados e permite baixar o comprovante. */
(function () {
  AppAuth.configurarCabecalho();
  if (!AppAuth.exigirGrupos(['IST_Colaborators', 'Manager_User', 'Administrator_User'])) return;

  const corpo = document.querySelector('#checklists-body');
  if (!corpo) return;

  const status = document.querySelector('#checklists-status');
  const vazio = document.querySelector('#checklists-empty');
  const busca = document.querySelector('#checklists-search');
  const botaoResumo = document.querySelector('#checklists-export-summary');
  let checklists = [];

  const REFERENCIA = {
    'analise-sementes': 'Análise de Sementes',
    'analise-microbiologica': 'Análise Microbiológica',
    'analise-fisico-quimica': 'Análise Físico-Química',
    'amostras-fiscais': 'Análise de Alimentos'
  };

  function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caractere) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[caractere]));
  }

  function rotuloReferencia(tipo) {
    return REFERENCIA[tipo] || tipo || '—';
  }

  function recebimento(item) {
    if (!item.dataRecebimento) return item.dataRegistro || 'Não informado';
    return item.horaRecebimento ? `${item.dataRecebimento} ${item.horaRecebimento}` : String(item.dataRecebimento);
  }

  function mostrarStatus(mensagem, tipo = 'loading') {
    status.textContent = mensagem;
    status.className = `status show ${tipo}`;
  }

  function filtrados() {
    const filtro = busca.value.trim().toLowerCase();
    return checklists.filter((item) => [
      item.checklistId, item.solicitacaoId, item.tipoReferencia, rotuloReferencia(item.tipoReferencia),
      item.usuarioAmostra, item.usuarioAmostraNome, item.requerenteCliente, item.situacaoAmostra
    ].some((valor) => String(valor || '').toLowerCase().includes(filtro)));
  }

  function renderizar() {
    const lista = filtrados();
    corpo.innerHTML = lista.map((item) => `
      <tr>
        <td data-label="Checklist">${escapar(item.checklistId)}</td>
        <td data-label="Referência">${escapar(rotuloReferencia(item.tipoReferencia))}</td>
        <td data-label="Número da Análise">${escapar(item.solicitacaoId)}</td>
        <td data-label="Usuário">${escapar(item.usuarioAmostraNome || item.usuarioAmostra || '—')}</td>
        <td data-label="Requerente/Cliente">${escapar(item.requerenteCliente || '—')}</td>
        <td data-label="Recebimento">${escapar(recebimento(item))}</td>
        <td data-label="Situação"><span class="history-status-pill">${escapar(item.situacaoAmostra || '—')}</span></td>
        <td data-label="Ação" class="history-actions"><button class="button primary checklist-pdf-button" data-id="${escapar(item.checklistId)}" type="button">Baixar PDF</button></td>
      </tr>
    `).join('');
    vazio.hidden = lista.length > 0;

    corpo.querySelectorAll('.checklist-pdf-button').forEach((botao) => {
      botao.addEventListener('click', () => {
        const item = checklists.find((registro) => registro.checklistId === botao.dataset.id);
        if (!item) return;
        try {
          RelatoriosPdf.baixarChecklist(item);
        } catch (erro) {
          mostrarStatus(erro.message, 'error');
        }
      });
    });
  }

  async function carregar() {
    mostrarStatus('Carregando checklists…');
    try {
      const resultado = await AppAuth.requisitarApi('listarChecklists');
      checklists = resultado.dados.checklists || [];
      renderizar();
      mostrarStatus(`${checklists.length} checklist(s) encontrado(s).`, 'success');
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
      checklists = [];
      renderizar();
    }
  }

  busca.addEventListener('input', renderizar);
  document.querySelector('#checklists-refresh').addEventListener('click', carregar);
  botaoResumo.addEventListener('click', () => {
    const lista = filtrados();
    if (!lista.length) {
      mostrarStatus('Não há checklists para exportar com o filtro atual.', 'error');
      return;
    }
    const resumo = lista.map((item) => ({
      solicitacaoId: item.checklistId,
      titulo: `Checklist — ${rotuloReferencia(item.tipoReferencia)}`,
      dataEnvio: recebimento(item),
      status: item.situacaoAmostra || 'Registrado'
    }));
    try {
      RelatoriosPdf.baixarResumo(resumo, { termoBusca: busca.value.trim() || 'Todos os registros' });
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
  });

  carregar();
})();
