/* Fluxo público de cadastro: todo novo usuário nasce como Client_User no servidor. */
(function () {
  const form = document.querySelector('#cadastro-form');
  if (!form) return;

  const status = document.querySelector('#cadastro-status');

  function mostrarStatus(mensagem, tipo) {
    status.textContent = mensagem;
    status.className = `status show ${tipo}`;
  }

  form.addEventListener('legacy-submit', async (evento) => {
    evento.preventDefault();

    const nome = form.nome.value.trim();
    const email = form.email.value.trim();
    const senha = form.senha.value;
    const confirmarSenha = form.confirmarSenha.value;
    const botao = form.querySelector('button');

    form.querySelectorAll('.invalid').forEach((campo) => campo.classList.remove('invalid'));

    if (!nome || !email || !senha || !confirmarSenha) {
      mostrarStatus('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (senha.length < 8) {
      form.senha.classList.add('invalid');
      mostrarStatus('A senha deve ter pelo menos 8 caracteres.', 'error');
      return;
    }

    if (senha !== confirmarSenha) {
      form.confirmarSenha.classList.add('invalid');
      mostrarStatus('As senhas não conferem.', 'error');
      return;
    }

    botao.disabled = true;
    mostrarStatus('Criando seu acesso…', 'loading');

    try {
      await AppAuth.cadastrarUsuario(nome, email, senha);
      mostrarStatus('Cadastro realizado. Redirecionando para o login…', 'success');
      setTimeout(() => {
        window.location.href = 'index.html?cadastro=sucesso';
      }, 900);
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
      botao.disabled = false;
    }
  });
})();

(function () {
  const form = document.querySelector('#cadastro-form');
  const blocoCliente = document.querySelector('#cliente-cadastro');
  const lista = document.querySelector('#contatos-cliente');
  if (!form || !blocoCliente || !lista) return;
  const camposCliente = ['razaoSocial', 'nomeFantasia', 'endereco', 'cidade', 'estado', 'cep', 'telefone', 'cpfCnpj', 'inscricaoEstadualRg', 'ramoAtividade', 'numeroFuncionarios'];

  function adicionarContato() {
    const item = document.createElement('fieldset');
    item.className = 'contact-card';
    item.innerHTML = `<legend>Contato</legend><div class="field-grid"><div class="field"><label>Nome *</label><input name="contatoNome"></div><div class="field"><label>CPF *</label><input name="contatoCpf"></div><div class="field"><label>E-mail *</label><input name="contatoEmail" type="email"></div><div class="field"><label>Telefone *</label><input name="contatoTelefone"></div><div class="field"><label>Cargo *</label><input name="contatoCargo"></div><div class="field"><label>Departamento *</label><input name="contatoDepartamento"></div></div><div class="check-grid"><label class="choice"><input type="checkbox" name="recebeNotaFiscalBoleto"> Envio de nota fiscal e boleto</label><label class="choice"><input type="checkbox" name="recebeProposta"> Envio de proposta</label><label class="choice"><input type="checkbox" name="recebeRelatorio"> Envio de relatório</label></div><button class="button secondary remover-contato" type="button">Remover contato</button>`;
    item.querySelector('.remover-contato').addEventListener('click', () => { if (lista.children.length > 1) item.remove(); });
    lista.appendChild(item);
  }

  function alternarCliente() {
    const cliente = form.tipoUsuario.value === 'CLIENTE';
    blocoCliente.hidden = !cliente;
    blocoCliente.querySelectorAll('input').forEach((campo) => { campo.disabled = !cliente; campo.required = cliente && camposCliente.includes(campo.name); });
    if (cliente && !lista.children.length) adicionarContato();
  }

  form.querySelectorAll('[name="tipoUsuario"]').forEach((campo) => campo.addEventListener('change', alternarCliente));
  document.querySelector('#adicionar-contato').addEventListener('click', adicionarContato);
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const tipoUsuario = form.tipoUsuario.value;
    if (!tipoUsuario || form.senha.value !== form.confirmarSenha.value || form.senha.value.length < 8) return;
    const payload = { nome: form.nome.value.trim(), email: form.email.value.trim(), senha: form.senha.value, tipoUsuario };
    if (tipoUsuario === 'CLIENTE') {
      payload.cliente = Object.fromEntries(camposCliente.concat('renasem').map((nome) => [nome, form.elements[nome].value.trim()]));
      payload.contatos = Array.from(lista.children).map((item) => ({ nome: item.querySelector('[name="contatoNome"]').value.trim(), cpf: item.querySelector('[name="contatoCpf"]').value.trim(), email: item.querySelector('[name="contatoEmail"]').value.trim(), telefone: item.querySelector('[name="contatoTelefone"]').value.trim(), cargo: item.querySelector('[name="contatoCargo"]').value.trim(), departamento: item.querySelector('[name="contatoDepartamento"]').value.trim(), recebeNotaFiscalBoleto: item.querySelector('[name="recebeNotaFiscalBoleto"]').checked, recebeProposta: item.querySelector('[name="recebeProposta"]').checked, recebeRelatorio: item.querySelector('[name="recebeRelatorio"]').checked }));
      if (!camposCliente.every((nome) => payload.cliente[nome]) || !payload.contatos.every((contato) => contato.nome && contato.cpf && contato.email && contato.telefone && contato.cargo && contato.departamento && (contato.recebeNotaFiscalBoleto || contato.recebeProposta || contato.recebeRelatorio))) return;
    }
    const botao = form.querySelector('[type="submit"]'); botao.disabled = true;
    try { await AppAuth.cadastrarUsuario(payload); window.location.href = 'index.html?cadastro=sucesso'; } catch (erro) { botao.disabled = false; }
  });
})();
