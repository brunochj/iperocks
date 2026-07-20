<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CRITICAL RULES - MUST FOLLOW

## RESPONSES
- Keep responses concise and to the point - unless the user ask otherwise

## PLANNING MODE
- Always ask clarifying questions
- Never assume design, tech stack or features
- Use deep-dive sub-agents to assist with research
- Use deep-dive sub-agents to review the different aspects of yous plane before presenting to the user

## CHANGE / EDIT MODE
- Never implement features yourself when possible - use sub-agents!
- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features effeciently
- When using sub-agents to implement features, act as coordinator only
- Use the best model for the task - premium models for complex tasks (like coding), and mid-tier models for simpler tasks, like documentation
- After completing features (large or small), always run commands like lint, type check and next build to check code quality

## DATABASE SCHEMA CHANGES
- Whenever you make changes to the database schema, ALWAYS run the drizzle generate and migrate commands
- NEVER run drizzle push!

## TESTING
- Use any testing tools, libraries available to the project for testing your changes!
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user wheter testing should be skipped.

<!-- ## UI DESIGN
- Always follow the UI design system when creating or reviewing components or pages.
- Design system: @DESIGN.md -->

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

<!-- BEGIN:change-only-what-is-asked -->
# Change Only What Is Explicitly Asked

**Core Principle: Minimal, Targeted Changes**

When the user asks you to fix or change something:

1. **Only change what they explicitly asked for** - Don't add "improvements", "enhancements", or related changes without asking first
2. **Verify which file/component** - If there are multiple similar files or components, confirm which one should be modified
3. **When in doubt, ASK** - Never assume what the user wants. If the request is ambiguous or you see multiple ways to implement it, ask for clarification
4. **No scope creep** - Don't add background colors, gradients, refactors, or style changes unless specifically requested
5. **Document your understanding** - Before making changes, briefly confirm what you're about to change and why

**Examples:**

❌ **Wrong**: User asks to make cards transparent → Agent changes card styling AND adds page background gradient AND refactors layout  
✅ **Right**: User asks to make cards transparent → Agent only changes the card background opacity

❌ **Wrong**: User asks to fix error in ComponentA → Agent assumes ComponentB is also wrong and "fixes" it  
✅ **Right**: User asks to fix error in ComponentA → Agent only fixes ComponentA

❌ **Wrong**: User mentions they want something changed → Agent immediately implements their interpretation  
✅ **Right**: User mentions they want something changed → Agent asks clarifying questions if the request is ambiguous

**When Unsure:**
- "I can change X in [file]. Should I also update Y? Or only X?"
- "There are two similar components: A and B. Which one should I modify?"
- "Would you like me to [specific change], or did you have something else in mind?"

**Remember**: Restraint is a feature, not a bug. Users appreciate precise, targeted changes over well-intentioned but unwanted modifications.
<!-- END:change-only-what-is-asked -->

<!-- BEGIN:understand-before-modify -->
# Understand Before Modifying (STRICT RULE)

**Before making any code change, you MUST:**

1. **Understand WHAT** - Read the relevant code to fully understand what it does currently
2. **Understand WHY** - Know why the change is needed and what problem it solves
3. **Understand WHERE** - Identify ALL files/components affected by the change (frontend, backend, types, etc.)

**After making changes, you MUST:**

1. **Test E2E** - Manually trace through the entire flow you modified:
   - If you changed an API endpoint → verify frontend calls it correctly and handles the response
   - If you changed a form → verify data flows from UI → API → database → back to UI
   - If you changed state logic → verify the UI updates correctly in all scenarios

2. **Verify data flow** - Confirm data is being:
   - Sent correctly from the frontend (check request body)
   - Received correctly by the API (check destructuring)
   - Saved correctly to the database (check Prisma query)
   - Returned correctly to the frontend (check response object)

**Common mistakes to avoid:**
- Commenting out code without understanding why it was there
- Adding fields to API response but forgetting to update the query that fetches them
- Changing frontend to send data but forgetting to update backend to receive it
- Assuming a change works without tracing the full data flow

**When in doubt:** Ask the user to clarify the expected behavior before implementing.
<!-- END:understand-before-modify -->
