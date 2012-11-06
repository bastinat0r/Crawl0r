var http = require('http');
var util = require('util');

var srv = http.createServer(function(req, res) {
	var data = "";
	req.on('data', function(chunk){
		data = data + chunk;
	});
	req.on('end', function(){
		res.writeHead(200);
		res.end();
		var site = JSON.parse(data);
		var body = /\<body(.|[\n\r])*\<\/body/gi.exec(site.text);
		if(!body) {
			body = site.text; 
			util.puts(body);
			util.puts('nobody');
		}
		else {
			body = "" + body;
		}
		body = "" + (""+ body).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>*/gi, '');
		var stripped = body.replace(/\<[^\>]*>/g,'').replace(/\{[^\}]*}/g,'');
		var analyzerOpts = {
			host : "localhost",
			port : "13337",
			method : "POST",
			path : "/"
		};
		var analyzerReq = http.request(analyzerOpts);
		analyzerReq.end(stripped);
	});
});
srv.listen(13336);
