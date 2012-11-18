var http = require('http');
var util = require('util');
var stemmer = require('porter-stemmer').stemmer;

var queryString = "fucking";
var opts = {
	host : 'localhost',
	port : 8091,
	method : 'GET'
};

var resultList;
var wordList = queryString.split(/\s/gi);

function queryWord(cb) {
	w = wordList.shift();
	util.puts(stemmer(w));
	if(typeof(w) === "undefined") {
		util.puts(JSON.stringify(wordList));
		return;
	}
	opts.path = '/buckets/'+stemmer(w)+'/index/$key/0/z'
	var req = http.request(opts, function(res) {
		var data = "";
		res.on('data', function(chunk) {
			data = data + chunk;
		});
		res.on('end', function() {
			if(res.statusCode == 200) {
				answer = JSON.parse(data);
				if(typeof(resultList) === "undefined") {
					if(answer.keys) {
						resultList = answer.keys;
					}
				} else {
					if(answer.keys) {
						resultList = resultList.filter(function(x) {
							return (answer.keys.indexOf(x) >= 0)
						});
					}
				
				}
				if(wordList.length > 0) {
					util.puts(resultList.length);
					queryWord(cb);
				} else {
					util.puts(resultList.length);
					cb(resultList);
				}
			} else {
				util.puts(opts.path);
				util.puts(res.statusCode);
			}
		});
	});
	req.end();
	req.on('error', util.puts);
}

queryWord(function(resultList) {
	util.puts(JSON.stringify(resultList) + '*');
});
