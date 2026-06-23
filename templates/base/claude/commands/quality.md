Run a comprehensive code quality check on recent changes.

Steps:
1. Run `git diff --name-only HEAD~1` to identify changed files (or all files if no commits yet)
{{QUALITY_STEPS}}
3. Report all violations found with file paths and line numbers
4. Suggest fixes for each violation
