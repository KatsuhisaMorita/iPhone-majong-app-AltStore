// Main entry point - SPA Router
import { renderContentView, bindContentViewEvents } from './views/ContentView.js';
import { renderSessionStartView, bindSessionStartViewEvents } from './views/SessionStartView.js';
import { renderDailySessionView, bindDailySessionViewEvents } from './views/DailySessionView.js';
import { renderGameInputView, bindGameInputViewEvents } from './views/GameInputView.js';
import { renderSessionChipInputView, bindSessionChipInputViewEvents } from './views/SessionChipInputView.js';
import { renderPlayersListView, bindPlayersListViewEvents } from './views/PlayersListView.js';
import { renderSettingsView, bindSettingsViewEvents } from './views/SettingsView.js';

class Router {
  constructor() {
    this._history = []; // stack of { route, params }
    this._app = document.getElementById('app');
  }

  navigate(route, params = {}, replace = false) {
    if (replace && this._history.length > 0) {
      this._history[this._history.length - 1] = { route, params };
    } else {
      this._history.push({ route, params });
    }
    this._render(route, params, replace ? 'none' : 'forward');
  }

  back() {
    if (this._history.length > 1) {
      this._history.pop();
      const { route, params } = this._history[this._history.length - 1];
      this._render(route, params, 'back');
    }
  }

  _render(route, params, direction) {
    let html = '';
    let bindFn = null;

    switch (route) {
      case 'home':
        html = renderContentView();
        bindFn = (el) => bindContentViewEvents(el);
        break;
      case 'sessionStart':
        html = renderSessionStartView();
        bindFn = (el) => bindSessionStartViewEvents(el);
        break;
      case 'dailySession':
        html = renderDailySessionView(params);
        bindFn = (el) => bindDailySessionViewEvents(el, params);
        break;
      case 'gameInput':
        html = renderGameInputView(params);
        bindFn = (el) => bindGameInputViewEvents(el, params);
        break;
      case 'chipInput':
        html = renderSessionChipInputView(params);
        bindFn = (el) => bindSessionChipInputViewEvents(el, params);
        break;
      case 'players':
        html = renderPlayersListView();
        bindFn = (el) => bindPlayersListViewEvents(el);
        break;
      case 'settings':
        html = renderSettingsView();
        bindFn = (el) => bindSettingsViewEvents(el);
        break;
      default:
        html = renderContentView();
        bindFn = (el) => bindContentViewEvents(el);
    }

    this._app.innerHTML = html;

    // Apply animation class
    if (direction === 'forward') {
      this._app.firstElementChild?.classList.add('view-enter');
    } else if (direction === 'back') {
      this._app.firstElementChild?.classList.add('view-back');
    }

    // Scroll to top
    this._app.scrollTop = 0;

    // Bind events
    if (bindFn) bindFn(this._app);
  }
}

// Export router singleton
export const router = new Router();

// Update status bar time
function updateClock() {
  const el = document.getElementById('status-time');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 30000);
  router.navigate('home');
});
