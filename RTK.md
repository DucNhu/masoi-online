# RTK - Rust Token Killer (Codex CLI)

**Usage**: Token-optimized CLI proxy for shell commands.

## Rule

Use RTK for supported, verbose commands. It reduces command output, not model reasoning or image tokens. Codex uses these instructions; this setup does not install an automatic shell rewrite hook.

Examples:

```bash
rtk git status
rtk git diff --stat
rtk dotnet build
rtk dotnet test
```

## Meta Commands

```bash
rtk gain            # Token savings analytics
rtk gain --history  # Recent command savings history
rtk proxy <cmd>     # Run a supported executable without filtering
```

## Verification

```bash
rtk --version
rtk gain
which rtk
```

Use native `codegraph`, `rg`, and exact file reads when appropriate. Read SKILL.md, AGENTS.md, specifications, and relevant source without lossy filtering. If a summary omits needed evidence, rerun the precise read-only command without RTK. Do not repeat mutating commands just to obtain unfiltered output. Preserve original build/test logs when troubleshooting failures. RTK analytics estimate command-output savings, not billed API costs.
