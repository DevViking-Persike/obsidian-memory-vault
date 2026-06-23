Run tests for the areas affected by recent changes.

Argument: $ARGUMENTS (optional: {{TEST_AREAS}})

Steps:
1. If no argument, run `git diff --name-only` to detect which areas changed
{{TEST_STEPS}}
4. Summarize: total tests, passed, failed, coverage percentage
