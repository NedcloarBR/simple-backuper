export interface Config {
  zipName: string;
  outputDir?: string;
  paths: string[];
  zipOptions?: {
    compressLevel?: number;
    password?: string;
    encryptionMethod?: 'aes256' | 'zip20';
  };
}
