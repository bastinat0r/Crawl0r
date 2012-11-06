var http = require('http');
var util = require('util');
var url = require('url');

var urls = ["http://www.w3schools.com/jsref/jsref_obj_regexp.asp", "http://patriciopalladino.com/blog/2012/08/09/non-alphanumeric-javascript.html", "http://blog.bastinat0r.de", "http://boofeladen.de/", "http://ruby.railstutorial.org/ruby-on-rails-tutorial-book", "http://ashikaga.ovgu.de/cms/index.php/en/robert-neumann/teaching/89-cc", "http://en.wikipedia.org/wiki/Information_retrieval"];
var done = [];
var hosts = [];
var garbage = /(\.(ico|rss|atom|gif|jpg|jpeg|png|css|js|json|yaml|bin|exe|sh|xml|pdf|mp3|m3u|mp4|mpeg|mpg|mov|opus|aac|java|o|tar|gz|zip|rar|torrent|min)|(twitter))/i;
var iterations = 10000;

function crawl(count) {
	if(done.indexOf(urls[0]) >= 0) {
		urls.shift();
		crawl(count);
	} else {
		var currentUrl = urls.shift();
		done.push(currentUrl);
		var req = http.get(currentUrl, function(res) {
			var opts = url.parse(currentUrl);
			var baseUrl = opts.protocol + "//"+ opts.host;
			if(hosts.indexOf(opts.host) < 0) {
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
										href[1] = baseUrl + href[1];
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
					url : currentUrl,
					title : title,
					statusCode : res.statusCode,
					headers : res.headers,
					text : text,
				}
				var postOpts = {
					host : "localhost",
					port : "13336",
					method : "POST",
					path : "/"
				};
				util.puts(currentUrl);
				var postReq = http.request(postOpts);
				postReq.end(JSON.stringify(site));
				postReq.on('error', util.puts);
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

crawl(iterations);
crawl(iterations);
crawl(iterations);
crawl(iterations);
crawl(iterations);
crawl(iterations);
