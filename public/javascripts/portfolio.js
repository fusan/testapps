'use strict';

//リスト入れつを作る
//セレクト要素をクリエイト
//選択するとポートフォリオにポップする

//ロード時にゲットする
//ゲットはinput要素にイベントがハッセしたら格納

//ポートフォリをコントロール機能
//サーバサイドで終値を格納
//ブラウザロード時に変化率を算出　寄与度を計算しポートフォリをの保全をする

//add portfolio
id('add').addEventListener('click', add, false);

//remove portfolio
//id('remove').addEventListener('click', remove, false);

/* -------------  model -------------- */
//add histrory
function add(e) {

  var json = {};
      json['like'] = {};
      json['like']['date'] = new Date(e.timeStamp);
      json['like']['d3_data'] = JSON.parse(get('d3_data'));

      console.log(json);

  set_to_localStorage('like',json);

};

//remove histrory
//function remove() { console.log('removeItem'); };

//to localStorage
function set_to_localStorage(ts, balance) {

  localStorage.setItem(ts, balance);

  get(ts);

}

//from localStorage
function get(ts) {

  var balance = localStorage.getItem(ts);

  return balance;

  console.log(balance);

}

/* ------------ controller ----------------- */
var base = 0;

//ticker get
generate(['JPY_BTC','BTC_ETH', 'BTC_XMR','BTC_DASH','BTC_FCT','BTC_MAID','BTC_AMP','BTC_XEM','BTC_GEMZ','BTC_SJCX','BTC_BTS']);

function generate(tickers) {

  var card_datas = [];

  var promise = new Promise(function(resolve, reject) {

    //create card object and get localStorage json
    for(var i = 0,n = tickers.length; i < n; i++) {
      var card_data = {};
          card_data[tickers[i]] = {};
          card_data[tickers[i]]['poloniex'] = 0;
          card_data[tickers[i]]['balance'] = get(tickers[i]) || 0;

      card_datas.push(card_data);

      new Card(tickers[i],get(tickers[i]));

    }

    if(i === n) resolve('ok');

  });

  promise.then(function(value) {

    start(tickers,card_datas);

    //get starting only
    //btc_ratio();

  });

}

//starting to get poloniex
function start(tss,card_datas) {
  console.log('start tick');

  //get poloniex api
  function poloniex(tss,card_datas) {
    //console.log('get poloniex');
    var ticker = $.get('https://poloniex.com/public?command=returnTicker');

    ticker.done(function(data) { update(data, tss, card_datas); });

    var timerID = setTimeout( function() { poloniex(tss, card_datas); }, 1000);

    id('stop').addEventListener('click', function() { clearTimeout(timerID); }, false);

  }

  poloniex(tss,card_datas);

  //get bitflyer api
  var bitcoin = new Bitflyer();
  bitcoin.start();

  id('stop').addEventListener('click', function() { bitcoin.stop(); } ,false);

}

//updating ticker data
function update(data,tss,card_datas) {

  var total_balance = 0;
  var portfolios = {};

  for(var i = 0, n = card_datas.length; i < n; i++) {

    var key = Object.keys(card_datas[i]);

    card_datas[i][key]['poloniex'] = data[key];
    card_datas[i][key]['balance'] = get(key);
    //console.log(card_datas[i][key]);

  }

  for(var i = 0,n = card_datas.length; i < n ; i++) { process_data(card_datas[i]); }

  if(i === n) display_total_volume(total_balance);
  if(i === n) set_to_localStorage('d3_data',JSON.stringify(portfolios));
  if(i === n) btc_ratio(); //update by tick

  function process_data(ts) {

    var key = Object.keys(ts);
    //console.log(ts[key]);

    var tick = ts[key].poloniex === undefined ? 1 : ts[key]['poloniex'].last;
    var balance = ts[key].balance;
    //console.log(tick,balance);

    total_balance += tick * balance;

    input_data_to_card(ts,balance);

    set_to_localStorage(ts,balance);

    portfolios[key] = calc_ratio_portfolio(key,tick,balance)[key];

  }

}

//data for visualize
function calc_ratio_portfolio(ts, tick, balance) {

  var obj = {};
      obj[ts] = {};
      obj[ts]['tick'] = tick;
      obj[ts]['balance'] = balance;
      obj[ts]['btc_balance'] = tick * balance;

  return obj;

}

//get bitcoin data by bitflyer lighting
function Bitflyer() {

  this.pubnub = PUBNUB({
      subscribe_key: "sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f",
      publish_key: 'demo'    // only required if publishing
  });

}

Bitflyer.prototype.start = function start() {

  this.pubnub.subscribe({
    channel: "lightning_ticker_BTC_JPY",
    message: function(data) {
      base = `${data.best_bid}`;
      //console.log('get bitflyer');
    }
   });

}

Bitflyer.prototype.stop = function stop() {
  console.log('stop bitflyer');
  this.pubnub.unsubscribe({
    channel: "lightning_ticker_BTC_JPY"
  });

}

/* --------------    view  --------------- */
//portfolio panel
function Card(ts,balance) {

  this.ts = ts;

  var port = document.createElement('div');
      port.textContent = this.ts.substring(4);
      port.id = this.ts;
      port.classList.add('card');

  var slider = document.createElement('div');
      slider.id = `slider_${this.ts}`;
      slider.classList.add('slider');

  var tick = document.createElement('div');
      tick.id = `_${this.ts}`;
      tick.classList.add('ts');

  var input = document.createElement('input');
      input.id = `balance_${this.ts}`;
      input.value = balance;
      input.classList.add('balance')

  var result = document.createElement('div');
      result.id = `bitbase_balance_${this.ts}`;
      result.classList.add('bircon_balance');


  id('init_port').appendChild(port);
  port.appendChild(tick);
  port.appendChild(result);
  port.appendChild(input);
  port.appendChild(slider);

  input.addEventListener('change', function() {
    var self = this;
    //console.log(self.value,ts);
    set_to_localStorage(ts,self.value);
  }, false);

  //new Tooltip(port,input);

}

function percent() {

  var flag = true;
  var sliders = document.querySelectorAll('.slider');

  id('percent').addEventListener('click', slide, false);

  function slide() {

    for(var i=0,n=sliders.length;i<n;i++) { sliders[i].classList.toggle('slider_in'); }

  }

  //rotate animation
  //id('percent').addEventListener('click', rotate, false);
  /*function rotate(flag) {
    for(var i=0,n=cards.length;i<n;i++) {
      cards[i].classList.toggle('card_rotate_right');
      cards[i].classList.toggle('card_rotate_left');
    }
  }*/

}

percent();

//display card data
function input_data_to_card(ts,balance) {

  //console.log(ts);

  var key = Object.keys(ts)[0];
  var tick = ts[key].poloniex === undefined ? 0 : ts[key].poloniex.last;
  var _balance = ts[key].balance;
  var _tick = id(`_${key}`);
  var _balance = id(`balance_${key}`);
  var _btc_balance = id(`bitbase_balance_${key}`);

  _tick.textContent = key === 'JPY_BTC' ? base : tick;

  isNaN(balance) ?
  _btc_balance.innerHTML = `no balance` :
  _btc_balance.innerHTML = key === 'JPY_BTC' ?
    `${balance} BTC` : `${(tick * balance).toFixed(5)} BTC`;

}

//total balance
function display_total_volume(balance) {

  var jpy = (balance * base).toFixed(0);

  id('total').innerHTML = `${balance.toFixed(2)}BTC / ¥${jpy}`;

}


/* ---------- d3 visual ------------ */
//btc_ratio d3.js
function btc_ratio(e) {
  //console.log(JSON.parse(get('d3_data')));
  var json = JSON.parse(get('d3_data'));
  var total_balance = 0;

  for(var key in json) { total_balance += json[key].btc_balance * 1; }

  for(var key in json) {

    id(key).style.background = `-webkit-linear-gradient(top, #04b1f1 0%,#ffffff ${json[key].btc_balance/total_balance * 100}%)`;
    id(`slider_${key}`).innerHTML = `<div class="slider_inner">${(json[key].btc_balance/total_balance * 100).toFixed(0)}%</div>`

  }

}

function pie(json) {

  var data = create_data_for_d3(json);

  var chart_width = 400, chart_height = 400;
  var ir = 50,or = 100;
  var color = d3.scale.category20();

  var arc = d3.svg.arc().innerRadius(ir).outerRadius(or);
  var pie = d3.layout.pie().value(function(d) { return d; });

  var labelArc = d3.svg.arc()
    .outerRadius(chart_width / 2 - 80)
    .innerRadius(chart_width / 2 - 80);

  console.log(data);

  var field = d3.select('#chart')
          .append('svg')
            .attr({
              "width": chart_width,
              "height": chart_height
            })
          .append('g')
            .attr({
              "transform": `translate(${chart_width / 2}, ${chart_height / 2})`
            })

  var chart = field.selectAll('path').data(pie(data[2])).enter()
        .append('g');


      chart.append('path')
        .attr({
          "d": function(d) {
            return arc(d);
            console.log(d, arc(d));
          },
          "fill": function(d) { return color(d.data); }
        });

      chart.append("text")
          .attr("dy", "0.25em")
          .attr("transform", function(d) { return `translate(${labelArc.centroid(d) + 80})`; })
          .style({"text-anchor": "middle",
                  'font-size': '8px'})
          .text(function(d,i){ return`${data[0][i].substring(4)}`; });

  function create_data_for_d3(json) {

    var json = JSON.parse(json);
    var ticks = [];
    var balances = [];
    var btc_balances = [];
    var jsons = [];

    console.log(json);

    for(var key in json ) {

      ticks.push(key);
      balances.push(json[key]['balance'])
      btc_balances.push(json[key]['btc_balance']);

    }

    jsons.push(ticks,balances,btc_balances);
    console.log(jsons);
    return jsons;

  }

}

pie(get('d3_data'));

/* -------- general --------------- */
function id(id) { return document.getElementById(id); }

function Tooltip(parent,input) {
  this.parent = parent;
  this.input = input;

  var tooltip = document.createElement('div');
      tooltip.classList.add('tooltip');
      tooltip.textContent = 'tes';

  this.parent.addEventListener('mouseenter', function() {
    var self = this.id;
    console.log('on',self,this);
    this.appendChild(tooltip);
  }, false);

  this.parent.addEventListener('mouseleave',function() {
    var self = this.id;
    console.log('off',self);
    this.removeChild(tooltip);
  },false);
}
