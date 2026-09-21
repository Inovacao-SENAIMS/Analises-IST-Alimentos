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
    historico: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5M8 17h3"/></svg>'
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

  function renderizarSidebar(paginaAtiva = 'servicos') {
    return `
      <aside class="sidebar">
        <a class="sidebar-brand" href="menu.html">
          <img class="senai-logo" src="${window.APP_CONFIG?.assetBase || ''}design/brand/logo_senai_fiems.png" alt="SENAI FIEMS">
          <span>Portal de serviços</span>
        </a>
        <nav class="sidebar-nav" aria-label="Navegação principal">
          <a class="${paginaAtiva === 'servicos' ? 'active' : ''}" href="menu.html">
            ${renderizarIcone('servicos')}<span>Serviços</span>
          </a>
          <a class="${paginaAtiva === 'perfil' ? 'active' : ''}" href="dados-pessoais.html">
            ${renderizarIcone('perfil')}<span>Dados pessoais</span>
          </a>
          <a data-admin-only hidden class="${paginaAtiva === 'administracao' ? 'active' : ''}" href="administracao-usuarios.html">
            ${renderizarIcone('admin')}<span>Administração</span>
          </a>
          <a data-historico class="${paginaAtiva === 'historico' ? 'active' : ''}" href="historico-solicitacoes.html">
            ${renderizarIcone('historico')}<span>Histórico</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <span class="avatar" data-usuario-inicial>U</span>
            <span>
              <strong data-usuario-nome>Usuário</strong>
              <small data-usuario-grupo>Client_User</small>
            </span>
          </div>
          ${renderizarBotao(`${renderizarIcone('sair')}Sair`, 'logout-button sidebar-logout', 'data-logout type="button"')}
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
            <img class="senai-logo" src="${window.APP_CONFIG?.assetBase || ''}design/brand/logo_senai_fiems.png" alt="SENAI FIEMS">
            <span class="brand-subtitle">Portal de serviços</span>
          </a>
          <div class="user-actions">
            <span class="user-name">Olá, <strong data-usuario-nome></strong></span>
            ${renderizarBotao('Sair', 'logout-button', 'data-logout type="button"')}
          </div>
        </div>
      </header>`;
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
  }

  window.AppComponents = {
    renderizarIcone,
    renderizarBotao,
    renderizarBotaoVoltarMenu,
    renderizarBotaoAdicionarAmostra,
    renderizarBotaoEnviar,
    renderizarBotaoLimpar,
    renderizarSidebar,
    renderizarRodape,
    renderizarCabecalhoFormulario,
    inicializarLayout
  };

  inicializarLayout();
})();
