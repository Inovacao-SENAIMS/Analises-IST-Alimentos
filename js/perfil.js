/* Carrega dados pessoais diretamente da API, sem permitir edição de permissões no cliente. */
(function () {
  AppAuth.configurarCabecalho();
  const status = document.querySelector('#perfil-status');
  document.querySelectorAll('[data-sidebar-toggle]').forEach((botao) => botao.addEventListener('click', () => document.querySelector('.sidebar')?.classList.toggle('open')));
  const sessao = AppAuth.obterSessao();
  if (sessao) document.querySelectorAll('[data-usuario-inicial]').forEach((elemento) => { elemento.textContent = (sessao.nome || 'U').trim().charAt(0).toUpperCase(); });
  AppAuth.requisitarApi('obterPerfil').then((resultado) => {
    const perfil = resultado.dados; document.querySelector('[data-perfil-nome]').textContent = perfil.nome; document.querySelector('[data-perfil-email]').textContent = perfil.email; document.querySelector('[data-perfil-grupo]').textContent = perfil.grupo;
  }).catch((erro) => { status.textContent = erro.message; status.className = 'status show error'; });
})();
