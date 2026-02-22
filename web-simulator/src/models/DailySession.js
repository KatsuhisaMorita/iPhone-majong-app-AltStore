// DailySession model - mirrors Swift DailySession @Model

export class DailySession {
  constructor(date = new Date(), playerIds = []) {
    this.id = crypto.randomUUID();
    this.date = date instanceof Date ? date.toISOString() : date;
    this.gameIds = []; // string[] of GameRecord IDs
    this.playerIds = playerIds; // string[] of Player IDs
    this.chipResults = {}; // { [playerId: string]: number }
  }
}
