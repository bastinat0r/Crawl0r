var http = require('http');
var util = require('util');

var nodeSel = 0;
var riakPorts = [8091, 8092, 8093, 8094];

var clientId = 'node';
var basePath = '/riak/';

module.exports.getValue = getValue;
module.exports.getVClock = getVClock;
module.exports.putValue = putValue;
module.exports.clientId = clientId;

http.Agent.maxSockets = 20;

function getValue(bucket, key, cb) {
	nodeSel++;
	nodeSel = nodeSel % riakPorts.length;
	var opts = {
		host : 'localhost',
		method : 'GET',
		headers : {
			'X-Riak-ClientId' : clientId,
			'content-type' : 'application/json',
		},
		port : riakPorts[nodeSel],
		path : basePath + bucket + '/' + key,
	};
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
	nodeSel = nodeSel % riakPorts.length;
	var opts = {
		host : 'localhost',
		method : 'HEAD',
		headers : {
			'X-Riak-ClientId' : clientId,
			'content-type' : 'application/json',
		},
		port : riakPorts[nodeSel],
		path : basePath + bucket + '/' + key,
	};
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
	req.setTimeout(1000, function() {
		util.puts("Reqest Timeout");
	});
	req.end();
}

function putValue(bucket, key, value, cb) {
	getVClock(bucket, key, function(vClock) {
		nodeSel++;
		nodeSel = nodeSel % riakPorts.length;
		var opts = {
			host : 'localhost',
			method : 'PUT',
			headers : {
				'X-Riak-ClientId' : clientId,
				'content-type' : 'application/json',
			},
			port : riakPorts[nodeSel],
			path : basePath + bucket + '/' + key,
		};
		if(vClock)
			opts.headers['X-Riak-VClock'] = vClock;

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
