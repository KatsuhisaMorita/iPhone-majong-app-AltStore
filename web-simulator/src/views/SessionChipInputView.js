// SessionChipInputView - Chip settlement (mirrors Swift SessionChipInputView)
import { store } from '../store/DataStore.js';
import { router } from '../main.js';

export function renderSessionChipInputView(params) {
  const session = store.getSession(params.sessionId);
  if (!session) return '<div class="empty-state"><div class="empty-state-text">セッションが見つかりません</div></div>';

  const players = session.playerIds.map(id => store.getPlayer(id)).filter(Boolean);

  return `
    <div class="nav-bar nav-bar-inline">
      <button class="nav-back" data-action="cancel">キャンセル</button>
      <span class="nav-title-small">チップ精算</span>
      <span style="width:80px"></span>
    </div>
    <div class="ios-list">
      <div class="ios-section">
        <div class="ios-section-header">セッション終了チップ精算</div>
        <div class="ios-section-content">
          <div class="ios-row">
            <span class="ios-caption" style="padding:0;">本日の最終的なチップ獲得枚数を入力してください。マイナスの場合は - を付けてください。</span>
          </div>
        </div>
      </div>

      <div class="ios-section">
        <div class="ios-section-content">
          ${players.map(p => {
            const chipValue = session.chipResults[p.id] || 0;
            return `
              <div class="ios-row">
                <span class="ios-row-label">${p.name}</span>
                <div class="ios-stepper">
                  <button data-stepper="minus" data-player="${p.id}">−</button>
                  <span class="stepper-divider"></span>
                  <button data-stepper="plus" data-player="${p.id}">+</button>
                </div>
                <span class="chip-value ios-row-detail" data-chip-display="${p.id}" style="min-width:40px; text-align:right;">${chipValue} 枚</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="padding: 0 16px 24px;">
        <button class="ios-button-primary" id="btn-save-chips" style="background: var(--tint-orange);">精算して終了</button>
      </div>
    </div>
  `;
}

export function bindSessionChipInputViewEvents(el, params) {
  const session = store.getSession(params.sessionId);
  const players = session.playerIds.map(id => store.getPlayer(id)).filter(Boolean);
  const chipValues = {};

  players.forEach(p => {
    chipValues[p.id] = session.chipResults[p.id] || 0;
  });

  function updateDisplay(playerId) {
    const display = el.querySelector(`[data-chip-display="${playerId}"]`);
    if (display) display.textContent = `${chipValues[playerId]} 枚`;
  }

  el.querySelectorAll('[data-stepper]').forEach(btn => {
    btn.addEventListener('click', () => {
      const playerId = btn.dataset.player;
      const direction = btn.dataset.stepper;
      chipValues[playerId] += direction === 'plus' ? 1 : -1;
      updateDisplay(playerId);
    });
  });

  el.querySelector('[data-action="cancel"]')?.addEventListener('click', () => router.back());

  el.querySelector('#btn-save-chips')?.addEventListener('click', () => {
    const settings = store.getSettings();
    session.chipResults = { ...chipValues };

    // Add chip points to player total scores
    players.forEach(p => {
      const chips = chipValues[p.id] || 0;
      const chipPoints = chips * settings.chipRate;
      p.totalScore += chipPoints;
      store.updatePlayer(p);
    });

    store.updateSession(session);
    router.navigate('home', {}, true);
  });
}
