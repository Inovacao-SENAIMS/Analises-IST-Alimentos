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

  const ROTULOS_PESSOA = { FISICA: 'Pessoa física', JURIDICA: 'Pessoa jurídica' };

  function valorCliente(cliente, chave) {
    if (chave === 'tipoPessoa') return ROTULOS_PESSOA[cliente.tipoPessoa] || cliente.tipoPessoa;
    return cliente[chave];
  }

  function campo(rotulo, valor) {
    return `<div class="data-field"><span>${escapar(rotulo)}</span><strong>${escapar(valor)}</strong></div>`;
  }

  function renderizarCadastro(cliente) {
    const campos = ROTULOS_CLIENTE
      .map(([chave, rotulo]) => [rotulo, String(valorCliente(cliente, chave) || '').trim()])
      .filter(([, valor]) => valor);
    if (!campos.length) return;
    document.querySelector('[data-perfil-detalhes]').innerHTML = campos.map(([rotulo, valor]) => campo(rotulo, valor)).join('');
    const pill = document.querySelector('[data-perfil-pessoa]');
    if (pill) pill.textContent = ROTULOS_PESSOA[cliente.tipoPessoa] || '';
    document.querySelector('#perfil-cadastro').hidden = false;
  }

  function renderizarContatos(contatos) {
    if (!Array.isArray(contatos) || !contatos.length) return;
    document.querySelector('[data-perfil-contatos]').innerHTML = contatos.map((contato) => {
      const finalidades = [
        [contato.recebeNotaFiscalBoleto, 'Nota fiscal e boleto'],
        [contato.recebeProposta, 'Proposta'],
        [contato.recebeRelatorio, 'Relatório']
      ].filter(([ativo]) => ativo).map(([, rotulo]) => rotulo);
      const celulas = [
        ['Nome', contato.nome],
        ['CPF', contato.cpf],
        ['E-mail', contato.email],
        ['Telefone', contato.telefone],
        ['Cargo', contato.cargo],
        ['Departamento', contato.departamento]
      ].map(([rotulo, valor]) => `<td data-label="${escapar(rotulo)}">${escapar(String(valor || '').trim() || '—')}</td>`).join('');
      const propositos = finalidades.length
        ? `<ul class="data-purposes">${finalidades.map((item) => `<li>${escapar(item)}</li>`).join('')}</ul>`
        : '<span>—</span>';
      return `<tr>${celulas}<td data-label="Finalidades">${propositos}</td></tr>`;
    }).join('');
    const pill = document.querySelector('[data-perfil-contatos-pill]');
    if (pill) pill.textContent = `${contatos.length} ${contatos.length === 1 ? 'contato' : 'contatos'}`;
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
