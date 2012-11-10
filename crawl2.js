var http = require('http');
var util = require('util');
var url = require('url');
var timer = require('timers');

var done = [];
var hosts = ['blog.bastinat0r.de'];
var garbage = /(\.(ico|rss|atom|gif|jpg|jpeg|png|css|js|json|yaml|bin|exe|sh|xml|pdf|mp3|m3u|mp4|mpeg|mpg|mov|opus|aac|java|o|tar|gz|zip|rar|torrent|min|xrd)|(wikipedia)|#)/i;

function crawlHost() {
	var getHost = http.get('http://localhost:13335', function(resHost) {
		if(resHost.statusCode < 400) {
			var data = "";
			resHost.on('data', function(chunk) {
				data = data + chunk;
				util.puts(data);
			});
			resHost.on('end', function() {
				var host = {
					url : data
				};
				done.push(data);
				util.puts(host.url);
				var internalUrls = ['/'];
				var get = http.get('http://' + host.url + '/robots.txt', function(res) {
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
						var temp = data.match(/disallow\s*\:.*/gi);
						for(i in temp) {
							var regex = temp[i].replace(/disallow\s*:\s*/i, '');
							regex = regex.replace(/[\+\?\.\(\)\{\}\/\\\|\$\^]/gi, '\\$&');
							regex = regex.replace(/\*/gi, '.*');
							disallow.push(new RegExp(regex, 'i'));
						}
						host.disallow = disallow;
						temp = data.match(/\nallow\s*\:\s*\/.*/gi);
						for(i in temp) {
							internalUrls.push(temp[i].replace(/\nallow\s*\:\s*/i,''));
						}
						crawlInternal(host, internalUrls);
					});
				});
				get.on('error', function(e) {
					util.puts(e);
				});
			});
		} else {
			util.puts("no urls could be fetched.");
			timer.setTimeout(crawlHost, 2000);
		}
	}).on('error', function(e) {
		util.puts(e);
		timer.setTimeout(crawlHost, 2000);
	});
};

function crawlInternal(host, internalUrls, internalDone) {
	if(internalDone == null)
		internalDone = [];
	if(internalUrls.length == 0) {
		crawlHost();
		return;
	}
	current = internalUrls.shift();
	if(internalDone.indexOf(current) >= 0) {
		util.puts('duplicate url: ' + current);
		crawlInternal(host, internalUrls, internalDone);
	}
	else {
		util.puts('  ' + current);
		internalDone.push(current);
		var req = http.get('http://' + host.url + current, function(res) {
			if(!(res.statusCode < 300 && res.headers["content-type"] != null && /text\/(plain|html)/.test(res.headers["content-type"]))) {
				util.puts('    ' + res.statusCode);
				util.puts('    ' + res.headers["content-type"]);
				if(res.statusCode < 304 || res.statusCode == 307) {
					href = "\<a\s[^\>]*href=\"" + res.headers["location"] + "\"";
					scrapeUrls(href, host, internalUrls, internalDone);
				} else {
					crawlInternal(host, internalUrls, internalDone);
				}
			} else {
				var data = "";
				res.on('data', function(chunk) {
					data = data + chunk;
				});
				res.on('end', function() {
					if(/[\.\s\(](of|and|for|is|on|that|der|die|das|und|oder)[\.\,\s\)]/i.test(data)) {
						scrapeUrls(data, host, internalUrls, internalDone);
						var site = {
							url : 'http://' + host.url + current,
							statuscode : res.statusCode,
							headers : res.headers,
							text : data,
						};
						var postopts = {
							host : "localhost",
							port : "13336",
							method : "post",
							path : "/"
						};
						var postreq = http.request(postopts);
						postreq.end(JSON.stringify(site));
						postreq.on('error', util.puts);

					} else {
						crawlInternal(host, internalUrls, internalDone);
					}
				});
			}
		});
		req.on('error', function(e) {
			util.puts('*' + e);
			util.puts('http://' + host.url + current);
			crawlInternal(host, internalUrls, internalDone);
		});
	}
};

function scrapeUrls(text, host, internalUrls, internalDone) {
	var hrefs = text.match(/href=\"[^\"]*\"/ig);
	for(var i in hrefs) {
		var href = hrefs[i].replace(/(href=\"|"$)/gi, '');
		if(/^http\:\/\//i.test(href)){
			var parse = url.parse(href);
			if(parse.host == host.url) {
				href = parse.path;
			} else	if(hosts.indexOf(parse.host) < 0 && done.indexOf(parse.host) < 0) {
				var reqOpts = {
					host : 'localhost',
					port : 13335,
					method : 'POST',
				}
				var req = http.request(reqOpts);
				req.end(parse.host);
				util.puts('    ' + parse.host);
				done.push(parse.host);
			}
		}
		if(/^\/[^\/]/.test(href)) {
			var allowed = true;
			for(var j in host.disallow) {
				if(host.disallow[j].test(href)) {
					allowed = false;
					//util.puts(host.disallow[j]);
					//util.puts('disallow: ' + href);
					break;
				}
			}
			if(allowed && !garbage.test(href)) {
				if(internalUrls.indexOf(href) < 0 && internalDone.indexOf(href) < 0) {
					internalUrls.push(href);
				}
			}
		}
	};
	util.puts('  ' +  host.url + ' ' + internalDone.length + ' : ' + internalUrls.length);
	if(internalUrls.length > 0)
		crawlInternal(host, internalUrls, internalDone);
	else
	{	
		crawlHost();
	}	
};

crawlHost();
