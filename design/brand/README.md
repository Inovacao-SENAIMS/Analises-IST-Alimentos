# `.design/` — identidade visual do projeto

Esta pasta contém os arquivos de design que **todo dashboard deve seguir e
implementar** (ver seção *Dashboards* em `AGENTS.md` e a skill `dashboard`).

Ao construir um painel, o agente lê estes arquivos **antes** de escrever qualquer
CSS. O que estiver aqui prevalece sobre a paleta genérica Okabe--Ito.

## Arquivos presentes

| Arquivo | Conteúdo |
|---|---|
| `Marcas_FIEMS.pdf` | Manual de marca oficial FIEMS/SENAI‑MS (fonte autoritativa da identidade). |
| `palette.json` | Cores do SENAI (Sistema Indústria): azul institucional `#003876` + laranja `#E84910`, neutros e paleta de gráficos. |
| `typography.json` | Tipografia: marca em **Neo Sans Pro**; stack de sistema para render offline. |
| `tokens.css` | Variáveis CSS (cores, fontes, raio, sombra, espaçamento) prontas para os dashboards. |
| `README.md` | Este arquivo. |

## Regras

- Se a pasta estiver **vazia**, use a paleta **Okabe--Ito** (skill `graficos`).
- Nunca dependa de CDN para as cores/fontes definidas aqui — embuta tudo no HTML.
- Mantenha consistência: mesmos tokens em todos os dashboards do projeto.
- No Power BI, aplique esta paleta via **Tema** (importe `palette.json`).
