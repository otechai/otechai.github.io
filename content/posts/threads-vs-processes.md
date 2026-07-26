+++
date = '2026-07-26T15:39:14+01:00'
draft = false
title = 'Threads vs Processes'
+++

# Your Computer Is Full of Roommates, and One of Them Is About to Ruin Everything

Your video call freezes. The picture's frozen mid-blink, your coworker's mouth stuck open on a word you'll never hear. But the audio keeps going. And somehow, in the background, your music app is still playing, untouched, like nothing happened at all.

One thing broke. The rest of the house kept living. Why?

## Start in a house you already know

Picture a house. It has an address, a front door, a shared fridge, shared furniture. That's a **process** — a running program, with its own little world of memory and resources.

Now put people in the house. Not one person living alone — several people, sharing the same fridge, the same living room, the same front door. Those people are **threads**. Multiple threads, one process. One house, several roommates, each one moving through it doing their own thing.

That's the entire setup behind why your call can freeze while your music doesn't skip a beat. You've lived in a shared house. You already know exactly how this works.

## But the roommates aren't as separate as they look

Here's where it gets less cozy than it sounds. These roommates aren't just *near* each other — they share almost everything. The fridge, obviously. But also the furniture, the mail, the family photos on the wall. In computer terms: threads in the same process share the program's code, its global variables, its open files, its entire heap of memory.

Which sounds efficient — and it is. But think about what that actually means: if one roommate rearranges the furniture, *every* roommate walks into the new arrangement, whether they were told about it or not. There's no lock on the fridge. There's no "please don't touch my shelf." If two people reach for the same thing at the exact same moment, the house has no built-in referee.

Now the stakes are higher than "who ate the leftovers." Now it's: what happens when two roommates try to *write* to the same shelf at the same instant?

## Even the operating system got this wrong for years

Here's a genuinely surprising one, and it trips up even people who've written multithreaded code for years: for a long stretch of Unix and Linux history, **the landlord couldn't see the roommates at all.**

As far as the kernel was concerned, the whole house was one occupant. If a single roommate got stuck waiting on hold — a blocking system call — the landlord assumed the *entire house* had gone silent and stopped all mail delivery for everyone inside. One person on hold, and the whole household froze. This is called the **many-to-one threading model**, and once you picture it as an actual house, it's almost absurd that it worked at all — let alone that it was standard for years.

## The one sentence that explains all of it

> **Threads are roommates: they share the fridge, but each one needs their own toothbrush — and the landlord has to know exactly who lives in the house before he can stop one late sleeper from freezing out everyone else's mail.**

Everything above is really just that sentence, unpacked. The shared stuff (fridge, furniture, files, memory) is the *convenience*. The private stuff (toothbrush — your own stack, your own thread ID, your own place in line) is what keeps roommates from colliding. And the landlord finally *seeing* each roommate individually is what fixed the frozen-house problem.

## "But if everything's shared, isn't this just asking for disaster?"

Fair challenge. And the honest answer is: yes, kind of — that's the trade nobody tells you about upfront.

Sharing the fridge is *fast*. Two separate houses (two separate processes) trying to share a snack have to mail it to each other — package it, send it, wait, unwrap it. That's what programmers call IPC, inter-process communication, and it's slow by comparison. Roommates sharing one fridge skip all of that. Same memory, instant access, no delivery truck required.

But that speed is exactly *why* the danger is real. This exact collision — two threads reaching for the same shared data at once — has a name: a **race condition**. It's arguably the single most feared bug in all of software, precisely because it depends on split-second timing. It can run perfectly a thousand times and then corrupt silently on the thousand-and-first, on a Tuesday, on someone else's machine, and never again on yours. The convenience and the danger are the same feature. You don't get one without the other.

## Which means the fix couldn't be about removing the sharing — it had to be about seeing the roommates

Since you can't un-share the fridge without losing the entire speed advantage, the actual fix had to happen somewhere else: the landlord needed better eyesight.

That's what changed with the **one-to-one threading model**, standard in Linux since the 2.6 kernel. Every roommate — every thread — became individually visible and individually schedulable. One person waiting on hold no longer freezes the mail for the whole house. This shift arrived through **NPTL**, the Native POSIX Thread Library, built in 2005 by Ulrich Drepper and Ingo Molnár — a serious speed and reliability upgrade over what came before.

And under the hood, Linux keeps this arrangement lightweight on purpose: each thread gets its own `task_struct`, but that structure mostly just holds *pointers* to the shared stuff rather than duplicating it — a key to the fridge, not a second fridge.

## Back to your frozen call

So — your video call froze, but your music didn't. Now you know why that's even possible: they're different roommates, in different (or even the same) houses, and the landlord today is watching each one closely enough that one stuck thread doesn't have to take the rest down with it.

And the next time some app behaves perfectly ninety-nine times and then glitches once, for no reason you can reproduce — you're not imagining it, and it's not "just a fluke." Somewhere, two roommates reached for the same shelf at the exact same moment, and this time, nobody was watching.
