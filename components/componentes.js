/* Componentes visuais compartilhados entre as páginas estáticas do aplicativo. */
(function () {
  const icones = {
    servicos: '▦',
    perfil: '◎',
    sair: '↪',
    menu: '☰'
  };

  function renderizarIcone(nome) {
    return `<span class="component-icon" aria-hidden="true">${icones[nome] || '•'}</span>`;
  }

  function renderizarBotao(texto, classe = 'secondary', atributos = '') {
    return `<button class="button ${classe}" ${atributos}>${texto}</button>`;
  }

  function renderizarSidebar(paginaAtiva = 'servicos') {
    return `
      <aside class="sidebar">
        <a class="sidebar-brand" href="menu.html">
          <img class="senai-logo" src="design/brand/logo_senai_fiems.png" alt="SENAI FIEMS">
          <span>Portal de serviços</span>
        </a>
        <nav class="sidebar-nav" aria-label="Navegação principal">
          <a class="${paginaAtiva === 'servicos' ? 'active' : ''}" href="menu.html">
            ${renderizarIcone('servicos')}<span>Serviços</span>
          </a>
          <a class="${paginaAtiva === 'perfil' ? 'active' : ''}" href="dados-pessoais.html">
            ${renderizarIcone('perfil')}<span>Dados pessoais</span>
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
          ${renderizarBotao(`${renderizarIcone('sair')}Sair`, 'sidebar-logout', 'data-logout type="button"')}
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
      <header class="app-header">
        <div class="app-shell header-inner">
          <a class="brand" href="menu.html">
            <img class="senai-logo" src="design/brand/logo_senai_fiems.png" alt="SENAI FIEMS">
            <span class="brand-subtitle">Portal de serviços</span>
          </a>
          <div class="user-actions">
            <span class="user-name">Olá, <strong data-usuario-nome></strong></span>
            ${renderizarBotao('Sair', 'secondary', 'data-logout type="button"')}
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
    renderizarSidebar,
    renderizarRodape,
    renderizarCabecalhoFormulario,
    inicializarLayout
  };

  inicializarLayout();
})();
