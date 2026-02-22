// SessionStartView - Player selection (mirrors Swift SessionStartView)
import { store } from '../store/DataStore.js';
import { router } from '../main.js';

export function renderSessionStartView() {
  const players = store.getPlayers();

  return `
    <div class="nav-bar nav-bar-inline">
      <button class="nav-back" data-action="cancel">キャンセル</button>
      <span class="nav-title-small">メンバー選択</span>
      <span style="width:80px"></span>
    </div>
    <div class="ios-list">
      <div class="ios-section">
        <div class="ios-section-header">参加プレイヤーの選択</div>
        <div class="ios-section-content">
          ${[0,1,2,3].map(i => `
            <div class="ios-row">
              <span class="ios-row-label">プレイヤー ${i + 1}</span>
              <select class="ios-select player-select" data-index="${i}">
                <option value="">未選択</option>
                ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
      </div>

      ${players.length === 0 ? `
        <div class="ios-footnote" style="text-align:center; padding:20px;">
          先に「プレイヤーと成績」でプレイヤーを追加してください。
        </div>
      ` : ''}

      <div id="session-error" class="ios-error" style="display:none; text-align:center;"></div>

      <div style="padding: 0 16px;">
        <button class="ios-button-primary" id="btn-start-session" disabled>このメンバーで対局開始</button>
      </div>
    </div>
  `;
}

export function bindSessionStartViewEvents(el) {
  const selects = el.querySelectorAll('.player-select');
  const btn = el.querySelector('#btn-start-session');
  const errorEl = el.querySelector('#session-error');

  function checkReady() {
    const values = Array.from(selects).map(s => s.value);
    const allSelected = values.every(v => v !== '');
    const allUnique = new Set(values.filter(v => v)).size === values.filter(v => v).length;
    btn.disabled = !allSelected || !allUnique;

    if (allSelected && !allUnique) {
      errorEl.textContent = '4人の異なるプレイヤーを選択してください。';
      errorEl.style.display = 'block';
    } else {
      errorEl.style.display = 'none';
    }
  }

  selects.forEach(s => s.addEventListener('change', checkReady));

  btn.addEventListener('click', () => {
    const playerIds = Array.from(selects).map(s => s.value);
    const session = store.addSession(playerIds);
    router.navigate('dailySession', { sessionId: session.id });
  });

  el.querySelector('[data-action="cancel"]').addEventListener('click', () => {
    router.back();
  });
}
