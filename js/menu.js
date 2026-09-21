/* Renderiza os cards a partir do catálogo centralizado. */
(function () {
  AppAuth.configurarCabecalho();
  document.querySelectorAll('[data-sidebar-toggle]').forEach((botao) => botao.addEventListener('click', () => document.querySelector('.sidebar')?.classList.toggle('open')));
  const sessao = AppAuth.obterSessao();
  if (sessao) document.querySelectorAll('[data-usuario-inicial]').forEach((elemento) => { elemento.textContent = (sessao.nome || 'U').trim().charAt(0).toUpperCase(); });
  if (sessao?.grupo) document.querySelectorAll('[data-usuario-grupo]').forEach((elemento) => { elemento.textContent = sessao.grupo; });
  const alvo = document.querySelector('[data-formularios]');
  if (!alvo) return;
  alvo.innerHTML = APP_CONFIG.formularios.map((formulario) => `
    <a class="card form-card" href="${formulario.caminho}" aria-label="Abrir ${formulario.titulo}">
      <span class="form-icon" aria-hidden="true">${formulario.icone}</span>
      <h2>${formulario.titulo}</h2>
      <p>${formulario.descricao}</p>
      <span class="button primary">Abrir formulário →</span>
    </a>`).join('');
})();
