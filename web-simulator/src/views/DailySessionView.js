// DailySessionView - Session overview with table layout
import { store } from '../store/DataStore.js';
import { router } from '../main.js';

export function renderDailySessionView(params) {
  const session = store.getSession(params.sessionId);
  if (!session) return '<div class="empty-state"><div class="empty-state-text">セッションが見つかりません</div></div>';

  const players = session.playerIds.map(id => store.getPlayer(id)).filter(Boolean);
  const games = store.getGamesForSession(session.id).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const settings = store.getSettings();

  // Calculate totals per player
  const totals = {};
  players.forEach(p => { totals[p.id] = 0; });

  games.forEach(game => {
    game.playerScores.forEach(ps => {
      if (totals[ps.playerId] !== undefined) {
        totals[ps.playerId] += ps.finalScore;
      }
    });
  });

  // Add chip results
  players.forEach(p => {
    const chips = session.chipResults[p.id] || 0;
    totals[p.id] += chips * settings.chipRate;
  });

  const dateStr = new Date(session.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

  // Build per-game rows
  const gameRows = games.map((game, gi) => {
    const cells = players.map(p => {
      const ps = game.playerScores.find(s => s.playerId === p.id);
      if (!ps) return { score: 0, rank: '-' };
      return { score: ps.finalScore, rank: ps.rank };
    });
    const timeStr = new Date(game.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    return { label: `${gi + 1}半荘`, time: timeStr, cells };
  });

  return `
    <div class="nav-bar nav-bar-inline">
      <button class="nav-back" data-action="back">戻る</button>
      <span class="nav-title-small">本日の対局</span>
      <button class="nav-trailing" data-action="newGame">＋入力</button>
    </div>
    <div class="ios-list">
      <div class="ios-section">
        <div class="ios-section-header">${dateStr}　|　${games.length}半荘　|　${players.length}人</div>
      </div>

      <div class="ios-section">
        <div class="ios-section-content" style="overflow-x:auto;">
          <table class="score-table">
            <thead>
              <tr>
                <th class="score-table-label"></th>
                ${players.map(p => `<th class="score-table-player">${p.name}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr class="score-table-total">
                <td class="score-table-label">合計</td>
                ${players.map(p => {
                  const v = totals[p.id] || 0;
                  return `<td class="${v >= 0 ? 'score-positive' : 'score-negative'}">${v >= 0 ? '+' : ''}${v.toFixed(1)}</td>`;
                }).join('')}
              </tr>
              ${gameRows.length === 0 ? `
                <tr><td colspan="${players.length + 1}" style="text-align:center; color:var(--text-tertiary); padding:20px;">まだ半荘がありません</td></tr>
              ` : gameRows.map(row => `
                <tr>
                  <td class="score-table-label">
                    <div>${row.label}</div>
                    <div class="score-table-time">${row.time}</div>
                  </td>
                  ${row.cells.map(c => {
                    const v = c.score;
                    return `<td class="${v >= 0 ? 'score-positive' : 'score-negative'}">
                      <div>${v >= 0 ? '+' : ''}${v.toFixed(1)}</div>
                      <div class="score-table-rank">${c.rank}位</div>
                    </td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <button class="ios-button-primary" data-action="chipSettlement" style="background: var(--tint-orange);">セッション終了 (チップ精算)</button>
    </div>
  `;
}

export function bindDailySessionViewEvents(el, params) {
  el.querySelector('[data-action="back"]')?.addEventListener('click', () => router.back());
  el.querySelector('[data-action="newGame"]')?.addEventListener('click', () => {
    router.navigate('gameInput', { sessionId: params.sessionId });
  });
  el.querySelector('[data-action="chipSettlement"]')?.addEventListener('click', () => {
    router.navigate('chipInput', { sessionId: params.sessionId });
  });
}
