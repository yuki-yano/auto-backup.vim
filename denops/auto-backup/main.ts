import { assert, fn, fs, is, path, Semaphore, vars } from "./deps.ts"
import type { Denops } from "./deps.ts"

import { dayjsJST } from "./dayjs.ts"

let backupRootDir: string
const semaphore = new Semaphore(1)

type FileContent = {
  status: "backed-up" | "not-backed-up"
  content: string
}

const files = new Map<string, FileContent>()
let gitRoot: string | null = null

const getGitRoot = (filePath: string): string | null => {
  const command = new Deno.Command("git", {
    args: ["rev-parse", "--show-toplevel"],
    cwd: filePath,
  })
  const result = command.outputSync()
  return result.success ? new TextDecoder().decode(result.stdout).trim() : null
}

const createBackupPath = (relativePath: string, date: string): string => {
  const baseDir = gitRoot
    ? path.join(backupRootDir, gitRoot.replace(/\//g, "_"))
    : path.join(backupRootDir, path.dirname(relativePath).replace(/\//g, "_"))

  return path.join(baseDir, relativePath, date)
}

const performBackup = async (filePath: string, buffer: string): Promise<void> => {
  const backupPath = createBackupPath(filePath, dayjsJST().format("YYYY-MM-DD_HH:mm"))
  const backupDir = path.dirname(backupPath)

  try {
    fs.ensureDirSync(backupDir)
    await Deno.writeTextFile(backupPath, buffer)
  } catch (error) {
    console.error(`Failed to perform backup: ${error}`)
    throw error
  }
}

const findLastBackup = async (relativePath: string): Promise<string | undefined> => {
  const backupDir = createBackupPath(relativePath, "")

  if (!fs.existsSync(backupDir)) return undefined

  const entries = Deno.readDir(backupDir)
  const backupFiles = []

  for await (const entry of entries) {
    if (!entry.isFile) continue

    const fullPath = path.join(backupDir, entry.name)
    const stat = await Deno.stat(fullPath)
    backupFiles.push({ path: fullPath, mtime: stat.mtime })
  }

  return backupFiles
    .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0))[0]?.path
}

const initLastBackup = async (relativePath: string): Promise<void> => {
  const lastBackupPath = await findLastBackup(relativePath)

  if (!lastBackupPath) {
    files.set(relativePath, { status: "not-backed-up", content: "" })
    return
  }

  try {
    const content = await Deno.readTextFile(lastBackupPath)
    files.set(relativePath, { status: "backed-up", content })
  } catch (error) {
    console.error(`Failed to read the last backup file: ${error}`)
    files.set(relativePath, { status: "not-backed-up", content: "" })
  }
}

const handleBackup = async (denops: Denops, filePath: string, cwd: string): Promise<void> => {
  if (!fs.existsSync(filePath)) return
  if (!containsHomeDir(filePath)) return
  if (gitRoot && !filePath.startsWith(gitRoot)) return
  if (await fn.getbufvar(denops, "%", "&modifiable") === 0) return

  const relativePath = gitRoot ? path.relative(gitRoot, filePath) : path.relative(cwd, filePath)

  await semaphore.lock(async () => {
    if (!files.has(relativePath)) {
      await initLastBackup(relativePath)
    }

    const fileContent = files.get(relativePath)
    if (!fileContent) return

    try {
      const buffer = await getBuffer(denops)
      if (fileContent.status === "not-backed-up" || fileContent.content !== buffer) {
        await performBackup(relativePath, buffer)
        files.set(relativePath, {
          status: "backed-up",
          content: buffer,
        })
      }
    } catch (error) {
      console.error(`Failed to read the file: ${error}`)
    }
  })
}

const getBuffer = async (denops: Denops): Promise<string> => {
  const buffer = (await fn.getline(denops, 1, "$")).join("\n")
  return buffer
}

const containsHomeDir = (targetPath: string): boolean => {
  const homeDir = Deno.env.get("HOME")
  if (!homeDir) return false

  const normalizedPath = path.normalize(targetPath)
  const normalizedHome = path.normalize(homeDir)

  return normalizedPath.startsWith(normalizedHome)
}

export const main = async (denops: Denops): Promise<void> => {
  backupRootDir = await vars.globals.get(denops, "auto_backup_root_dir")

  fs.ensureDir(backupRootDir)
  const cwd = await denops.call("getcwd")
  assert(cwd, is.String)
  gitRoot = getGitRoot(cwd)

  denops.dispatcher = {
    async backup(filePath: unknown): Promise<void> {
      assert(filePath, is.String)
      await handleBackup(denops, filePath, cwd)
    },
    async getBackupDir(filePath: unknown): Promise<string> {
      assert(filePath, is.String)
      const relativePath = gitRoot ? path.relative(gitRoot, filePath) : path.relative(cwd, filePath)
      return await Promise.resolve(createBackupPath(relativePath, ""))
    },
  }
}
