var http = require("http");
var url = require("url");
var getContent = require("./get-content.js");
var extractResults = require("./google-extractor.js");

function startServe(config) {
	console.log("Start serving on port " + config.port + "...");

	var server = http.createServer( function(request, response) {

		if ( url.parse(request.url).pathname === "/search" ) {
			console.log("Recieved a request from client.");

			getContent("https://www.google.com/search" + url.parse(request.url).search, function(googleResponse) {
				if (googleResponse.status === "success") {
					extractResults(googleResponse.html, function(extracted) {
						respondUser(request, response, extracted);
					});
				} else {
					respondUser(request, response, googleResponse);
				}
			});
		} else {
			respondUser(request, response, { status: "Improper request address.", httpCode: 404 });
		}
	});

	server.listen(config.port);
}

function respondUser(request, response, data) {

	var httpCode = 200;
	if (data.httpCode !== undefined) {
		httpCode = data.httpCode;
	}

	response.writeHead(httpCode, { "Content-Type": "text/plain" });

	if (data.status === "success") {
		response.write("Search complete.\n\n");
		for (var i = 0; i < data.resultList.length; i++) {
			var result = data.resultList[i];
			response.write(
				result.title + "\n" +
				result.link + "\n" +
				result.description + "\n\n"
			);
		}
	} else {
		response.write(data.status + "\n");
	}

	response.end();
}

module.exports = { startServe: startServe };
