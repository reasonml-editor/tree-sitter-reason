# tree-sitter-reason (experimental)


## Neovim Installation

```lua
-- Install grammar with nvim-treesitter
local list = require("nvim-treesitter.parsers").get_parser_configs()
list.reason = {
  install_info = {
    url = "https://github.com/reasonml-editor/tree-sitter-reason",
    files = { "src/parser.c", "src/scanner.c" },
    branch = "master",
  },
}
```

Then you need to copy the files from `queries/reason/highlights.scm` into
somewhere in your `runtimepath` (with the same name).

If you don't detect Reason files, you need this too:

```lua
-- Adds reason as a filetype
vim.filetype.add {
  extension = {
    re = "reason",
  },
}

-- (Sometimes required): Tells neovim to load reason
vim.treesitter.language.add("reason", { filetype = "reason" })
```
