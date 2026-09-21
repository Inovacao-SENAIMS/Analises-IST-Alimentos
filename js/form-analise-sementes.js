/* Controla amostras, regras condicionais, validação e envio da solicitação. */
(function () {
  AppAuth.configurarCabecalho();

  const form = document.querySelector('#seed-form');
  if (!form) return;

  const apiAction = form.dataset.apiAction || 'salvarSolicitacao';

  const sampleList = document.querySelector('#sample-list');
  const addButton = document.querySelector('#add-sample');
  const count = document.querySelector('#sample-count');
  const ensaios = [
    'pureza', 'pms', 'outrasSementes', 'infestadas', 'germinacao',
    'vigorEa', 'tetrazolio', 'frio', 'emergencia'
  ];

  let opcoes = APP_CONFIG.opcoesPadrao;
  let amostras = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function opcoesHtml(lista, selecionada) {
    return [
      '<option value="">Selecione</option>',
      ...lista.map((item) => `<option value="${escapeHtml(item)}" ${item === selecionada ? 'selected' : ''}>${escapeHtml(item)}</option>`)
    ].join('');
  }

  function novoRegistro() {
    return {
      especie: '',
      cultivar: '',
      safra: '',
      peneira: '',
      lote: '',
      representatividade: '',
      categoria: '',
      tratamento: 'Não',
      tratProduto: '',
      tratPrincipioAtivo: '',
      tratDosagem: ''
    };
  }

  function templateAmostra(amostra, indice) {
    const tratamentoAtivo = amostra.tratamento === 'Sim';

    return `
      <article class="sample-card" data-amostra="${indice}">
        <div class="sample-header">
          <h3 class="sample-title">Amostra ${indice + 1}</h3>
          <button class="link-button remove-sample" type="button" ${amostras.length === 1 ? 'disabled' : ''}>Remover</button>
        </div>
        <div class="sample-body">
          <div class="field-grid">
            <div class="field">
              <label>Espécie <span>*</span></label>
              <input data-campo="especie" value="${escapeHtml(amostra.especie)}" required>
              <small class="error-message"></small>
            </div>
            <div class="field">
              <label>Cultivar <span>*</span></label>
              <input data-campo="cultivar" value="${escapeHtml(amostra.cultivar)}" required>
              <small class="error-message"></small>
            </div>
            <div class="field">
              <label>Safra (ano/ano) <span>*</span></label>
              <input data-campo="safra" placeholder="2023/24" value="${escapeHtml(amostra.safra)}" required>
              <small class="error-message"></small>
            </div>
            <div class="field">
              <label>Peneira <span>*</span></label>
              <select data-campo="peneira" required>${opcoesHtml(opcoes.peneiras, amostra.peneira)}</select>
              <small class="error-message"></small>
            </div>
            <div class="field">
              <label>Lote <span>*</span></label>
              <input data-campo="lote" value="${escapeHtml(amostra.lote)}" required>
              <small class="error-message"></small>
            </div>
            <div class="field">
              <label>Representatividade <span>*</span></label>
              <input data-campo="representatividade" value="${escapeHtml(amostra.representatividade)}" required>
              <small class="error-message"></small>
            </div>
            <div class="field">
              <label>Categoria <span>*</span></label>
              <select data-campo="categoria" required>${opcoesHtml(opcoes.categorias, amostra.categoria)}</select>
              <small class="error-message"></small>
            </div>
            <div class="field">
              <label>Tratamento? <span>*</span></label>
              <div class="radio-group" style="grid-template-columns:1fr 1fr">
                <label class="choice"><input type="radio" data-campo="tratamento" name="tratamento-${indice}" value="Sim" ${tratamentoAtivo ? 'checked' : ''}>Sim</label>
                <label class="choice"><input type="radio" data-campo="tratamento" name="tratamento-${indice}" value="Não" ${!tratamentoAtivo ? 'checked' : ''}>Não</label>
              </div>
              <small class="error-message"></small>
            </div>
            <div class="field treatment-fields" data-treatment-fields ${tratamentoAtivo ? '' : 'hidden'}>
              <div class="field-grid">
                <div class="field">
                  <label>Produto <span>*</span></label>
                  <input data-campo="tratProduto" value="${escapeHtml(amostra.tratProduto)}">
                  <small class="error-message"></small>
                </div>
                <div class="field">
                  <label>Princípio ativo <span>*</span></label>
                  <input data-campo="tratPrincipioAtivo" value="${escapeHtml(amostra.tratPrincipioAtivo)}">
                  <small class="error-message"></small>
                </div>
                <div class="field">
                  <label>Dosagem <span>*</span></label>
                  <input data-campo="tratDosagem" value="${escapeHtml(amostra.tratDosagem)}">
                  <small class="error-message"></small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderizarAmostras() {
    sampleList.innerHTML = amostras.map(templateAmostra).join('');
    count.textContent = `${amostras.length} de 8`;
    addButton.disabled = amostras.length >= 8;

    sampleList.querySelectorAll('[data-campo]').forEach((campo) => {
      campo.addEventListener('input', atualizarRegistro);
    });
    sampleList.querySelectorAll('[data-campo="tratamento"]').forEach((campo) => {
      campo.addEventListener('change', atualizarTratamento);
    });
    sampleList.querySelectorAll('.remove-sample').forEach((botao) => {
      botao.addEventListener('click', removerAmostra);
    });
  }

  function atualizarRegistro(evento) {
    const campo = evento.target;
    const card = campo.closest('[data-amostra]');
    const registro = amostras[Number(card.dataset.amostra)];

    if (campo.type === 'radio' && !campo.checked) return;
    registro[campo.dataset.campo] = campo.value;
  }

  function atualizarTratamento(evento) {
    atualizarRegistro(evento);
    const card = evento.target.closest('[data-amostra]');
    const bloco = card.querySelector('[data-treatment-fields]');
    bloco.hidden = evento.target.value !== 'Sim';
  }

  function removerAmostra(evento) {
    const indice = Number(evento.target.closest('[data-amostra]').dataset.amostra);
    amostras.splice(indice, 1);
    renderizarAmostras();
  }

  function limparStatus() {
    const status = document.querySelector('#form-status');
    status.className = 'status';
    status.textContent = '';
  }

  function registrarErro(elemento, mensagem) {
    Validacoes.adicionarErro(elemento, mensagem);
    return elemento;
  }

  function validar() {
    document.querySelectorAll('.invalid').forEach((elemento) => Validacoes.limparErro(elemento));

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

    const documento = document.querySelector('#cpf-cnpj');
    if (documento.value && !Validacoes.validarCpfCnpj(documento.value)) {
      registrarErro(documento, 'Informe um CPF ou CNPJ válido.');
      if (!primeiroErro) primeiroErro = documento;
    }

    sampleList.querySelectorAll('[data-amostra]').forEach((card, indice) => {
      const safra = card.querySelector('[data-campo="safra"]');
      if (safra.value && !Validacoes.validarSafra(safra.value)) {
        registrarErro(safra, 'Use o formato AAAA/AA, por exemplo 2023/24.');
        if (!primeiroErro) primeiroErro = safra;
      }

      const tratamento = amostras[indice];
      if (tratamento.tratamento === 'Sim') {
        ['tratProduto', 'tratPrincipioAtivo', 'tratDosagem'].forEach((nome) => {
          const campo = card.querySelector(`[data-campo="${nome}"]`);
          if (!campo.value.trim()) {
            registrarErro(campo, 'Obrigatório quando há tratamento.');
            if (!primeiroErro) primeiroErro = campo;
          }
        });
      }
    });

    const selecionados = [...form.querySelectorAll('input[name="ensaios"]:checked')];
    const ensaiosErro = document.querySelector('#ensaios-error');
    ensaiosErro.textContent = '';

    if (!selecionados.length) {
      ensaiosErro.textContent = 'Selecione pelo menos um ensaio.';
      if (!primeiroErro) primeiroErro = form.querySelector('input[name="ensaios"]');
    }

    if (finalidade === 'Emissão de BAS' && !selecionados.some((campo) => campo.hasAttribute('data-definitivo'))) {
      ensaiosErro.textContent = 'Para emissão de BAS, selecione pelo menos um ensaio definitivo.';
      if (!primeiroErro) primeiroErro = form.querySelector('[data-definitivo]');
    }

    const declaracao = form.querySelector('#declaracao');
    const declaracaoErro = document.querySelector('#declaracao-error');
    if (!declaracao.checked) {
      declaracaoErro.textContent = 'A declaração é obrigatória.';
      if (!primeiroErro) primeiroErro = declaracao;
    } else {
      declaracaoErro.textContent = '';
    }

    if (!primeiroErro) return true;

    primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    primeiroErro.focus?.();
    return false;
  }

  function coletar() {
    const dados = {};
    new FormData(form).forEach((valor, chave) => {
      if (chave !== 'ensaios' && chave !== 'declaracao') dados[chave] = valor;
    });

    dados.ensaios = {};
    ensaios.forEach((nome) => {
      dados.ensaios[nome] = Boolean(form.querySelector(`input[name="ensaios"][value="${nome}"]`)?.checked);
    });
    dados.declaracao = true;
    dados.amostras = amostras.map((amostra, indice) => ({ ...amostra, numero: indice + 1 }));
    return dados;
  }

  async function carregarOpcoes() {
    try {
      const resultado = await AppAuth.requisitarApi('listarOpcoes');
      if (resultado.dados?.peneiras?.length && resultado.dados?.categorias?.length) {
        opcoes = resultado.dados;
      }
    } catch (erro) {
      const status = document.querySelector('#form-status');
      status.textContent = `Não foi possível carregar as listas atualizadas. Foram carregadas opções locais: ${erro.message}`;
      status.className = 'status show error';
    }

    renderizarAmostras();
  }

  addButton.addEventListener('click', () => {
    if (amostras.length < 8) {
      amostras.push(novoRegistro());
      renderizarAmostras();
    }
  });

  document.querySelectorAll('input[name="finalidade"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const outros = document.querySelector('#finalidade-outros-wrap');
      const avisoBas = document.querySelector('#bas-notice');
      outros.hidden = radio.value !== 'Outros' || !radio.checked;
      avisoBas.hidden = radio.value !== 'Emissão de BAS' || !radio.checked;
    });
  });

  document.querySelector('#cpf-cnpj').addEventListener('input', (evento) => {
    evento.target.value = Validacoes.mascaraCpfCnpj(evento.target.value);
  });

  document.querySelector('#clear-button').addEventListener('click', () => {
    if (!window.confirm('Deseja limpar todos os dados preenchidos?')) return;

    form.reset();
    amostras = [novoRegistro()];
    renderizarAmostras();
    document.querySelector('#finalidade-outros-wrap').hidden = true;
    document.querySelector('#bas-notice').hidden = true;
    limparStatus();
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparStatus();
    if (!validar()) return;

    const botao = document.querySelector('#submit-button');
    const status = document.querySelector('#form-status');
    botao.disabled = true;
    status.textContent = 'Enviando solicitação…';
    status.className = 'status show loading';

    try {
      const resultado = await AppAuth.requisitarApi(apiAction, { dados: coletar() });
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

  amostras.push(novoRegistro());
  carregarOpcoes();
})();
