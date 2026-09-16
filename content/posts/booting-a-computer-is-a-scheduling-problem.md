---
title: "Booting a Computer Is a Scheduling Problem"
date: 2026-09-16
slug: "booting-a-computer-is-a-scheduling-problem"
description: "The init-system wars were never really about philosophy. They were an argument about whether startup should be a numbered list or a dependency graph, fought in the wrong vocabulary for twenty years."
tags:
  - linux
  - systems
  - sysadmin
categories:
  - technology
draft: false
---

Ask someone to explain why a computer takes forty seconds to boot instead of four, and you'll usually get an answer about hardware — slow disks, cold caches, too many background apps. That's the wrong layer. The real answer, for almost every modern operating system, is a scheduling decision made long before any application gets to run: does the system start things one at a time, in a fixed order somebody wrote down years ago, or does it figure out what can start *right now* and launch all of it at once?

That single design choice is responsible for more of the Linux "init wars" than any of the philosophical arguments people actually had in public.

## The To-Do List Model

The oldest approach to bringing a machine up is embarrassingly literal: number the things that need to start, and start them in that order, one at a time. Script `20` runs before script `50`. Nobody asks whether `20` and `50` actually depend on each other, because the numbering doesn't encode dependency — it encodes somebody's best guess, frozen in place as a filename prefix.

This is a priority queue with the priority function surgically removed, leaving only its output. You can read the order. You cannot read the *reason* for the order, because the reason was never written down anywhere except in the head of whoever typed the number. Every system administrator who has ever renumbered a startup script to fix a race condition has been doing archaeology on someone else's forgotten reasoning.

The appeal of this model is real, and it isn't nostalgia. A numbered shell script is legible in the most literal sense: you can `cat` it and understand, completely, what will happen. There's no compiled binary standing between you and the truth. That transparency has genuine value, and it's worth stating plainly instead of waving away, because the alternative gives some of it up.

## The Dependency Graph Model

The newer approach throws out the numbering entirely and asks each piece of the system to declare what it actually needs: *I require the filesystem mounted. I want to start after the network is up. I conflict with that other service.* From those declarations, the scheduler builds a graph, and then does the obvious thing a graph invites you to do — starts everything that has no unmet dependency, all at the same time, and keeps doing that as each layer of the graph clears.

This is not a new idea. It's the same idea a build system uses when it compiles fifty independent source files in parallel instead of one after another just because they happen to be in alphabetical order. A serial startup script and a serial compiler have the identical flaw: neither one can exploit available parallelism, not because the parallelism doesn't exist, but because the information required to find it was thrown away at design time. A sixteen-core machine boots exactly as slowly on a numbered-list system as a two-core machine, for the same reason a `-j1` build doesn't get faster on a bigger machine — the scheduler was never told it was allowed to look ahead.

Once you see startup as a graph-coloring problem instead of a checklist, the "which system boots faster" argument stops being interesting. Of course the graph-based one is faster, structurally, whenever there's real independence to exploit. The only honest question left is what you give up to get there.

## What You Actually Give Up

Mostly: a layer of readability. A dependency-driven scheduler that manages sockets, mounts, timers, device hotplug, and process supervision through a shared internal model is not one enormous program pretending to be many small ones — it's closer to several small, individually-inspectable components coordinating through a common interface, which is a very different architecture from a monolith even though it gets called one constantly. But those components are compiled, not scripted. The configuration is plain text; the behavior that interprets the configuration is not something you can read over coffee the way you can read a shell script.

That's the actual cost, and it's worth stating without exaggeration in either direction. "Open source" doesn't erase it — the source being *available* and a stressed administrator at 2 a.m. actually *reading* it are two different claims, and treating the first as satisfying the second is a small act of self-deception. But "opaque binary blob you can't reason about" overstates it too, because a live dependency graph you can query in real time — *show me everything this target actually requires, right now, on this machine* — is often more useful during an actual failure than the source code would be anyway. You're not debugging the code. You're debugging tonight's graph.

## The Synchronization Barrier Hiding in Plain Sight

The most underrated piece of graph-based startup design isn't the parallelism — it's the checkpoints. Certain groups of independent tasks are allowed to race ahead in any order, but nothing in the *next* group is allowed to start until *everything* in the current group has finished, however long the slowest one took.

Anyone who has written concurrent code has already met this pattern under a different name: a synchronization barrier. Threads run independently, then all wait at a line until the last one arrives, then everyone proceeds together. It's the correct structure precisely because the naive alternative — *just parallelize everything, all the time* — is not actually faster, it's just broken in a way that's hard to reproduce. Without the barrier, you'd occasionally get a service starting before the filesystem it needs even exists, and the failure would look random because it *is* random, a race condition with the process ID serial-numbered onto it. The barrier is what converts "mostly parallel" from a liability into a feature.

## The Argument Was Never About the Graph

Here's the part that's easy to miss: almost nobody actually disputes that dependency-graph scheduling is a better model than a numbered list. That part of the argument was settled quickly and quietly, the way most genuinely correct engineering ideas get settled — by people simply adopting it and moving on. The prolonged, bitter, decade-long public fight was never really about the scheduling algorithm.

It was about who gets to decide the default for machines that aren't theirs.

A scheduling model is a technical claim with a technical answer. "This particular project should now own the default startup behavior for a huge fraction of the world's Linux machines" is a governance claim, and governance claims provoke a completely different, much less rational kind of resistance — the kind that shows up disguised as objections to binary log formats and "doing too much," because architecture is the vocabulary that happens to be lying around when people want to argue about power without admitting that's what they're arguing about. You can tell the two arguments apart by a simple test: a technical objection has a technical fix. "I dislike binary logs, use text output" is a config flag. "I dislike that a decision this large got made for me" has no config flag, because it was never a complaint about the graph.

## The General Lesson

Strip away the specific technology entirely and you're left with a pattern that shows up anywhere a system has to bring many interdependent parts online: a numbered list is what you get when you never bothered to model the actual dependencies, and a graph is what you get when you did. The list is easier to read. The graph is faster, more correct under load, and more honest about what depends on what — right up until something inside it fails, at which point you need tooling built for graphs, not intuition built for lists.

Most systems eventually make this trade whether or not anyone frames it that way — deployment pipelines, task runners, even org charts drift from "do these ten things in this order because someone once said so" toward "here's what actually blocks what, figure out the fastest legal order yourself." The fight over how to boot a computer was really a preview of that same fight happening everywhere else, one dependency graph at a time.
