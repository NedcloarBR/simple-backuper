import "archiver";

// add typescript support for archiver-zip-encrypted
// https://github.com/artem-karpenko/archiver-zip-encrypted
declare module "archiver" {
  namespace archiver {
    type Format = "zip" | "tar" | "zip-encrypted";
  }

  interface ArchiverOptions {
    encryptionMethod: "aes256" | "zip20" | undefined;
    password: string | undefined;
  }

  function archiver(format: archiver.Format, options?: ArchiverOptions): archiver.Archiver;

  export = archiver;
}
