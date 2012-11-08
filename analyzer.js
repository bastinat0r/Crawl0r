var http = require('http');
var util = require('util');
var stemmer = require('porter-stemmer').stemmer;

var tokens = {};
var totalTokens = 0;

function tokenize(text, cb) {
	tokenList = ("" + ("" + text).replace(/[^\w\d]/g, ' ')).toLowerCase().split(' ');
	for(var i in tokenList) {
		if(tokenList[i] !== "") {
			var stemm = stemmer(tokenList[i]);
			totalTokens++;
			if(totalTokens%1000 === 0)
				util.puts(totalTokens);
			if(typeof(tokens[stemm]) === 'undefined') {
				tokens[stemm] = 1;
			}
			else {
				tokens[stemm]++;
			}
		}
	}
	if(cb)
		cb();
};

function writeTokens(fn, cb) {
	if(!fn)
		fn = util.puts;
	var tuples = [];
	for (var i in tokens) {
		tuples.push([tokens[i], i]);
	}
	tuples = tuples.sort(function(a,b) {
		return - a[0] + b[0];
	});
	
	fn(totalTokens + ' tokens found.');
	fn('There are ' + tuples.length + ' distinct tokens');
	for(var i in tuples) {
		fn(tuples[i][0] + ' ' + tuples[i][1]);
	}
	if(cb)
		cb();
};

var srv = http.createServer(function(req, res) {
	if(req.method === "POST") {
		req.on('data', tokenize);
		req.on('end', function() {
			res.writeHead(200);
			res.end();
		});
	}

	if(req.method === "GET") {
		res.writeHead(200);
		writeTokens(function(str) {res.write(str + '\r\n');}, function(){res.end();})
	}
});
srv.listen(13337);
