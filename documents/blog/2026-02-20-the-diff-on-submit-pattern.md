---
title: The diff-on-submit pattern
date: 2026-02-20
$author: /authors/bitter-truth
layout: post
summary: "When a user edits a form and clicks save, most systems send every field back. A better pattern — diff against the initial values and send only what actually changed. The result is surgical writes that don't clobber the rest of the entity."
tags: [mcp, ui, pattern]
status: draft
---

Look at any form submission in any web app. The user opens the form, three fields are pre-filled, they change two of them, they click save. The system receives all three values, including the one that didn't change, and dutifully writes all three back to the database.

This is fine when you control both ends. It's a problem when you don't.

[Draft. To finish: how this becomes a real problem when an agent is writing through forms (it clobbers fields it didn't intend to touch), the diff-on-submit pattern in MCP-UI layouts (compute the diff in the layout's script, send only the deltas as the payload), why this matters for the verification loop, the generalization to other patterns where the writer's intent should be specific not exhaustive.]
