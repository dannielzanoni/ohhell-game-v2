# PRD — US 042 — Disposição da mesa Mobile

**Módulo:** MOD 07 — Mesa e gameplay  
**Status:** Planejado  
**Prioridade:** A refinar  
**Produto:** Fodinha / Oh Hell Game V2  
**Plataforma:** único site responsivo Mobile-First  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

---

## 1. Visão geral

criar mesas visualmente independentes sobre a mesma máquina de sessão.

Esta especificação detalha exclusivamente **US 042 — Disposição da mesa Mobile**. Ela deve ser implementada no mesmo aplicativo React/Vite, usando a experiência Mobile abaixo de 768 px e a experiência Desktop a partir de 768 px.

## 2. User Story

Como jogador Mobile, quero uma mesa legível e operável com uma mão.

## 3. Resultado esperado

Entregar **Disposição da mesa Mobile** de forma verificável, sem duplicar regras, estado, chamadas HTTP, sessão WebSocket ou persistência entre os layouts Mobile e Desktop.

## 4. Escopo funcional

- Implementar a capacidade descrita nesta User Story.
- Expor dados e ações por controller/view model compartilhado quando houver estado ou efeitos.
- Adaptar apenas a apresentação e a interação ao viewport.
- Cobrir estados de carregamento, sucesso, vazio, indisponibilidade e erro quando forem aplicáveis.
- Preservar rotas, sessão e dados durante resize ou mudança de orientação.

## 5. Fora de escopo

- Criar aplicativo nativo, PWA ou publicação em lojas.
- Duplicar regras de negócio entre Mobile e Desktop.
- Alterar contratos do backend sem atualizar fixtures, documentação e testes.
- Incluir funcionalidades pertencentes a outra US sem refinamento explícito.

## 6. Requisitos funcionais

- **RF-01:** Prioriza jogador local, mão, turno atual, mesa e ação.
- **RF-02:** Oponentes podem usar carrossel/anel compacto/detalhe sob demanda.
- **RF-03:** Não exige rotacionar a mesa Web com CSS.
- **RF-04:** Retrato é o modo principal; paisagem é suportada sem recarregar.

## 7. Critérios de aceite

- [ ] **CA-01:** Prioriza jogador local, mão, turno atual, mesa e ação.
- [ ] **CA-02:** Oponentes podem usar carrossel/anel compacto/detalhe sob demanda.
- [ ] **CA-03:** Não exige rotacionar a mesa Web com CSS.
- [ ] **CA-04:** Retrato é o modo principal; paisagem é suportada sem recarregar.

## 8. Diretriz técnica

Separar reducer, controller e view. A UI não interpreta mensagens WebSocket nem acessa timers, storage ou áudio diretamente.

Regras obrigatórias:

- A view não acessa etch, WebSocket, storage, áudio ou globals do navegador diretamente.
- Mobile é o CSS/componente base; Desktop é uma evolução por min-width: 768px ou view Desktop selecionada pela mesma boundary.
- Trocar de layout não reinicia controllers, requisições concluídas ou sessão realtime.
- Strings de produto usam i18n PT/EN.
- Alvos de toque Mobile têm no mínimo 44×44 CSS px.

## 9. Dependências

MOD 00 e MOD 06.

Dependências adicionais devem ser registradas durante o refinamento, com link para a US ou contrato responsável.

## 10. Impacto em dados e contratos

- Reutilizar os contratos existentes sempre que possível.
- Qualquer campo HTTP ou mensagem WebSocket nova exige fixture e teste de compatibilidade JS/Rust.
- Esta US não autoriza migração destrutiva de storage ou identidade.
- Dados sensíveis e tokens não podem aparecer em logs, URLs de telemetria ou mensagens visuais.

## 11. Plano de implementação

1. Identificar o controller, adapter e contrato afetados.
2. Criar ou ajustar testes do estado compartilhado antes da view.
3. Implementar a experiência Mobile como base.
4. Implementar/adaptar a experiência Desktop sem duplicar efeitos.
5. Validar critérios, acessibilidade, resize, falhas e regressão E2E.

## 12. Plano de testes

- **CT-01:** comprovar CA-01 no(s) viewport(s) aplicável(is), incluindo o estado de falha quando pertinente.
- **CT-02:** comprovar CA-02 no(s) viewport(s) aplicável(is), incluindo o estado de falha quando pertinente.
- **CT-03:** comprovar CA-03 no(s) viewport(s) aplicável(is), incluindo o estado de falha quando pertinente.
- **CT-04:** comprovar CA-04 no(s) viewport(s) aplicável(is), incluindo o estado de falha quando pertinente.
- **CT-R01:** redimensionar entre 767 e 768 px e confirmar preservação de estado.
- **CT-R02:** validar teclado/foco no Desktop e toque/safe areas no Mobile quando aplicável.
- **CT-R03:** confirmar ausência de chamadas, listeners ou sockets duplicados após montar/desmontar a view.

## 13. Observabilidade e segurança

- Registrar apenas eventos técnicos necessários, identificando mobile ou desktop sem armazenar user-agent como regra de layout.
- Não registrar JWT, refresh token, credencial Google ou URL WebSocket autenticada.
- Erros devem ser acionáveis para o usuário e diagnósticos para a equipe, sem expor detalhes internos.

## 14. Definition of Done

- [ ] Todos os critérios de aceite estão automatizados ou possuem evidência de QA.
- [ ] Mobile 320–767 px e Desktop ≥768 px foram validados.
- [ ] Não há lógica de negócio ou efeito duplicado entre views.
- [ ] PT e EN possuem paridade.
- [ ] Acessibilidade e reduced motion foram avaliados.
- [ ] Testes unitários/integrados/E2E aplicáveis estão verdes.
- [ ] Build, lint e typecheck definidos pelo projeto estão verdes.
- [ ] Documentação e contratos impactados foram atualizados.
