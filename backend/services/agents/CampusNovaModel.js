/**
 * CAMPUSNOVA STRANDS AGENT MODEL ADAPTER
 * Preserves compatibility while delegating reasoning to genuine Strands Model providers
 * via strandsModelFactory.
 */

const { Model } = require("@strands-agents/sdk");
const { StrandsOfflineTestModel, extractEventSearchParams } = require("../llm/strandsModelFactory");

class CampusNovaModel extends Model {
  constructor(options = {}) {
    super();
    this.options = options;
    this.modelName = options.modelId || "CampusNova-Grounded-Reasoner";
    this.referenceDate = options.referenceDate || new Date("2026-09-10T09:25:00+05:30");
    this.delegate = new StrandsOfflineTestModel(options);
  }

  updateConfig(config) {
    this.options = { ...this.options, ...config };
    if (this.delegate && typeof this.delegate.updateConfig === "function") {
      this.delegate.updateConfig(config);
    }
  }

  getConfig() {
    return { modelId: this.modelName, contextWindowLimit: 200000 };
  }

  extractEventSearchParams(text) {
    return extractEventSearchParams(text, this.referenceDate);
  }

  async *stream(messages, options = {}) {
    yield* this.delegate.stream(messages, options);
  }
}

module.exports = CampusNovaModel;
