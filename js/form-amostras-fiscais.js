/* Controla a solicitação de análise para amostras fiscais de alimentos. */
(function () {
  AppAuth.configurarCabecalho();

  const form = document.querySelector('#fiscal-form');
  if (!form) return;

  const status = document.querySelector('#fiscal-status');

  function limparStatus() {
    status.className = 'status';
    status.textContent = '';
  }

  function validar() {
    document.querySelectorAll('.invalid').forEach((campo) => Validacoes.limparErro(campo));
    let primeiroErro = null;
    const obrigatorios = [...form.querySelectorAll('[required]')]
      .filter((campo) => !campo.closest('[hidden]'));

    obrigatorios.forEach((campo) => {
      const vazio = campo.type === 'checkbox' || campo.type === 'radio'
        ? !form.querySelector(`[name="${campo.name}"]:checked`)
        : !String(campo.value || '').trim();
      if (vazio) {
        Validacoes.adicionarErro(campo, 'Campo obrigatório.');
        if (!primeiroErro) primeiroErro = campo;
      }
    });

    const documento = document.querySelector('#cpf-cnpj-fiscal');
    if (documento.value && !Validacoes.validarCpfCnpj(documento.value)) {
      Validacoes.adicionarErro(documento, 'Informe um CPF ou CNPJ válido.');
      if (!primeiroErro) primeiroErro = documento;
    }

    const analises = [...form.querySelectorAll('input[name="analises"]:checked')];
    const analisesErro = document.querySelector('#analises-fiscal-error');
    analisesErro.textContent = '';
    if (!analises.length) {
      analisesErro.textContent = 'Selecione pelo menos uma análise.';
      if (!primeiroErro) primeiroErro = form.querySelector('input[name="analises"]');
    }

    const declaracao = document.querySelector('#declaracao-fiscal');
    const declaracaoErro = document.querySelector('#declaracao-fiscal-error');
    declaracaoErro.textContent = declaracao.checked ? '' : 'A declaração é obrigatória.';
    if (!declaracao.checked && !primeiroErro) primeiroErro = declaracao;

    if (!primeiroErro) return true;
    primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    primeiroErro.focus?.();
    return false;
  }

  function coletar() {
    const dados = {};
    new FormData(form).forEach((valor, chave) => {
      if (chave !== 'analises' && chave !== 'declaracao') dados[chave] = valor;
    });
    dados.analises = [...form.querySelectorAll('input[name="analises"]:checked')]
      .map((campo) => campo.value);
    dados.declaracao = true;
    return dados;
  }

  document.querySelector('#cpf-cnpj-fiscal').addEventListener('input', (evento) => {
    evento.target.value = Validacoes.mascaraCpfCnpj(evento.target.value);
  });

  document.querySelector('#fiscal-clear').addEventListener('click', () => {
    if (!window.confirm('Deseja limpar todos os dados preenchidos?')) return;
    form.reset();
    limparStatus();
    document.querySelector('#analises-fiscal-error').textContent = '';
    document.querySelector('#declaracao-fiscal-error').textContent = '';
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparStatus();
    if (!validar()) return;

    const botao = document.querySelector('#fiscal-submit');
    botao.disabled = true;
    status.textContent = 'Enviando solicitação…';
    status.className = 'status show loading';

    try {
      const resultado = await AppAuth.requisitarApi('salvarSolicitacaoAmostrasFiscais', { dados: coletar() });
      status.textContent = `Solicitação enviada com sucesso. Número: ${resultado.dados.solicitacaoId}`;
      status.className = 'status show success';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (erro) {
      status.textContent = erro.message;
      status.className = 'status show error';
      botao.disabled = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();
