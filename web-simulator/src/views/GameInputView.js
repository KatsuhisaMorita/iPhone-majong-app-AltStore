// GameInputView - Score entry
// Redesigned: clean, compact layout inspired by 麻雀スコア app
import { store } from '../store/DataStore.js';
import { calculate } from '../logic/ScoreCalculator.js';
import { GameRecord, PlayerGameScore } from '../models/GameRecord.js';
import { router } from '../main.js';

export function renderGameInputView(params) {
  const session = store.getSession(params.sessionId);
  if (!session) return '<div class="empty-state"><div class="empty-state-text">セッションが見つかりません</div></div>';

  const players = session.playerIds.map(id => store.getPlayer(id)).filter(Boolean);
  const settings = store.getSettings();

  return `
    <div class="nav-bar nav-bar-inline">
      <button class="nav-back" data-action="back">戻る</button>
      <span class="nav-title-small">半荘入力</span>
      <span style="width:40px"></span>
    </div>
    <div class="ios-list">
      <div class="ios-section">
        <div class="ios-section-header">持ち点入力（3人入力で4人目は自動計算）</div>
        <div class="ios-section-content">
          ${players.map((p, i) => `
            <div class="ios-row">
              <span class="ios-row-label">${p.name}</span>
              <input class="ios-input score-input" type="number" inputmode="numeric"
                     placeholder="例: 25000" data-index="${i}" data-player="${p.id}" />
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Seat order for tie-breaking (hidden by default) -->
      <div id="tiebreaker-section" style="display:none;">
        <div class="ios-section">
          <div class="ios-section-header">同点時の席順</div>
          <div class="ios-section-content">
            ${players.map((p, i) => `
              <div class="ios-row">
                <span class="ios-row-label">${p.name}</span>
                <select class="ios-select seat-select" data-index="${i}">
                  <option value="1">東 (起家)</option>
                  <option value="2">南</option>
                  <option value="3">西</option>
                  <option value="4">北</option>
                </select>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Tobi confirmation (hidden until negative scores detected) -->
      <div id="tobi-section" style="display:none;">
        <div class="ios-section">
          <div class="ios-section-header">飛び賞</div>
          <div class="ios-section-content">
            <div id="tobi-minus-players"></div>
            <div class="ios-row">
              <span class="ios-row-label">飛び賞を適用</span>
              <button class="ios-toggle" id="tobi-apply-toggle"></button>
            </div>
          </div>
        </div>
        <div id="tobi-winner-section" style="display:none;">
          <div class="ios-section">
            <div class="ios-section-header">飛び賞の獲得者</div>
            <div class="ios-section-content">
              <div class="ios-row">
                <span class="ios-row-label">獲得者</span>
                <select class="ios-select" id="tobi-winner-select">
                  ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="game-error" class="ios-error" style="display:none; text-align:center; padding:8px 16px;"></div>

      <div style="padding: 0 16px 24px;">
        <button class="ios-button-primary" id="btn-save-game" disabled>保存</button>
      </div>
    </div>
  `;
}

export function bindGameInputViewEvents(el, params) {
  const session = store.getSession(params.sessionId);
  const players = session.playerIds.map(id => store.getPlayer(id)).filter(Boolean);
  const settings = store.getSettings();
  const inputs = el.querySelectorAll('.score-input');
  const seatSelects = el.querySelectorAll('.seat-select');
  const tiebreakerSection = el.querySelector('#tiebreaker-section');
  const btn = el.querySelector('#btn-save-game');
  const errorEl = el.querySelector('#game-error');

  // Tobi elements
  const tobiSection = el.querySelector('#tobi-section');
  const tobiToggle = el.querySelector('#tobi-apply-toggle');
  const tobiWinnerSection = el.querySelector('#tobi-winner-section');
  const tobiWinnerSelect = el.querySelector('#tobi-winner-select');
  const tobiMinusPlayers = el.querySelector('#tobi-minus-players');
  let tobiApply = false;

  seatSelects.forEach((s, i) => { s.value = String(i + 1); });

  function getScores() {
    return Array.from(inputs).map(inp => {
      const v = inp.value.trim();
      return v === '' ? null : parseInt(v, 10);
    });
  }

  function autoCalculate4th() {
    const scores = getScores();
    const validCount = scores.filter(s => s !== null && !isNaN(s)).length;
    const emptyIndices = scores.map((s, i) => s === null ? i : -1).filter(i => i >= 0);

    if (validCount === 3 && emptyIndices.length === 1) {
      const total = scores.filter(s => s !== null).reduce((a, b) => a + b, 0);
      const requiredTotal = settings.baseScore * 4;
      inputs[emptyIndices[0]].value = String(requiredTotal - total);
    }
  }

  function checkTieBreaker() {
    const scores = getScores();
    const validScores = scores.filter(s => s !== null && !isNaN(s));
    const needsTie = validScores.length === 4 && new Set(validScores).size < 4;
    tiebreakerSection.style.display = needsTie ? 'block' : 'none';
    return needsTie;
  }

  function checkTobi() {
    const scores = getScores();
    const allValid = scores.every(s => s !== null && !isNaN(s));

    if (!allValid || !settings.isTobiEnabled) {
      tobiSection.style.display = 'none';
      return;
    }

    const minusPlayers = [];
    scores.forEach((s, i) => {
      if (s < 0) minusPlayers.push({ player: players[i], score: s });
    });

    if (minusPlayers.length > 0) {
      tobiSection.style.display = 'block';
      tobiMinusPlayers.innerHTML = minusPlayers.map(mp => `
        <div class="ios-row">
          <span class="ios-row-label" style="color:var(--tint-red);">⚠ ${mp.player.name}</span>
          <span class="ios-row-detail score-negative">${mp.score.toLocaleString()}点</span>
        </div>
      `).join('');
    } else {
      tobiSection.style.display = 'none';
      tobiApply = false;
      tobiToggle.classList.remove('active');
      tobiWinnerSection.style.display = 'none';
    }
  }

  function validate() {
    const scores = getScores();
    btn.disabled = !scores.every(s => s !== null && !isNaN(s));
  }

  tobiToggle.addEventListener('click', () => {
    tobiApply = !tobiApply;
    tobiToggle.classList.toggle('active', tobiApply);
    tobiWinnerSection.style.display = tobiApply ? 'block' : 'none';
  });

  inputs.forEach(inp => {
    inp.addEventListener('focus', () => {
      if (inp.value.trim() === '') autoCalculate4th();
    });
    inp.addEventListener('input', () => {
      checkTieBreaker();
      checkTobi();
      validate();
    });
  });

  el.querySelector('[data-action="back"]')?.addEventListener('click', () => router.back());

  btn.addEventListener('click', () => {
    const scores = getScores();
    const total = scores.reduce((a, b) => a + b, 0);
    const requiredTotal = settings.baseScore * 4;

    if (total !== requiredTotal) {
      errorEl.textContent = `合計が${requiredTotal}点になりません（現在: ${total}点）`;
      errorEl.style.display = 'block';
      return;
    }

    const needsTie = checkTieBreaker();
    if (needsTie) {
      const seats = Array.from(seatSelects).map(s => parseInt(s.value));
      if (new Set(seats).size !== 4) {
        errorEl.textContent = '席順をそれぞれ異なる値にしてください';
        errorEl.style.display = 'block';
        return;
      }
    }

    errorEl.style.display = 'none';

    const scoreInputs = players.map((p, i) => ({
      playerId: p.id,
      rawScore: scores[i],
      chipCount: 0,
      tieBreakerRank: needsTie ? parseInt(seatSelects[i].value) : null
    }));

    let tobiOptions = null;
    if (settings.isTobiEnabled && scores.some(s => s < 0)) {
      const tobiPlayerIds = [];
      scores.forEach((s, i) => { if (s < 0) tobiPlayerIds.push(players[i].id); });
      tobiOptions = {
        applyTobi: tobiApply,
        tobiPlayerIds,
        tobiWinnerId: tobiApply ? tobiWinnerSelect.value : null
      };
    }

    try {
      const results = calculate(scoreInputs, settings, tobiOptions);
      const game = new GameRecord(new Date());
      game.dailySessionId = session.id;

      players.forEach((p, i) => {
        const result = results.find(r => r.playerId === p.id);
        const gameScore = new PlayerGameScore(p.id, scores[i], needsTie ? parseInt(seatSelects[i].value) : null);
        gameScore.finalScore = result.finalScore;
        gameScore.rank = result.rank;
        game.playerScores.push(gameScore);

        p.totalGames += 1;
        p.totalScore += result.finalScore;
        switch (result.rank) {
          case 1: p.firstPlaceCount += 1; break;
          case 2: p.secondPlaceCount += 1; break;
          case 3: p.thirdPlaceCount += 1; break;
          case 4: p.fourthPlaceCount += 1; break;
        }
        store.updatePlayer(p);
      });

      store.addGame(game);
      router.navigate('dailySession', { sessionId: session.id }, true);
    } catch (e) {
      errorEl.textContent = e.message;
      errorEl.style.display = 'block';
    }
  });
}
