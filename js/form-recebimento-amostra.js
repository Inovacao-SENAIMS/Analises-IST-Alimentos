/* Serviço de recebimento: registra o checklist de recebimento de uma amostra. */
(function () {
  AppAuth.configurarCabecalho();

  const form = document.querySelector('#recebimento-form');
  if (!form) return;
  if (AppAuth.bloquearEntradasSolicitacao(form)) return;

  const status = document.querySelector('#recebimento-status');

  function limparStatus() {
    status.className = 'status';
    status.textContent = '';
  }

  const limpar = document.querySelector('#recebimento-clear');
  if (limpar) {
    limpar.addEventListener('click', () => {
      if (!window.confirm('Deseja limpar os dados preenchidos?')) return;
      form.reset();
      const numero = document.querySelector('#checklist-numero-analise');
      if (numero) {
        numero.innerHTML = '<option value="">Selecione a referência</option>';
        numero.disabled = true;
      }
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
})();
