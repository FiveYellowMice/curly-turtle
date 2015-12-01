var http = require("http");
var fs = require("fs");
var url = require("url");
var Liquid = require("liquid-node");
var getContent = require("./get-content.js");
var extractResults = require("./google-extractor.js");

var programInfo = {
	version: "0.0.1",
	port: 8081,
	baseurl: ""
};

function startServe(config) {
	programInfo = config;

	console.log("Start serving on port " + programInfo.port + "...");

	var server = http.createServer(recievedRequest);

	server.listen(programInfo.port);
}

function recievedRequest(request, response) {
	console.log( "User requests " + request.method + " to " + request.headers.host + request.url + " , user agent: " + request.headers["user-agent"] );

	switch ( url.parse(request.url).pathname ) {

		case "/search":
			getContent("https://www.google.com/search" + url.parse(request.url).search, function(googleResponse) {
				if (googleResponse.status === "success") {
					extractResults(googleResponse.html, function(extracted) {
						renderAndRespond(request, response, extracted);
					});
				} else {
					renderAndRespond(request, response, googleResponse);
				}
			});
			break;

		case "/":
			renderAndRespond(request, response, { status: "home page", template: "index.html" });
			break;

		default:
			renderAndRespond(request, response, { status: "Improper request address.", template: "error.html", httpCode: 404 });
	}
}

function renderAndRespond(request, response, data) {

	var httpCode = 200;
	if (data.httpCode !== undefined) {
		httpCode = data.httpCode;
	}

	fs.readFile("./assets/template/" + data.template, "utf-8", function(error, template) {
		var renderer = new Liquid.Engine;
		renderer.parseAndRender(template, { search: data, program: programInfo }).then(respondUser);
	});

	function respondUser(renderedPage) {
		response.writeHead(httpCode, {
			"Content-Type": "text/html; charset=utf-8",
			"Content-Length": Buffer.byteLength(renderedPage)
		});

		response.write(renderedPage);
		response.end();
		console.log("Complete, " + data.status);
	}
}

module.exports = {
	programInfo: programInfo,
	startServe: startServe
};
