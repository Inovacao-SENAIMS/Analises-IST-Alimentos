/* Serviço de recebimento: registra o checklist de recebimento de uma amostra. */
(function () {
  AppAuth.configurarCabecalho();

  const form = document.querySelector('#recebimento-form');
  if (!form) return;
  if (!AppAuth.exigirGrupos(['IST_Colaborators', 'Manager_User', 'Administrator_User'])) return;

  const status = document.querySelector('#recebimento-status');
  const botaoPdf = document.querySelector('#recebimento-pdf');
  let ultimoChecklist = null;

  function limparStatus() {
    status.className = 'status';
    status.textContent = '';
  }

  function rotuloOpcao(seletor) {
    const select = document.querySelector(seletor);
    const opcao = select && select.selectedOptions && select.selectedOptions[0];
    return opcao ? opcao.textContent.trim() : '';
  }

  function resetarSelects() {
    ['#checklist-usuario', '#checklist-requerente', '#checklist-numero-analise'].forEach((seletor) => {
      const select = document.querySelector(seletor);
      if (!select) return;
      select.innerHTML = '<option value="">Selecione a referência</option>';
      select.disabled = true;
    });
  }

  const limpar = document.querySelector('#recebimento-clear');
  if (limpar) {
    limpar.addEventListener('click', () => {
      if (!window.confirm('Deseja limpar os dados preenchidos?')) return;
      form.reset();
      resetarSelects();
      ultimoChecklist = null;
      botaoPdf.hidden = true;
      limparStatus();
    });
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparStatus();

    const dados = window.ChecklistRecebimento?.coletar() || null;
    if (!dados) {
      window.ChecklistRecebimento?.mostrarErro('Preencha o checklist de recebimento para enviar.');
      return;
    }
    const problema = window.ChecklistRecebimento.validar(dados) || '';
    if (problema) {
      window.ChecklistRecebimento.mostrarErro(problema);
      return;
    }

    const botao = document.querySelector('#recebimento-submit');
    botao.disabled = true;
    status.className = 'status show loading';
    status.textContent = 'Registrando recebimento…';

    try {
      const resultado = await window.ChecklistRecebimento.enviar(dados);
      ultimoChecklist = Object.assign({}, dados, {
        checklistId: resultado.dados.checklistId,
        tipoReferenciaRotulo: rotuloOpcao('#checklist-referencia'),
        usuarioAmostraNome: rotuloOpcao('#checklist-usuario') || dados.usuarioAmostra,
        requerenteClienteNome: rotuloOpcao('#checklist-requerente') || dados.requerenteCliente,
        dataRegistro: new Date().toLocaleString('pt-BR')
      });
      botaoPdf.hidden = false;
      status.className = 'status show success';
      status.textContent = `Recebimento registrado. Identificador: ${resultado.dados.checklistId}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (erro) {
      status.className = 'status show error';
      status.textContent = erro.message;
      botao.disabled = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  botaoPdf.addEventListener('click', () => {
    if (!ultimoChecklist) return;
    try {
      RelatoriosPdf.baixarChecklist(ultimoChecklist);
    } catch (erro) {
      status.className = 'status show error';
      status.textContent = erro.message;
    }
  });
})();
