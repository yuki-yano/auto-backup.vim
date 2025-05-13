# auto-backup.vim

This is a Vim/Neovim plugin that automatically backs up files.
It detects file changes during editing and creates backups in the specified directory.
It also supports files within Git repositories, organizing backups for each repository.

**This plugin depends on [Denops.vim](https://github.com/vim-denops/denops.vim). Please ensure it is installed.**

## Features

* **Automatic Backup**: Detects file changes and backs them up automatically.
* **Git Integration**: Generates backup paths based on the Git repository root and manages backups per repository.
* **Customizable Backup Root**: You can specify the root directory for backups using the `g:auto_backup_root_dir` variable.
* **Timestamped Backups**: Manages backup files (their parent directories) with timestamps in `YYYY-MM-DD_HH:mm` format.
* **Home Directory Only**: For safety, only files under the home directory are targeted for backup.

## Installation

Install with your preferred plugin manager. **Requires [Denops.vim](https://github.com/vim-denops/denops.vim).**

Example using [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  "yuki-yano/auto-backup.vim",
  dependencies = { "vim-denops/denops.vim" },
  config = function()
    vim.g.auto_backup_root_dir = vim.fn.expand("~/.cache/auto-backup.vim")
  end,
}
```

## Configuration

Please specify the root directory to save backup files (required).
The plugin will not function correctly without this setting.

```vim
" Example: Create backups under ~/.cache/auto-backup.vim/
let g:auto_backup_root_dir = expand('~/.cache/auto-backup.vim')
```
If using `lazy.nvim`, you can configure this within the `config` function as shown in the installation example.

The plugin reads this setting on startup.

## Usage Example

You can create a custom command to open the backup directory for the current file
in your preferred file explorer. Here's an example using Lua with Neovim's API
and the [Fern](https://github.com/lambdalisue/vim-fern) file explorer:

```lua
vim.api.nvim_create_user_command('AutoBackupOpen', function()
  -- Get the backup directory path for the current file
  local backup_dir = vim.fn.call('denops#request', {'auto-backup', 'getBackupDir', {vim.fn.expand('%:p')}})
  if backup_dir and backup_dir ~= '' then
    -- Open the directory with Fern in a drawer
    -- Use vim.fn.fnameescape() to correctly escape special characters in the path
    vim.cmd('Fern ' .. vim.fn.fnameescape(backup_dir) .. ' -drawer')
  else
    print("No backup directory found for the current file or an error occurred.")
  end
end, {})
```

You can adapt this example to use your favorite file explorer or to add more complex logic.

## Commands

Backups are usually performed automatically, but commands are also available to manually trigger backups or check backup directories.

* **Backup the current file**

```vim
:call denops#request('auto-backup', 'backup', [expand('%:p')])
```

* **Get the backup directory path for the current file**

```vim
:echo denops#request('auto-backup', 'getBackupDir', [expand('%:p')])
```
This returns the parent directory path for the backup group to which the file
belongs. It does not include individual timestamped directory names.

## License

MIT

## Author

[yuki-yano](https://github.com/yuki-yano) 
