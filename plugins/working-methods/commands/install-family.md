---
description: Bootstrap — install/verify the whole four-plugin family (working-methods, automations, forge-methodology, design-review) so /forge-run has every phase's tool present. Reports what's missing and installs it.
argument-hint: (none)
allowed-tools: Bash(claude plugin:*), Bash(claude plugin list:*), Bash(claude plugin validate:*), Read
---

# /install-family — make sure the whole spine is present

`/forge-run` only works if every phase's tool is installed. This is **one** step (repo
setup, run once), not part of a feature run. It installs/verifies the family as a unit
instead of four manual installs that nothing checks.

## Steps
1. **Add the marketplace** (idempotent):
   ```bash
   claude plugin marketplace add davidgarciagordo/claude-code-setup-optimizer
   ```
2. **Check what's already installed:**
   ```bash
   claude plugin list
   ```
3. **Install only the missing ones** of the family — all four are required together:
   ```bash
   claude plugin install working-methods@claude-code-setup-optimizer    # /forge-run · /grill · /handoff · forge-on-claude
   claude plugin install automations@claude-code-setup-optimizer         # optimize-my-setup · hooks · templates · /release
   claude plugin install forge-methodology@claude-code-setup-optimizer   # the neutral 7-step loop forge-on-claude delegates to
   claude plugin install design-review@claude-code-setup-optimizer       # the design pipeline /forge-run's verify phase fires
   ```
   > **Dependency:** `working-methods` (`forge-on-claude`) **requires** `forge-methodology` —
   > it maps that skill's neutral loop onto Claude Code tools. Installing working-methods
   > without forge-methodology leaves the spec/loop reference dangling. Likewise the verify
   > phase of `/forge-run` calls `design-review`, so it must be present too.
4. **Validate:**
   ```bash
   claude plugin validate . --strict   # when run from a clone of the marketplace repo
   ```
5. Report which were already present, which got installed, and any that failed. Then the
   user can run `/forge-run <task>`.
