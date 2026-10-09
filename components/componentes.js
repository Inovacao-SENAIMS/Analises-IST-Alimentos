/* Componentes visuais compartilhados entre as páginas estáticas do aplicativo. */
(function () {
  // Ícones SVG inspirados em bibliotecas React (Lucide/React Icons),
  // renderizados inline para preservar o projeto vanilla e evitar dependências.
  const icones = {
    servicos: '<svg viewBox="0 0 24 24" focusable="false"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
    perfil: '<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.9-3.2 3.2-5 7-5s6.1 1.8 7 5"/></svg>',
    sair: '<svg viewBox="0 0 24 24" focusable="false"><path d="M10 5H5v14h5"/><path d="m14 8 4 4-4 4"/><path d="M18 12H9"/></svg>',
    menu: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    seedling: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 20V9"/><path d="M12 13c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Z"/><path d="M12 10c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7Z"/></svg>',
    flask: '<svg viewBox="0 0 24 24" focusable="false"><path d="M9 3h6M10 3v6l-5.5 9.2A1.2 1.2 0 0 0 5.5 20h13a1.2 1.2 0 0 0 1-1.8L14 9V3"/><path d="M8 15h8"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24" focusable="false"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3"/></svg>',
    admin: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    historico: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5M8 17h3"/></svg>',
    recebimento: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 8h16v12H4z"/><path d="m4 8 1.5-4h13L20 8"/><path d="M10 12h4"/></svg>'
  };

  function renderizarIcone(nome) {
    return `<span class="component-icon" aria-hidden="true">${icones[nome] || icones.menu}</span>`;
  }

  function renderizarBotao(texto, classe = 'secondary', atributos = '') {
    return `<button class="button ${classe}" ${atributos}>${texto}</button>`;
  }

  function renderizarBotaoVoltarMenu(classeExtra = '') {
    return `<a class="button form-menu-button ${classeExtra}" href="menu.html"><span class="button-arrow" aria-hidden="true">←</span><span>Voltar ao menu</span></a>`;
  }

  function renderizarBotaoAdicionarAmostra() {
    return '<button id="add-sample" class="button sample-add-button" type="button">+ Adicionar amostra</button>';
  }

  function renderizarBotaoEnviar(id = 'submit-button', texto = 'Enviar Solicitação') {
    return `<button id="${id}" class="button primary" type="submit">${texto}</button>`;
  }

  function renderizarBotaoLimpar(id = 'clear-button') {
    return `<button id="${id}" class="button secondary form-clear-button" type="button">Limpar</button>`;
  }

  function renderizarBotaoBaixarPdf(id = 'download-pdf', texto = 'Baixar PDF') {
    return `<button id="${id}" class="button pdf-download-button" type="button" hidden>${texto}</button>`;
  }

  function renderizarBotaoExportarResumo(id = 'export-summary-pdf') {
    return `<button id="${id}" class="button pdf-summary-button" type="button">Exportar relatório resumido</button>`;
  }

  function renderizarSidebar(paginaAtiva = 'servicos') {
    return `
      <aside class="sidebar">
        <a class="sidebar-brand" href="menu.html">
          <img class="senai-logo" src="${window.APP_CONFIG?.assetBase || ''}design/brand/senai_alimentos.jpeg" alt="SENAI FIEMS">
          <span>Portal de serviços</span>
        </a>
        <nav class="sidebar-nav" aria-label="Navegação principal">
          <a class="${paginaAtiva === 'servicos' ? 'active' : ''}" href="menu.html">
            ${renderizarIcone('servicos')}<span>Serviços</span>
          </a>
          <a data-historico class="${paginaAtiva === 'historico' ? 'active' : ''}" href="historico-solicitacoes.html">
            ${renderizarIcone('historico')}<span>Histórico</span>
          </a>
          <a data-checklists hidden class="${paginaAtiva === 'checklists' ? 'active' : ''}" href="historico-checklists.html">
            ${renderizarIcone('clipboard')}<span>Histórico de checklists</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-profile">
            <button type="button" class="profile-trigger" data-profile-toggle aria-haspopup="menu" aria-expanded="false">
              <span class="profile-info">
                <strong data-usuario-nome>Usuário</strong>
                <small data-usuario-email>usuario@empresa.com</small>
              </span>
              <span class="profile-ring" aria-hidden="true">
                <span class="profile-ring-inner"><span data-usuario-inicial>U</span></span>
              </span>
              <span class="profile-chevron" aria-hidden="true">
                <svg width="12" height="24" viewBox="0 0 12 24" fill="none"><path d="M2 4C6 8 6 16 2 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
              </span>
            </button>
            <div class="profile-menu" role="menu">
              <a role="menuitem" class="${paginaAtiva === 'perfil' ? 'active' : ''}" href="dados-pessoais.html">
                ${renderizarIcone('perfil')}<span>Dados pessoais</span>
              </a>
              <a role="menuitem" data-admin-only hidden class="${paginaAtiva === 'administracao' ? 'active' : ''}" href="administracao-usuarios.html">
                ${renderizarIcone('admin')}<span>Administração</span>
              </a>
              <div class="profile-menu-separator" aria-hidden="true"></div>
              <button type="button" role="menuitem" class="profile-signout" data-logout>${renderizarIcone('sair')}<span>Sair</span></button>
            </div>
          </div>
        </div>
      </aside>`;
  }

  function renderizarRodape() {
    return `
      <footer class="app-footer">
        <span>© ${new Date().getFullYear()} SENAI FIEMS</span>
        <span>Portal de serviços</span>
      </footer>`;
  }

  function renderizarCabecalhoFormulario() {
    return `
      <header class="app-header form-header-light">
        <div class="app-shell header-inner">
          <a class="brand" href="menu.html">
            <img class="senai-logo" src="${window.APP_CONFIG?.assetBase || ''}design/brand/senai_alimentos.jpeg" alt="SENAI FIEMS">
            <span class="brand-subtitle">Portal de serviços</span>
          </a>
          <div class="user-actions">
            <span class="user-name">Olá, <strong data-usuario-nome></strong></span>
            ${renderizarBotao('Sair', 'logout-button', 'data-logout type="button"')}
          </div>
        </div>
      </header>`;
  }

  function renderizarChecklistRecebimento() {
    const tipos = [
      ['analise-sementes', 'Análise de Sementes'],
      ['analise-microbiologica', 'Análise Microbiológica'],
      ['analise-fisico-quimica', 'Análise Físico-Química'],
      ['amostras-fiscais', 'Análise de Alimentos']
    ];
    const opcoesReferencia = tipos
      .map(([valor, rotulo]) => `<option value="${valor}">${rotulo}</option>`)
      .join('');
    return `
      <section class="form-section" id="checklist-recebimento">
        <div class="section-heading">
          <div>
            <h2 class="section-title">Checklist de Recebimento de Amostra</h2>
            <p class="section-description">Preenchimento opcional. Vincule o recebimento a uma solicitação existente.</p>
          </div>
        </div>
        <div class="field-grid">
          <div class="field">
            <label for="checklist-referencia">Referência</label>
            <select id="checklist-referencia" name="checklistReferencia">
              <option value="">Selecione</option>
              ${opcoesReferencia}
            </select>
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-usuario">Usuário</label>
            <select id="checklist-usuario" name="checklistUsuario" disabled>
              <option value="">Selecione a referência</option>
            </select>
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-requerente">Requerente/Cliente</label>
            <select id="checklist-requerente" name="checklistRequerente" disabled>
              <option value="">Selecione a referência</option>
            </select>
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-numero-analise">Número da Análise</label>
            <select id="checklist-numero-analise" name="checklistNumeroAnalise" disabled>
              <option value="">Selecione a referência</option>
            </select>
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-data-recebimento">Data do Recebimento</label>
            <input id="checklist-data-recebimento" name="checklistDataRecebimento" type="date">
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-hora">Hora</label>
            <input id="checklist-hora" name="checklistHora" type="time">
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-temperatura">Temperatura da Amostra (ºC)</label>
            <input id="checklist-temperatura" name="checklistTemperatura" type="number" step="0.1">
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-quantidade">Quantidade da Amostra</label>
            <input id="checklist-quantidade" name="checklistQuantidade">
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-peso-volume">Peso/Volume</label>
            <input id="checklist-peso-volume" name="checklistPesoVolume">
            <small class="error-message"></small>
          </div>
          <div class="field">
            <label for="checklist-numero-amostra">Número da Amostra</label>
            <input id="checklist-numero-amostra" name="checklistNumeroAmostra">
            <small class="error-message"></small>
          </div>
          <fieldset class="field">
            <legend class="legend-label">Situação da Amostra</legend>
            <div class="radio-group">
              <label class="choice"><input type="radio" name="checklistSituacao" value="Conforme">Conforme</label>
              <label class="choice"><input type="radio" name="checklistSituacao" value="Não Conforme">Não Conforme</label>
            </div>
          </fieldset>
          <div class="field">
            <label for="checklist-responsavel">Responsável</label>
            <input id="checklist-responsavel" name="checklistResponsavel">
            <small class="error-message"></small>
          </div>
          <div class="field full">
            <label for="checklist-observacoes">Observações</label>
            <textarea id="checklist-observacoes" name="checklistObservacoes"></textarea>
            <small class="error-message"></small>
          </div>
        </div>
        <small id="checklist-error" class="error-message"></small>
      </section>`;
  }

  function inicializarLayout() {
    document.querySelectorAll('[data-componente="sidebar"]').forEach((alvo) => {
      alvo.outerHTML = renderizarSidebar(alvo.dataset.paginaAtiva || 'servicos');
    });

    document.querySelectorAll('[data-componente="footer"]').forEach((alvo) => {
      alvo.outerHTML = renderizarRodape();
    });

    document.querySelectorAll('[data-componente="form-header"]').forEach((alvo) => {
      alvo.outerHTML = renderizarCabecalhoFormulario();
    });

    document.querySelectorAll('[data-componente="botao-voltar-menu"]').forEach((alvo) => {
      alvo.outerHTML = renderizarBotaoVoltarMenu(alvo.dataset.classe || '');
    });

    document.querySelectorAll('[data-componente="botao-adicionar-amostra"]').forEach((alvo) => {
      alvo.outerHTML = renderizarBotaoAdicionarAmostra();
    });

    document.querySelectorAll('[data-componente="botao-enviar"]').forEach((alvo) => {
      alvo.outerHTML = renderizarBotaoEnviar(alvo.dataset.id || 'submit-button', alvo.dataset.texto || 'Enviar Solicitação');
    });

    document.querySelectorAll('[data-componente="botao-limpar"]').forEach((alvo) => {
      alvo.outerHTML = renderizarBotaoLimpar(alvo.dataset.id || 'clear-button');
    });

    document.querySelectorAll('[data-componente="botao-baixar-pdf"]').forEach((alvo) => {
      alvo.outerHTML = renderizarBotaoBaixarPdf(alvo.dataset.id || 'download-pdf', alvo.dataset.texto || 'Baixar PDF');
    });

    document.querySelectorAll('[data-componente="botao-exportar-resumo"]').forEach((alvo) => {
      alvo.outerHTML = renderizarBotaoExportarResumo(alvo.dataset.id || 'export-summary-pdf');
    });

    document.querySelectorAll('[data-componente="checklist-recebimento"]').forEach((alvo) => {
      alvo.outerHTML = renderizarChecklistRecebimento();
    });

    document.querySelectorAll('[data-sidebar-toggle]').forEach((botao) => {
      botao.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.toggle('open');
      });
    });

    document.querySelectorAll('.sidebar-nav a').forEach((link) => {
      link.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.remove('open');
      });
    });

    document.querySelectorAll('[data-profile-toggle]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const aberto = botao.getAttribute('aria-expanded') === 'true';
        botao.setAttribute('aria-expanded', String(!aberto));
        botao.parentElement.querySelector('.profile-menu')?.classList.toggle('open', !aberto);
      });
    });

    document.addEventListener('click', (evento) => {
      if (evento.target.closest('.sidebar-profile')) return;
      document.querySelectorAll('.profile-trigger[aria-expanded="true"]').forEach((botao) => {
        botao.setAttribute('aria-expanded', 'false');
        botao.parentElement.querySelector('.profile-menu')?.classList.remove('open');
      });
    });
  }

  window.AppComponents = {
    renderizarIcone,
    renderizarBotao,
    renderizarBotaoVoltarMenu,
    renderizarBotaoAdicionarAmostra,
    renderizarBotaoEnviar,
    renderizarBotaoLimpar,
    renderizarBotaoBaixarPdf,
    renderizarBotaoExportarResumo,
    renderizarSidebar,
    renderizarRodape,
    renderizarCabecalhoFormulario,
    renderizarChecklistRecebimento,
    inicializarLayout
  };

  inicializarLayout();
})();
