# Documentação modular — Fodinha / Oh Hell Game V2

Esta pasta divide o [PRD mestre](../PRD-SEPARACAO-WEB-MOBILE.md) em módulos navegáveis e em um PRD independente para cada User Story.

## Princípio do produto

- Um único site React/Vite.
- Mobile-first de 320 a 767 CSS px.
- Desktop a partir de 768 CSS px.
- Mesmas URLs, domínio, deploy, backend, controllers e contratos.
- Sem aplicativo nativo, PWA ou publicação em lojas.

## Cobertura

- **15 módulos** (MOD 00 a MOD 14).
- **81 PRDs de User Story** (US 001 a US 081).
- Cada PRD contém escopo, requisitos, critérios de aceite, dependências, orientação técnica, plano de testes e Definition of Done.

## Índice de módulos

| Módulo | Área | Quantidade de US | Intervalo |
|---|---|---:|---|
| MOD 00 | [Fundação de plataforma e contratos](./MOD-00-fundacao-de-plataforma-e-contratos/README.md) | 7 | US 001-007 |
| MOD 01 | [Shell e navegação](./MOD-01-shell-e-navegacao/README.md) | 5 | US 008-012 |
| MOD 02 | [Home Page](./MOD-02-home-page/README.md) | 5 | US 013-017 |
| MOD 03 | [Autenticação e perfil](./MOD-03-autenticacao-e-perfil/README.md) | 7 | US 018-024 |
| MOD 04 | [Criar jogo](./MOD-04-criar-jogo/README.md) | 4 | US 025-028 |
| MOD 05 | [Salas](./MOD-05-salas/README.md) | 5 | US 029-033 |
| MOD 06 | [Lobby e pré-partida](./MOD-06-lobby-e-pre-partida/README.md) | 6 | US 034-039 |
| MOD 07 | [Mesa e gameplay](./MOD-07-mesa-e-gameplay/README.md) | 10 | US 040-049 |
| MOD 08 | [Rodada, vidas e fim de jogo](./MOD-08-rodada-vidas-e-fim-de-jogo/README.md) | 4 | US 050-053 |
| MOD 09 | [Ranking e estatísticas](./MOD-09-ranking-e-estatisticas/README.md) | 5 | US 054-058 |
| MOD 10 | [Configurações e personalização](./MOD-10-configuracoes-e-personalizacao/README.md) | 6 | US 059-064 |
| MOD 11 | [Idioma e conteúdo](./MOD-11-idioma-e-conteudo/README.md) | 4 | US 065-068 |
| MOD 12 | [Como jogar](./MOD-12-como-jogar/README.md) | 3 | US 069-071 |
| MOD 13 | [GitHub e informações externas](./MOD-13-github-e-informacoes-externas/README.md) | 1 | US 072-072 |
| MOD 14 | [Qualidade, performance e rollout](./MOD-14-qualidade-performance-e-rollout/README.md) | 9 | US 073-081 |

## Ordem recomendada

1. MOD 00 — Fundação.
2. MOD 14 — Qualidade transversal desde o início.
3. MOD 01 — Shell e navegação.
4. MOD 09 e MOD 05 — pilotos de separação de views.
5. MOD 04, MOD 02, MOD 10–13.
6. MOD 03 — autenticação e renovação.
7. MOD 06–08 — lobby, partida e resultados.

## Convenção

- Pastas: MOD-XX-slug.
- Arquivos: US-XXX-slug.md.
- A numeração é global e contínua.
- Mudanças de requisito devem ser feitas primeiro no PRD da US e depois refletidas no PRD mestre.
