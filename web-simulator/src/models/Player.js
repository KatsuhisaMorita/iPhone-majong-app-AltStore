// Player model - mirrors Swift Player @Model
export class Player {
  constructor(name) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.totalGames = 0;
    this.totalScore = 0.0;
    this.firstPlaceCount = 0;
    this.secondPlaceCount = 0;
    this.thirdPlaceCount = 0;
    this.fourthPlaceCount = 0;
  }

  get averageRank() {
    if (this.totalGames === 0) return 0.0;
    const sum = (this.firstPlaceCount * 1) + (this.secondPlaceCount * 2) +
                (this.thirdPlaceCount * 3) + (this.fourthPlaceCount * 4);
    return sum / this.totalGames;
  }

  get top2Rate() {
    if (this.totalGames === 0) return 0.0;
    return (this.firstPlaceCount + this.secondPlaceCount) / this.totalGames;
  }

  get lastPlaceAvoidanceRate() {
    if (this.totalGames === 0) return 0.0;
    return (this.totalGames - this.fourthPlaceCount) / this.totalGames;
  }
}
