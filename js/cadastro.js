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
  const cidadesBrasil = document.querySelector('#cidades-brasil');
  let cidadesCarregadas = false;
  let carregandoCidades = false;

  function somenteNumeros(valor) { return valor.replace(/\D/g, ''); }
  function mascararCep(valor) {
    const numeros = somenteNumeros(valor).slice(0, 8);
    return numeros.replace(/^(\d{2})(\d{3})(\d{0,3})$/, (_, a, b, c) => `${a}.${b}${c ? `-${c}` : ''}`);
  }
  function mascararCpfCnpj(valor) {
    const numeros = somenteNumeros(valor).slice(0, 14);
    if (numeros.length <= 11) {
      return [numeros.slice(0, 3), numeros.slice(3, 6), numeros.slice(6, 9)].filter(Boolean).join('.') + (numeros.length > 9 ? `-${numeros.slice(9)}` : '');
    }
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}${numeros.length > 12 ? `-${numeros.slice(12)}` : ''}`;
  }
  function mascararTelefone(valor) {
    const numeros = somenteNumeros(valor).slice(0, 11);
    if (numeros.length < 3) return numeros ? `(${numeros}` : '';
    const corpo = numeros.slice(2);
    return `(${numeros.slice(0, 2)}) ${corpo.replace(/^(\d{4,5})(\d{0,4})$/, (_, a, b) => `${a}${b ? `-${b}` : ''}`)}`;
  }
  function mascararInscricaoEstadualRg(valor) {
    const documento = valor.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);
    if (!/^\d{1,9}$/.test(documento)) return documento;
    return `${documento.slice(0, 2)}${documento.length > 2 ? `.${documento.slice(2, 5)}` : ''}${documento.length > 5 ? `.${documento.slice(5, 8)}` : ''}${documento.length > 8 ? `-${documento.slice(8)}` : ''}`;
  }
  function aplicarMascara(campo, mascara) {
    if (!campo) return;
    campo.addEventListener('input', () => { campo.value = mascara(campo.value); });
  }
  async function carregarCidades() {
    if (cidadesCarregadas || carregandoCidades || !cidadesBrasil) return;
    carregandoCidades = true;
    try {
      const resposta = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
      if (!resposta.ok) throw new Error('Não foi possível carregar as cidades.');
      const municipios = await resposta.json();
      const opcoes = document.createDocumentFragment();
      municipios.forEach(({ nome }) => {
        const opcao = document.createElement('option');
        opcao.value = nome;
        opcoes.appendChild(opcao);
      });
      cidadesBrasil.appendChild(opcoes);
      cidadesCarregadas = true;
    } catch (_) {
      // A cidade permanece um campo livre quando a lista oficial não estiver disponível.
    } finally {
      carregandoCidades = false;
    }
  }

  aplicarMascara(form.elements.cep, mascararCep);
  aplicarMascara(form.elements.cpfCnpj, mascararCpfCnpj);
  aplicarMascara(form.elements.inscricaoEstadualRg, mascararInscricaoEstadualRg);
  aplicarMascara(form.elements.telefone, mascararTelefone);
  form.elements.cidade.addEventListener('focus', carregarCidades);

  function adicionarContato() {
    const item = document.createElement('fieldset');
    item.className = 'contact-card';
    item.innerHTML = `<legend>Contato</legend><div class="field-grid"><div class="field"><label>Nome *</label><input name="contatoNome"></div><div class="field"><label>CPF *</label><input name="contatoCpf"></div><div class="field"><label>E-mail *</label><input name="contatoEmail" type="email"></div><div class="field"><label>Telefone *</label><input name="contatoTelefone"></div><div class="field"><label>Cargo *</label><input name="contatoCargo"></div><div class="field"><label>Departamento *</label><input name="contatoDepartamento"></div></div><div class="check-grid"><label class="choice"><input type="checkbox" name="recebeNotaFiscalBoleto"> Envio de nota fiscal e boleto</label><label class="choice"><input type="checkbox" name="recebeProposta"> Envio de proposta</label><label class="choice"><input type="checkbox" name="recebeRelatorio"> Envio de relatório</label></div><button class="button secondary remover-contato" type="button">Remover contato</button>`;
    item.querySelectorAll('.check-grid .choice').forEach((opcao) => opcao.classList.add('contact-purpose'));
    const remover = item.querySelector('.remover-contato');
    remover.classList.add('contact-remove-button');
    remover.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>Remover contato';
    remover.addEventListener('click', () => { if (lista.children.length > 1) item.remove(); });
    aplicarMascara(item.querySelector('[name="contatoCpf"]'), mascararCpfCnpj);
    aplicarMascara(item.querySelector('[name="contatoTelefone"]'), mascararTelefone);
    lista.appendChild(item);
  }

  function alternarCliente() {
    const cliente = form.tipoUsuario.value === 'CLIENTE';
    blocoCliente.hidden = !cliente;
    form.closest('.cadastro-card').classList.toggle('cadastro-card--cliente', cliente);
    blocoCliente.querySelectorAll('input, select').forEach((campo) => { campo.disabled = !cliente; campo.required = cliente && camposCliente.includes(campo.name); });
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
