# PRD — US 044 — Mão do jogador Web

**Módulo:** MOD 07 — Mesa e gameplay  
**Status:** Planejado  
**Prioridade:** A refinar  
**Produto:** Fodinha / Oh Hell Game V2  
**Plataforma:** único site responsivo Mobile-First  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

---

## 1. Visão geral

criar mesas visualmente independentes sobre a mesma máquina de sessão.

Esta especificação detalha exclusivamente **US 044 — Mão do jogador Web**. Ela deve ser implementada no mesmo aplicativo React/Vite, usando a experiência Mobile abaixo de 768 px e a experiência Desktop a partir de 768 px.

## 2. User Story

Como jogador Web, quero selecionar uma carta com mouse ou teclado.

## 3. Resultado esperado

Entregar **Mão do jogador Web** de forma verificável, sem duplicar regras, estado, chamadas HTTP, sessão WebSocket ou persistência entre os layouts Mobile e Desktop.

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

- **RF-01:** Cartas habilitadas possuem hover, foco e nome acessível.
- **RF-02:** Clique duplo/rápido não envia duas jogadas.

## 7. Critérios de aceite

- [ ] **CA-01:** Cartas habilitadas possuem hover, foco e nome acessível.
- [ ] **CA-02:** Clique duplo/rápido não envia duas jogadas.

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
