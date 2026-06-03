<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:verification-rules -->
# Always Verify Before Confirming

When making file changes (especially batch updates like JSON modifications):

1. **Check first** - Use grep/cat/read tools to verify the actual file state before claiming success
2. **Don't assume cache** - If the user says something isn't working, verify with tools rather than assuming it's a cache issue
3. **Verify after** - Always run a verification command to confirm changes were applied correctly
4. **No "it's probably fine"** - Only report success after concrete verification

Example: After updating JSON entries, use grep or node to read back the actual file contents and confirm the changes exist.
<!-- END:verification-rules -->

<!-- BEGIN:always-make-sure-rule -->
# ALWAYS MAKE SURE BEFORE SAYING STUFF (STRICT RULE)

**Before saying "I added it", "updated", "set the value", "done", "it is there", "changes applied", or any similar claim:**

- You **MUST** have executed a verification tool (Read, Grep, Shell cat/grep/node, etc.) **AFTER** the edit/write operation in the same interaction flow.
- The verification tool output **MUST** be present in the conversation and must explicitly contain the expected new content (e.g. the exact suffix in the JSON line).
- Quote or reference the specific lines from the **post-edit verification output** before concluding success.
- If the user says "it didn't add / no changes", do **not** assume "probably cache", "view not refreshed", "previous run was fine". Re-run a fresh verification tool call on the file right then, show the output, and only claim success if that output proves the data.

Never rely solely on "the command said Updated 5 lines" or "the script printed YES". The only truth is a **fresh read of the target file after the modification**.

Add this behavior to every edit task. Re-verify live if the user questions the result.
<!-- END:always-make-sure-rule -->
