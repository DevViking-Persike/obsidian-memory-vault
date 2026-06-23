Perform a comprehensive code review on staged or recent changes.

Steps:
1. Run `git diff --cached` (if staged) or `git diff HEAD~1` to get changes
2. For each changed file, evaluate:

   **Architecture Compliance**:
   {{ARCH_REVIEW_RULES}}

   **Code Quality**:
   - Are functions/methods under 40 lines?
   - Are there proper error handling paths?
   - Is naming clear and consistent?
   - Are there magic numbers or strings that should be constants?

   **Testing**:
   - Does the change include or update tests?
   - Are edge cases covered?

   **Security**:
   - No hardcoded secrets
   - Input validation present
   - Proper error messages (no internal details leaked)

   **Performance**:
   {{PERF_REVIEW_RULES}}

3. Output a structured review with:
   - APPROVE, REQUEST_CHANGES, or COMMENT verdict
   - Specific findings with file:line references
   - Suggested improvements as code snippets
