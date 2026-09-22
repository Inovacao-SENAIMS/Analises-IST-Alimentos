/* Controla a solicitação de análise físico-química. */
(function () {
  AppAuth.configurarCabecalho();
  const form = document.querySelector('#fisico-quimico-form');

  if (!form) return;

  const status          = document.querySelector('#fq-status');
  const alvo            = document.querySelector('#fisico-quimico-ensaios');
  const erro            = document.querySelector('#fisico-quimico-ensaios-error');
  const botaoPdf        = document.querySelector('#fq-pdf');
  let ultimoComprovante = null;

  const escapar = v => String(v || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));

  function renderizarEnsaios(matriz) {
    const lista = APP_CONFIG.ensaiosFisicoQuimicos[matriz] || [];
    alvo.innerHTML = lista.map((e, i) =>
      '<label class="choice micro-assay-choice">' +
        '<input type="checkbox" name="ensaiosFisicoQuimicos" value="' + i + '" data-grupo="' + matriz + '" data-codigo="' + escapar(e.codigo) + '" data-ensaio="' + escapar(e.nome) + '">' +
        '<span class="assay-code">' + escapar(e.codigo || '—') + '</span>' +
        '<span>' + escapar(e.nome) + '</span>' +
      '</label>'
    ).join('');
    erro.textContent = '';
  }

  function alternarOutros() {
    ['finalidade', 'matriz'].forEach(n => {
      const v = form.querySelector('[name="' + n + '"]:checked')?.value;
      const w = document.querySelector('#' + n + '-outros-wrap');
      w.hidden = v !== 'Outros';
      w.querySelector('input').required = v === 'Outros';
    });

    const matriz = form.querySelector('[name="matriz"]:checked')?.value;
    renderizarEnsaios(matriz);
  }

  function coletar() {
    const dados = {};
    new FormData(form).forEach((v, k) => {
      if (k !== 'ensaiosFisicoQuimicos' && k !== 'confirmacao') dados[k] = v;
    });

    dados.confirmacao = true;
    dados.ensaios = [...form.querySelectorAll('[name="ensaiosFisicoQuimicos"]:checked')].map(x => ({
      grupo: x.dataset.grupo,
      codigo: x.dataset.codigo,
      ensaio: x.dataset.ensaio
    }));

    dados.autorizacoes = {
      tempo: dados.autorizaTempo === 'SIM',
      temperatura: dados.autorizaTemperatura === 'SIM'
    };

    return dados;
  }

  function validar() {
    document.querySelectorAll('.invalid').forEach(Validacoes.limparErro);
    let primeiro;

    [...form.querySelectorAll('[required]')]
      .filter(x => !x.closest('[hidden]'))
      .forEach(x => {
        const ok = x.type === 'radio' || x.type === 'checkbox'
          ? form.querySelector('[name="' + x.name + '"]:checked')
          : String(x.value).trim();

        if (!ok) {
          Validacoes.adicionarErro(x, 'Campo obrigatório.');
          primeiro ||= x;
        }
      });

    const cpf = document.querySelector('#fq-cpf');
    if (cpf.value && !Validacoes.validarCpfCnpj(cpf.value)) {
      Validacoes.adicionarErro(cpf, 'Informe um CPF ou CNPJ válido.');
      primeiro ||= cpf;
    }

    const matriz = form.querySelector('[name="matriz"]:checked')?.value;
    if (matriz && matriz !== 'Outros' && !form.querySelector('[name="ensaiosFisicoQuimicos"]:checked')) {
      erro.textContent = 'Selecione pelo menos um ensaio.';
      primeiro ||= alvo;
    }

    if (primeiro) {
      primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' });
      primeiro.focus?.();
      return false;
    }

    return true;
  }

  form.addEventListener('change', e => {
    if (['finalidade', 'matriz'].includes(e.target.name)) alternarOutros();
  });

  document.querySelector('#fq-cpf').addEventListener('input', e =>
    e.target.value = Validacoes.mascaraCpfCnpj(e.target.value)
  );

  document.querySelector('#fq-clear').addEventListener('click', () => {
    if (confirm('Deseja limpar todos os dados preenchidos?')) {
      form.reset();
      alternarOutros();
      botaoPdf.hidden = true;
      ultimoComprovante = null;
      status.className = 'status';
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar()) return;

    const b = document.querySelector('#fq-submit');
    b.disabled = true;
    status.className = 'status show loading';
    status.textContent = 'Enviando solicitação…';

    try {
      const dados = coletar();
      const r = await AppAuth.requisitarApi('salvarSolicitacaoFisicoQuimica', { dados });

      ultimoComprovante = {
        solicitacaoId: r.dados.solicitacaoId,
        titulo: 'Solicitação de Análise Físico-Química',
        dataEnvio: new Date().toLocaleString('pt-BR'),
        campos: [
          ['Razão social', dados.razaoSocial],
          ['Matriz', dados.matriz],
          ['Finalidade', dados.finalidade]
        ].map(([rotulo, valor]) => ({ rotulo, valor })),
        relacionados: dados.ensaios.map((x, i) => ({
          numero: i + 1,
          campos: [
            { rotulo: 'Ensaio', valor: x.ensaio },
            { rotulo: 'Código', valor: x.codigo }
          ]
        }))
      };

      botaoPdf.hidden = false;
      status.className = 'status show success';
      status.textContent = 'Solicitação enviada com sucesso. Número: ' + r.dados.solicitacaoId;
    } catch (x) {
      status.className = 'status show error';
      status.textContent = x.message;
      b.disabled = false;
    }
  });

  botaoPdf.addEventListener('click', () => {
    try {
      RelatoriosPdf.baixarComprovante(ultimoComprovante);
    } catch (e) {
      status.className = 'status show error';
      status.textContent = e.message;
    }
  });

  alternarOutros();
})();