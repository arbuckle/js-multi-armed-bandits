js-multi-armed-bandits
======================
This is a collection of multi-armed-bandit examples written in javascript.  

Multi-armed-bandits might be useful for determining the effectiveness of multiple 
variations of a web design simultaneously, when the website in question has high 
enough traffic that significant results can be achieved quickly.

How it works
------------
The MAB is provided with a list of 'levers' each with their expected conversion rate, 
which the bandit will discover over repeated attempts.

The "Auto" button on the page starts the test for each module.  A random number is generated 
and compared to the expected conversion rate for the current lever, rewarding the lever
or starting the next iteration depending on the value.

A variety of different strategies are present on the page, as are statistical significance 
calculations and a regret delta for each strategy.  The aim is to achieve significance for 
all levers with minimum regret in the shortest amount of time possible.

Note
----
If you're looking for a really great set of MAB implementations, this may be a better resource:
http://bandit.sourceforge.net/
