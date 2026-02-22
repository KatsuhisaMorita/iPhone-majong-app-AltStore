// DataStore - localStorage-based persistence (mirrors SwiftData)
import { Player } from '../models/Player.js';
import { GameRecord, PlayerGameScore } from '../models/GameRecord.js';
import { DailySession } from '../models/DailySession.js';
import { RuleSettings } from '../models/RuleSettings.js';

const STORAGE_KEYS = {
  PLAYERS: 'mahjong_players',
  SESSIONS: 'mahjong_sessions',
  GAMES: 'mahjong_games',
  SETTINGS: 'mahjong_settings'
};

class DataStore {
  constructor() {
    this._listeners = new Set();
  }

  // ===== Event System =====
  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _notify() {
    this._listeners.forEach(fn => fn());
  }

  // ===== Players =====
  getPlayers() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS) || '[]');
    return data.map(d => Object.assign(new Player(''), d));
  }

  getPlayer(id) {
    return this.getPlayers().find(p => p.id === id) || null;
  }

  addPlayer(name) {
    const players = this.getPlayers();
    const player = new Player(name);
    players.push(player);
    this._savePlayers(players);
    return player;
  }

  updatePlayer(player) {
    const players = this.getPlayers();
    const idx = players.findIndex(p => p.id === player.id);
    if (idx >= 0) {
      players[idx] = player;
      this._savePlayers(players);
    }
  }

  deletePlayer(id) {
    const players = this.getPlayers().filter(p => p.id !== id);
    this._savePlayers(players);
  }

  _savePlayers(players) {
    // Strip getter-only computed props before serializing
    const serializable = players.map(p => ({
      id: p.id,
      name: p.name,
      totalGames: p.totalGames,
      totalScore: p.totalScore,
      firstPlaceCount: p.firstPlaceCount,
      secondPlaceCount: p.secondPlaceCount,
      thirdPlaceCount: p.thirdPlaceCount,
      fourthPlaceCount: p.fourthPlaceCount
    }));
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(serializable));
    this._notify();
  }

  // ===== Sessions =====
  getSessions() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    return data.map(d => Object.assign(new DailySession(), d));
  }

  getSession(id) {
    return this.getSessions().find(s => s.id === id) || null;
  }

  addSession(playerIds) {
    const sessions = this.getSessions();
    const session = new DailySession(new Date(), playerIds);
    sessions.push(session);
    this._saveSessions(sessions);
    return session;
  }

  updateSession(session) {
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
      this._saveSessions(sessions);
    }
  }

  _saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    this._notify();
  }

  // ===== Games =====
  getGames() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES) || '[]');
    return data.map(d => {
      const g = Object.assign(new GameRecord(), d);
      g.playerScores = (d.playerScores || []).map(ps => Object.assign(new PlayerGameScore('', 0), ps));
      return g;
    });
  }

  getGamesForSession(sessionId) {
    return this.getGames().filter(g => g.dailySessionId === sessionId);
  }

  addGame(game) {
    const games = this.getGames();
    games.push(game);
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));

    // Also update the session's gameIds
    const session = this.getSession(game.dailySessionId);
    if (session) {
      session.gameIds.push(game.id);
      this.updateSession(session);
    }
    this._notify();
    return game;
  }

  // ===== Settings =====
  getSettings() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || 'null');
    if (data) {
      return Object.assign(new RuleSettings(), data);
    }
    const defaults = new RuleSettings();
    this.saveSettings(defaults);
    return defaults;
  }

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this._notify();
  }

  // ===== Helpers =====
  isToday(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  }

  getTodaySession() {
    return this.getSessions().find(s => this.isToday(s.date)) || null;
  }
}

// Singleton
export const store = new DataStore();
