// RuleSettings model - mirrors Swift RuleSettings @Model

export class RuleSettings {
  constructor() {
    this.id = crypto.randomUUID();
    this.targetScore = 30000; // 30000点返し
    this.baseScore = 25000;   // 25000点持ち
    this.umaFirst = 30;
    this.umaSecond = 10;
    this.isTobiEnabled = true; // 飛び賞の有無
    this.tobiBonus = 10;
    this.tobiPenalty = 10;
    this.chipRate = 2;
  }
}
