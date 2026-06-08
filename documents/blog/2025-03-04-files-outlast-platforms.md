---
title: Files outlast platforms
date: 2025-03-04
$author: /authors/bitter-truth
layout: post
summary: Every five years, someone announces the end of the file. Every five years, the announcement is wrong in the same way. The file is not a technology you upgrade away from; it is a technology you build on top of, indefinitely.
tags: [content, durability]
status: published
---

There's a strange recurring pattern in software discourse. Every five or so years, someone influential announces that we are about to leave files behind. The replacement varies — databases, the cloud, "the document model," APIs, blockchains, AI memory — but the announcement is always the same shape: files are old, we have something better now, it's time to move on.

So far, the announcement has been wrong every time. Files have stayed.

I think it's worth examining why. The shape of the failure tells you something about what files actually are, and why the systems we keep proposing as replacements are not really replacements.

---

In 1998 the prediction was that databases would replace files. The unstructured file would give way to the structured row. Word documents would live in document management systems. Photos would live in catalog tools. Code would live in source control systems (which, ironically, are themselves built on files). The age of the file was ending.

The age of the file did not end. Twenty-seven years later, my Mac has a folder of files in it, and so does my server, and so does every system I work with. The database adoption happened, but the file persisted. The files just have databases over them now.

In 2007 the prediction was that the cloud would replace files. Local storage was a holdover. Everything would live in remote services. The file as a unit of storage would dissolve into a stream of data managed by platforms.

Eighteen years later, every cloud service offers an export to file. The file persisted again. The cloud sat on top of it.

In 2014 the prediction was that "the document model" would replace files — Google Docs, Notion, online platforms that store rich documents in proprietary formats accessible via API. Microsoft Word's days were numbered.

Notion just added markdown export. Google Docs has Office export. The Word document persisted. The platforms are still there, but the file is also still there, on the other side of the export.

In 2021 the prediction was that AI memory would replace files. Why store anything when an AI can hold it all in context? The file as an artifact would become obsolete.

We're four years in. Files have not become obsolete. AI memory turns out to be a working surface, not a storage layer. The files are still there.

---

The pattern is not that the new technologies are wrong. They are useful. The cloud is real. Notion is real. AI memory is real. These technologies do what they do well.

The pattern is that they keep being proposed as replacements for files, and they keep not replacing files, because they are not actually solving the same problem.

Files solve a specific problem: durable, portable, addressable storage that any program can read. The replacements solve other problems: hosted collaboration, structured queries, intelligent retrieval. They are not file replacements; they are layers that sit on top of files, or alongside them, and provide additional capabilities.

The mistake the announcements keep making is assuming that the new capability supersedes the old one. It doesn't. The new capability adds to the stack. The old one stays at the bottom.

This is why every cloud service eventually adds file export. The cloud capability is real, but users still need the file capability underneath. Without it, the cloud capability is a one-way trap.

---

The lesson generalizes to AI memory now. AI agents can hold large contexts and retrieve from them intelligently. This is genuinely useful. But it does not replace the file underneath the context. The file is still where the content lives durably. The AI memory is a working surface on top of it.

Mikser bets on this stack explicitly. Content lives in files. The agent reads the files. The agent edits the files. The catalog, the inverse-reference index, the vector store — all derived from files, regenerated when the files change, never primary.

This is not nostalgia. It's a recognition that the file has a property — durability — that the proposed replacements do not have, and that property is what every layer above the file ultimately depends on.

---

Five years from now someone will announce that some new technology is going to replace files. The announcement will be wrong in the same way. The new technology will be real, and useful, and add to the stack, and not replace the bottom of it.

Files will still be there. Mikser will still be there. The bet, which has aged well so far, will keep aging well.

There is a kind of stubbornness in choosing to build on files in 2025. It looks unfashionable. It looks like a refusal to adopt new technology. It is not. It is a bet that the new technology, whatever it is, will sit on top of files, and the right place to build the durable layer is where the file actually lives.

The fashionable thing is to assume the new layer is replacing the old one. The boring, correct thing is to assume the new layer is one more layer on top of an old foundation that is still doing the work it always did.

Files outlast platforms. They have so far. There's no sign they're going to stop.
