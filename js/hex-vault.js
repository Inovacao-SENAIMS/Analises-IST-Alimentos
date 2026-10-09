/* Efeito decorativo "hexagonal vault": malha de hexágonos com pulsos de brilho. */
(function () {
  const alvo = document.querySelector('[data-hex-vault]');
  if (!alvo) return;

  const reduzirMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let hexes = [];

  function montar() {
    const largura = alvo.clientWidth || window.innerWidth;
    const altura = alvo.clientHeight || window.innerHeight;
    const raio = largura < 640 ? 18 : 24;
    const larguraHex = Math.sqrt(3) * raio;
    const alturaHex = 2 * raio;
    const passoX = larguraHex;
    const passoY = alturaHex * 0.75;
    const fragmento = document.createDocumentFragment();
    hexes = [];

    for (let linha = -1; linha * passoY < altura + alturaHex; linha += 1) {
      const deslocamento = linha % 2 ? larguraHex / 2 : 0;
      for (let coluna = -1; coluna * passoX < largura + larguraHex; coluna += 1) {
        const hex = document.createElement('span');
        hex.className = 'hex';
        hex.style.width = `${larguraHex}px`;
        hex.style.height = `${alturaHex}px`;
        hex.style.left = `${coluna * passoX + deslocamento - larguraHex / 2}px`;
        hex.style.top = `${linha * passoY - alturaHex / 4}px`;
        fragmento.appendChild(hex);
        hexes.push(hex);
      }
    }

    alvo.innerHTML = '';
    alvo.appendChild(fragmento);
  }

  function pulsar() {
    if (!hexes.length) return;
    const quantidade = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < quantidade; i += 1) {
      const hex = hexes[Math.floor(Math.random() * hexes.length)];
      hex.classList.add('on');
      setTimeout(() => hex.classList.remove('on'), 900 + Math.random() * 700);
    }
  }

  montar();
  if (!reduzirMovimento) setInterval(pulsar, 320);

  let reagendar;
  window.addEventListener('resize', () => {
    clearTimeout(reagendar);
    reagendar = setTimeout(montar, 200);
  });
})();
