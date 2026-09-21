/* Máscaras e validações compartilhadas pelo formulário. */
(function () {
  function apenasNumeros(valor) { return String(valor || '').replace(/\D/g, ''); }
  function mascaraCpfCnpj(valor) {
    const n = apenasNumeros(valor).slice(0, 14);
    if (n.length <= 11) return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return n.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  function todosIguais(valor) { return /^([0-9])\1+$/.test(valor); }
  function validarCpf(valor) {
    const cpf = apenasNumeros(valor); if (cpf.length !== 11 || todosIguais(cpf)) return false;
    let soma = 0; for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
    let digito = (soma * 10) % 11; if (digito === 10) digito = 0; if (digito !== Number(cpf[9])) return false;
    soma = 0; for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
    digito = (soma * 10) % 11; if (digito === 10) digito = 0; return digito === Number(cpf[10]);
  }
  function validarCnpj(valor) {
    const cnpj = apenasNumeros(valor); if (cnpj.length !== 14 || todosIguais(cnpj)) return false;
    const calcular = (tamanho) => { const pesos = tamanho === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2]; let soma = 0; for (let i = 0; i < tamanho; i++) soma += Number(cnpj[i]) * pesos[pesos.length - tamanho + i]; const resto = soma % 11; return resto < 2 ? 0 : 11 - resto; };
    return calcular(12) === Number(cnpj[12]) && calcular(13) === Number(cnpj[13]);
  }
  function validarCpfCnpj(valor) { const n = apenasNumeros(valor); return n.length === 11 ? validarCpf(n) : n.length === 14 && validarCnpj(n); }
  function validarSafra(valor) { return /^(19|20)\d{2}\/(\d{2})$/.test(String(valor || '').trim()); }
  function adicionarErro(elemento, mensagem) {
    elemento.classList.add('invalid'); elemento.setAttribute('aria-invalid', 'true');
    const campo = elemento.closest('.field'); const erro = campo?.querySelector('.error-message'); if (erro) erro.textContent = mensagem;
  }
  function limparErro(elemento) { elemento.classList.remove('invalid'); elemento.removeAttribute('aria-invalid'); const erro = elemento.closest('.field')?.querySelector('.error-message'); if (erro) erro.textContent = ''; }
  window.Validacoes = { apenasNumeros, mascaraCpfCnpj, validarCpfCnpj, validarSafra, adicionarErro, limparErro };
})();
