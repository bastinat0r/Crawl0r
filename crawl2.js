var http = require('http');
var util = require('util');
var url = require('url');

var done = [];
var hosts = [];
var garbage = /(\.(ico|rss|atom|gif|jpg|jpeg|png|css|js|json|yaml|bin|exe|sh|xml|pdf|mp3|m3u|mp4|mpeg|mpg|mov|opus|aac|java|o|tar|gz|zip|rar|torrent|min)|(twitter))/i;

function crawlHost() {
	var host = {
		url : hosts.shift(),
	};
	var internalUrls = ['/'];
	http.get('http://' + host.url + '/robots.txt', function(res) {
		var data = "";
		res.on('data', function(chunk) {
			data = data + chunk;
		});
		res.on('end', function() {
			// Looks Like
			
			// User-agent: *
			// Allow: /search
			// Disallow: /search/realtime
			// Disallow: /search/users
			// Disallow: /search/*/grid
			
			data = "" + /User\-agent\s*\:\s*\*(.|[\n\r])*/i.exec(data);
			data = data.replace(/User\-agent\s*\:\s*\*.*/i, '');
			data = data.replace(/User\-agent(.|[\r\n])*/i, '');
			var disallow = [];
			var r = /disallow\s*\:.*/i;
			while(r.test(data)) {
				d = r.exec(data);
				data = data.replace(d, '');
				d = ("" + d).replace(/(\s|disallow\s*\:)/gi, '');
				if(/\*/.test(d)) {
					var s = d.split('*');
					for(var i in s)
						disallow.push(s[i]);
				} else {
					disallow.push("" + d);
				}
			}
			host.disallow = disallow;
			r = /allow\s*\:.*/i;
			while(r.test(data)) {
				d = r.exec(data);
				data = data.replace(d, '');
				d = ("" + d).replace(/(\s|allow\s*\:)/gi, '');
				if(/^\//.test(d)) {
					internalUrls.push(d);
				}
			}
			util.puts(JSON.stringify(internalUrls));
			util.puts(JSON.stringify(disallow));
			crawlInternal(host, internalUrls);
		});
	});
};

function crawlInternal(host, internalUrls) {
	var internalDone = [];
	while(internalUrls.length > 0) {
		current = internalUrls.shift();
		if(!internalDone.indexOf(current) >= 0) {
			internalDone.push(current);
			var req = http.get('http://' + host.url + current, function(res) {
				var data = "";
				res.on('data', function(chunk) {
					data = data + chunk;
				});
				res.on('end', function() {
					
				});
			});
			req.on('error', function(e) {
				util.puts(e);
				util.puts('http://' + host.url + current);
			});
		}
	}
};

hosts = ['twitter.com'];
crawlHost();

function crawl(count) {
	if(done.indexof(urls[0]) >= 0) {
		urls.shift();
		crawl(count);
	} else {
		var currenturl = urls.shift();
		done.push(currenturl);
		var req = http.get(currenturl, function(res) {
			var opts = url.parse(currenturl);
			var baseurl = opts.protocol + "//"+ opts.host;
			if(hosts.indexof(opts.host) < 0) {
				hosts.push(opts.host);
			}
			var text = "";
			if(res.headers["content-type"])
				if(/(text\/plain|text\/html)/i.test(res.headers["content-type"]))
					res.on('data',  function(data) {
						text = text + data;
						var href = ("" + /href=\"[^\"]*\"/ig.exec(data)).split("\"");
						if(href) {
							if(href[1]) {
								if(!/[#\?\&\=\;]/.test(href[1])) {
									if(/^\/[^\/]/.test(href[1])) {
										href[1] = baseurl + href[1];
									}
									if(/^http:\/\/.*[\w\d\/]$/.test(href[1]) && !garbage.test(href[1])) {
										urls.push(href[1]);
									}
								}
							}
						}
					});
			res.on('end', function() {
				var title = ("" + /\<title\>[^\<]*\<\/title\>/i.exec(text)).replace(/\<[^\<]*\>/ig,'');
				var site = {
					url : currenturl,
					title : title,
					statuscode : res.statuscode,
					headers : res.headers,
					text : text,
				}
				var postopts = {
					host : "localhost",
					port : "13336",
					method : "post",
					path : "/"
				};
				util.puts(currenturl);
				var postreq = http.request(postopts);
				postreq.end(json.stringify(site));
				postreq.on('error', util.puts);
				if(typeof(count) !== "undefined")
					if(count > 0)
						crawl(count - 1);
					else {
						util.puts(done.length + " wobsites were crawled:");
						for(var i in hosts)
							util.puts(hosts[i]);
					}
			});

		});
		req.on('error', function(err) {
			util.puts(err + ": "+ urls[0]);
		});
	}
};
