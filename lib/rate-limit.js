/* Copyright (C) 2016 FiveYellowMice
 *
 * This file is part of Curly Turtle.
 *
 * Curly Turtle is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Curly Turtle is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have recieved a copy of the GNU General Public Licanse
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function RateLimit(rate) {
	this.setRate = (newRate) => {
		if (newRate && typeof newRate === "number") {
			this._rate = newRate;
		} else {
			throw new TypeError("Rate should be a number.");
		}
	}

	this.getRate = () => { return this._rate; }

	this.update = () => {
		var thisTime = Date.now();

		if (thisTime - this._lastTime <= this._rate) {
			return false;
		} else {
			this._lastTime = thisTime;
			return true;
		}
	}

	this.clean = () => {
		this._lastTime = undefined;
	}

	this._lastTime = 0;
	this._rate = 10000;
	if (rate) this.setRate(rate);
}

module.exports = RateLimit;
