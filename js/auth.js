/* Sessão e comunicação com a API Apps Script. */
(function () {
  const config = window.APP_CONFIG;
  const chaveSessao = config.sessionStorageKey;

  function obterSessao() {
    try {
      return JSON.parse(localStorage.getItem(chaveSessao) || 'null');
    } catch (_) {
      return null;
    }
  }

  function sessaoValida() {
    const sessao = obterSessao();
    return Boolean(sessao && sessao.token && Number(sessao.expiraEm) > Date.now());
  }

  function limparSessao() {
    localStorage.removeItem(chaveSessao);
  }

  function exigirSessao() {
    if (!sessaoValida()) {
      limparSessao();
      window.location.href = 'index.html';
      return null;
    }

    return obterSessao();
  }

  function respostaJson(resposta) {
    return resposta.text().then((texto) => {
      try {
        return JSON.parse(texto);
      } catch (_) {
        throw new Error('Resposta inválida da API.');
      }
    });
  }

  async function requisitarApi(acao, dados = {}, protegido = true) {
    if (protegido && !sessaoValida()) {
      limparSessao();
      window.location.href = 'index.html';
      throw new Error('Sessão expirada.');
    }

    if (!config.apiUrl || config.apiUrl.includes('COLE_AQUI')) {
      throw new Error('A URL da API ainda não foi configurada.');
    }

    const sessao = obterSessao();
    const corpo = { acao, ...dados };

    if (protegido) {
      corpo.token = sessao.token;
    }

    let resposta;
    try {
      resposta = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(corpo)
      });
    } catch (_) {
      throw new Error('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
    }

    const resultado = await respostaJson(resposta);
    if (!resultado || resultado.sucesso !== true) {
      if (resultado && /sessão|token/i.test(resultado.mensagem || '')) {
        limparSessao();
        window.location.href = 'index.html';
      }

      throw new Error(resultado?.mensagem || 'Não foi possível concluir a operação.');
    }

    return resultado;
  }

  async function fazerLogin(email, senha) {
    const resultado = await requisitarApi('login', { email, senha }, false);
    const expiraEm = Date.now() + config.sessionHours * 60 * 60 * 1000;

    localStorage.setItem(chaveSessao, JSON.stringify({
      token: resultado.dados.token,
      nome: resultado.dados.nome,
      email: resultado.dados.email,
      grupo: resultado.dados.grupo,
      expiraEm
    }));

    return resultado.dados;
  }

  async function cadastrarUsuario(dados) {
    const resultado = await requisitarApi('cadastrarUsuario', { dados }, false);
    return resultado.dados;
  }

  function bloquearEntradasSolicitacao(form) {
    if (!form || obterSessao()?.grupo !== 'IST_Colaborators') return false;
    let aviso = form.querySelector('[data-sem-permissao]');
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.dataset.semPermissao = 'true';
      aviso.className = 'status show error user-permission-notice';
      aviso.setAttribute('role', 'alert');
      form.prepend(aviso);
    }
    aviso.textContent = 'Usuário Sem Permissão';
    form.querySelectorAll('input, select, textarea, button').forEach((campo) => { campo.disabled = true; });
    return true;
  }

  function configurarCabecalho() {
    const sessao = exigirSessao();
    if (!sessao) return;

    document.querySelectorAll('[data-usuario-nome]').forEach((elemento) => {
      elemento.textContent = sessao.nome || sessao.email;
    });

    document.querySelectorAll('[data-usuario-inicial]').forEach((elemento) => {
      elemento.textContent = (sessao.nome || sessao.email || 'U').trim().charAt(0).toUpperCase();
    });

    document.querySelectorAll('[data-usuario-email]').forEach((elemento) => {
      elemento.textContent = sessao.email || '';
    });

    document.querySelectorAll('[data-usuario-grupo]').forEach((elemento) => {
      elemento.textContent = sessao.grupo || '';
    });

    document.querySelectorAll('[data-admin-only]').forEach((elemento) => {
      elemento.hidden = sessao.grupo !== 'Administrator_User';
    });

    const gruposIst = ['IST_Colaborators', 'Manager_User', 'Administrator_User'];
    document.querySelectorAll('[data-checklists]').forEach((elemento) => {
      elemento.hidden = gruposIst.indexOf(sessao.grupo) < 0;
    });

    document.querySelectorAll('[data-logout]').forEach((botao) => {
      botao.addEventListener('click', () => {
        limparSessao();
        window.location.href = 'index.html';
      });
    });
  }

  window.AppAuth = {
    obterSessao,
    sessaoValida,
    limparSessao,
    exigirSessao,
    requisitarApi,
    fazerLogin,
    cadastrarUsuario,
    bloquearEntradasSolicitacao,
    configurarCabecalho
  };
})();
