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

	var server = http.createServer(recievedRequest);

	server.listen(programInfo.port, function() {
		console.log("Start serving on port " + programInfo.port + " inside " + programInfo.baseurl.replace(/^$/, "/") +  " ...");
	});
}

function recievedRequest(request, response) {
	var sourceIp;
   	try {
		sourceIp = request.headers["x-forwarded-for"] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress;
	} catch (error) {
		sourceIp = "unknown address";
	}
	console.log( "User from " + sourceIp + " requests " + request.method + " to " + request.headers.host + request.url + " , user agent: " + request.headers["user-agent"] );

	var pathname = url.parse(request.url).pathname;
	if ( ! new RegExp("^" + programInfo.baseurl).test(pathname) ) {
		rejectUser(request, response);
	} else switch ( pathname.substring(programInfo.baseurl.length) ) {

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

		case "":
			renderAndRespond(request, response, { status: "redirect", template: "redirect.html", httpCode: 302, location: pathname + "/" });
			break;

		case "/":
			renderAndRespond(request, response, { status: "home page", template: "index.html" });
			break;

		default:
			var fileType = "application/octet-stream";
			switch ( pathname.replace(/^.*(?=\.)/, "") ) {
				case ".css":
					fileType = "text/css";
					break;
				case ".png":
					fileType = "image/png";
					break;
				case ".ico":
					fileType = "image/vnd.microsoft.icon";
					break;
			}
			fs.readFile(__dirname + "/../assets/static" + pathname.substring(programInfo.baseurl.length), function(error, file) {
				if (error) {
					renderAndRespond(request, response, { status: "Improper request address.", template: "error.html", httpCode: 404 });
				} else {
					renderAndRespond(request, response, { status: "static file", fileType: fileType, file: file });
				}
			});
	}
}

function renderAndRespond(request, response, data) {

	var httpCode = 200;
	var headers = {
		"Content-Type": "text/html; charset=utf-8"
	};

	if (data.httpCode) {
		httpCode = data.httpCode;
	}

	if (data.fileType) {
		headers["Content-Type"] = data.fileType;
	}

	if (data.location) {
		headers["Location"] = data.location;
	}

	if (!data.template) {
		respondUser(data.file);
	} else {
		fs.readFile(__dirname + "/../assets/template/" + data.template, "utf-8", function(error, template) {
			var renderer = new Liquid.Engine;
			renderer.parseAndRender(template, { search: data, program: programInfo }).then(respondUser);
		});
	}

	function respondUser(renderedPage) {

		if (Buffer.isBuffer(renderedPage)) {
			headers["Content-Length"] = renderedPage.length;
		} else {
			headers["Content-Length"] = Buffer.byteLength(renderedPage);
		}

		response.writeHead(httpCode, headers);
		response.write(renderedPage);
		response.end();
		console.log("Complete. " + data.status);
	}
}

function rejectUser(request, response) {

	var rejectPage = "<html>\n<head><title>404 Not Found</title></head>\n<body bgcolor=\"white\">\n<center><h1>404 Not Found</h1></center>\n<hr><center>nginx/1.8.0</center>\n</body>\n</html>\n";

	response.writeHead(404, {
		"Server": "nginx/1.8.0",
		"Content-Type": "text/html",
		"Content-Length": Buffer.byteLength(rejectPage)
	});

	response.write(rejectPage);
	response.end();
	console.log("Reject.");
}

module.exports = {
	programInfo: programInfo,
	startServe: startServe
};
