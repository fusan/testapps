var mongoose = require('mongoose');

//var url = 'mongodb://heroku_99cv7jnx:urpqu046rhf5v623i3ckma1d35@ds047612.mongolab.com:47612/heroku_99cv7jnx/blog';
//public/javascripts/index.js も変更
var url = 'mongodb://localhost/poloniex';
//var url = 'mongodb://dbuser:password@52.69.160.65';

var db = mongoose.createConnection(url, function(err, res) {
	if(err) {
		console.log('error connected:' + url + '-' + err);
	} else {
		console.log('Success connected:' + url);
	}
});

var poloniex = new mongoose.Schema({
	'baseVolume': String,
	'high24hr': String,
	'highestBid': String,
	'isFrozen': String,
	'last': String,
	'low24hr': String,
	'lowestAsk': String,
	'percentChange': String,
	'quoteVolume': String
}, {collection: '1D'});

exports.Poloniex = db.model('Reserve', poloniex);
