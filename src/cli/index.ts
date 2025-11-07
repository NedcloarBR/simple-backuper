import prompts from "prompts";
import { ConfigService } from "../services/ConfigService";
import { ZipService } from "../services/ZipService";
import { Config } from "../types";
import { logger } from "../utils/logger";

export class CLI {
  private static clearScreen(): void {
    console.clear();
  }

  public static async start(): Promise<void> {
    this.clearScreen();
    logger.section("Simple Backuper CLI");

    prompts.override({ cancel: true });

    while (true) {
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Start Backup", value: "backup" },
          { title: "View Configurations", value: "view" },
          { title: "Add Configuration", value: "add" },
          { title: "Edit Configuration", value: "edit" },
          { title: "Remove Configuration", value: "remove" },
          { title: "Exit", value: "exit" }
        ]
      });

      if (!action || action === "exit") {
        this.clearScreen();
        logger.info("Goodbye!");
        break;
      }

      this.clearScreen();

      switch (action) {
        case "backup":
          await this.runBackup();
          break;
        case "view":
          await this.viewConfigs();
          break;
        case "add":
          await this.addConfig();
          break;
        case "edit":
          await this.editConfig();
          break;
        case "remove":
          await this.removeConfig();
          break;
      }

      logger.divider();
      
      await prompts({
        type: "text",
        name: "continue",
        message: "Press Enter to continue..."
      });

      this.clearScreen();
    }
  }

  private static async runBackup(): Promise<void> {
    logger.section("Start Backup");
    
    const configs = ConfigService.getConfig();
    
    if (configs.length === 0) {
      logger.warn("No configurations found. Please add a configuration first.");
      return;
    }

    const { selectedConfigs } = await prompts({
      type: "multiselect",
      name: "selectedConfigs",
      message: "Select configurations to backup:",
      choices: configs.map((config, index) => ({
        title: `${config.zipName} (${config.paths.length} path${config.paths.length > 1 ? "s" : ""})`,
        value: index,
        selected: true
      })),
      hint: "Space to select, Enter to confirm"
    });

    if (!selectedConfigs || selectedConfigs.length === 0) {
      logger.warn("No configurations selected.");
      return;
    }

    logger.section("Running Backup");
    
    for (const index of selectedConfigs) {
      try {
        logger.info(`Backing up: ${configs[index].zipName}`);
        await ZipService.createZip(configs[index]);
      } catch (error) {
        logger.error(`Failed to backup ${configs[index].zipName}:`, error);
      }
    }

    logger.success("Backup completed!");
  }

  private static async viewConfigs(): Promise<void> {
    logger.section("View Configurations");
    
    const configs = ConfigService.getConfig();
    
    if (configs.length === 0) {
      logger.warn("No configurations found.");
      return;
    }

    logger.section("Current Configurations");
    logger.divider();
    
    for (const [index, config] of configs.entries()) {
      logger.info(`\n[${index + 1}] ${config.zipName}`);
      logger.step(`Output: ${config.outputDir || "temp directory"}`);
      logger.step(`Paths (${config.paths.length}):`);
      for (const p of config.paths) {
        logger.url(p);
      }
      if (config.zipOptions?.password) {
        logger.step(`Password: ${"*".repeat(config.zipOptions.password.length)}`);
        logger.step(`Encryption: ${config.zipOptions.encryptionMethod || "zip20"}`);
      }
      if (config.zipOptions?.compressLevel !== undefined) {
        logger.step(`Compression Level: ${config.zipOptions.compressLevel}`);
      }
    }
  }

  private static async addConfig(): Promise<void> {
    logger.section("Add New Configuration");

    const answers = await prompts([
      {
        type: "text",
        name: "zipName",
        message: "Backup name:",
        validate: (value) => value.length > 0 || "Name is required"
      },
      {
        type: "text",
        name: "outputDir",
        message: "Output directory (leave empty for temp):",
        initial: ""
      },
      {
        type: "list",
        name: "paths",
        message: "Paths to backup (comma-separated):",
        separator: ",",
        validate: (value) => value.length > 0 || "At least one path is required"
      },
      {
        type: "confirm",
        name: "usePassword",
        message: "Encrypt with password?",
        initial: false
      }
    ]);

    if (!answers.zipName || !answers.paths) {
      logger.error("Operation cancelled.");
      return;
    }

    let zipOptions: Config["zipOptions"];

    if (answers.usePassword) {
      const passwordAnswers = await prompts([
        {
          type: "password",
          name: "password",
          message: "Enter password:",
          validate: (value) => value.length > 0 || "Password is required"
        },
        {
          type: "select",
          name: "encryptionMethod",
          message: "Encryption method:",
          choices: [
            { title: "zip20 (Windows Explorer compatible)", value: "zip20" },
            { title: "aes256 (More secure, requires 7-Zip/WinZip)", value: "aes256" }
          ],
          initial: 0
        },
        {
          type: "number",
          name: "compressLevel",
          message: "Compression level (0-9):",
          initial: 9,
          min: 0,
          max: 9
        }
      ]);

      if (!passwordAnswers.password) {
        logger.error("Operation cancelled.");
        return;
      }

      zipOptions = {
        password: passwordAnswers.password,
        encryptionMethod: passwordAnswers.encryptionMethod,
        compressLevel: passwordAnswers.compressLevel
      };
    }

    const config: Config = {
      zipName: answers.zipName,
      outputDir: answers.outputDir || undefined,
      paths: answers.paths,
      zipOptions
    };

    if (ConfigService.addConfig(config)) {
      logger.success(`Configuration "${config.zipName}" added successfully!`);
    }
  }

  private static async editConfig(): Promise<void> {
    logger.section("Edit Configuration");
    
    const configs = ConfigService.getConfig();
    
    if (configs.length === 0) {
      logger.warn("No configurations found.");
      return;
    }

    const { configIndex } = await prompts({
      type: "select",
      name: "configIndex",
      message: "Select configuration to edit:",
      choices: configs.map((config, index) => ({
        title: `${config.zipName} (${config.paths.length} path${config.paths.length > 1 ? "s" : ""})`,
        value: index
      }))
    });

    if (configIndex === undefined) {
      logger.error("Operation cancelled.");
      return;
    }

    const currentConfig = configs[configIndex];
    
    this.clearScreen();
    logger.section(`Editing: ${currentConfig.zipName}`);

    const answers = await prompts([
      {
        type: "text",
        name: "zipName",
        message: "Backup name:",
        initial: currentConfig.zipName,
        validate: (value) => value.length > 0 || "Name is required"
      },
      {
        type: "text",
        name: "outputDir",
        message: "Output directory (leave empty for temp):",
        initial: currentConfig.outputDir || ""
      },
      {
        type: "list",
        name: "paths",
        message: "Paths to backup (comma-separated):",
        initial: currentConfig.paths.join(","),
        separator: ",",
        validate: (value) => value.length > 0 || "At least one path is required"
      },
      {
        type: "confirm",
        name: "usePassword",
        message: "Encrypt with password?",
        initial: !!currentConfig.zipOptions?.password
      }
    ]);

    if (!answers.zipName || !answers.paths) {
      logger.error("Operation cancelled.");
      return;
    }

    let zipOptions: Config["zipOptions"];

    if (answers.usePassword) {
      const passwordAnswers = await prompts([
        {
          type: "password",
          name: "password",
          message: "Enter password:",
          initial: currentConfig.zipOptions?.password || "",
          validate: (value) => value.length > 0 || "Password is required"
        },
        {
          type: "select",
          name: "encryptionMethod",
          message: "Encryption method:",
          choices: [
            { title: "zip20 (Windows Explorer compatible)", value: "zip20" },
            { title: "aes256 (More secure, requires 7-Zip/WinZip)", value: "aes256" }
          ],
          initial: currentConfig.zipOptions?.encryptionMethod === "aes256" ? 1 : 0
        },
        {
          type: "number",
          name: "compressLevel",
          message: "Compression level (0-9):",
          initial: currentConfig.zipOptions?.compressLevel ?? 9,
          min: 0,
          max: 9
        }
      ]);

      if (!passwordAnswers.password) {
        logger.error("Operation cancelled.");
        return;
      }

      zipOptions = {
        password: passwordAnswers.password,
        encryptionMethod: passwordAnswers.encryptionMethod,
        compressLevel: passwordAnswers.compressLevel
      };
    }

    const config: Config = {
      zipName: answers.zipName,
      outputDir: answers.outputDir || undefined,
      paths: answers.paths,
      zipOptions
    };

    if (ConfigService.updateConfig(configIndex, config)) {
      logger.success(`Configuration "${config.zipName}" updated successfully!`);
    }
  }

  private static async removeConfig(): Promise<void> {
    logger.section("Remove Configuration");
    
    const configs = ConfigService.getConfig();
    
    if (configs.length === 0) {
      logger.warn("No configurations found.");
      return;
    }

    const { configIndex } = await prompts({
      type: "select",
      name: "configIndex",
      message: "Select configuration to remove:",
      choices: configs.map((config, index) => ({
        title: `${config.zipName} (${config.paths.length} path${config.paths.length > 1 ? "s" : ""})`,
        value: index
      }))
    });

    if (configIndex === undefined) {
      logger.error("Operation cancelled.");
      return;
    }

    const configToRemove = configs[configIndex];

    const { confirm } = await prompts({
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to remove "${configToRemove.zipName}"?`,
      initial: false
    });

    if (!confirm) {
      logger.info("Operation cancelled.");
      return;
    }

    if (ConfigService.removeConfig(configIndex)) {
      logger.success(`Configuration "${configToRemove.zipName}" removed successfully!`);
    }
  }
}
