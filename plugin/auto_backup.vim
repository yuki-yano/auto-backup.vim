autocmd BufWritePre,CursorHold * call auto_backup#backup(expand('%:p'))

if !exists('g:auto_backup_root_dir')
  let g:auto_backup_root_dir = expand('~/.cache/vim/backup')
endif
