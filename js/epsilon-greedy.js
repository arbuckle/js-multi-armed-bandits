function epsilon_greedy() {
	return {
		levers: {
			//'color': [iterations, rewards, conversion rate (for testing)],
			//'purple': [1, 1, 0.23],
		},
		nLevers: 0,
		_iterations: 0,
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
					bandito._iterations = 0;
					bandito._drawResult();
				}
			});

			this._next();
		},
		_autoInterval: undefined,
		_auto: function() {
			this._autoInterval = setInterval(function(bandito) {
				var selection = Math.random();
				if (bandito.levers[bandito._current][2] > selection) {
					bandito.$wrapper.find('.reward').trigger('click');
				} else {
					bandito.$wrapper.find('.skip').trigger('click');
				}
			}, 0, this);
		},
		_next: function() {
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
			this._iterations += 1;

			this._drawMachine();
		},
		_reward: function() {
			this.levers[this._current][1] += 1;
			this._next();
		},
		_drawMachine: function() {
			var $option = this.$wrapper.find('.machine > .option');
			$option.html(this._current);
			$option.css('border', '2px solid ' + this._current);
		},
		_drawResult: function() {
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
			resultsHTML += '</tbody></table>';
			$results.html(resultsHTML);
		}
	};
}