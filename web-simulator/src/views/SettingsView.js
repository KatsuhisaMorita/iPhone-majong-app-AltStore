// SettingsView - Rule settings (mirrors Swift SettingsView)
import { store } from '../store/DataStore.js';
import { router } from '../main.js';

export function renderSettingsView() {
  const s = store.getSettings();

  return `
    <div class="nav-bar nav-bar-inline">
      <button class="nav-back" data-action="back">戻る</button>
      <span class="nav-title-small">ルール設定</span>
      <span style="width:40px"></span>
    </div>
    <div class="ios-list">
      <div class="ios-section">
        <div class="ios-section-header">ウマ設定</div>
        <div class="ios-section-content">
          <div class="ios-row">
            <span class="ios-row-label">1位: +<span id="uma1-val">${s.umaFirst}</span></span>
            <div class="ios-stepper">
              <button data-stepper="minus" data-field="umaFirst">−</button>
              <span class="stepper-divider"></span>
              <button data-stepper="plus" data-field="umaFirst">+</button>
            </div>
          </div>
          <div class="ios-row">
            <span class="ios-row-label">2位: +<span id="uma2-val">${s.umaSecond}</span></span>
            <div class="ios-stepper">
              <button data-stepper="minus" data-field="umaSecond">−</button>
              <span class="stepper-divider"></span>
              <button data-stepper="plus" data-field="umaSecond">+</button>
            </div>
          </div>
        </div>
        <div class="ios-footnote">※ 3位は -${s.umaSecond}、4位は -${s.umaFirst} となります。<br>ワンスリーの場合は 10-30 を、ワンツーの場合は 10-20 を設定してください。</div>
      </div>

      <div class="ios-section">
        <div class="ios-section-header">飛び賞 (箱下)</div>
        <div class="ios-section-content">
          <div class="ios-row">
            <span class="ios-row-label">飛び賞を有効にする</span>
            <button class="ios-toggle ${s.isTobiEnabled ? 'active' : ''}" id="tobi-toggle"></button>
          </div>
          <div id="tobi-details" style="${!s.isTobiEnabled ? 'display:none;' : ''}">
            <div class="ios-row">
              <span class="ios-row-label">飛ばした人のボーナス: +<span id="tobi-bonus-val">${s.tobiBonus}</span></span>
              <div class="ios-stepper">
                <button data-stepper="minus" data-field="tobiBonus">−</button>
                <span class="stepper-divider"></span>
                <button data-stepper="plus" data-field="tobiBonus">+</button>
              </div>
            </div>
            <div class="ios-row">
              <span class="ios-row-label">飛んだ人のペナルティ: -<span id="tobi-penalty-val">${s.tobiPenalty}</span></span>
              <div class="ios-stepper">
                <button data-stepper="minus" data-field="tobiPenalty">−</button>
                <span class="stepper-divider"></span>
                <button data-stepper="plus" data-field="tobiPenalty">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ios-section">
        <div class="ios-section-header">チップ</div>
        <div class="ios-section-content">
          <div class="ios-row">
            <span class="ios-row-label">1枚あたりのスコア: <span id="chip-val">${s.chipRate}</span></span>
            <div class="ios-stepper">
              <button data-stepper="minus" data-field="chipRate">−</button>
              <span class="stepper-divider"></span>
              <button data-stepper="plus" data-field="chipRate">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindSettingsViewEvents(el) {
  const settings = store.getSettings();

  const displayMap = {
    umaFirst: el.querySelector('#uma1-val'),
    umaSecond: el.querySelector('#uma2-val'),
    tobiBonus: el.querySelector('#tobi-bonus-val'),
    tobiPenalty: el.querySelector('#tobi-penalty-val'),
    chipRate: el.querySelector('#chip-val')
  };

  el.querySelectorAll('[data-stepper]').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const dir = btn.dataset.stepper === 'plus' ? 1 : -1;
      settings[field] = Math.max(0, settings[field] + dir);
      if (displayMap[field]) displayMap[field].textContent = settings[field];
      store.saveSettings(settings);
    });
  });

  const tobiToggle = el.querySelector('#tobi-toggle');
  const tobiDetails = el.querySelector('#tobi-details');
  tobiToggle?.addEventListener('click', () => {
    settings.isTobiEnabled = !settings.isTobiEnabled;
    tobiToggle.classList.toggle('active', settings.isTobiEnabled);
    tobiDetails.style.display = settings.isTobiEnabled ? '' : 'none';
    store.saveSettings(settings);
  });

  el.querySelector('[data-action="back"]')?.addEventListener('click', () => router.back());
}
