---
title: "Perl Thinks You're Talking to It"
date: 2026-09-16
slug: "perl-thinks-youre-talking-to-it"
description: "Larry Wall designed Perl like a language, not a proof. Context, pronouns, and TIMTOWTDI are the weird, deliberate consequences — and they explain a lot about why Perl code still confuses people who learned to program from math textbooks."
tags:
  - perl
  - programming-languages
  - language-design
categories:
  - technology
draft: false
---

Most programming languages were designed by people who wanted to formalize logic. Perl was designed by someone who used to formalize sentences. Larry Wall studied linguistics before he wrote a line of Perl, and it shows in a way that trips up almost everyone who comes to the language expecting a small, clean calculus. Perl doesn't behave like arithmetic. It behaves like a person mid-conversation, filling in the parts you didn't bother to say because the context made them obvious.

That's not a metaphor tacked on after the fact to make the docs friendlier. It's the actual design principle, and once you see it, half of Perl's supposedly "weird" behavior stops being weird and starts being consistent — just consistent with the wrong reference model. You've been grading it as math. It was never trying to be math.

## The Grammar Nobody Taught You

Take the sentence "Please give me one hamburgers." You don't need a grammar textbook to know it's broken — the mismatch between "one" and "hamburgers" trips an alarm before you've consciously parsed why. You did that with a rule you never memorized, because subject-verb-number agreement isn't something English speakers learn as a rule; it's something they absorb as a reflex from exposure.

Perl tries to give code the same kind of reflex-legible structure, through something it calls **context**. In Perl, an operation can behave differently depending on how many results you're asking for and what you intend to do with them. Call a function and ignore its return value entirely, and it's running in *void context* — it can skip work it knows nobody will read. Assign the result to a single variable, and it's in *scalar context* — it can stop after finding the one thing you actually wanted. Assign it to an array, and it's in *list context* — now it has to do the full job.

This is the part that reads as sorcery to programmers coming from stricter, more mathematically-minded languages, where a function has exactly one behavior regardless of who's asking. Perl's position is closer to a sysadmin's: doing unnecessary work is itself a bug. If nobody asked for the whole sorted list, don't build the whole sorted list. Context is Perl's mechanism for a function to ask "how much do you actually need from me?" before deciding how hard to work — which is a genuinely useful idea wearing a genuinely confusing syntax.

The trap is that context is inherited, not requested. Wrap a function call inside a hash literal, and it's suddenly evaluated in list context whether you meant to or not — because hash construction expects a list of key-value pairs, and that expectation propagates inward. You didn't ask your function to do the expensive, exhaustive version of its job. The *structure around it* did, silently, and you find out during a debugging session at 1 a.m. This is the sysadmin mind's favorite kind of failure: not "the component is broken," but "the component behaved exactly as specified, and the specification had implications nobody traced through."

## $_ and the Pronoun Problem

If context is Perl borrowing grammar, the default variables are Perl borrowing pronouns. `$_` is what English does with "it." You don't say "chomp the newline off of the string that I am currently holding in this variable" every single time — you say "chomp it," and everyone in the room tracks what "it" refers to from context. Perl's built-ins — `chomp`, `print`, `say`, its regex operators, its loop constructs — all default to operating on `$_` when you don't specify anything else. Loops in particular hand you `$_` as the implicit loop variable, the same way you'd narrate a walk through a list in English without renaming the thing you're currently looking at.

`@_` plays the same role for function arguments that "they" or "them" plays for a group: a function's parameter list, referenced implicitly, unless you bother to name the individuals. `shift` with no argument pulls from `@_` inside a function and from `@ARGV` — the command-line arguments — outside of one, because Perl assumes you mean whichever implicit collection is contextually available.

This is elegant right up until you have two functions that both use `$_` and one calls the other. English has the same failure mode — pronoun trouble is exactly why a badly written paragraph full of "it" and "they" becomes impossible to parse, because you lose track of the antecedent. Call a function from inside a loop that's iterating over `$_`, and if that function also touches `$_` without localizing it, you've just let the callee quietly reassign the variable the caller was relying on. There's only one `$_` in scope at a time, globally, unless you take steps to protect it. Perl's own documentation treats this less like a design flaw to patch and more like a style problem to manage: use the pronoun sparingly, in small, well-defined scopes, the same advice a decent writing teacher gives about "it" in a paragraph that's gotten away from itself.

## Do What I Mean, and Other Load-Bearing Assumptions

All of this sits on top of a principle Perl programmers call DWIM — do what I mean — which is really just the principle of least astonishment given a linguistics degree. Add two variables with `+` and Perl assumes you mean numbers, because you *used the numeric operator*, and it will coerce strings, undefined values, whatever you hand it, into numbers to honor that stated intent. Compare two variables with `eq` and it assumes you mean strings. Compare the same two variables with `==` and it assumes you mean numbers — which is how two different strings can silently compare equal, because in numeric context they both coerce to zero. This isn't the language being sloppy about types. It's the language taking your choice of operator as a speech act: you didn't just write an expression, you *expressed an intent*, and Perl is obligated to honor it, consequences included.

This is also where TIMTOWTDI comes from — "there's more than one way to do it" — Perl's answer to languages that insist there's exactly one correct way to write a loop. A Perl beginner can triple a list with an index counter and an explicit array push. Someone with more fluency writes a `for` loop over the list directly. Someone fully native collapses it into a single `map` expression. All three programs are correct. All three are "real Perl." The language explicitly refuses to declare one of them the only legitimate dialect, the same way no serious linguist declares that only formal, Latinate English sentences count as "real English." Beginners get to write beginner code that works, and grow into idiom the way anyone grows into fluency in a spoken language — through exposure and repetition, not through being told their first attempts were illegitimate.

## Where This Pattern Actually Lives

None of this is unique to Perl once you go looking for it. Shells default to operating on standard input when you don't redirect anything — the shell equivalent of `$_`. Unix pipelines assume the previous command's output is the next command's implicit subject. Git commands infer which branch you mean from the one you're currently on, unless you say otherwise. REST APIs infer the format you want from an `Accept` header instead of making you specify it in the URL every time. All of these are the same bet: that an interface which infers intent from context will feel more natural to a fluent user and more baffling to a beginner — right up until the beginner becomes fluent, at which point the inference stops feeling like magic and starts feeling like the interface finally shutting up and trusting you.

The honest cost of that bet is real, and Perl doesn't hide it: implicit behavior is legible only to someone who already holds the grammar in their head, and building that grammar takes longer than memorizing an explicit rule that never bends. A language that forces you to write `list.map(x => x * 3)` every time is more tedious and more forgiving. A language that lets you write `map { $_ * 3 }` and infer the rest is faster and less forgiving — it assumes a reader who's already fluent, the same way a native speaker doesn't need "it" defined before every sentence.

Perl just made that trade-off explicitly, decades before "developer experience" became a phrase people put on conference slides, and it made it by treating a programming language less like a proof system and more like a language people actually have to live in. Whether that was a good trade depends entirely on how much time you're willing to spend becoming fluent — and Perl, to its credit, never pretended otherwise.
