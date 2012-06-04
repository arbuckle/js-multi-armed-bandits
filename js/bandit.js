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
		_getCBound: function(lever) {
			var avgRatio = this._totalRewards / this._totalIterations;
			var leverRatio = this.levers[lever][1] / this.levers[lever][0];
			var cBound = leverRatio + Math.sqrt(2 * Math.log(this._totalIterations) / this.levers[lever][0]);
			return cBound;
		},
		_getSignificance: function(lever) {
			/*
			 *	Determines the confidence bound for a given lever using calculations presented here:
			 *	http://www.chrisstucchio.com/blog/2012/bandit_algorithms_vs_ab.html
			 */
			function Phi3 (z, mu, sigma){return Phi((z-mu)/sigma);}function Phi(z){return 0.5 * (1 + erf(z / Math.sqrt(2)));}function erf(z){t = 1 / (1 + (0.5 * Math.abs(z)));ans = 1 - (t * Math.exp(((-1 * z) * z)- 1.26551223 + t * (1.00002368+ t * (0.37409196 + t * (0.09678418+ t * (-0.18628806 + t * (0.27886807+ t * (-1.13520398 + t * (1.48851587+ t * (-0.82215223+ t * (0.17087277)))))))))));if (z >= 0){res = ans;}else{res = - ans;};return res}function normdist(n, m,s){return 100*Phi3(n, m ,s);}
			 
			////////////////////////////////////////
			
			var lever_p = this.levers[lever][1] / this.levers[lever][0],
				other_p = (this._totalRewards - this.levers[lever][1]) / (this._totalIterations - this.levers[lever][0]),
				lever_se = lever_p * (1 - lever_p) / this.levers[lever][1],
				other_se = other_p * (1 - other_p) / (this._totalRewards - this.levers[lever][1]),
				floor95 = (lever_p - 1.65 * lever_se > 0) ? 0 : (lever_p - 1.65 * lever_se),
				ceiling95 = (lever_p + 1.65 * lever_se > 1) ? 1 : (lever_p + 1.65 * lever_se),
				zScore = (lever_p - other_p) / Math.sqrt(Math.pow(lever_se, 2)+Math.pow(other_se, 2)),
				p_value = normdist(zScore, 0, 1),
				sig95 = (p_value < 0.05 || p_value > 0.95) ? true : false,
				sig99 = (p_value < 0.01 || p_value > 0.99) ? true : false;
			
			return {
				lever_p: lever_p,
				other_p: other_p,
				lever_se: lever_se,
				other_se: other_se,
				floor95: floor95,
				ceiling95: ceiling95,
				zScore: zScore,
				p_value: p_value,
				sig95: sig95,
				sig99: sig99
			}


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
			var lever,
				stats,
				$results = this.$wrapper.find('.results'),
				regret = this._calculateRegret(),
				resultsHTML = '';

			resultsHTML +=	'<table><tbody><tr class="heading">' +
							'<td class="lever-name">' + 'Lever' +
							'</td><td class="lever-iterations">' + 'Iter' +
							'</td><td class="lever-pulls">' + 'Pulls' +
							'</td><td class="lever-stats">' + 'Rate' +
							'</td><td class="lever-stats">' + 'StdErr' +
							'</td><td class="lever-stats">' + 'zScore' +
							'</td><td class="lever-stats">' + 'p_value' +
							'</td><td class="lever-stats">' + '95% sig' +
							'</td><td class="lever-stats">' + '99% sig' +
							'</td></tr>';
			for (lever in this.levers) {
				stats = this._getSignificance(lever);
				resultsHTML +=	'<tr><td class="lever-name">' +
								lever +
								'</td><td class="lever-iterations">' +
								this.levers[lever][0] +
								'</td><td class="lever-pulls">' +
								this.levers[lever][1] +
								'</td><td class="lever-stats">' +
								stats.lever_p.toFixed(4) + 
								'%</td><td class="lever-stats">' +
								stats.lever_se.toFixed(6) +
								'</td><td class="lever-stats">' +
								stats.zScore.toFixed(4) + 
								'</td><td class="lever-stats">' +
								stats.p_value.toFixed(4) + 
								'</td><td class="lever-stats">' +
								stats.sig95 + 
								'</td><td class="lever-stats">' +
								stats.sig99 + 
								'</td><td class="lever-stats">' +
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