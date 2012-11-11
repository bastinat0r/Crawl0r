var http = require('http');
var util = require('util');

var hosts = ['blog.bastinat0r.de'];
var done = [];

var startTime = new Date();

var srv = http.createServer(function(req, res) {
	var data = "";
	req.on('data', function(chunk) {
		data = data + chunk;	
	});
	req.on('end', function() {
		if(req.method == "POST") {
			res.writeHead(200);
			res.end();
			if(done.indexOf(data) < 0 && hosts.indexOf(data) < 0) {
				hosts.push(data);
			}
		}
		if(req.method == "GET") {
			if(req.url != '/lists') {
				util.puts(done.length + " : " + hosts.length);
				var dps = done.length * 1000.0 / (new Date() - startTime); 
				util.puts(dps + ' dps');
				util.puts(dps * 3600 + 'dph');
				if(hosts.length > 0) {
					res.writeHead(200);
					var host = hosts.shift();
					done.push(host);
					res.end(host);
				}
				else {
					res.writeHead(404);
					res.end();
				}
			} else {
				res.writeHead(200);
				res.write('Done: ' + done.length + ' \n');
				for(var i in done)
					res.write(done[i]+'\n');
				res.write('Hosts: ' + hosts.length + '\n');
				for(var i in hosts)
					res.write(hosts[i] + '\n');
				res.end();
			}
		}
	});
});
srv.listen(13335);
