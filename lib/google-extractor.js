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

var url = require("url");
var querystring = require("querystring");
var jsdom = require("jsdom");

function extractResults(rawHTML, callback) {
	jsdom.env(rawHTML, function(error, window) {
		if (error) {
			callback({ status: "HTML parse error", template: "error.html", httpCode: 500 });
		} else {
			try {
				var keywords = window.document.getElementsByClassName("lst")[0].value;

				var resultInfo = window.document.getElementById("resultStats").innerHTML.match(/(?:\d{1,3}[,. ])*\d{1,3}/g);
				var resultStats = 0,
					pageNumber = 1;
				if (resultInfo.length === 2) {
					resultStats = Math.max(resultInfo[0].replace(/\D/g, ""), resultInfo[1].replace(/\D/g, ""));
					pageNumber = Math.min(resultInfo[0].replace(/\D/g, ""), resultInfo[1].replace(/\D/g, ""));
				} else if (resultInfo.length === 1) {
					resultStats = Number(resultInfo[0].replace(/\D/g, ""));
				}

				var listElements = window.document.getElementById("ires").getElementsByClassName("g");
				var resultList = [];
				for (var i = 0; i < listElements.length; i++) {
					try {
						resultList.push(getResultInfo(listElements[i]));
					} catch (error) {
						console.error(error);
					}
				}

				if (resultList.length === 0) {
					callback({ status: "No search results found.", template: "results.html", keywords: keywords });
				} else {
					callback({ status: "success", template: "results.html", keywords: keywords, resultstats: resultStats, pagenumber: pageNumber, results: resultList });
				}

			} catch (error) {
				callback({ status: "Did not get a page contains search results.", template: "error.html", httpCode: 500 });
			} finally {
				window.close();
			}

		}
	});
}

function getResultInfo(resultElement) {

	var result = {};

	result.title = resultElement.getElementsByClassName("r")[0].innerHTML.replace(/<(?:.|\n)*?>/gm, '');

	var rawLink = resultElement.getElementsByClassName("r")[0].getElementsByTagName("a")[0].href;
	if ( url.parse(rawLink).pathname === "/url" ) {
		result.link = querystring.parse(url.parse(rawLink).query).q;
	} else {
		result.link = "https://www.google.com" + rawLink;
	}

	var imageElements = resultElement.getElementsByTagName("div")[0].getElementsByTagName("img");
	if ( imageElements.length >= 2 ) {
		var images = [];
		for (var i = 0; i < imageElements.length; i++) {
			images.push({
				src: "/url?" + querystring.stringify({ q: imageElements[i].src }),
				alt: imageElements[i].alt,
				link: imageElements[i].title
			});
		}
		result.images = images;
	}

	try {
		var description = resultElement.getElementsByClassName("st")[0].innerHTML;
		if (description.length > 0) {
			result.description = description;
		}
	} catch (error) {}

	// Google's answers to questions
	if (resultElement.getElementsByClassName("Z_uXc").length > 0) {
		result.answer = resultElement.getElementsByClassName("Z_sPg")[0].innerHTML;
	}

	return result;
}

module.exports = extractResults;
