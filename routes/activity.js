"use strict";
var util = require("util");

// Deps
const Path = require("path");
const JWT = require(Path.join(__dirname, "..", "lib", "jwtDecoder.js"));
var util = require("util");
var http = require("https");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const jsesc = require('jsesc');

let campaignLookup = '';
exports.logExecuteData = [];

function logData(req) {
	exports.logExecuteData.push({
		body: req.body,
		headers: req.headers,
		trailers: req.trailers,
		method: req.method,
		url: req.url,
		params: req.params,
		query: req.query,
		route: req.route,
		cookies: req.cookies,
		ip: req.ip,
		path: req.path,
		host: req.host,
		fresh: req.fresh,
		stale: req.stale,
		protocol: req.protocol,
		secure: req.secure,
		originalUrl: req.originalUrl
	});
	console.log("body: " + util.inspect(req.body));
	console.log("headers: " + req.headers);
	console.log("trailers: " + req.trailers);
	console.log("method: " + req.method);
	console.log("url: " + req.url);
	console.log("params: " + util.inspect(req.params));
	console.log("query: " + util.inspect(req.query));
	console.log("route: " + req.route);
	console.log("cookies: " + req.cookies);
	console.log("ip: " + req.ip);
	console.log("path: " + req.path);
	console.log("host: " + req.host);
	console.log("fresh: " + req.fresh);
	console.log("stale: " + req.stale);
	console.log("protocol: " + req.protocol);
	console.log("secure: " + req.secure);
	console.log("originalUrl: " + req.originalUrl);
}

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
exports.edit = function(req, res) {
	// Data from the req and put it in an array accessible to the main app.
	//console.log( req.body );
	logData(req);
	res.send(200, "Edit");
};

/*
 * POST Handler for /save/ route of Activity.
 */
exports.save = function(req, res) {
	// Data from the req and put it in an array accessible to the main app.
	//console.log( req.body );
	logData(req);
	res.send(200, "Save");
};

/*
 * POST Handler for /execute/ route of Activity.
 */
exports.execute = function(req, res) {
	console.log("EXECUTE HAS BEEN RUN");

	// example on how to decode JWT
	JWT(req.body, process.env.jwtSecret, (err, decoded) => {
		// verification error -> unauthorized request
		if (err) {
			console.error(err);
			return res.status(401).end();
		}

		if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
			console.log("##### decoded ####=>", decoded);

			// decoded in arguments
			var decodedArgs = decoded.inArguments[0];
			
			campaignLookup = decodedArgs.campaignName; //This is the campaign name that will find the ID in service cloud
			
			//If the smsBoolean == false it means that it DID NOT OPT OUT of SMS.
			if (decodedArgs.smsBoolean !== 'True') {
				console.log('== This person is not Opt Out of SMS ==');
				soapRequest(decodedArgs);
			}

			logData(req);
			res.send(200, "Execute");
		} else {
			console.error("inArguments invalid.");
			return res.status(400).end();
		}
	});
};

/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = function(req, res) {
	// Data from the req and put it in an array accessible to the main app.
	//console.log( req.body );
	logData(req);
	res.send(200, "Publish");
};

/*
 * POST Handler for /validate/ route of Activity.
 */
exports.validate = function(req, res) {
	// Data from the req and put it in an array accessible to the main app.
	//console.log( req.body );
	logData(req);
	res.send(200, "Validate");
};

/*
 * POST Handler for /Stop/ route of Activity.
 */
exports.stop = function(req, res) {
	// Data from the req and put it in an array accessible to the main app.
	//console.log( req.body );
	logData(req);
	res.send(200, "Stop");
};

/*
 * GET Handler for requesting the template type.
 */
exports.requestTemplate = function(req, res) {
	const tokenURL =
		"https://mcrcd9q885yh55z97cmhf8r1hy80.auth.marketingcloudapis.com/v2/token";
	// const queryURL = 'https://mcrcd9q885yh55z97cmhf8r1hy80.rest.marketingcloudapis.com/asset/v1/content/categories';
	const queryURL =
		"https://mcrcd9q885yh55z97cmhf8r1hy80.rest.marketingcloudapis.com/asset/v1/content/assets?$pageSize=2500&$page=1&$orderBy=name";
    

	var axios = require("axios");
	axios
		.post(tokenURL, {
			// Retrieving of token
			grant_type: 'client_credentials',
			client_id: "o2wcejetsruqh3z5wsgiramx",
			client_secret: "PNusOD7s996J2LGivME9K5FV"
		})
		.then(function(response) {
			let accessToken = response.data["access_token"]; // After getting token, parse it through to grab the individual categories

			axios
				.get(queryURL, {
					//Query of Individual items
					headers: { Authorization: `Bearer ${accessToken}` }
				})
				.then(response => {
					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify(response.data, null, 3));
				})
				.catch(function(error) {
					console.log(error);
				});
		})
		.catch(function(error) {
			console.log(error);
		});
};

function soapRequest(decodedArgs) {
	var str =
		'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:send="http://send_sms.vienthongdidong.vn/">' +
		"<soapenv:Header/>" +
		"<soapenv:Body>" +
		"<send:send>" +
		"<USERNAME>ABSalesforce</USERNAME>" +
		"<PASSWORD>Salesforce</PASSWORD>" +
		"<BRANDNAME>" + decodedArgs.brandNames + "</BRANDNAME>" +
		"<MESSAGE>" + decodedArgs.textMessage.toString() + "</MESSAGE>" +
		"<TYPE>1</TYPE>" +
		"<PHONE>" + decodedArgs.phoneNumber + "</PHONE>" +
		"<IDREQ>" + decodedArgs.phoneNumber + "</IDREQ>" +
		"</send:send>" +
		"</soapenv:Body>" +
		"</soapenv:Envelope>";

	function createCORSRequest(method, url) {
		var xhr = new XMLHttpRequest();
		if ("withCredentials" in xhr) {
			xhr.open(method, url, false);
		} else if (typeof XDomainRequest != "undefined") {
			alert;
			xhr = new XDomainRequest();
			xhr.open(method, url);
		} else {
			console.log("CORS not supported");
			alert("CORS not Supported");
			xhr = null;
		}
		return xhr;
	}

	var xhr = createCORSRequest(
		"POST",
		"http://210.211.109.118/apibrandname/send?wsdl"
	);
	if (!xhr) {
		console.log("XHR issue");
		return;
	}

	xhr.onload = function() {
		var results = xhr.responseText;
		console.log("responseText", results);
		
		let singleQuoteRegex = /'/g;
		let regexExp = /<result>0<\/result>/gmi;
		let regexResponse = results.search(regexExp); //This is either a -1 if the word 'success' is not present
		
		console.log('CAMPAIGN LOOKUP >>',campaignLookup);

		if (regexResponse !== -1) { //If its not -1 success is present
			console.log('this is a success');
			sendingToSFDC('Completed', decodedArgs.campaignName, decodedArgs.contactID, decodedArgs.shortMsg.replace(singleQuoteRegex, '&#39;') );
		} else {
			console.log('this is not success');
			sendingToSFDC('Failed', decodedArgs.campaignName, decodedArgs.contactID, decodedArgs.shortMsg.replace(singleQuoteRegex, '&#39;') );
		}
	};
	console.log("SOAP MESSAGE", str);
	xhr.setRequestHeader("Content-Type", "text/xml");
	xhr.send(str);
}


// sendingToSFDC('Completed','PH5.2 – Lapsed User Promo 3 – Similac', '0030k00000oQzQiAAK');
// statusOfMsg = Completed || Failed
function sendingToSFDC (statusOfMsg, campaignName, contactID, messageName) { //Function to connect to postgres Heroku Connect
    const { Pool } = require('pg');
    const connectionString = 'postgres://uv3bf39oboo6i:p17596604ecf6ea97e986f03bcb98f289de47a34cecc556e3703f27c088838798@ec2-52-197-48-67.ap-northeast-1.compute.amazonaws.com:5432/dadpcdirgrberd';
    const pool = new Pool({
        connectionString: connectionString
    });

	console.log('CAMPAIGN NAME >>',campaignName);
    // INSERT INTO Customer (FirstName, LastName) VALUES ('Anita', 'Coats')
    let queryCampaignID = `SELECT sfid, name FROM salesforcetest.Campaign WHERE Name = '${campaignName}'`;
    
    pool.query(queryCampaignID, (err, res) => {
		console.log('===== Querying Rows =====');
		console.log('QUERY RES >> ',res);
		if(res.rows[0] !== undefined) {
			console.log('ID of the result >>> ',res.rows[0].sfid);
			console.log('Name of the result >>> ',res.rows[0].name);
			let campaignID = res.rows[0].sfid;

			let insertMobileSend = `INSERT INTO salesforcetest.et4ae5__SMSDefinition__c (et4ae5__Campaign__c, et4ae5__Contact__c, et4ae5__SendStatus__c, et4ae5__Campaigns__c, et4ae5__smsName__c) VALUES ('${campaignID}', '${contactID}', '${statusOfMsg}', '${campaignName}', '${messageName}') `;
			pool.query(insertMobileSend, (err, res) => {
				console.log(err, res);
				pool.end();
			});
		}
    });
}