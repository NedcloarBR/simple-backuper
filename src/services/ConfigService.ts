import path from "node:path";
import fs from "node:fs";
import { Config } from "../types";
import { logger } from "../utils/logger";

export class ConfigService {
  private static readonly configDir = path.join(process.cwd());
  private static readonly configPath = path.join(this.configDir, "config.json");

  public static getConfig(): Config[] {
    try {
      if (!fs.existsSync(this.configPath)) {
        return [];
      }
      return JSON.parse(fs.readFileSync(this.configPath, "utf-8")) as Config[];
    } catch (error) {
      logger.error("Failed to read config file:", error);
      return [];
    }
  }

  public static saveConfig(configs: Config[]): boolean {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2), "utf-8");
      logger.success("Configuration saved successfully");
      return true;
    } catch (error) {
      logger.error("Failed to save config file:", error);
      return false;
    }
  }

  public static addConfig(config: Config): boolean {
    const configs = this.getConfig();
    configs.push(config);
    return this.saveConfig(configs);
  }

  public static updateConfig(index: number, config: Config): boolean {
    const configs = this.getConfig();
    if (index < 0 || index >= configs.length) {
      logger.error("Invalid config index");
      return false;
    }
    configs[index] = config;
    return this.saveConfig(configs);
  }

  public static removeConfig(index: number): boolean {
    const configs = this.getConfig();
    if (index < 0 || index >= configs.length) {
      logger.error("Invalid config index");
      return false;
    }
    configs.splice(index, 1);
    return this.saveConfig(configs);
  }
}
