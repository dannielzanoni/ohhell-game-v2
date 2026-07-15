# Otimização de chunks do Vite

Status: fase inicial concluída em 15/07/2026.

## Resultado atual

- Todas as páginas de Classic, Hell Hand e devtools são carregadas por rota com `lazy` e `Suspense`.
- A sessão de jogo é um chunk próprio e só é baixada ao entrar em uma sala.
- O dialog e o formulário completo de autenticação são carregados somente quando há uma solicitação de login.
- O maior chunk da aplicação caiu para aproximadamente **447 kB** (143 kB gzip).
- React foi separado automaticamente em um chunk compartilhado de aproximadamente **121 kB** (39 kB gzip).
- O build não emite mais aviso de chunk JavaScript acima de 500 kB.
- Não foi necessário aumentar `chunkSizeWarningLimit` nem criar grupos manuais frágeis.

## Implementação

As definições lazy ficam próximas de cada domínio:

- `src/games/classic/routes.jsx`
- `src/games/hell-hand/routes.jsx`
- `src/devtools/routes.jsx`
- `src/features/auth/components/AuthGateProvider.jsx`

O router principal apenas compõe os módulos e mantém redirects para URLs legadas.

## Próximas otimizações possíveis

Estas melhorias devem ser tratadas separadamente da refatoração estrutural:

1. Comprimir os maiores GIFs, vídeos e imagens de cartas. Há assets individuais muito maiores que qualquer chunk JavaScript.
2. Medir o CSS global, atualmente grande antes de gzip, e substituir `primeicons` por ícones React antes de remover a dependência.
3. Carregar mapas de cartas por tipo de baralho somente se a medição da rota de jogo mostrar impacto real.
4. Adicionar um visualizador de bundle apenas durante uma análise específica.

Evitar divisão manual de vendors sem evidência de rede: muitos chunks pequenos podem aumentar o custo de requisições sem melhorar o tempo de interação.

## Verificação

```bash
npm run build
npm run test:e2e
```

Os testes E2E cobrem a seleção de jogos, as rotas padronizadas e redirects legados principais.
