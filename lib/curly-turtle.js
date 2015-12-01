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
	var sourceIp;
   	try {
		sourceIp = request.headers["x-forwarded-for"] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress;
	} catch (error) {
		sourceIp = "unknown address";
	}
	console.log( "User from " + sourceIp + " requests " + request.method + " to " + request.headers.host + request.url + " , user agent: " + request.headers["user-agent"] );

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
			fs.readFile("./assets/static" + url.parse(request.url).pathname, function(error, file) {
				if (error) {
					renderAndRespond(request, response, { status: "Improper request address.", template: "error.html", httpCode: 404 });
				} else {
					renderAndRespond(request, response, { status: "static file", fileType: "application/octet-stream", file: file });
				}
			});
	}
}

function renderAndRespond(request, response, data) {

	var httpCode = 200;
	if (data.httpCode) {
		httpCode = data.httpCode;
	}
	var contentType = "text/html; charset=utf8";
	if (data.fileType) {
		contentType = data.fileType;
	}

	if (!data.template) {
		respondUser(data.file);
	} else {
		fs.readFile("./assets/template/" + data.template, "utf-8", function(error, template) {
			var renderer = new Liquid.Engine;
			renderer.parseAndRender(template, { search: data, program: programInfo }).then(respondUser);
		});
	}

	function respondUser(renderedPage) {

		var contentLength;
		if (Buffer.isBuffer(renderedPage)) {
			contentLength = renderedPage.length;
		} else {
			contentLength = Buffer.byteLength(renderedPage);
		}

		response.writeHead(httpCode, {
			"Content-Type": contentType,
			"Content-Length": contentLength
		});

		response.write(renderedPage);
		response.end();
		console.log("Complete. " + data.status);
	}
}

module.exports = {
	programInfo: programInfo,
	startServe: startServe
};
