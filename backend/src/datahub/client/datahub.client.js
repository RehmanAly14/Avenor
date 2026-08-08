/** Interface contract for a future DataHub client. */
export class DataHubClient {
  async listAssets() { throw new Error("DataHubClient is an interface; no integration is configured."); }
  async getAsset() { throw new Error("DataHubClient is an interface; no integration is configured."); }
}
