var http = require("http");
var https = require("https");
var url = require("url");

function getContent(link, callback) {

	var requestOptions = url.parse(link);
	requestOptions.headers = {
		"User-Agent": "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)"
	};

	if ( /https/.test(requestOptions.protocol) ) {
		var request = https.request(requestOptions, takeResponse);
	} else {
		var request = http.request(requestOptions, takeResponse);
	}

	function takeResponse(response) {
		console.log("Recieved HTTP status code " + response.statusCode);

		if (response.statusCode === 302 || response.statusCode === 301) {
			console.log("Redirect to " + response.headers.location);
			getContent(response.headers.location, callback);
		} else if (response.statusCode === 200) {
			var body = [];

			response.on("data", function(chunk) {
				body.push(chunk);
			});

			response.on("end", function() {
				callback({ status: "success", html: Buffer.concat(body).toString()});
			});
		} else {
			callback({ status: "Recieved HTTP status code " + response.statusCode });
		}

	}

	request.on("error", function(error) {
		callback({ status: "Request error: " + error.message });
	});

	request.end();
}

module.exports = getContent;
