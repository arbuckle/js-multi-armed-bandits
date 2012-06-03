js-multi-armed-bandits
======================
This is a collection of multi-armed-bandit examples written in javascript.  

The intent is to demonstrate the effectiveness of different values of epsilon and different
was of calculating epsilon for a variety of conversion rates, so that regret (lost conversions)
can be minimized in practice.


How it works
------------
The MAB is provided with a list of levers each with their expected conversion rate, which the 
bandit will discover over repeated attempts.

The "Auto" button on the page starts the test for each module.  A random number is generated 
and compared to the expected conversion rate for the current lever, calling the _reward() or 
_skip() methods as appropriate.


Usage
-----
Example usage can be found in bandit.htm

