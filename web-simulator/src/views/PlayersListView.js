// PlayersListView - Player management (mirrors Swift PlayersListView)
import { store } from '../store/DataStore.js';
import { router } from '../main.js';

export function renderPlayersListView() {
  const players = store.getPlayers().sort((a, b) => a.name.localeCompare(b.name));

  return `
    <div class="nav-bar nav-bar-inline">
      <button class="nav-back" data-action="back">戻る</button>
      <span class="nav-title-small">プレイヤー実績</span>
      <button class="nav-trailing" data-action="addPlayer">＋</button>
    </div>
    <div class="ios-list">
      <div class="ios-section">
        <div class="ios-section-content">
          ${players.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">👤</div>
              <div class="empty-state-text">プレイヤーがまだいません<br>右上の ＋ ボタンで追加してください</div>
            </div>
          ` : players.map(p => `
            <div class="ios-row" style="flex-direction:column; align-items:stretch; position:relative;">
              <div class="player-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div class="player-card-name">${p.name}</div>
                  <button class="ios-button-text ios-button-destructive" data-action="delete" data-id="${p.id}" style="font-size:13px;">削除</button>
                </div>
                <div class="player-card-stats">対局数: ${p.totalGames}半荘 | 累計スコア: ${p.totalScore.toFixed(1)}</div>
                <div class="player-card-detail">平均順位: ${p.averageRank.toFixed(2)} | 連対率 (Top-2): ${(p.top2Rate * 100).toFixed(1)}%</div>
                <div class="player-card-detail">ラス回避率: ${(p.lastPlaceAvoidanceRate * 100).toFixed(1)}%</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div id="add-player-modal" class="ios-modal-overlay" style="display:none;">
      <div class="ios-modal">
        <div class="ios-modal-title">新規プレイヤー追加</div>
        <input class="ios-modal-input" id="new-player-name" type="text" placeholder="名前" />
        <div class="ios-modal-actions">
          <button data-action="modal-cancel">キャンセル</button>
          <button data-action="modal-add" class="primary">追加</button>
        </div>
      </div>
    </div>
  `;
}

export function bindPlayersListViewEvents(el) {
  const modal = el.querySelector('#add-player-modal');
  const nameInput = el.querySelector('#new-player-name');

  el.querySelector('[data-action="back"]')?.addEventListener('click', () => router.back());

  el.querySelector('[data-action="addPlayer"]')?.addEventListener('click', () => {
    modal.style.display = 'flex';
    setTimeout(() => nameInput.focus(), 100);
  });

  el.querySelector('[data-action="modal-cancel"]')?.addEventListener('click', () => {
    modal.style.display = 'none';
    nameInput.value = '';
  });

  el.querySelector('[data-action="modal-add"]')?.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) {
      store.addPlayer(name);
      nameInput.value = '';
      modal.style.display = 'none';
      router.navigate('players', {}, true); // refresh
    }
  });

  // Enter key in input
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      el.querySelector('[data-action="modal-add"]').click();
    }
  });

  el.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('このプレイヤーを削除しますか？')) {
        store.deletePlayer(id);
        router.navigate('players', {}, true);
      }
    });
  });
}
