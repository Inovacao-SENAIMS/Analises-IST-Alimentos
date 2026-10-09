/* Renderiza os cards a partir do catálogo centralizado. */
(function () {
  AppAuth.configurarCabecalho();

  const sessao = AppAuth.obterSessao();
  if (sessao) {
    document.querySelectorAll('[data-usuario-inicial]').forEach((elemento) => {
      elemento.textContent = (sessao.nome || 'U').trim().charAt(0).toUpperCase();
    });
  }

  if (sessao?.grupo) {
    document.querySelectorAll('[data-usuario-grupo]').forEach((elemento) => {
      elemento.textContent = sessao.grupo;
    });
  }

  const alvo = document.querySelector('[data-formularios]');
  if (!alvo) return;

  const grupos = [
    { titulo: 'Serviços de Análise', categoria: 'analise' },
    { titulo: 'Serviços de Recebimento', categoria: 'recebimento' }
  ];

  const cartao = (formulario) => `
    <a class="card form-card" href="${formulario.caminho}" aria-label="Abrir ${formulario.titulo}">
      ${AppComponents.renderizarIcone(formulario.icone)}
      <h2>${formulario.titulo}</h2>
      <p>${formulario.descricao}</p>
      <span class="button primary">Abrir formulário →</span>
    </a>`;

  alvo.innerHTML = grupos.map((grupo) => {
    const itens = APP_CONFIG.formularios.filter((formulario) => (formulario.categoria || 'analise') === grupo.categoria);
    if (!itens.length) return '';
    return `
      <div class="services-group">
        <h2 class="services-group-title">${grupo.titulo}</h2>
        <div class="cards-grid">${itens.map(cartao).join('')}</div>
      </div>`;
  }).join('');
})();
