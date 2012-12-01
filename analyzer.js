require('v8-profiler');
var http = require('http');
var util = require('util');
var stemmer = require('porter-stemmer').stemmer;


var tokens = {};
var totalTokens = 0;
var numWords = 0;
var nodeSel = 0;

var stopwords = {
	the : 1,
	and : 1,
	you : 1,
	"for" : 1,
	that : 1,
	open : 1,
	thi  : 1,
	your : 1,
	"with" : 1,
	ar : 1,
	us : 1,
	nbsp : 1,
	from : 1,
	have : 1,
	can : 1
};

function tokenize(site, cb) {
	tokenList = site.text.toLowerCase().split(/\W+/gi);
	site.tokens = {};
	for(var i in tokenList) {
		if(tokenList[i].length > 2) {
			var stemm = stemmer(tokenList[i]);
			totalTokens++;
			if(totalTokens%10000 === 0)
				util.puts(totalTokens/1000 + 'k tokens');
			if(typeof(tokens[stemm]) === 'undefined') {
					tokens[stemm] = 1;
					numWords++;
			}
			else {
				tokens[stemm]++;
				if(tokens[stemm] % 30 === 0) {
					saveTokenNum(stemm);
				}
			}
			if(typeof(site.tokens[stemm]) === 'undefined') {
					site.tokens[stemm] = 1;
			}
			else {
				site.tokens[stemm]++;
			}
		}
	}
	if(cb)
		cb(site);
};

function writeTokens(fn, cb) {
	if(!fn)
		fn = util.puts;
	var tuples = [];
	for (var i in tokens) {
		if(tokens[i] > 5)
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
		var data = "";
		req.on('data', function(chunk){
			data = data + chunk;
		});
		req.on('end', function() {
			tokenize(JSON.parse(data), function(site) {
				for(var i in site.tokens) {
					if(tokens[i] > 3 && !stopwords[i]) {
						var opts = {
							host : 'localhost',
							port : 8091,
							path : '/riak/'+i+'/'+encodeURIComponent(site.url),
							method : 'PUT',
							headers : {'content-type' : 'application/json'}
						};
						var req = http.request(opts, function(res) {
					//		util.puts(JSON.stringify(res.headers));
					//		res.on('data', util.puts);
						});
						req.on('error', util.puts);
						req.end("" + site.tokens[i]);
					}
				}
			});
			//util.puts("foobar");
			res.writeHead(200);
			res.end();
		});
	}

	if(req.method === "GET") {
		util.puts(req.url);
		if(req.url !== "/json") {
			res.writeHead(200);
			writeTokens(function(str) {res.write(str + '\r\n');}, function(){res.end();})
		} else {
			res.writeHead(200);
			res.write(JSON.stringify(tokens));
		}
	}
});
srv.listen(13337);

function saveTokenNum(stemm) {
	var opts = {
		host : 'localhost',
		port : [8091,8092,8093,8094][nodeSel],
		path : '/riak/words/'+stemm,
		method : 'PUT',
		headers : {'content-type' : 'application/json'}
	};
	nodeSel++;
	nodeSel = nodeSel % 4;
	var req = http.request(opts, function(res) {
		res.on('data', util.puts);
	});
	req.on('error', util.puts);
	req.end("" + tokens[stemm]);
}
