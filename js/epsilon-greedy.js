function epsilon_greedy() {
	return {
		levers: {
			//'color': [iterations, rewards, conversion rate (for testing)],
			//'purple': [1, 1, 0.23],
		},
		nLevers: 0,
		_bestLever: undefined,
		_totalIterations: 0,
		_totalRewards: 0,
		_current: undefined,
		epsilon: 0,
		$wrapper: undefined,
		init: function() {
			//populating epsilon and wrapper from arguments
			if (arguments.length) {
				for (argument in arguments[0]) {
					this[argument] = arguments[0][argument];
				}
			}

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
		_next: function() {
			/*
			 *	Resets the active lever by either displaying a random lever this.epsilon % of the time,
			 *	or displays the lever with the best conversion rate.
			 */
			this._drawResult();

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

				ratio = this.levers[lever][1] / this.levers[lever][0];
				if (ratio > bestRatio) {
					bestLever = lever;
					bestRatio = ratio;
				}
			}

			if (Math.random() < this.epsilon) {
				this._current = randLever;
			} else {
				this._current = bestLever;
			}

			this.levers[this._current][0] += 1;
			this._totalIterations += 1;
			this._bestLever = bestLever;

			this._drawMachine();
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
			 *	(badIterations * optimum conversion rate) - badPulls = regret
			 */
			if (typeof(this._bestLever) === 'undefined') {
				return 0;
			}
			var badIterations,
				badPulls,
				regret;

			badIterations = this._totalIterations - this.levers[this._bestLever][0];
			badPulls = this._totalRewards - this.levers[this._bestLever][1];
			regret = (badIterations * this.levers[this._bestLever][1] / this.levers[this._bestLever][0]) - badPulls;
			return regret;
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
			var $results = this.$wrapper.find('.results'),
				resultsHTML = '';

			resultsHTML +=	'<table><tbody><tr class="heading">' +
							'<td class="lever-name">' + 'Lever' +
							'</td><td class="lever-iterations">' + 'Iter' +
							'</td><td class="lever-pulls">' + 'Pulls' +
							'</td><td class="lever-conversion-rate">' + 'Rate' +
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
								'%</td></tr>';
			}
			resultsHTML +=	'<tr><td colspan=2>Regret:</td>' +
							'<td colspan=2>' +
							this._calculateRegret().toFixed(1) +
							'</td></tr></tbody></table>';
			$results.html(resultsHTML);
		}
	};
}