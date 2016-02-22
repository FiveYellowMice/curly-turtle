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

var http = require("http");
var https = require("https");
var url = require("url");

function getContent(link, callback, redirectLimit) {

	var requestOptions = url.parse(link);
	requestOptions.headers = {
		"User-Agent": "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)"
	};

	if (redirectLimit === undefined) redirectLimit = 5;

	if ( /https/.test(requestOptions.protocol) ) {
		var request = https.request(requestOptions, takeResponse);
	} else {
		var request = http.request(requestOptions, takeResponse);
	}

	function takeResponse(response) {
		console.log("Recieved HTTP status code " + response.statusCode);

		if ((response.statusCode === 302 || response.statusCode === 301) && redirectLimit > 0) {
			console.log("Redirect to " + response.headers.location);
			getContent(response.headers.location, callback, redirectLimit - 1);
		} else if (response.statusCode === 200) {
			var body = [];

			response.on("data", function(chunk) {
				body.push(chunk);
			});

			response.on("end", function() {
				callback({ status: "success", headers: { "Content-Type": response.headers["content-type"] }, html: Buffer.concat(body)});
			});
		} else {
			callback({ status: "Recieved HTTP status code " + response.statusCode, template: "error.html", httpCode: 502 });
		}

	}

	request.on("error", function(error) {
		callback({ status: "Request error: " + error.message, template: "error.html", httpCode: 502 });
	});

	request.end();
}

module.exports = getContent;
