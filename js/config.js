/* Configuração pública: substitua apenas a URL pelo Web App implantado. */
window.APP_CONFIG = {
  // As páginas ficam em /pages; os recursos compartilhados permanecem na raiz.
  assetBase: '../',
  apiUrl: 'https://script.google.com/macros/s/AKfycbwH_94kvA7DDv9alK4qs-JF_cnDdU7ib-BUP3WxvVNXmQ3qcjntjrDywnrneN8bMhjX/exec',
  sessionStorageKey: 'ist_alimentos_sessao',
  sessionHours: 8,
  formularios: [
    {
      id: 'analise-sementes',
      titulo: 'Solicitação de Análise de Sementes',
      descricao: 'Solicitação de ensaios de análise de sementes para Controle de Qualidade ou emissão de BAS.',
      icone: 'seedling',
      caminho: 'formulario-analise-sementes.html'
    },
    {
      id: 'analise-microbiologica',
      titulo: 'Solicitação de Análise Microbiológica',
      descricao: 'Solicitação de ensaios microbiológicos para água, gelo, alimentos e bebidas.',
      icone: 'flask',
      caminho: 'formulario-analise-microbiologica.html'
    },
    { id: 'analise-fisico-quimica', titulo: 'Solicitação de Análise Físico-Química', descricao: 'Solicitação de ensaios físico-químicos para água, gelo, carnes, leite, mel, alimentos, bebidas e matérias-primas.', icone: 'flask', caminho: 'formulario-analise-fisico-quimica.html' },
    {
      id: 'amostras-fiscais',
      titulo: 'Amostras Fiscais - Alimentos',
      descricao: 'Solicitação de análise fiscal indicativa ou representativa de alimentos.',
      icone: 'clipboard',
      caminho: 'formulario-amostras-fiscais.html'
    },
    {
      id: 'analise-sementes-r08',
      titulo: 'Análise de Sementes R.08',
      descricao: 'Solicitação de análise de sementes conforme o formulário revisado R.08.',
      icone: 'seedling',
      caminho: 'formulario-analise-sementes-r08.html'
    }
  ],
  ensaiosMicrobiologicos: {
    aguaGelo: [
      { codigo: 'M04', nome: 'Contagem Total de Clostridium perfringens incluindo esporos a 44±1°C' },
      { codigo: 'M08', nome: 'Contagem de Coliformes Totais - Método de Filtração em Membrana' },
      { codigo: 'M09', nome: 'Contagem de Enterococos spp. - Método de Filtração em Membrana' },
      { codigo: 'M10', nome: 'Detecção e Contagem de Escherichia coli - Método de Filtração em Membrana' },
      { codigo: 'M13', nome: 'Contagem Padrão de Microrganismos Mesófilos Aeróbios Viáveis a 36°C' },
      { codigo: 'M13A', nome: 'Contagem Padrão de Microrganismos Mesófilos Aeróbios Viáveis a 22°C' },
      { codigo: 'M13B', nome: 'Contagem Padrão de Microrganismos Heterotróficos Aeróbios Viáveis' },
      { codigo: 'M26A', nome: 'Pesquisa de Salmonella spp.' },
      { codigo: 'M53', nome: 'Pesquisa de Pseudomonas aeruginosa' }
    ],
    alimentosBebidas: [
      { codigo: 'M01', nome: 'Contagem Presuntiva de Bacillus cereus' },
      { codigo: 'M02', nome: 'Contagem Total de Bolores e Leveduras' },
      { codigo: 'M03', nome: 'Contagem Total de Clostridium perfringens' },
      { codigo: 'M06', nome: 'Contagem Total de Coliformes Termotolerantes' },
      { codigo: 'M07', nome: 'Contagem de Coliformes totais' },
      { codigo: 'M11', nome: 'Contagem de Microrganismos Mesófilos Aeróbios Viáveis a 30°C' },
      { codigo: 'M12', nome: 'Contagem de Staphylococcus aureus' },
      { codigo: 'M12A', nome: 'Contagem de Staphylococcus coagulase positiva' },
      { codigo: 'M14', nome: 'Contagem Total de Enterobacteriaceas' },
      { codigo: 'M15', nome: 'NMP de Coliformes Termotolerantes' },
      { codigo: 'M16', nome: 'NMP de Coliformes Totais' },
      { codigo: 'M26', nome: 'Pesquisa de Listeria monocytogenes' },
      { codigo: 'M26A', nome: 'Pesquisa de Salmonella spp.' },
      { codigo: 'M29', nome: 'Pré-incubação a 55°C±1°C - Teste de Esterilidade Comercial' },
      { codigo: 'M30', nome: 'Pré-incubação a 36°C±1°C - Teste de Esterilidade Comercial' },
      { codigo: 'M32', nome: 'Contagem Total de Escherichia coli' },
      { codigo: 'M34', nome: 'Contagem total de Bactérias Acidófilas específicas' },
      { codigo: '', nome: 'Detecção de Salmonella typhimurium e Salmonella enteritidis' },
      { codigo: '', nome: 'Detecção de Enterotoxina Estafilocócica' }
    ]
  },
  ensaiosFisicoQuimicos: {
    aguaGelo: [{ codigo: 'FQ076', nome: 'Alcalinidade' }, { codigo: 'FQ064', nome: 'Cor aparente' }, { codigo: 'FQ085', nome: 'Cloreto' }, { codigo: 'FQ066A', nome: 'Cloro Residual Livre' }, { codigo: 'FQ066B', nome: 'Cloro Total' }, { codigo: 'FQ069', nome: 'Condutividade' }, { codigo: 'FQ074', nome: 'DBO - Demanda Bioquímica de Oxigênio' }, { codigo: 'FQ075', nome: 'DQO - Demanda Química de Oxigênio' }, { codigo: 'FQ070', nome: 'Dureza' }, { codigo: 'FQ078', nome: 'Fósforo' }, { codigo: 'FQ084', nome: 'Matéria Orgânica' }, { codigo: 'FQ071', nome: 'Nitrito' }, { codigo: 'FQ072', nome: 'Nitrato' }, { codigo: 'FQ073', nome: 'Óleos e Graxas' }, { codigo: 'FQ067', nome: 'pH' }, { codigo: 'FQ083', nome: 'Sólidos Sedimentáveis' }, { codigo: 'FQ080', nome: 'Sólidos Totais Dissolvidos' }, { codigo: 'FQ081', nome: 'Sólidos Totais Suspensos' }, { codigo: 'FQ065', nome: 'Turbidez' }],
    carnesPescados: [{ codigo: 'FQ076', nome: 'Alcalinidade' }, { codigo: 'FQ064', nome: 'Cor aparente' }, { codigo: 'FQ085', nome: 'Cloreto' }, { codigo: 'FQ066A', nome: 'Cloro Residual Livre' }, { codigo: 'FQ066B', nome: 'Cloro Total' }, { codigo: 'FQ069', nome: 'Condutividade' }, { codigo: 'FQ074', nome: 'DBO - Demanda Bioquímica de Oxigênio' }, { codigo: 'FQ075', nome: 'DQO - Demanda Química de Oxigênio' }, { codigo: 'FQ070', nome: 'Dureza' }, { codigo: 'FQ078', nome: 'Fósforo' }, { codigo: 'FQ084', nome: 'Matéria Orgânica' }, { codigo: 'FQ071', nome: 'Nitrito' }, { codigo: 'FQ072', nome: 'Nitrato' }, { codigo: 'FQ073', nome: 'Óleos e Graxas' }, { codigo: 'FQ067', nome: 'pH' }, { codigo: 'FQ083', nome: 'Sólidos Sedimentáveis' }, { codigo: 'FQ080', nome: 'Sólidos Totais Dissolvidos' }, { codigo: 'FQ081', nome: 'Sólidos Totais Suspensos' }, { codigo: 'FQ065', nome: 'Turbidez' }, { codigo: '', nome: 'Subcontratado - Metais pesados' }],
    leiteOvos: [{ codigo: 'FFQ001', nome: 'Acidez (ácido láctico - g/100 g ou mL)' }, { codigo: 'FQ005', nome: 'Acidez (SAN%)' }, { codigo: 'FQ005a', nome: 'Acidez (mmmol/100 g)' }, { codigo: 'FQ006', nome: 'Acidez Titulável - SNG (g/mL)' }, { codigo: 'FQ008', nome: 'Ácido Sórbico e/ou Sorbato' }, { codigo: 'FQ087', nome: 'Açúcares Redutores em Glicose' }, { codigo: 'FQ057', nome: 'Açúcares Redutores em Lactose' }, { codigo: 'FQ013A', nome: 'Amido - Qualitativo' }, { codigo: 'FQ088', nome: 'Antibiótico' }, { codigo: 'FQ082', nome: 'Cinzas' }, { codigo: 'FQ022', nome: 'Cloreto de Sódio' }, { codigo: 'FQ031', nome: 'Densidade a 15 °C' }, { codigo: 'FQ038', nome: 'Detecção de Formaldeido' }, { codigo: 'FQ036', nome: 'Extrato Seco Desengordurado' }, { codigo: 'FQ037', nome: 'Extrato Seco Total' }, { codigo: 'FQ039', nome: 'Fosfatase Alcalina' }, { codigo: 'FQ043', nome: 'Índice Crioscópico' }, { codigo: 'FQ050', nome: 'Índice de Peróxidos' }, { codigo: 'FQ126', nome: 'Insolúveis' }, { codigo: 'FQ058', nome: 'Matéria Gorda/ Lipídios' }, { codigo: 'FQ060', nome: 'Matéria Gorda no Extrato Seco' }, { codigo: 'FQ070', nome: 'Peroxidase' }, { codigo: 'FQ071', nome: 'pH' }, { codigo: 'FQ075', nome: 'Proteína' }, { codigo: 'FQ075A', nome: 'Proteína no Extrato Seco Desengordurado' }, { codigo: 'FQ082', nome: 'Resíduo Mineral Fixo (cinzas)' }, { codigo: 'FQ084', nome: 'Sólidos Totais' }, { codigo: 'FQ083', nome: 'Sacarose' }, { codigo: 'FQ090', nome: 'Umidade' }],
    melApicolas: [{ codigo: 'FQ004', nome: 'Acidez' }, { codigo: 'FQ010', nome: 'Açúcares Redutores' }, { codigo: 'FQ082', nome: 'Cinzas' }, { codigo: 'FQ037', nome: 'Extrato Seco' }, { codigo: 'FQ048', nome: 'Hidroximetilfurfural (HMF)' }, { codigo: 'FQ044', nome: 'Índice de Amilase (Atividade Diastásica)' }, { codigo: 'FQ109', nome: 'Reação de Fiehe' }, { codigo: 'FQ110', nome: 'Reação de Lugol' }, { codigo: 'FQ111', nome: 'Reação de Lund' }, { codigo: 'FQ083', nome: 'Umidade' }, { codigo: 'FQ063', nome: 'Sólidos Insolúveis' }],
    alimentosBebidas: [{ codigo: 'FQ001', nome: 'Acidez' }, { codigo: 'FQ101', nome: 'Acidez Volátil' }, { codigo: 'FQ102', nome: 'Acidez Total' }, { codigo: 'FQ103', nome: 'Açúcares Totais' }, { codigo: 'FQ006', nome: 'Amido - Qualitativo' }, { codigo: 'FQ034', nome: 'Atividade de Água' }, { codigo: 'FQ098', nome: 'Atividade Ureática' }, { codigo: 'FQ094', nome: 'Cálcio' }, { codigo: 'FQ104', nome: 'Características Organolépcticas' }, { codigo: 'FQ033', nome: 'Carboidrato Total' }, { codigo: 'FQ095', nome: 'Digestibilidade Proteica' }, { codigo: 'FQ105', nome: 'Densidade Relativa' }, { codigo: 'FQ106', nome: 'Extrato Aparente' }, { codigo: 'FQ096', nome: 'Extrato Etéreo' }, { codigo: 'FQ096a', nome: 'Extrato Etéreo (Base Seca)' }, { codigo: 'FQ107', nome: 'Extrato Primitivo ou Original' }, { codigo: '', nome: 'Subcontratado - Fibra Alimentar' }, { codigo: 'FQ092', nome: 'Fibra Bruta' }, { codigo: 'FQ092a', nome: 'Fibra Bruta (Base Seca)' }, { codigo: '', nome: 'Subcontratado - Gorduras Totais (Polisaturadas, Saturadas, Monoinsaturadas e Trans)' }, { codigo: 'FQ108', nome: 'Grau Alcoólico Real' }, { codigo: 'FQ093', nome: 'Índice de Peróxido' }, { codigo: 'FQ097', nome: 'Índice de Acidez' }, { codigo: 'FQ037', nome: 'Lipídios Totais' }, { codigo: 'FQ038', nome: 'Lipídios (Base Seca)' }, { codigo: 'FQ100', nome: 'Nutrientes Totais Digestivos (NDT)' }, { codigo: '', nome: 'Subcontratado - Perfil de Açúcares (Galactose, Glicose, Lactose, Maltose, Sacarose, Frutose)' }, { codigo: 'FQ039', nome: 'pH' }, { codigo: 'FQ043', nome: 'Proteína' }, { codigo: 'FQ043a', nome: 'Proteína (Base Seca)' }, { codigo: 'FQ046', nome: 'Umidade' }, { codigo: 'FQ045', nome: 'Resíduo Mineral (Cinzas)' }, { codigo: 'FQ090', nome: 'Valor Calórico/ Energético (Cálculo)' }, { codigo: 'FQ091', nome: 'Sólidos Solúveis Totais (°Brix)' }, { codigo: 'FQ099', nome: 'Teste de Rancidez' }]
  },
  opcoesPadrao: {
    peneiras: ['Não se aplica', 'Peneira 1', 'Peneira 2', 'Peneira 3'],
    categorias: ['Semente genética', 'Semente básica', 'Semente certificada', 'Semente não certificada']
  }
};
