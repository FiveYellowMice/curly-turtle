var url = require("url");
var querystring = require("querystring");
var jsdom = require("jsdom");

function extractResults(rawHTML, callback) {
	jsdom.env(rawHTML, function(error, window) {
		if (error) {
			callback({ status: "HTML parse error" });
		} else {
			try {
				var listElements = window.document.getElementById("ires").getElementsByClassName("g");

				var resultList = [];
				for (var i = 0; i < listElements.length; i++) {
					try {
						resultList.push(getResultInfo(listElements[i]));
					} catch (error) {
						console.log("Unable to get result info from: " + listElements[i].innerHTML.substring(0, 20) + "...");
					}
				}

				if (resultList.length === 0) {
					callback({ status: "No search results found." });
				} else {
					callback({ status: "success", resultList: resultList });
				}

			} catch (error) {
				callback({ status: "Did not get a page contains search results." });
			} finally {
				window.close();
			}

		}
	});
}

function getResultInfo(resultElement) {

	var title = resultElement.getElementsByClassName("r")[0].innerHTML.replace(/<(?:.|\n)*?>/gm, '');
	var link = querystring.parse(url.parse(resultElement.getElementsByClassName("r")[0].getElementsByTagName("a")[0].href).query).q;
	var description = resultElement.getElementsByClassName("st")[0].innerHTML;

	return {
		"title": title,
		"link": link,
		"description": description
	};
}

module.exports = extractResults;
