# Simple Backuper

An interactive CLI tool for creating compressed backups with encryption support.

## 🚀 Features

- ✅ Interactive and intuitive CLI interface
- 📦 ZIP compression with configurable compression levels (0-9)
- 🔐 Password encryption support (zip20 or aes256)
- 🎯 Multiple backup configuration management
- ⚡ Progress animation during backup
- 🔗 Automatically ignores symbolic links
- ⚠️ Robust error handling for inaccessible files
- 💾 Persistent JSON configurations

## 📋 Prerequisites

### For Binary Users
- No prerequisites needed! Just download and run.

### For Developers
- Node.js 18+ or higher
- Yarn 4.11.0 or higher

## 🛠️ Installation

### Option 1: Download Pre-built Binary (Recommended)

1. Go to the [Releases page](https://github.com/NedcloarBR/simple-backuper/releases/latest)
2. Download the binary for your platform:
   - Windows: `simple-backuper-win.exe`
   - Linux: `simple-backuper-linux`
   - macOS: `simple-backuper-macos`
3. Make it executable (Linux/macOS only):
   ```bash
   chmod +x simple-backuper-linux
   ```
4. Run it:
   ```bash
   # Windows
   simple-backuper-win.exe
   
   # Linux/macOS
   ./simple-backuper-linux
   ```

### Option 2: Install from Source

```bash
# Clone the repository
git clone https://github.com/NedcloarBR/simple-backuper
cd simple-backuper

# Install dependencies
yarn install

# Run in development mode
yarn dev
```

### Option 3: Build Your Own Binary

```bash
# Install dependencies
yarn install

# Build binaries for all platforms
yarn release

# Or build for specific platform
yarn pkg:win    # Windows
yarn pkg:linux  # Linux
yarn pkg:macos  # macOS
```

See [BUILD_RELEASE.md](BUILD_RELEASE.md) for detailed build instructions.

## 🎮 Usage

### Development Mode

```bash
yarn dev
```

### Main Menu

When you start, you'll see the main menu with the following options:

1. **Start Backup** - Execute backup from existing configurations
2. **View Configurations** - View all saved configurations
3. **Add Configuration** - Add new backup configuration
4. **Edit Configuration** - Edit existing configuration
5. **Remove Configuration** - Remove configuration
6. **Exit** - Exit the program

### Create New Configuration

When adding a new configuration, you'll be prompted for:

- **Backup name**: Unique identifier for the backup
- **Output directory**: Where the ZIP file will be saved (leave empty for temp directory)
- **Paths to backup**: Comma-separated list of files/directories
- **Password** (optional): To encrypt the backup
  - **Encryption method**:
    - `zip20`: Compatible with Windows Explorer (recommended)
    - `aes256`: More secure, requires 7-Zip/WinZip
  - **Compression level**: 0 (no compression) to 9 (maximum compression)

### Configuration Example

```json
[
  {
    "zipName": "important-documents",
    "outputDir": "D:\\Backups",
    "paths": [
      "C:\\Users\\user\\Documents",
      "C:\\Users\\user\\Pictures"
    ],
    "zipOptions": {
      "password": "secure-password",
      "encryptionMethod": "zip20",
      "compressLevel": 9
    }
  }
]
```

## 🔧 Configuration

Configurations are saved in `config.json` at the project root.

### Configuration Structure

```typescript
interface Config {
  zipName: string;           // ZIP file name
  outputDir?: string;        // Output directory (optional)
  paths: string[];          // Paths to include in backup
  zipOptions?: {
    compressLevel?: number;       // 0-9 (default: 9)
    password?: string;           // Encryption password
    encryptionMethod?: 'aes256' | 'zip20'; // Method (default: zip20)
  };
}
```

## ⌨️ Keyboard Shortcuts

- **Ctrl+C**: Exit the program gracefully
- **Enter**: After any action, press Enter to return to menu
- **Arrows**: Navigate through options
- **Space**: Select/deselect in multiple selection lists

## 🐛 Error Handling

The program automatically handles:

- ✅ Inaccessible files/directories (permission denied)
- ✅ Symbolic links (are ignored)
- ✅ Empty directories
- ✅ Non-existent paths
- ✅ Read/write errors

## 📝 Logs

To see detailed logs (debug):

```bash
DEBUG=true yarn dev
```

On Windows PowerShell:
```powershell
$env:DEBUG="true"; yarn dev
```

## 🔐 Encryption Methods

### zip20 (ZipCrypto)
- ✅ Compatible with Windows Explorer
- ✅ Compatible with native Linux/Windows tools
- ⚠️ Less secure (can be cracked)
- 👍 **Recommended for compatibility**

### aes256 (AES-256)
- ✅ More secure
- ✅ Supported by 7-Zip and WinZip
- ❌ NOT supported by Windows Explorer
- ❌ NOT supported by native Linux unzip
- 👍 **Recommended for maximum security**

## 🚨 Common Issues

### "Windows cannot open the folder"
- You're using AES-256, which Windows Explorer doesn't support
- Solution: Use `zip20` or open with 7-Zip/WinZip

### Symbolic links cause problems
- The program now automatically ignores all symbolic links
- You'll see warnings in the log when symbolic links are found

### Program takes too long
- Large directories may take time
- The animation shows progress (file count)
- Counter updates every 50 files

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or pull requests.

## 📄 License

[MIT](LICENSE)

## 👨‍💻 Author

Developed with ❤️ to simplify backups
