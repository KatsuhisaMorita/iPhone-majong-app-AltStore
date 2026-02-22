// GameRecord & PlayerGameScore - mirrors Swift models

export class PlayerGameScore {
  constructor(playerId, rawScore, seatOrder = null) {
    this.id = crypto.randomUUID();
    this.gameId = null;
    this.playerId = playerId;
    this.rawScore = rawScore;
    this.finalScore = 0.0;
    this.rank = 1;
    this.chipCount = 0;
    this.seatOrder = seatOrder;
  }
}

export class GameRecord {
  constructor(timestamp = new Date()) {
    this.id = crypto.randomUUID();
    this.timestamp = timestamp;
    this.dailySessionId = null;
    this.playerScores = []; // PlayerGameScore[]
  }
}
