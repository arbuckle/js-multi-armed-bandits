function bandit() {
	return {
		levers: {
			//'color': [iterations, rewards, conversion rate (for testing)],
			//'purple': [1, 1, 0.23],
		},
		nLevers: 0,
		_bestLever: undefined,
		_totalIterations: 1,
		_totalRewards: 0,
		_current: undefined,
		_epsilon: 1,
		_epsilonOriginal: 1,
		$wrapper: undefined,
		init: function() {
			//populating epsilon and wrapper from arguments
			if (arguments.length) {
				for (argument in arguments[0]) {
					this[argument] = arguments[0][argument];
				}
			}
			this._epsilonOriginal = this._epsilon;

			//getting the number of levers
			var lever,
				count = 0;
			for (lever in this.levers) {
				count += 1;
			}
			this.nLevers = count;

			//bindings for HTML control elements. (consider building HTML within the module)
			this.$wrapper.on('click', '.reward', {'bandito': this}, function(event) {
				event.data['bandito']._reward();
			}).on('click', '.skip', {'bandito': this}, function(event) {
				event.data['bandito']._next();
			}).on('click', '.auto', {'bandito': this}, function(event) {
				$(this).attr('disabled', 'disabled');
				event.data['bandito']._auto();
			}).on('click', '.stop', {'bandito': this}, function(event) {
				xx = event.data['bandito'].$wrapper.find('.auto');
				event.data['bandito'].$wrapper.find('.auto').attr('disabled', false);
				clearInterval(event.data['bandito']._autoInterval);
			}).on('click', '.reset', {'bandito': this}, function(event) {
				var lever,
					bandito = event.data['bandito'];
				for (lever in bandito.levers) {
					this._epsilon = this._epsilonOriginal;
					bandito.levers[lever][0] = 1;
					bandito.levers[lever][1] = 1;
					bandito._totalIterations = 0;
					bandito._totalRewards = 0;
					bandito._drawResult();
				}
			});

			this._next();
		},
		_autoInterval: undefined,
		_auto: function() {
			/*
			 *	Automatically performs many iterations of the test using the conversion rates provided in levers.color[2]
			 */
			this._autoInterval = setInterval(function(bandito) {
				var selection = Math.random();
				if (bandito.levers[bandito._current][2] >= selection) {
					bandito.$wrapper.find('.reward').trigger('click');
				} else {
					bandito.$wrapper.find('.skip').trigger('click');
				}
			}, 0, this);
		},
		_resetEpsilon: function() {
			/*
			 *	This method can be overridden in order to calculate a new value for epsilon with each iteration.
			 */
			this._epsilon = this._epsilon;
		},
		_next: function() {
			/*
			 *	Resets the active lever by either displaying a random lever this.epsilon % of the time,
			 *	or displays the lever with the best conversion rate.
			 */
			this._drawResult();
			this._resetEpsilon();

			var lever,
				ratio,
				bestLever,
				bestRatio = 0,
				count = 0,
				randLever = Math.floor((Math.random()*this.nLevers)+1);

			for (lever in this.levers) {
				count += 1;
				if (count === randLever) {
					randLever = lever;
				}
				
				ratio = this._getLeverScore(lever);
				if (ratio > bestRatio) {
					bestLever = lever;
					bestRatio = ratio;
				}
			}

			if (Math.random() < this._epsilon) {
				this._current = randLever;
			} else {
				this._current = bestLever;
			}

			this.levers[this._current][0] += 1;
			this._totalIterations += 1;
			this._bestLever = bestLever;

			this._drawMachine();
		},
		_getLeverScore: function(lever) {
			/*
			 *	Returns a lever "score" which is used to determine which lever is best
			 *	High score wins.
			 */
			return this.levers[lever][1] / this.levers[lever][0];
		},
		_reward: function() {
			/*
			 *	Increments the reward counter
			 */
			this.levers[this._current][1] += 1;
			this._totalRewards += 1;
			this._next();
		},
		_calculateRegret: function() {
			/*
			 *	Regret P after T rounds is defined as the difference between the reward sum associated with an optimal strategy
			 *	and the sum of the collected rewards. Basically,
			 *	(badIterations • optimum conversion rate) - badPulls = regret
			 *	Also returns the regret expressed as a percentage of all pulls.
			 */
			if (typeof(this._bestLever) === 'undefined') {
				return {total: 0, percentage: 0};
			}
			var badIterations,
				badPulls,
				regret;

			badIterations = this._totalIterations - this.levers[this._bestLever][0];
			badPulls = this._totalRewards - this.levers[this._bestLever][1];
			regret = (badIterations * this.levers[this._bestLever][1] / this.levers[this._bestLever][0]) - badPulls;
			return {
				total: regret,
				percentage: regret / this._totalRewards
			};
		},
		_getSignificance: function(lever) {
			/*
			 *	Determines the confidence bound for a given lever using calculations presented here:
			 *	http://www.chrisstucchio.com/blog/2012/bandit_algorithms_vs_ab.html
			 */
			var avgRatio = this._totalRewards / this._totalIterations;
			var leverRatio = this.levers[lever][1] / this.levers[lever][0];
			
			var cBound = leverRatio + Math.sqrt(2 * Math.log(this._totalIterations) / this.levers[lever][0]);
			
			return cBound;
		},
		_drawMachine: function() {
			/*
			 * Updates the UI to display the currently selected lever.
			 */
			var $option = this.$wrapper.find('.machine > .option');
			$option.html(this._current);
			$option.css('border', '2px solid ' + this._current);
		},
		_drawResult: function() {
			/*
			 * Updates the UI to display the results of the series of tests
			 *
			 */
			if (this._totalIterations > 1 && this._totalIterations % 100 !== 0) {
				return;
			}
			
			var lever,
				$results = this.$wrapper.find('.results'),
				regret = this._calculateRegret(),
				resultsHTML = '';

			resultsHTML +=	'<table><tbody><tr class="heading">' +
							'<td class="lever-name">' + 'Lever' +
							'</td><td class="lever-iterations">' + 'Iter' +
							'</td><td class="lever-pulls">' + 'Pulls' +
							'</td><td class="lever-conversion-rate">' + 'Rate' +
							'</td><td class="lever-statistical-significance">' + 'Sig' +
							'</td></tr>';
			for (lever in this.levers) {
				resultsHTML +=	'<tr><td class="lever-name">' +
								lever +
								'</td><td class="lever-iterations">' +
								this.levers[lever][0] +
								'</td><td class="lever-pulls">' +
								this.levers[lever][1] +
								'</td><td class="lever-conversion-rate">' +
								(this.levers[lever][1]  / this.levers[lever][0]).toFixed(4) +
								'%</td><td class="lever-statistical-significance">' +
								this._getSignificance(lever).toFixed(6) +
								'</td></tr>';
			}
			//adding Regret calculation
			resultsHTML +=	'<tr><td colspan=2>Regret:</td>' +
							'<td>' +
							regret['total'].toFixed(1) +
							'</td><td>' +
							regret['percentage'].toFixed(3) +
							'</td></tr>';
			
			//Adding current Epsilon value
			resultsHTML +=	'<tr><td colspan=2>Epsilon:</td>' +
							'<td colspan=2>' +
							this._epsilon.toFixed(4) +
							'</td></tr>';
							
			resultsHTML +=	'</tbody></table>';
			
			$results.html(resultsHTML);
		}
	};
}