+++
date = '2026-08-04T12:36:06+01:00'
draft = false
title = 'Perl Lets the Same Line Mean Two Different Things  on Purpose'
tags: ["perl", "context", "programming"]
+++
# The Same Line of Code Can Mean Two Different Things — And Perl Does This On Purpose

Here's a sentence that should be impossible: two people run the exact same line of code and get two different answers, and neither of them is wrong.

That's not a bug. In Perl, it's the whole point.

## It works like ordering food

Say "give me a hamburger" and you get one. Say "give me hamburgers" and you get several. The verb didn't change, the request barely changed — one letter — but the *amount* you expect changes everything about what comes back.

Perl builds this same expectation into its own grammar. Ask a function for nothing, and it can slack off. Ask it for one thing, and it does the minimum work to hand you that one thing. Ask it for everything, and it has to sort, gather, and return the whole list. Same function, same line of code — three different jobs, depending on what you said you wanted.

## And it gets stranger than food ordering

Because the "asking" isn't always obvious. Assign a function's result to a single variable and you've silently asked for one thing. Assign it to a list — even a list with only one name in it — and you've silently asked for everything, and the function behaves differently as a result. The only difference between these two lines is a pair of parentheses:

```perl
my $scalar_context = find_chores();
my ($list_context)  = find_chores();
```

Nothing about the words changed. Only the *shape* of the request did. That shape is invisible unless you already know to look for it — which means the exact same code can quietly do two different amounts of work depending on punctuation most people read past without noticing.

## Even experienced people trip on this

New Perl programmers hit this constantly: they build a hash, plug a function call in as one of the values, and assume it'll just fetch "the answer" — only to discover the hash has quietly forced that function into *list* mode, and now it's doing far more work than intended, in the wrong shape entirely:

```perl
my %results = (
    cheap_operation     => $cheap_results,
    expensive_operation => find_chores(),   # OOPS!
);
```

Nobody typed a mistake. The code reads perfectly fine top to bottom. The bug is entirely about context nobody flagged.

## Here's the idea in one line

**In Perl, meaning isn't fixed by the words alone — it's fixed by the sentence they're standing in.**

## "Isn't that just bad design, though?"

It's fair to ask why a language would let identical code mean different things — doesn't that make bugs *harder* to catch, not easier? The answer is that this isn't an accident Perl tolerates; it's a decision Perl made deliberately, because the alternative — forcing you to explicitly declare "I want exactly one result" or "I want exactly zero" every single time — is *more* ceremony for the 95% of cases where the surrounding code already makes that obvious. Perl bets that once you learn to read for context the way you already read for context in English, the shortcuts save you far more time than they cost you. The bet isn't free — this is a real source of subtle bugs for beginners — but it's a bet, not an oversight.

## Which means Perl needs its own version of "it"

If a language is willing to let *shape* imply meaning, it's a short step to letting *absence* imply meaning too. That's exactly what Perl's default variables are: pronouns.

## English already does this constantly

You don't say "chomp the trailing newline off of the string stored in this variable" every time — you'd say "chomp it." Perl's `$_` is that *it*. Leave out the variable, and dozens of built-ins — `chomp`, `print`, `say`, pattern matching, loops — quietly reach for `$_` on your behalf:

```perl
for (1 .. 10) {
    say "# $_";
}
```

No variable named anywhere in that loop body. It's implied, the way "it" is implied in a conversation where everyone already knows what you're talking about.

## But pronouns break down when a sentence has too many antecedents

The trouble starts when two things both want to be "it" at once. Call a function from inside a loop that's already using `$_`, and if that function *also* touches `$_` internally, it can silently overwrite the value your loop was still relying on — and your loop won't throw an error, it'll just quietly use the wrong data for the rest of that iteration.

## Here's the idea in one line

**`$_` is Perl's word for "it" — a convenience right up until two different sentences both need their own "it" at the same time.**

## "So why would you ever use it, if it's this fragile?"

Because the fragility only shows up when you overuse it, the same way a paragraph of nothing but "it, it, it" gets confusing in English too. Used in one line, one small, well-scoped loop, `$_` is completely unambiguous and saves real clutter. The rule experienced Perl programmers actually follow isn't "avoid `$_`" — it's "use it the way you'd use the word *it* in careful writing: sparingly, and only when there's no question what it refers to."

## Which means this was never really about syntax at all

Context-sensitivity and implicit pronouns are two symptoms of the same underlying choice: Perl was built by someone who studied *linguistics* before he built a programming language, and he modeled it on how people actually talk to each other rather than on formal mathematical notation. Perl's own culture even has a name for the philosophy this produces — TIMTOWTDI, "there's more than one way to do it" — the idea that the language shouldn't dictate the one correct sentence, only make sure your sentence is understandable once you write it.

That freedom is exactly why the same list-tripling task can legitimately be written three completely different ways in Perl — a beginner's explicit loop, an intermediate's cleaner loop, and an expert's one-line `map` — and none of the three is the "wrong" answer, only the answer that matched who wrote it and when.

## Which is exactly why Perl ships a small library's worth of documentation

A language that refuses to force one right way to write something has to compensate by making it painless to look anything up — which is why `perldoc` isn't an afterthought bolted onto Perl, it's treated as part of the language itself, covering everything from a single built-in function (`perldoc -f sort`) to a single variable (`perldoc -v $PID`) to the entire table of contents of the language (`perldoc perltoc`).

## Next time you're staring at a line of Perl that seems to be doing something impossible

Don't assume it's broken. Ask what it was *asked* for — one result, many results, or none at all — the same way you'd listen for whether a sentence was singular or plural before deciding whether it sounded wrong. And if you genuinely can't tell what a piece of syntax means, the fix isn't to guess: it's one line in a terminal — `perldoc -f` and the name of whatever's confusing you — and Perl will tell you, in the same document format every library on CPAN agreed to use, exactly what it meant.

That's the trick that looked like it shouldn't work at the top of this post: code that means different things in different places isn't chaos. It's a language betting that you can read context — and giving you an instant way to check your read whenever you can't.
