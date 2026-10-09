/* Carrega dados pessoais diretamente da API, sem permitir edição de permissões no cliente. */
(function () {
  AppAuth.configurarCabecalho();

  const status = document.querySelector('#perfil-status');
  const sessao = AppAuth.obterSessao();

  if (sessao) {
    document.querySelectorAll('[data-usuario-inicial]').forEach((elemento) => {
      elemento.textContent = (sessao.nome || 'U').trim().charAt(0).toUpperCase();
    });
  }

  function escapar(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, (caractere) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caractere]
    ));
  }

  const ROTULOS_CLIENTE = [
    ['tipoPessoa', 'Tipo de pessoa'],
    ['razaoSocial', 'Razão social'],
    ['nomeFantasia', 'Nome fantasia'],
    ['cpfCnpj', 'CPF/CNPJ'],
    ['inscricaoEstadualRg', 'Inscrição Estadual / RG'],
    ['renasem', 'RENASEM'],
    ['endereco', 'Endereço'],
    ['cidade', 'Cidade'],
    ['estado', 'Estado'],
    ['cep', 'CEP'],
    ['telefone', 'Telefone'],
    ['ramoAtividade', 'Ramo de atividade'],
    ['numeroFuncionarios', 'Número de funcionários']
  ];

  function valorCliente(cliente, chave) {
    if (chave === 'tipoPessoa') return { FISICA: 'Pessoa física', JURIDICA: 'Pessoa jurídica' }[cliente.tipoPessoa] || cliente.tipoPessoa;
    return cliente[chave];
  }

  function renderizarCadastro(cliente) {
    const campos = ROTULOS_CLIENTE
      .map(([chave, rotulo]) => [rotulo, String(valorCliente(cliente, chave) || '').trim()])
      .filter(([, valor]) => valor);
    if (!campos.length) return;
    document.querySelector('[data-perfil-detalhes]').innerHTML = campos
      .map(([rotulo, valor]) => `<div><span>${escapar(rotulo)}</span><strong>${escapar(valor)}</strong></div>`)
      .join('');
    document.querySelector('#perfil-cadastro').hidden = false;
  }

  function renderizarContatos(contatos) {
    if (!Array.isArray(contatos) || !contatos.length) return;
    document.querySelector('[data-perfil-contatos]').innerHTML = contatos.map((contato) => {
      const linhas = [
        ['CPF', contato.cpf],
        ['E-mail', contato.email],
        ['Telefone', contato.telefone],
        ['Cargo', contato.cargo],
        ['Departamento', contato.departamento]
      ].filter(([, valor]) => String(valor || '').trim());
      const finalidades = [
        [contato.recebeNotaFiscalBoleto, 'Nota fiscal e boleto'],
        [contato.recebeProposta, 'Proposta'],
        [contato.recebeRelatorio, 'Relatório']
      ].filter(([ativo]) => ativo).map(([, rotulo]) => rotulo);
      const detalhes = linhas.map(([rotulo, valor]) => `<div><span>${escapar(rotulo)}</span><strong>${escapar(valor)}</strong></div>`).join('');
      const propositos = finalidades.length ? `<ul class="profile-contact-purposes">${finalidades.map((item) => `<li>${escapar(item)}</li>`).join('')}</ul>` : '';
      return `<article class="profile-contact-card"><strong>${escapar(contato.nome || 'Contato')}</strong>${detalhes}${propositos}</article>`;
    }).join('');
    document.querySelector('#perfil-contatos').hidden = false;
  }

  AppAuth.requisitarApi('obterPerfil')
    .then((resultado) => {
      const perfil = resultado.dados;
      document.querySelector('[data-perfil-nome]').textContent = perfil.nome;
      document.querySelector('[data-perfil-email]').textContent = perfil.email;
      document.querySelector('[data-perfil-grupo]').textContent = perfil.grupo;
      if (perfil.cliente) renderizarCadastro(perfil.cliente);
      renderizarContatos(perfil.contatos);
    })
    .catch((erro) => {
      status.textContent = erro.message;
      status.className = 'status show error';
    });
})();
