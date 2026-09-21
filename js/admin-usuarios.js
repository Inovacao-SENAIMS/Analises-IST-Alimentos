/* Controla a gestão administrativa de usuários sem expor credenciais. */
(function () {
  AppAuth.configurarCabecalho();

  const sessao = AppAuth.obterSessao();
  if (!sessao || sessao.grupo !== 'Administrator_User') {
    window.location.href = 'menu.html';
    return;
  }

  const corpo = document.querySelector('#admin-users-body');
  const status = document.querySelector('#admin-status');
  const atualizar = document.querySelector('#admin-refresh');

  function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caractere) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[caractere]));
  }

  function mostrarStatus(mensagem, tipo = 'success') {
    status.textContent = mensagem;
    status.className = `status show ${tipo}`;
  }

  function formatarData(valor) {
    if (!valor) return 'Não informado';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR');
  }

  function renderizar(usuarios) {
    corpo.innerHTML = usuarios.map((usuario) => `
      <tr data-email="${escapar(usuario.email)}">
        <td data-label="Nome">${escapar(usuario.nome)}</td>
        <td data-label="E-mail">${escapar(usuario.email)}</td>
        <td data-label="Grupo">
          <select class="admin-group" aria-label="Grupo de ${escapar(usuario.nome)}">
            <option value="Client_User" ${usuario.grupo === 'Client_User' ? 'selected' : ''}>Client_User</option>
            <option value="Manager_User" ${usuario.grupo === 'Manager_User' ? 'selected' : ''}>Manager_User</option>
            <option value="Administrator_User" ${usuario.grupo === 'Administrator_User' ? 'selected' : ''}>Administrator_User</option>
          </select>
        </td>
        <td data-label="Status">
          <label class="admin-active"><input class="admin-active-control" type="checkbox" ${usuario.ativo ? 'checked' : ''}> Ativo</label>
        </td>
        <td data-label="Data de cadastro">${escapar(formatarData(usuario.dataCadastro))}</td>
        <td data-label="Ação"><button class="button primary admin-save" type="button">Salvar</button></td>
      </tr>
    `).join('');

    corpo.querySelectorAll('.admin-save').forEach((botao) => {
      botao.addEventListener('click', () => atualizarUsuario(botao));
    });
  }

  async function carregar() {
    atualizar.disabled = true;
    mostrarStatus('Carregando usuários…', 'loading');
    try {
      const resultado = await AppAuth.requisitarApi('listarUsuariosAdmin');
      renderizar(resultado.dados.usuarios);
      mostrarStatus('Lista de usuários atualizada.');
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    } finally {
      atualizar.disabled = false;
    }
  }

  async function atualizarUsuario(botao) {
    const linha = botao.closest('tr');
    const email = linha.dataset.email;
    const grupo = linha.querySelector('.admin-group').value;
    const ativo = linha.querySelector('.admin-active-control').checked;
    botao.disabled = true;

    try {
      await AppAuth.requisitarApi('atualizarUsuarioAdmin', { dados: { email, grupo, ativo } });
      mostrarStatus(`Usuário ${email} atualizado.`);
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    } finally {
      botao.disabled = false;
    }
  }

  atualizar.addEventListener('click', carregar);
  carregar();
})();
