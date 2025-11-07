declare module "archiver-zip-encrypted" {
  import { Archiver } from "archiver";

  // archiver-zip-encrypted exports a format constructor function
  // that can be registered with archiver.registerFormat()
  interface ZipEncryptedFormat {
    new (options?: any): any;
  }

  const ZipEncrypted: ZipEncryptedFormat;
  export default ZipEncrypted;
}
