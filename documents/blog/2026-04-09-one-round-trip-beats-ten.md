---
title: One round trip beats ten
date: 2026-04-09
$author: /authors/bitter-truth
layout: post
summary: For an agent, every round trip is an inference. Ten round trips to fetch an article and its author and the author's organization is ten model calls. The right query interface answers the same question in one call. The cost difference is multiplicative.
tags: [api, performance, agents]
status: draft
---

A REST API designed for human consumption optimizes for clarity per call. Each endpoint has a clean URL. Each response contains exactly what you asked for. If you want more, you make another call. The architecture rewards thoughtful API design with a clean, navigable surface.

A REST API designed for agent consumption optimizes for round-trip economy. The agent thinks between calls. Each call is an inference cycle. Ten calls is ten inferences. The architecture should let the agent express what it wants in as few calls as possible.

[Draft. To finish: the specific mechanics of mikser's expand parameter, the difference between "follow this reference" and "expand this reference inline," what changes when you treat round-trip count as a cost metric, the meta-lesson about API design when the consumer is a model not a person.]
