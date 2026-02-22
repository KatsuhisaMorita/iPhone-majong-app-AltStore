// ContentView - Home screen (redesigned: clean, data-focused)
import { store } from '../store/DataStore.js';
import { router } from '../main.js';

export function renderContentView() {
  const todaySession = store.getTodaySession();
  const allSessions = store.getSessions().sort((a, b) => new Date(b.date) - new Date(a.date));
  const pastSessions = allSessions.filter(s => !store.isToday(s.date));

  return `
    <div class="nav-bar">
      <div class="nav-title">MajongScoreMemo</div>
    </div>
    <div class="ios-list">
      <!-- Today's session -->
      <div class="ios-section">
        <div class="ios-section-header">本日の対局</div>
        <div class="ios-section-content">
          ${todaySession ? `
            <div class="ios-row ios-row-chevron" data-action="openSession" data-session="${todaySession.id}">
              <span class="ios-row-label">対局中 — ${todaySession.playerIds.length}人</span>
              <span class="ios-row-detail">${store.getGamesForSession(todaySession.id).length}半荘</span>
            </div>
          ` : `
            <div class="ios-row" data-action="startSession" style="cursor:pointer;">
              <span class="ios-row-label" style="color:var(--tint-blue); text-align:center; flex:1;">
                ＋ 新しい対局を開始
              </span>
            </div>
          `}
        </div>
      </div>

      <!-- Past sessions -->
      ${pastSessions.length > 0 ? `
        <div class="ios-section">
          <div class="ios-section-header">過去の対局</div>
          <div class="ios-section-content">
            ${pastSessions.slice(0, 20).map(s => {
              const dateStr = new Date(s.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
              const gameCount = store.getGamesForSession(s.id).length;
              const playerNames = s.playerIds.map(id => {
                const p = store.getPlayer(id);
                return p ? p.name : '?';
              }).join(', ');
              return `
                <div class="ios-row ios-row-chevron" data-action="openSession" data-session="${s.id}">
                  <span class="ios-row-label">
                    <div>${dateStr}</div>
                    <div style="font:var(--font-caption1); color:var(--text-tertiary); margin-top:2px;">${playerNames}</div>
                  </span>
                  <span class="ios-row-detail">${gameCount}半荘</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Quick links -->
      <div class="ios-section">
        <div class="ios-section-content">
          <div class="ios-row ios-row-chevron" data-action="players" style="cursor:pointer;">
            <span class="ios-row-label">プレイヤーと成績</span>
          </div>
          <div class="ios-row ios-row-chevron" data-action="settings" style="cursor:pointer;">
            <span class="ios-row-label">ルール設定</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindContentViewEvents(el) {
  el.querySelectorAll('[data-action="openSession"]').forEach(row => {
    row.addEventListener('click', () => {
      router.navigate('dailySession', { sessionId: row.dataset.session });
    });
  });

  el.querySelector('[data-action="startSession"]')?.addEventListener('click', () => {
    router.navigate('sessionStart');
  });

  el.querySelector('[data-action="players"]')?.addEventListener('click', () => {
    router.navigate('players');
  });

  el.querySelector('[data-action="settings"]')?.addEventListener('click', () => {
    router.navigate('settings');
  });
}
