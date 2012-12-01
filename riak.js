var http = require('http');
var util = require('util');
var nodeSel = 0;

var clientId = 'node';
var basePath = '/riak/';
var opts = {
	host : 'localhost',
	path : '',
	method : 'PUT',
};

module.exports.getValue = getValue;
module.exports.getVClock = getVClock;
module.exports.putValue = putValue;
module.exports.clientId = clientId;


function getValue(bucket, key, cb) {
	nodeSel++;
	nodeSel = nodeSel % 4;
	opts.method = 'GET';
	opts.headers = {
		'X-Riak-ClientId' : clientId,
		'content-type' : 'application/json',
	};
	opts.port = [8091,8092,8093,8094][nodeSel];
	opts.path = basePath + bucket + '/' + key;
	var req = http.request(opts, function(res) {
		var data = "";
		res.on('data', function(chunk) {
			data = data + chunk;
		});
		res.on('end', function() {
			if(cb)
				cb(data);
		});
	});
	req.on('error', util.puts);
	req.end();
}

function getVClock(bucket, key, cb) {
	nodeSel++;
	nodeSel = nodeSel % 4;
	opts.method = 'HEAD';
	opts.headers = {
		'X-Riak-ClientId' : clientId,
		'content-type' : 'application/json',
	}
	opts.port = [8091,8092,8093,8094][nodeSel];
	opts.path = basePath + bucket + '/' + key;
	var req = http.request(opts, function(res) {
		res.on('data', function(chunk) {
			util.puts("Strangedystrange: " + chunk);
		});
		res.on('end', function() {
			if(cb)
				if(res.headers['x-riak-vclock'])
					cb(res.headers['x-riak-vclock']);
				else
					cb();
		});
	});
	req.on('error', util.puts);
	req.end();
}

function putValue(bucket, key, value, cb) {
	getVClock(bucket, key, function(vClock) {
		nodeSel++;
		nodeSel = nodeSel % 4;
		opts.method = 'PUT';
		opts.headers = {
			'content-type' : 'application/json',
			'X-Riak-ClientId' : clientId,
		}
		if(vClock)
			opts.headers['X-Riak-VClock'] = vClock;


		opts.port = [8091,8092,8093,8094][nodeSel];
		opts.path = basePath + bucket + '/' + key;
		var req = http.request(opts, function(res) {
			var data = '';
			res.on('data', function(chunk) {
				data = data + chunk;
			});
			res.on('end', function() {
				if(cb)
					cb(data);
			});
		});
		req.on('error', util.puts);
		req.end(JSON.stringify(value));
	});
}
