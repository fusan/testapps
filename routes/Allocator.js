'use strict';

const router = require('express').Router();
const server = require('http').Server(router);
const request = require('request');

//const model = require('../model');
//const Poloniex = model.Poloniex;

router.get('/', (req, res) => {

  /*Poloniex.find({}, (err, data) => {
    console.log(data );
  });*/

  res.render('Allocator', { 'title': 'Asset Allocator'});

});

//終値で格納する。　日本時間の０時を基準にする。
/*

const limit = new Date(1461916759805 + 2 * 60 * 1000);
//1461855600000 + 24 * 60 * 60 * 1000 = Sat Apr 30 2016 00:00:00 GMT+0900 (JST)
console.log(limit.getTime(),limit);

setTimeout(() => {
  request('https://poloniex.com/public?command=returnTicker', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('ETH',JSON.parse(body)['BTC_ETH']); // Show the HTML for the Google homepage.
    }
  });
},10 * 1000);
*/

//組み合わの計算式
/*
function permutation(n, r) {
  for(var i = 0, res = 1; i < r; i++) {
  res *= n - i;
  }
  return res;
}

function combination(n, r) {
  return permutation(n, r) / permutation(r, r);
}

console.log(combination(2000,3));
*/

module.exports = router;
