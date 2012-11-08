var http = require('http');

var hosts = ['blog.bastinat0r.de'];
var done = [];

var srv = http.createServer(function(req, res) {
	var data = "";
	req.on('data', function(chunk) {
		data = data + chunk;	
	});
	req.on('end', function() {
		if(req.method == "POST") {
			res.writeHead(200);
			res.end();
			if(done.indexOf(data) < 0) {
				hosts.push(data);
			}
		}
		if(req.method == "GET") {
			if(hosts.length > 0) {
				res.writeHead(200);
				var host = hosts.shift();
				done.push(host);
				res.write(host);
			}
			else {
				res.writeHead(404);
			}
		}
	});
});
srv.listen(13335);
