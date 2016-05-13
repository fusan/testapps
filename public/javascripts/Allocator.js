'use strict';

//ポートフォリをコントロール機能
//サーバサイドで終値を格納
//ブラウザロード時に変化率を算出 寄与度を計算しポートフォリをの保全をする

var base = 0;
var stars = get('stars') || [];
var d3_data;

/* -------- poloniex portfolio init get module  -------------- */
//アクセス時にpoloniexのBTCベースのJSONを取得するモジュール。
var portfolio_init = function portfolio_init() {

    var tss = [];
    var datas = [];
    var count = 0;

    var ticker = $.get('https://poloniex.com/public?command=returnTicker');

    ticker.done(function(data) {

      console.log(data);

      tss.push('JPY_BTC');
      datas.push({});

      for( var key in data) {

        count++;

        tss.push(key);
        datas.push(data[key]);

        // ポートフォリオデータを格納する
        if(count >= 135) {
          if(!get('poloniex_port')) create(tss, datas);
          //console.log(count, tss, datas);
        }
      }

    });

  //JSONデータの整形とlocalStorageへの格納
  function create(tss, data) {

    var poloniex = {};
        poloniex.tss = tss;
        poloniex.data = data;

        set('poloniex_port', poloniex);

  }

//end
}();


(function star() {

  var flag = true;

  generate(flag);

  id('star').style.color = 'red';

  id('star').addEventListener('click', toggle_stared, false);

  id('like').addEventListener('click', history, false);

  function toggle_stared() {

    flag ? flag = false : flag = true;

    star_style(this,flag);  //style

    generate(flag);  //select card

  }

  function star_style(dom, flag) {

    console.log(dom);

    flag ? dom.style.color = 'red' : dom.style.color = 'white';
    flag ? dom.style.transform = 'rotateY(360deg)' : dom.style.transform = '';

  }

}());

//history
function history(e) {

  var contents = `<div>
                  <div class="input_port">
                    <span>portfolio name:</span>
                    <input type='text' id="port_memo">
                    <button id="add_like_to_local">追加</button>
                    </div>
                  </div>`;

  var add_like_to_local = new Modal(id('modal'), id('modal_inner'),contents);
  //console.log(add_like_to_local);
};

/* ------------ controller ----------------- */

//カードを生成 -> 状態更新
function generate(flag) {

  //get card json data
  var all_port = get('poloniex_port').tss;
  var tss = flag ? stars : all_port;
  var init_port = id('init_port');

  var card_datas = [];

  //カード生成
  var creat_card = new Promise(function(resolve, reject) {

    id('init_port').innerHTML = '';

    //create card object and get localStorage json
    for(var i = 0,n = tss.length; i < n; i++) {

      var card_data = {};
          card_data[tss[i]] = {};
          card_data[tss[i]]['poloniex'] = 0;
          card_data[tss[i]]['balance'] = get(tss[i]) || 0;

      card_datas.push(card_data);

      new Card(init_port,tss[i],get(tss[i]));

    }

    if(i === n) resolve('ok');

  });

  //状態更新
  creat_card.then(function(value) {

    get_api_data(tss,card_datas);

    on_star();

    percent();

  });

}

//starting to get poloniex
function get_api_data(tss,card_datas) {
  //console.log('start tick');
  var bitflyer = new Bitflyer(tss,card_datas);

      bitflyer.start();

  id('stop').addEventListener('click', function() { bitflyer.stop(); } ,false);

}

//get poloniex api @http request by 1 second
function poloniex(tss,card_datas) {
  //console.log('get poloniex');
  var ticker = $.get('https://poloniex.com/public?command=returnTicker');

      ticker.done(function(data) {

        update(data, tss, card_datas);

      });

  var timerID = setTimeout( function() { poloniex(tss, card_datas); }, 1000);

  id('stop').addEventListener('click', function() { clearTimeout(timerID); }, false);

}

//get bitcoin data by bitflyer lighting
function Bitflyer(tss,card_datas) {

  this.pubnub = PUBNUB({
      subscribe_key: "sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f",
      publish_key: 'demo'    // only required if publishing
  });

  poloniex(tss,card_datas);

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

  //データ整形
  for(var i = 0, n = card_datas.length; i < n; i++) {

    var key = Object.keys(card_datas[i]);

    card_datas[i][key]['poloniex'] = data[key];
    card_datas[i][key]['balance'] = get(key);
    //console.log(card_datas[i]);
  }

  //カード表示の更新
  for(var i = 0,n = card_datas.length; i < n ; i++) { process_data(card_datas[i]); }

  set('d3_data',portfolios);
  //console.log(portfolios);
  d3_data = portfolios;

  card_gradient();

  display_total_BTC();

  if( get('like') !== null ) create_likes_list(get('like'),portfolios);

  function process_data(ts) {

    var key = Object.keys(ts);
    var tick = ts[key].poloniex === undefined ? 1 : ts[key]['poloniex'].last;
    var balance = ts[key].balance;

    total_balance += tick * balance;

    portfolios[key] = create_crypt_json(key,tick,balance)[key];

    realtime_card(ts);

  }

  function display_total_BTC() {

      id('total').innerHTML = realtime_total_value(total_balance);

  }

}

//data for visualize
function create_crypt_json(ts, tick, balance) {

  var obj = {};
      obj[ts] = {};
      obj[ts]['tick'] = tick;
      obj[ts]['balance'] = balance;
      obj[ts]['btc_balance'] = tick * balance;

  return obj;

}

/* --------------    view  --------------- */
//portfolio panel
function Card(parent,ts,balance) {

  this.parent = parent;
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


  this.parent.appendChild(port);

  port.appendChild(tick);
  port.appendChild(result);
  port.appendChild(input);
  port.appendChild(slider);
  port.appendChild(star);

  input.addEventListener('change', function() {
    var self = this;
    //console.log(self.value,ts);
    validation(self.value) === 0 ? set(ts,self.value) : self.value = '半角数字でね';

  }, false);

  star.addEventListener('click', add_stars, false);

  function add_stars() {

    var self = this;
    var self_id = self.id;

    if( id(self_id).classList.contains('stared') ) { //remove

      id(self_id).classList.remove('stared');

      for( var i=0,n=stars.length;i<n;i++ ) { if( stars[i] === self_id.split('star_')[1] ) stars.splice(i,1); }

    } else { //add

      stars.push(self_id.split('star_')[1]);

      //重複チェック
      stars = stars.filter(function (x, i, self) { return self.indexOf(x) === i; });

    }

    set('stars',stars);

    on_star();

  }

  function validation(value) {
    //console.log(value.search( /^[-]?[0-9]+(\.[0-9]+)?$/ ));
    return value.search( /^[-]?[0-9]+(\.[0-9]+)?$/ );
  }

}

function on_star() {

  for(var i=0,n=stars.length;i<n;i++) { id(`star_${stars[i]}`).classList.add('stared'); }

}

function percent() {

  var sliders = document.querySelectorAll('.slider');

  id('percent').addEventListener('click', slide, false);

  function slide() {

    this.classList.toggle('rotate');

    for(var i=0,n=sliders.length;i<n;i++) {
      //if(sliders[i].childNodes[0].innerHTML !== '0%') // ノーポジションを弾く
      sliders[i].classList.toggle('slider_in');

    }

  }

}

//display card data
function realtime_card(ts) {
  //console.log(ts);
  var key = Object.keys(ts)[0];
  var tick = ts[key].poloniex === undefined ? 0 : ts[key].poloniex.last;
  var balance = ts[key].balance;

  realtime_card_text(balance, key, tick);

}

function realtime_card_text(balance, key, tick) {

  var _tick = id(`_${key}`);
  var _balance = id(`balance_${key}`);
  var _btc_balance = id(`bitbase_balance_${key}`);

  //console.log(key === 'JPY_BTC' ? base : tick ,key);
  key === 'JPY_BTC' ? _tick.textContent = base : _tick.textContent = tick;

  isNaN(balance) ? _btc_balance.innerHTML = `no balance` : _btc_balance.innerHTML = key === 'JPY_BTC' ?  `${balance} BTC` : `${(tick * balance).toFixed(5)} BTC`;

}

//total balance
function realtime_total_value(balance) {

  var jpy = (balance * base).toFixed(0);

  return `${balance.toFixed(2)}BTC / ¥${jpy}`;

}

/* ---------- d3 visual ------------ */

//cart gradient d3.js
function card_gradient(e) {

  var json = d3_data; //get('d3_data'); ローカルストレージのブロッキングを回避するためにグローバル変数を活用
  var total_balance = 0;

  //BTCベースのトータルバランスを計算
  for(var key in json) { total_balance += json[key].btc_balance * 1; }

  //各通貨ごとの保有割合の計算
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

//ロード時のみ描画する
pie(get('d3_data'));

/* -------- likes --------------- */
function create_likes_list(json, portfolios) {
  //console.log(json, portfolios);

  id('likes').innerHTML = `<div id="portfolios_head">Portfolio History</div>`;

  for(var i = 0,n = json.length; i < n; i++ ) {

    var date = new Date(json[i].date);
    var btc_balance = total_balance(json[i].d3_data);
    var memo = json[i].memo || '';
    //console.log(btc_balance);
    date = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDay() + 1}`;

    id('likes').innerHTML += `<div class="portfolios" id="${json[i].date}">
                                  <span class="portfolio_date">${date}</span>
                                  <span class="portfolio_balance"> ${btc_balance.toFixed(2)} BTC </span>
                                  <span class="portfolio_memo">${memo}</span>
                              <div>`;

  }

  function total_balance(json) {
    var total = 0;
    var balances = [];

    for(var key in json) {
      //console.log(key,json[key].btc_balance * 1,portfolios[key].tick * 1,(json[key].btc_balance * 1) * (portfolios[key].tick * 1));
      total += (json[key].balance * 1) * (portfolios[key].tick * 1);
    }

    return total;

  }

};

/* --------------------  modal view ----------------------- */

function Modal(modal,modal_inner,contents) {

  modal.classList.add('modal_open');
  modal_inner.innerHTML = contents;

  //set portfolio to localStorage
  id('add_like_to_local').addEventListener('click', function(e) {

    id('port_memo').value ? Modal.prototype.push_history(e) : alert('ポートフォリオ名を入れてください。');
    modal.classList.remove('modal_open');
    modal_inner.innerHTML = '';

  }, false);

  //close modal
  modal.addEventListener('click',function(e) {

    modal.classList.remove('modal_open');
    modal_inner.innerHTML = '';

  });

  //stopPropagation modal_inner
  modal_inner.addEventListener('click', function(e) {
    e.stopPropagation();
  }, false);

}

Modal.prototype.push_history = function push_history(e) {

    var likes = get('like') || [];

    var like = {};
        like['memo'] = id('port_memo').value || new Date(e.timeStamp);
        like['date'] = new Date(e.timeStamp);
        like['d3_data'] = d3_data;//get('d3_data'); ローカルストレージのブロッキングを回避するためにグローバル変数を活用

    likes.push(like);

    console.log(likes);

    set('like',likes);

  }


/* -------- general --------------- */

//shorting
function id(id) { return document.getElementById(id); }

//to localStorage
function set(ts, balance) {

  localStorage.setItem(ts, JSON.stringify(balance));

}

//from localStorage
function get(ts) {

  return JSON.parse(localStorage.getItem(ts));

}
