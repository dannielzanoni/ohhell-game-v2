import { expect, test } from '@playwright/test';

const authToken = [
  'e2e',
  btoa(JSON.stringify({ id: 'guest-e2e', user: { type: 'Anonymous', data: { id: 'guest-e2e', data: { nickname: 'E2E Guest' } } } })),
  'signature',
].join('.');

async function mockHttp(page) {
  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname === '/auth/signup') {
      await route.fulfill({ json: { refresh_token: 'refresh-e2e', token: authToken } });
      return;
    }

    if (url.pathname === '/lobby' && method === 'POST') {
      await route.fulfill({ json: { lobby_id: 'room-e2e', status: { state: 'Waiting' } } });
      return;
    }

    if (url.pathname === '/lobby' && method === 'GET') {
      await route.fulfill({ json: [{ lobby_id: 'room-e2e', players: 1, capacity: 13, state: 'Waiting' }] });
      return;
    }

    if (url.pathname === '/lobby/room-e2e') {
      await route.fulfill({ json: { status: { state: 'Waiting' } } });
      return;
    }

    if (url.pathname === '/stats') {
      await route.fulfill({
        json: [{
          average_bid: 1.2,
          bid_hit_rate: 0.5,
          games_played: 3,
          player_id: 'guest-e2e',
          player_name: 'E2E Guest',
          rounds_played: 6,
          trump_cards: 2,
          win_rate: 0.333,
          wins: 1,
        }],
      });
      return;
    }

    await route.fulfill({ json: {} });
  });
}

async function installFakeSocket(page) {
  await page.addInitScript(() => {
    window.__socketCount = 0;
    window.__socketMessages = [];
    window.__lastSocket = null;

    class FakeWebSocket extends EventTarget {
      constructor(url) {
        super();
        this.url = url;
        this.readyState = 0;
        window.__lastSocket = this;
        window.__socketCount += 1;
        setTimeout(() => {
          this.readyState = 1;
          this.dispatchEvent(new Event('open'));
          this.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'Snapshot',
              data: {
                state: 'Waiting',
                players: [],
                status: {
                  'guest-e2e': {
                    ready: false,
                    player: {
                      type: 'Anonymous',
                      data: { id: 'guest-e2e', data: { nickname: 'E2E Guest', picture: '' } },
                    },
                  },
                },
              },
            }),
          }));
        }, 0);
      }

      close() {
        this.readyState = 3;
        this.dispatchEvent(new Event('close'));
      }

      send(message) {
        window.__socketMessages.push(JSON.parse(message));
      }
    }

    window.WebSocket = FakeWebSocket;
  });
}

test.beforeEach(async ({ page }) => {
  await mockHttp(page);
  await installFakeSocket(page);
});

async function persistGuestSession(page) {
  await page.addInitScript((token) => {
    localStorage.setItem('JWT_TOKEN', token);
    localStorage.setItem('ohhell_guest_nickname', 'E2E Guest');
  }, authToken);
}

async function openSettings(page) {
  const desktopSettings = page.getByRole('button', { name: 'Settings' }).first();
  if (await desktopSettings.isVisible()) {
    await desktopSettings.click();
    return;
  }

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
}

test('guest can create, share/enter, inspect ranking, switch language and change preferences', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Nick').fill('E2E Guest');
  await page.getByLabel('Save nick').click();
  await expect(page.getByRole('status')).toContainText('Profile saved');

  await page.getByRole('link', { name: 'Create a Game' }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page).toHaveURL(/\/game\/room-e2e/);

  await page.goto('/rooms');
  await expect(page.getByRole('article', { name: /Room room-e2e/ })).toBeVisible();
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page).toHaveURL(/\/game\/room-e2e/);

  await page.goto('/leaderboard');
  await expect(page.getByText('E2E Guest')).toBeVisible();

  await openSettings(page);
  await page.getByRole('tab', { name: 'Language' }).click();
  await page.getByRole('button', { name: /Portuguese/ }).click();
  await expect(page.getByText('Configurações')).toBeVisible();
  await page.getByRole('tab', { name: /Sons|Sounds/ }).click();
  await page.getByLabel(/Volume geral|General volume/).fill('35');
});

test('player can become ready, bid, play and receive a result snapshot', async ({ page }) => {
  await persistGuestSession(page);
  await page.goto('/game/room-e2e');
  await expect.poll(() => page.evaluate(() => window.__socketCount)).toBe(1);

  await page.getByRole('button', { name: /Ready/ }).click();
  await expect.poll(() => page.evaluate(() => window.__socketMessages.some(({ type }) => type === 'PlayerStatusChange'))).toBe(true);

  await page.evaluate(() => {
    window.__lastSocket.dispatchEvent(new MessageEvent('message', {
      data: JSON.stringify({ type: 'PlayerBiddingTurn', data: { player_id: 'guest-e2e', possible_bids: [0, 1] } }),
    }));
  });
  await page.getByRole('button', { name: /Bid 1/ }).click();

  await page.evaluate(() => {
    window.__lastSocket.dispatchEvent(new MessageEvent('message', {
      data: JSON.stringify({ type: 'GameEnded', data: { winners: [{ id: 'guest-e2e', nickname: 'E2E Guest' }] } }),
    }));
  });
  await expect(page.getByText(/Game ended|Fim de jogo/)).toBeVisible();
});

test('resizing during a match keeps a single socket connection', async ({ page }) => {
  await persistGuestSession(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/game/room-e2e');
  await expect.poll(() => page.evaluate(() => window.__socketCount)).toBe(1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect.poll(() => page.evaluate(() => window.__socketCount)).toBe(1);
});
