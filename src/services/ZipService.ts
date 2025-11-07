import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import archiver, { ArchiverOptions } from "archiver";
import ZipEncrypted from "archiver-zip-encrypted";
import ora from "ora";

import { Config } from "../types";
import { logger } from "../utils/logger";

try {
  archiver.registerFormat("zip-encrypted", ZipEncrypted);
} catch {
  logger.debug("archiver: zip-encrypted format already registered or registration failed");
}

export class ZipService {
  public static async createZip(config: Config): Promise<void> {
    const spinner = ora(`Creating backup: ${config.zipName}`).start();
    
    const outputDir = path.resolve(config.outputDir || os.tmpdir());
    const outputFilePath = path.join(outputDir, `${config.zipName}.zip`);

    const format = config.zipOptions?.password ? "zip-encrypted" : "zip";

    const encryptionMethod = config.zipOptions?.encryptionMethod ?? "zip20";

    const options: ArchiverOptions = {
      zlib: { level: config.zipOptions?.compressLevel ?? 9 },
      ...(format === "zip-encrypted" ? {
        encryptionMethod,
        password: config.zipOptions?.password
      } : {})
    };

    const archive = archiver(format, options);

    fs.mkdirSync(outputDir, { recursive: true });
    const output = fs.createWriteStream(outputFilePath);

    return new Promise((resolve, reject) => {
      let finalized = false;

      output.on("close", () => {
        if (!finalized) {
          finalized = true;
          spinner.succeed(`Created zip: ${config.zipName} (${archive.pointer()} bytes)`);
          logger.info(`Saved to: ${outputFilePath}`);
          resolve();
        }
      });

      output.on("finish", () => {
        if (!finalized) {
          finalized = true;
          spinner.succeed(`Created zip: ${config.zipName} (${archive.pointer()} bytes)`);
          logger.info(`Saved to: ${outputFilePath}`);
          resolve();
        }
      });
      
      archive.on("error", (err) => {
        spinner.fail(`Failed to create backup: ${config.zipName}`);
        reject(err);
      });

      archive.on("warning", (err) => {
        spinner.text = `Warning during backup: ${err && (err as Error).message ? (err as Error).message : err}`;
      });

      archive.on("end", () => {
        spinner.text = `Writing archive to disk: ${config.zipName}`;
      });

      output.on("error", (err) => {
        spinner.fail(`Output stream error: ${config.zipName}`);
        reject(err);
      });

      archive.pipe(output);
      
      let fileCount = 0;
      
      function addRecursive(src: string, destBase: string) {
        let stats;
        try {
          const lstat = fs.lstatSync(src);
          
          if (lstat.isSymbolicLink()) {
            logger.debug(`Skipping symbolic link: ${src}`);
            return;
          }

          stats = fs.statSync(src);
        } catch {
          logger.warn(`Skipping inaccessible path: ${src}`);
          return;
        }

        if (stats.isDirectory()) {
          const dirName = path.basename(src);
          const destDir = destBase ? path.posix.join(destBase, dirName) : dirName;

          archive.append(Buffer.alloc(0), { name: `${destDir}/` });

          let items;
          try {
            items = fs.readdirSync(src);
          } catch {
            logger.warn(`Cannot read directory: ${src}`);
            return;
          }

          if (items.length === 0) {
            logger.debug(`Empty directory: ${src}`);
          }

          for (const item of items) {
            addRecursive(path.join(src, item), destDir);
          }
          return;
        }

        if (stats.isFile()) {
          const destName = destBase ? path.posix.join(destBase, path.basename(src)) : path.basename(src);
          try {
            archive.file(src, { name: destName });
            fileCount++;
            if (fileCount % 50 === 0) {
              spinner.text = `Creating backup: ${config.zipName} (${fileCount} files)`;
            }
          } catch {
            logger.warn(`Cannot add file: ${src}`);
          }
        }
      }

      for (const p of config.paths) {
        const fullPath = path.resolve(p);
        
        let stats;
        let lstat;
        try {
          lstat = fs.lstatSync(fullPath);
          
          if (lstat.isSymbolicLink()) {
            logger.warn(`Skipping symbolic link: ${fullPath}`);
            continue;
          }

          stats = fs.statSync(fullPath);
        } catch {
          logger.error(`Path does not exist or is inaccessible: ${fullPath}`);
          continue;
        }

        if (stats.isDirectory()) {
          addRecursive(fullPath, "");
        } else if (stats.isFile()) {
          archive.file(fullPath, { name: path.basename(fullPath) });
          fileCount++;
        }
      }
      
      spinner.text = `Finalizing backup: ${config.zipName} (${fileCount} files)`;
      archive.finalize();
    });
  }
}
