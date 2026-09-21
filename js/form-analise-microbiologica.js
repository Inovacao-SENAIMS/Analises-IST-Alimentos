/* Controla o formulário de análise microbiológica. */
(function () {
  AppAuth.configurarCabecalho();

  const form = document.querySelector('#micro-form');
  if (!form) return;

  const status = document.querySelector('#micro-status');
  const ensaiosAlvo = document.querySelector('#micro-ensaios');
  const ensaios = APP_CONFIG.ensaiosMicrobiologicos;
  const botaoPdf = document.querySelector('#micro-pdf');
  let ultimoComprovante = null;

  function prepararComprovante(dados, solicitacaoId) {
    return {
      solicitacaoId,
      titulo: 'Solicitação de Análise Microbiológica',
      dataEnvio: new Date().toLocaleString('pt-BR'),
      campos: [
        ['Razão social', dados.razaoSocial], ['CPF/CNPJ', dados.cpfCnpj], ['Responsável', dados.responsavel],
        ['Tipo de amostra', dados.tipoAmostra], ['Lote', dados.lote], ['Finalidade', dados.finalidade]
      ].map(([rotulo, valor]) => ({ rotulo, valor })),
      relacionados: dados.ensaios.map((ensaio, indice) => ({
        numero: indice + 1,
        campos: [{ rotulo: 'Ensaio', valor: ensaio.ensaio }, { rotulo: 'Código', valor: ensaio.codigo }]
      }))
    };
  }

  function escapeHtml(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function renderizarGrupo(titulo, grupo, prefixo) {
    return `
      <div class="micro-assay-group">
        <h3>${titulo}</h3>
        <div class="micro-assay-list">
          ${grupo.map((ensaio, indice) => `
            <label class="choice micro-assay-choice">
              <input type="checkbox" name="ensaiosMicro" value="${prefixo}-${indice}" data-codigo="${escapeHtml(ensaio.codigo)}" data-ensaio="${escapeHtml(ensaio.nome)}">
              <span class="assay-code">${escapeHtml(ensaio.codigo || '—')}</span>
              <span>${escapeHtml(ensaio.nome)}</span>
            </label>`).join('')}
        </div>
      </div>`;
  }

  function renderizarEnsaios() {
    ensaiosAlvo.innerHTML = [
      renderizarGrupo('Água e Gelo', ensaios.aguaGelo, 'agua'),
      renderizarGrupo('Alimentos e Bebidas', ensaios.alimentosBebidas, 'alimentos')
    ].join('');
  }

  function limparStatus() {
    status.className = 'status';
    status.textContent = '';
  }

  function registrarErro(campo, mensagem) {
    Validacoes.adicionarErro(campo, mensagem);
    return campo;
  }

  function validar() {
    document.querySelectorAll('.invalid').forEach((campo) => Validacoes.limparErro(campo));
    let primeiroErro = null;
    const finalidade = form.querySelector('input[name="finalidade"]:checked')?.value;
    const obrigatorios = [...form.querySelectorAll('[required]')]
      .filter((campo) => !campo.closest('[hidden]'));

    obrigatorios.forEach((campo) => {
      const vazio = campo.type === 'checkbox' || campo.type === 'radio'
        ? !form.querySelector(`[name="${campo.name}"]:checked`)
        : !String(campo.value || '').trim();

      if (vazio) {
        registrarErro(campo, 'Campo obrigatório.');
        if (!primeiroErro) primeiroErro = campo;
      }
    });

    const documento = document.querySelector('#cpf-cnpj-micro');
    if (documento.value && !Validacoes.validarCpfCnpj(documento.value)) {
      registrarErro(documento, 'Informe um CPF ou CNPJ válido.');
      if (!primeiroErro) primeiroErro = documento;
    }

    const ensaiosSelecionados = [...form.querySelectorAll('input[name="ensaiosMicro"]:checked')];
    const ensaiosErro = document.querySelector('#micro-ensaios-error');
    ensaiosErro.textContent = '';
    if (!ensaiosSelecionados.length) {
      ensaiosErro.textContent = 'Selecione pelo menos um ensaio.';
      if (!primeiroErro) primeiroErro = form.querySelector('input[name="ensaiosMicro"]');
    }

    const declaracao = document.querySelector('#declaracao-micro');
    const declaracaoErro = document.querySelector('#declaracao-micro-error');
    if (!declaracao.checked) {
      declaracaoErro.textContent = 'A declaração é obrigatória.';
      if (!primeiroErro) primeiroErro = declaracao;
    } else {
      declaracaoErro.textContent = '';
    }

    if (finalidade === 'Outros') {
      const especificacao = document.querySelector('#finalidade-outros');
      if (!especificacao.value.trim()) {
        registrarErro(especificacao, 'Especifique a finalidade.');
        if (!primeiroErro) primeiroErro = especificacao;
      }
    }

    if (!primeiroErro) return true;
    primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    primeiroErro.focus?.();
    return false;
  }

  function coletar() {
    const dados = {};
    new FormData(form).forEach((valor, chave) => {
      if (chave !== 'ensaiosMicro' && chave !== 'declaracao') dados[chave] = valor;
    });

    dados.ensaios = [...form.querySelectorAll('input[name="ensaiosMicro"]:checked')].map((campo) => ({
      codigo: campo.dataset.codigo,
      ensaio: campo.dataset.ensaio,
      grupo: campo.value.split('-')[0]
    }));
    dados.declaracao = true;
    dados.autorizacoes = {
      temperatura: Boolean(form.querySelector('[name="autorizaTemperatura"]')?.checked),
      tempo: Boolean(form.querySelector('[name="autorizaTempo"]')?.checked)
    };
    return dados;
  }

  document.querySelector('#cpf-cnpj-micro').addEventListener('input', (evento) => {
    evento.target.value = Validacoes.mascaraCpfCnpj(evento.target.value);
  });

  document.querySelectorAll('input[name="finalidade"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const outros = document.querySelector('#finalidade-outros-micro');
      outros.hidden = radio.value !== 'Outros' || !radio.checked;
    });
  });

  document.querySelector('#micro-clear').addEventListener('click', () => {
    if (!window.confirm('Deseja limpar todos os dados preenchidos?')) return;
    form.reset();
    document.querySelector('#finalidade-outros-micro').hidden = true;
    ultimoComprovante = null;
    botaoPdf.hidden = true;
    limparStatus();
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparStatus();
    if (!validar()) return;

    const botao = document.querySelector('#micro-submit');
    botao.disabled = true;
    status.textContent = 'Enviando solicitação…';
    status.className = 'status show loading';

    try {
      const dados = coletar();
      const resultado = await AppAuth.requisitarApi('salvarSolicitacaoMicrobiologica', { dados });
      ultimoComprovante = prepararComprovante(dados, resultado.dados.solicitacaoId);
      botaoPdf.hidden = false;
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

  botaoPdf.addEventListener('click', () => {
    try {
      RelatoriosPdf.baixarComprovante(ultimoComprovante);
    } catch (erro) {
      status.textContent = erro.message;
      status.className = 'status show error';
    }
  });

  renderizarEnsaios();
})();
