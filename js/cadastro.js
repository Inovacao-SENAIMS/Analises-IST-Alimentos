/* Cadastro publico com documentos obrigatorios para clientes PF/PJ. */
(function () {
  const form = document.querySelector('#cadastro-form');
  const blocoCliente = document.querySelector('#cliente-cadastro');
  const lista = document.querySelector('#contatos-cliente');
  if (!form || !blocoCliente || !lista) return;
  const camposCliente = ['razaoSocial', 'nomeFantasia', 'endereco', 'cidade', 'estado', 'cep', 'telefone', 'cpfCnpj', 'inscricaoEstadualRg', 'ramoAtividade', 'numeroFuncionarios'];
  const camposEmpresa = ['razaoSocial', 'nomeFantasia', 'ramoAtividade', 'numeroFuncionarios'];
  const documentos = UploadDocumentos.criar(document.querySelector('#documentos-cadastro'));
  const status = document.querySelector('#cadastro-status');
  let enviando = false;
  let tentativa = null;

  function mostrarStatus(mensagem, tipo = 'error') {
    status.textContent = mensagem;
    status.className = `status show ${tipo}`;
    if (tipo === 'error') status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function identificadorTentativa(email) {
    const chave = 'ist_documentos_cadastro_tentativa';
    if (!tentativa) {
      try { tentativa = JSON.parse(sessionStorage.getItem(chave) || 'null'); } catch (_) { tentativa = null; }
    }
    if (!tentativa || tentativa.email !== email || !/^[a-f0-9-]{36}$/i.test(tentativa.id || '')) {
      tentativa = { email, id: crypto.randomUUID() };
      // Somente identidade da tentativa; senhas e documentos ficam fora do storage.
      try { sessionStorage.setItem(chave, JSON.stringify(tentativa)); } catch (_) {}
    }
    return tentativa.id;
  }
  const cidadesBrasil = document.querySelector('#cidades-brasil');
  const cidade = form.elements.cidade;
  const estado = form.elements.estado;
  let municipios = [];
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
  function siglaUf(municipio) {
    return municipio.microrregiao?.mesorregiao?.UF?.sigla || municipio['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla || '';
  }
  function normalizarTexto(valor) { return valor.trim().toLocaleLowerCase('pt-BR'); }
  function opcaoCidade(municipio, ufSelecionada) {
    return ufSelecionada ? municipio.nome : `${municipio.nome} — ${siglaUf(municipio)}`;
  }
  function renderizarCidades(uf) {
    if (!cidadesBrasil || !cidadesCarregadas) return;
    const opcoes = document.createDocumentFragment();
    municipios.filter((municipio) => !uf || siglaUf(municipio) === uf).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach((municipio) => {
      const opcao = document.createElement('option');
      opcao.value = opcaoCidade(municipio, uf);
      opcoes.appendChild(opcao);
    });
    cidadesBrasil.replaceChildren(opcoes);
  }
  function municipiosComNome(valor) {
    const [nome] = valor.split(' — ');
    return municipios.filter((municipio) => normalizarTexto(municipio.nome) === normalizarTexto(nome));
  }
  function encontrarMunicipio(valor) {
    const [nome, ufDaOpcao] = valor.split(' — ');
    const opcoes = municipiosComNome(nome);
    if (ufDaOpcao) return opcoes.find((municipio) => siglaUf(municipio) === ufDaOpcao) || null;
    if (estado.value) return opcoes.find((municipio) => siglaUf(municipio) === estado.value) || null;
    return opcoes.length === 1 ? opcoes[0] : null;
  }
  async function carregarCidades() {
    if (cidadesCarregadas || carregandoCidades || !cidadesBrasil) return;
    carregandoCidades = true;
    try {
      const resposta = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
      if (!resposta.ok) throw new Error('Não foi possível carregar as cidades.');
      municipios = await resposta.json();
      cidadesCarregadas = true;
      renderizarCidades(estado.value);
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
  cidade.addEventListener('focus', carregarCidades);
  estado.addEventListener('change', async () => {
    await carregarCidades();
    const opcoesAtuais = municipiosComNome(cidade.value);
    if (opcoesAtuais.length && !opcoesAtuais.some((municipio) => siglaUf(municipio) === estado.value)) cidade.value = '';
    renderizarCidades(estado.value);
  });
  cidade.addEventListener('change', async () => {
    await carregarCidades();
    const municipio = encontrarMunicipio(cidade.value);
    if (!municipio) return;
    estado.value = siglaUf(municipio);
    cidade.value = municipio.nome;
    renderizarCidades(estado.value);
  });

  function adicionarContato() {
    const item = document.createElement('fieldset');
    item.className = 'contact-card';
    item.innerHTML = `<legend>Contato</legend><div class="field-grid"><div class="field"><label>Nome</label><input name="contatoNome"></div><div class="field"><label>CPF</label><input name="contatoCpf"></div><div class="field"><label>E-mail</label><input name="contatoEmail" type="email"></div><div class="field"><label>Telefone</label><input name="contatoTelefone"></div><div class="field"><label>Cargo</label><input name="contatoCargo"></div><div class="field"><label>Departamento</label><input name="contatoDepartamento"></div></div><div class="check-grid"><label class="choice"><input type="checkbox" name="recebeNotaFiscalBoleto"> Envio de nota fiscal e boleto</label><label class="choice"><input type="checkbox" name="recebeProposta"> Envio de proposta</label><label class="choice"><input type="checkbox" name="recebeRelatorio"> Envio de relatório</label></div><button class="button secondary remover-contato" type="button">Remover contato</button>`;
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
    form.elements.tipoPessoa.required = cliente;
    const juridica = form.elements.tipoPessoa.value === 'JURIDICA';
    form.querySelectorAll('[data-empresa-linha]').forEach((linha) => { linha.hidden = !juridica; });
    camposEmpresa.forEach((nome) => {
      const campo = form.elements[nome];
      campo.closest('.field').hidden = !juridica;
      campo.disabled = !cliente || !juridica;
      campo.required = cliente && juridica;
    });
    document.querySelector('#cliente-dados-titulo').textContent = juridica ? 'Dados da empresa' : 'Dados do cliente';
    document.querySelector('#cpf-cnpj-label').textContent = juridica ? 'CNPJ *' : 'CPF *';
    document.querySelector('#inscricao-label').textContent = juridica ? 'Inscrição Estadual *' : 'RG *';
    form.elements.cpfCnpj.placeholder = juridica ? '00.000.000/0000-00' : '000.000.000-00';
    documentos.atualizar(form.elements.tipoPessoa.value, cliente);
  }

  form.querySelectorAll('[name="tipoUsuario"]').forEach((campo) => campo.addEventListener('change', alternarCliente));
  form.elements.tipoPessoa.addEventListener('change', alternarCliente);
  document.querySelector('#adicionar-contato').addEventListener('click', adicionarContato);
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (enviando) return;
    const tipoUsuario = form.tipoUsuario.value;
    if (!tipoUsuario || !form.reportValidity()) { mostrarStatus('Preencha os campos obrigatórios e envie os documentos solicitados.'); return; }
    if (form.senha.value !== form.confirmarSenha.value) { mostrarStatus('As senhas não conferem.'); return; }
    if (form.senha.value.length < 8) { mostrarStatus('A senha deve ter pelo menos 8 caracteres.'); return; }
    const payload = { nome: form.nome.value.trim(), email: form.email.value.trim().toLowerCase(), senha: form.senha.value, tipoUsuario };
    if (tipoUsuario === 'CLIENTE') {
      payload.tipoPessoa = form.elements.tipoPessoa.value;
      const tamanhoDocumento = payload.tipoPessoa === 'FISICA' ? 11 : 14;
      if (!['FISICA', 'JURIDICA'].includes(payload.tipoPessoa) || somenteNumeros(form.cpfCnpj.value).length !== tamanhoDocumento || !Validacoes.validarCpfCnpj(form.cpfCnpj.value)) { mostrarStatus('Informe um CPF ou CNPJ válido para o tipo de pessoa selecionado.'); return; }
      const camposObrigatorios = camposCliente.filter((nome) => payload.tipoPessoa === 'JURIDICA' || !camposEmpresa.includes(nome));
      payload.cliente = Object.fromEntries(camposCliente.concat('renasem').map((nome) => [nome, form.elements[nome].disabled ? '' : form.elements[nome].value.trim()]));
      payload.contatos = Array.from(lista.children).map((item) => ({
        nome: item.querySelector('[name="contatoNome"]').value.trim(),
        cpf: item.querySelector('[name="contatoCpf"]').value.trim(),
        email: item.querySelector('[name="contatoEmail"]').value.trim(),
        telefone: item.querySelector('[name="contatoTelefone"]').value.trim(),
        cargo: item.querySelector('[name="contatoCargo"]').value.trim(),
        departamento: item.querySelector('[name="contatoDepartamento"]').value.trim(),
        recebeNotaFiscalBoleto: item.querySelector('[name="recebeNotaFiscalBoleto"]').checked,
        recebeProposta: item.querySelector('[name="recebeProposta"]').checked,
        recebeRelatorio: item.querySelector('[name="recebeRelatorio"]').checked
      })).filter((contato) => contato.nome || contato.cpf || contato.email || contato.telefone || contato.cargo || contato.departamento || contato.recebeNotaFiscalBoleto || contato.recebeProposta || contato.recebeRelatorio);
      if (!camposObrigatorios.every((nome) => payload.cliente[nome])) { mostrarStatus('Preencha os dados obrigatórios do cadastro.'); return; }
      payload.cadastroId = identificadorTentativa(payload.email);
    }
    enviando = true;
    const controles = Array.from(form.querySelectorAll('input, select, textarea, button')).map((campo) => ({ campo, disabled: campo.disabled }));
    controles.forEach(({ campo }) => { campo.disabled = true; });
    try {
      mostrarStatus('Preparando seu cadastro…', 'loading');
      if (tipoUsuario === 'CLIENTE') payload.documentos = await documentos.coletar();
      mostrarStatus(tipoUsuario === 'CLIENTE' ? 'Enviando cadastro e documentos. Aguarde a conclusão…' : 'Criando seu acesso…', 'loading');
      await AppAuth.cadastrarUsuario(payload);
      mostrarStatus('Cadastro concluído. Redirecionando para o login…', 'success');
      window.location.href = 'index.html?cadastro=sucesso';
    } catch (erro) {
      mostrarStatus(erro.message || 'Não foi possível concluir o cadastro. Tente novamente.');
    } finally {
      controles.forEach(({ campo, disabled }) => { campo.disabled = disabled; });
      enviando = false;
    }
  });
  alternarCliente();
})();
