'use strict';

//ポートフォリをコントロール機能
//サーバサイドで終値を格納
//ブラウザロード時に変化率を算出　寄与度を計算しポートフォリをの保全をする

/* -------- poloniex portfolio init get module  -------------- */
//アクセス時にpoloniexのBTCベースのJSONを取得するモジュール。
var port_init = function port_init() {

    var tss = [];
    var datas = [];
    var count = 0;

    var ticker = $.get('https://poloniex.com/public?command=returnTicker');

    ticker.done(function(data) {

      tss.push('JPY_BTC');
      datas.push({});

      for( var key in data) {
        count++;
        tss.push(key);
        datas.push(data[key]);
        // ポートフォリオデータを格納する
        if(count >= 135) {
          generate(tss, datas);
          //console.log(count, tss, datas);
        }
      }

    });

  //JSONデータの整形とlocalStorageへの格納
  function generate(tss, data) {

    var poloniex = {};
        poloniex.tss = tss;
        poloniex.data = data;

    if(!localStorage.getItem('poloniex_port')) {

      set('poloniex_port', poloniex);

      console.log(poloniex);

    }

  }
//end
}();

(function star() {



  var flag = false;
  generate(flag);
  id('star').addEventListener('click', stared, false);

  function stared() {

    flag ? flag = false : flag = true;

    star_style(this,flag);  //style

    generate(flag);  //select card

  }

  function star_style(dom, flag) {

    flag ? dom.style.color = 'red' : dom.style.color = 'white';
    flag ? dom.style.transform = 'rotateY(360deg)' : dom.style.transform = '';

  }

}());

//to localStorage
function set(ts, balance) {

  localStorage.setItem(ts, JSON.stringify(balance));

}

//from localStorage
function get(ts) {

  var balance = localStorage.getItem(ts);
      return JSON.parse(balance);

}

//open modal
//id('plus').addEventListener('click', open, false);
//close modal
//id('modal').addEventListener('click', close, false);
//modal_inner stopPropagation
//id('modal_inner').addEventListener('click', function(e) { e.stopPropagation();}, false);


/* ------------------------  model --------------------------- */
/*
//get ts
function open() {

  id('modal').classList.add('modal');

  var data = JSON.parse(localStorage.getItem('poloniex_port'));

  for( var i = 0,n = data.tss.length; i < n; i++ ) {

    if(i === 0) new Modal_inner_head();
    if(data.tss[i].split('_')[0] === 'BTC') new Port_card(id('modal_inner'), data.tss[i]);

  }

}

function close(e) {
  id('modal').classList.remove('modal');
  id('modal_inner').innerHTML = '';
}

//モーダルウィンドウのヘッダー生成

function Modal_inner_head() {

  var checked_ports = [];

  var controller = document.createElement('div');
  var submit = document.createElement('button');
  var cancel = document.createElement('button');
      submit.textContent = '決定';
      cancel.textContent = 'キャンセル';

  id('modal_inner').appendChild(controller);
  controller.appendChild(submit);
  controller.appendChild(cancel);

  submit.addEventListener('click', create, false);

  function create(e) {
    console.log('create new my port');

    var data = document.querySelectorAll('.pickup_port_radio');

    for(var i = 0, n = data.length; i < n; i++) { if(data[i].checked === true) checked_ports.push(data[i].id.split('pickup_')[1]); }

    if(i === n) set('my_port', JSON.stringify(checked_ports)); //console.log(checked_ports);

    close(e);

  }

}


//ポートフォリオの選択用のカードをmodal_innerにアペンドする。
function Port_card(parent, ts) {

  this.parent = parent;
  this.ts = ts;

  var div = document.createElement('div');
  var name = document.createElement('div');
  var input = document.createElement('input');
      div.classList.add('pickup_port');
      name.classList.add('pickup_port_name');
      input.classList.add('pickup_port_radio');
      input.type = 'radio';
      input.id = `pickup_${this.ts}`

  div.appendChild(name);
  div.appendChild(input);
  this.parent.appendChild(div);

  name.textContent = this.ts.split('_')[1];

  input.addEventListener('click', function() {
    var self = this;
    console.log(self.id,self.checked);
  });

}
*/

//add histrory
/*
function add(e) {

  var json = {};
      json['like'] = {};
      json['like']['date'] = new Date(e.timeStamp);
      json['like']['d3_data'] = JSON.parse(get('d3_data'));

      console.log(json);

  set('like',json);

};
*/

/* ------------ controller ----------------- */
var base = 0;

function generate(flag) {

  var all_port = get('poloniex_port').tss;
  var stars = get('stars')
  var tss = flag ? stars : all_port;

  var card_datas = [];

  var promise = new Promise(function(resolve, reject) {

    id('init_port').innerHTML = '';

    //create card object and get localStorage json
    for(var i = 0,n = tss.length; i < n; i++) {

      var card_data = {};
          card_data[tss[i]] = {};
          card_data[tss[i]]['poloniex'] = 0;
          card_data[tss[i]]['balance'] = get(tss[i]) || 0;

      card_datas.push(card_data);

      new Card(tss[i],get(tss[i]));

    }

    if(i === n) resolve('ok');

  });

  promise.then(function(value) {

    start(tss,card_datas);

    stared();

    percent();

  });

}

//starting to get poloniex
function start(tss,card_datas) {
  console.log('start tick');

  poloniex(tss,card_datas);

  var bitflyer = new Bitflyer();

      bitflyer.start();

  id('stop').addEventListener('click', function() { bitflyer.stop(); } ,false);

}

//get poloniex api
function poloniex(tss,card_datas) {
  //console.log('get poloniex');
  var ticker = $.get('https://poloniex.com/public?command=returnTicker');

  ticker.done(function(data) { update(data, tss, card_datas); });

  var timerID = setTimeout( function() { poloniex(tss, card_datas); }, 1000);

  id('stop').addEventListener('click', function() { clearTimeout(timerID); }, false);

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

//updating ticker data
function update(data,tss,card_datas) {

  var total_balance = 0;
  var portfolios = {};

  for(var i = 0, n = card_datas.length; i < n; i++) {

    var key = Object.keys(card_datas[i]);

    card_datas[i][key]['poloniex'] = data[key];
    card_datas[i][key]['balance'] = get(key);
    //console.log(card_datas[i]);

  }

  for(var i = 0,n = card_datas.length; i < n ; i++) { process_data(card_datas[i]); }

  display_total_volume(total_balance);
  set('d3_data',portfolios);
  card_gradient();

  function process_data(ts) {

    var key = Object.keys(ts);
    //console.log(ts[key]);

    var tick = ts[key].poloniex === undefined ? 1 : ts[key]['poloniex'].last;
    var balance = ts[key].balance;
    //console.log(tick,balance);

    total_balance += tick * balance;

    card_contents(ts,balance);

    set(ts,balance);

    portfolios[key] = create_card_contents(key,tick,balance)[key];

  }

}

//data for visualize
function create_card_contents(ts, tick, balance) {

  var obj = {};
      obj[ts] = {};
      obj[ts]['tick'] = tick;
      obj[ts]['balance'] = balance;
      obj[ts]['btc_balance'] = tick * balance;

  return obj;

}

/* --------------    view  --------------- */
//portfolio panel
function Card(ts,balance) {
  var flag = true;
  this.ts = ts;

  var port = document.createElement('div');
      port.textContent = this.ts.split('_')[1];
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

  var star = document.createElement('span');
      star.id = `star_${this.ts}`;
      star.classList.add('star');
      star.textContent = '★';


  id('init_port').appendChild(port);
  port.appendChild(tick);
  port.appendChild(result);
  port.appendChild(input);
  port.appendChild(slider);
  port.appendChild(star);

  input.addEventListener('change', function() {
    var self = this;
    //console.log(self.value,ts);
    set(ts,self.value);

  }, false);

  star.addEventListener('click', add_stars, false);

  function add_stars() {

    var self = this;
    var self_id = self.id;
    var stars = get('stars') || [];

    if( id(self_id).classList.contains('stared') ) { //remove

      id(self_id).classList.remove('stared');

      for( var i=0,n=stars.length;i<n;i++ ) { if( stars[i] === self_id.split('star_')[1] ) stars.splice(i,1); }

    } else { //add

      stars.push(self_id.split('star_')[1]);

      //重複チェック
      stars = stars.filter(function (x, i, self) { return self.indexOf(x) === i; });

    }

    set('stars',stars);

    stared();

  }

  //new Tooltip(port,input);
}

function stared() {

  var stars = get('stars');

  for(var i=0,n=stars.length;i<n;i++) { id(`star_${stars[i]}`).classList.add('stared'); }

}

function percent() {

  var flag = true;
  var sliders = document.querySelectorAll('.slider');
  //console.log(sliders);

  id('percent').addEventListener('click', slide, false);

  function slide() {

    var self = this;

    self.classList.toggle('rotate');

    for(var i=0,n=sliders.length;i<n;i++) {
      //console.log();
      //if(sliders[i].childNodes[0].innerHTML !== '0%') 
      sliders[i].classList.toggle('slider_in');
    }

  }

}

//display card data
function card_contents(ts,balance) {

  var key = Object.keys(ts)[0];
  var tick = ts[key].poloniex === undefined ? 0 : ts[key].poloniex.last;
  var _balance = ts[key].balance;
  var _tick = id(`_${key}`);
  var _balance = id(`balance_${key}`);
  var _btc_balance = id(`bitbase_balance_${key}`);

  //console.log(key === 'JPY_BTC' ? base : tick ,key);
  if(key === 'JPY_BTC') {
    //console.log(base);
    _tick.textContent = base;

  } else {
    //console.log(tick);
    _tick.textContent = tick;
  }

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

//cart gradient d3.js
function card_gradient(e) {

  var json = get('d3_data');
  var total_balance = 0;

  for(var key in json) { total_balance += json[key].btc_balance * 1; }

  for(var key in json) {

    var percent = json[key].btc_balance/total_balance * 100;

    //card gradient
    id(key).style.background = `-webkit-linear-gradient(top, #04b1f1 0%,#ffffff ${percent}%)`;

    //display %
    id(`slider_${key}`).innerHTML = `<div class="slider_inner">${percent.toFixed(0)}%</div>`

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
          .text(function(d,i){ return`${data[0][i].split('_')[1]}`; });

  function create_data_for_d3(json) {

    var json = json;
    var ticks = [];
    var balances = [];
    var btc_balances = [];
    var jsons = [];

    //console.log(json);

    for(var key in json ) {

      ticks.push(key);
      balances.push(json[key]['balance'])
      btc_balances.push(json[key]['btc_balance']);

    }

    jsons.push(ticks,balances,btc_balances);
    //console.log(jsons);
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
