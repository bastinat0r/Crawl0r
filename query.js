var http = require('http');
var util = require('util');

var opts = {
	host : 'localhost',
	port : 8091,
	method : 'GET'
};

var result = {
		list : null,
		df : {}
};

wordList = [];

function queryWord(cb) {
	w = wordList.shift();
	util.puts(w);
	if(typeof(w) === "undefined") {
		util.puts(JSON.stringify(wordList));
		return;
	}
	opts.path = '/buckets/'+w+'/index/$key/0/z'
	var req = http.request(opts, function(res) {
		var data = "";
		res.on('data', function(chunk) {
			data = data + chunk;
		});
		res.on('end', function() {
			if(res.statusCode == 200) {
				answer = JSON.parse(data);
				if(result.list == null) {
					if(answer.keys) {
						result.list = answer.keys;
					}
				} else {
					if(answer.keys) {
						result.list = result.list.filter(function(x) {
							return (answer.keys.indexOf(x) >= 0)
						});
					}
				}
				result.df[w] = answer.keys.length;
				if(wordList.length > 0) {
					util.puts(result.list.length);
					queryWord(cb);
				} else {
					util.puts(result.list.length);
					cb(result.list);
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

var srv = http.createServer(function(req, res) {
	var data = "";
	req.on('data', function(chunk) {
		util.puts(chunk);
		data = data + chunk;
	});

	req.on('end', function() {
		result.list = null;
		wordList = JSON.parse(data);
		util.puts(data);
		queryWord(function() {
			res.writeHead(200);
			res.end(JSON.stringify(result.list));
		});
	});
});
srv.listen(13334);


