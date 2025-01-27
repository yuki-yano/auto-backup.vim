function! auto_backup#backup(filePath)
  if !denops#plugin#is_loaded('auto-backup')
    return
  endif
  call denops#notify("auto-backup", "backup", [a:filePath])
endfunction

function! auto_backup#get_backup_dir()
  let current_file = expand('%:p')
  return denops#request("auto-backup", "getBackupDir", [current_file])
endfunction
