# MOD 10 — Configurações e personalização

**Status:** Planejado  
**User Stories:** 6  
**Produto:** Fodinha / Oh Hell Game V2  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

## Objetivo

separar o painel Web da experiência Mobile e manter preferências únicas.

## Diretriz técnica do módulo

Persistir preferências pelo adaptador compartilhado e garantir sincronização sem loop entre UI, evento local e abas.

## Dependências

MOD 00 e MOD 01.

## User Stories

| ID | PRD |
|---|---|
| US 059 | [Volume geral](./US-059-volume-geral.md) |
| US 060 | [Tipo de baralho](./US-060-tipo-de-baralho.md) |
| US 061 | [Verso da carta](./US-061-verso-da-carta.md) |
| US 062 | [Painel Web de configurações](./US-062-painel-web-de-configuracoes.md) |
| US 063 | [Tela Mobile de configurações](./US-063-tela-mobile-de-configuracoes.md) |
| US 064 | [Sincronização de preferências](./US-064-sincronizacao-de-preferencias.md) |

## Gate de conclusão do módulo

- [ ] Todas as User Stories do módulo atendem seus critérios e Definition of Done.
- [ ] A experiência é validada em Mobile e Desktop no mesmo site.
- [ ] Não existem efeitos ou regras duplicados entre as apresentações.
- [ ] Testes de regressão dos fluxos relacionados estão verdes.
- [ ] Métricas, acessibilidade, i18n e segurança foram revisadas.
