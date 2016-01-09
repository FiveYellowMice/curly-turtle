/* Copyright (C) 2015 FiveYellowMice
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
var fs = require("fs");
var path = require("path");
var url = require("url");
var querystring = require("querystring");
var Liquid = require("liquid-node");
var mime = require("mime-types");
var getContent = require("./get-content.js");
var extractResults = require("./google-extractor.js");

var programInfo = {
	version: "1.0.0",
	address: "0.0.0.0",
	port: 8081,
	baseurl: ""
};

function startServe(config) {
	programInfo = config;

	var server;

	if (programInfo.sslkey && programInfo.sslcert){
		server = https.createServer({
			key: programInfo.sslkey,
			cert: programInfo.sslcert
		}, recievedRequest);
		console.log("HTTPS enabled.");
	} else {
		if (programInfo.sslkey || programInfo.sslcert) {
			console.log("Only one of SSL key or certificate found, fallback to HTTP.");
		}
		server = http.createServer(recievedRequest);
	}

	server.listen(programInfo.port, programInfo.address, function() {
		console.log("Start serving on " + programInfo.address + ":" + programInfo.port + " inside " + programInfo.baseurl.replace(/^$/, "/") +  " ...");
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
					extractResults(googleResponse.html.toString(), function(extracted) {
						renderAndRespond(request, response, extracted);
					});
				} else {
					renderAndRespond(request, response, googleResponse);
				}
			});
			break;

		case "/json":
			getContent("https://www.google.com/search" + url.parse(request.url).search, function(googleResponse) {
				if (googleResponse.status === "success") {
					extractResults(googleResponse.html.toString(), respondJSON);
				} else {
					respondJSON(googleResponse);
				}
				function respondJSON(data) {
					data.file = JSON.stringify(data, null, "\t");
					if (data.headers) {
						Object.assign(data.headers, {"Content-Type": "application/json; charset=utf-8"});
					} else {
						data.headers = {"Content-Type": "application/json; charset=utf-8"};
					}
					data.template = undefined;
					renderAndRespond(request, response, data);
				}
			});
			break;

		case "/url":
			var requestedUrl = querystring.parse(url.parse(request.url).query).q;
			if (requestedUrl) {
				getContent(requestedUrl, function(urlResponse) {
					if (urlResponse.status === "success") {
						renderAndRespond(request, response, { status: "proxied url", headers: urlResponse.headers, file: urlResponse.html });
					} else {
						renderAndRespond(request, response, urlResponse);
					}
				});
			} else {
				renderAndRespond(request, response, { status: "No URL found.", template: "error.html", httpCode: 404 });
			}
			break;

		case "":
			renderAndRespond(request, response, { status: "redirect", template: "redirect.html", httpCode: 302, headers: {"Location": pathname + "/"} });
			break;

		case "/":
			renderAndRespond(request, response, { status: "home page", template: "index.html" });
			break;

		default:
			fs.readFile(__dirname + "/../assets/static" + pathname.substring(programInfo.baseurl.length), function(error, file) {
				if (error) {
					renderAndRespond(request, response, { status: "Improper request address.", template: "error.html", httpCode: 404 });
				} else {
					var fileType = mime.contentType(path.extname(pathname)) || "application/octet-stream";
					renderAndRespond(request, response, { status: "static file", headers: { "Content-Type": fileType, "Cache-Control": "max-age=600" }, file: file });
				}
			});
	}
}

function renderAndRespond(request, response, data) {

	var httpCode = 200;
	if (data.httpCode) {
		httpCode = data.httpCode;
	}

	var headers = {
		"Content-Type": "text/html; charset=utf-8"
	};
	Object.assign(headers, data.headers);

	data.request = request;

	if (!data.template) {
		respondUser(data.file);
	} else {
		fs.readFile(__dirname + "/../assets/template/" + data.template, "utf-8", function(error, template) {
			var renderer = new Liquid.Engine;
			renderer.registerFilters({
				regrep: function(input, match, replacement) {
					try {
						var regex = new RegExp(match);
					} catch (error) {
						return input;
					}
					return input.replace(regex, replacement);
				}
			});
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
