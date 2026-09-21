/* Fluxo público de cadastro: todo novo usuário nasce como Client_User no servidor. */
(function () {
  const form = document.querySelector('#cadastro-form'); if (!form) return;
  const status = document.querySelector('#cadastro-status');
  function mostrarStatus(mensagem, tipo) { status.textContent = mensagem; status.className = `status show ${tipo}`; }
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const nome = form.nome.value.trim(); const email = form.email.value.trim(); const senha = form.senha.value; const confirmar = form.confirmarSenha.value; const botao = form.querySelector('button');
    form.querySelectorAll('.invalid').forEach((campo) => campo.classList.remove('invalid'));
    if (!nome || !email || !senha || !confirmar) { mostrarStatus('Preencha todos os campos obrigatórios.', 'error'); return; }
    if (senha.length < 8) { form.senha.classList.add('invalid'); mostrarStatus('A senha deve ter pelo menos 8 caracteres.', 'error'); return; }
    if (senha !== confirmar) { form.confirmarSenha.classList.add('invalid'); mostrarStatus('As senhas não conferem.', 'error'); return; }
    botao.disabled = true; mostrarStatus('Criando seu acesso…', 'loading');
    try { await AppAuth.cadastrarUsuario(nome, email, senha); mostrarStatus('Cadastro realizado. Redirecionando para o login…', 'success'); setTimeout(() => { window.location.href = 'index.html?cadastro=sucesso'; }, 900); }
    catch (erro) { mostrarStatus(erro.message, 'error'); botao.disabled = false; }
  });
})();
