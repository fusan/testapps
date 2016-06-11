'use strict';

const request = require('request');

exports.listen = function (server) {

  var io = require('socket.io').listen(server);

  io.on('connection', (socket) => {

    ticker(io,socket);

  });
};

function ticker(io, socket) {
  var poloniex = new Promise((resolve, reject) => {

    request('https://poloniex.com/public?command=returnTicker', (err, res, body) => {
      //console.log('poloniex',body);
      if(err) throw err;
      resolve(JSON.parse(body));
    });

  });

  var bitflyer = new Promise((resolve, reject) => {

    request('https://api.bitflyer.jp/v1/getticker',(err, res, body) => {
      //console.log('bitflyer',JSON.parse(body)['best_bid']);
      //console.log(body);
      if(err) throw err;
       resolve(JSON.parse(body));
    });

  });

  Promise.all([poloniex, bitflyer]).then((value) => {
      //var data = {JPY_BTC: {last: value[2]['best_bid']}};
      var data = value[0];
          data['BTC_JPY'] = { last: value[1]['best_bid']};

          //console.log(data);

      socket.emit('ticker data',data);

      setTimeout(function() { ticker(io, socket); }, 1500);

  });
}
