'use strict';

/*
  サーバサイドで終値を格納
  ブラウザロード時に変化率を算出 寄与度を計算しポートフォリをの保全をする
  スタート時の画面を追加する。 再度見るためのヘルプボタンを設置
  sdd_stras fn で星がない時の'BTC_JPY','BTC_ETH'とかのlocalStorage.removeIemを定義
*/

var socket = io.connect('http://localhost:4000');

var stars = get('stars') || {};
var all;

var my_portfolio;
var d3;
var btc_tick = 0;

var init_port = id('init_port');

var _ua = function _ua(u){
  return {
    Tablet:(u.indexOf("windows") != -1 && u.indexOf("touch") != -1)
      || u.indexOf("ipad") != -1
      || (u.indexOf("android") != -1 && u.indexOf("mobile") == -1)
      || (u.indexOf("firefox") != -1 && u.indexOf("tablet") != -1)
      || u.indexOf("kindle") != -1
      || u.indexOf("silk") != -1
      || u.indexOf("playbook") != -1,
    Mobile:(u.indexOf("windows") != -1 && u.indexOf("phone") != -1)
      || u.indexOf("iphone") != -1
      || u.indexOf("ipod") != -1
      || (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
      || (u.indexOf("firefox") != -1 && u.indexOf("mobile") != -1)
      || u.indexOf("blackberry") != -1
  }
}(window.navigator.userAgent.toLowerCase());

//get data from servar to updating client
socket.on('test ping', function(data) {

  var btc_only_ticker = {};
  var datakeys = Object.keys(data);

  //reject XMR base & USDT base XMR,USD除外
  for(var i = 0, n = datakeys.length; i < n; i++) {

    if(datakeys[i].indexOf('BTC_') === 0) btc_only_ticker[datakeys[i]] = data[datakeys[i]];

  }

  //loop end   ループ終了後の処理
  if(i === n)  {

    all = btc_only_ticker;

    update(btc_only_ticker);

    if( !get('ticker') ) { set('ticker',btc_only_ticker); }

  }

});


function start_view() {

  var flag = true; //starsでcardをロードする

  create_card(flag);

  star_style(id('star'), flag);

  if(_ua.Mobile || _ua.Tablet) {

    id('star').addEventListener('touchstart', toggle_stared, false);

    id('history').addEventListener('touchstart', history, false);

    id('randscape').addEventListener('touchstart', randscape, false);

  } else {

    id('star').addEventListener('click', toggle_stared, false);

    id('history').addEventListener('click', history, false);

    id('randscape').addEventListener('click', randscape, false);

  }

  function toggle_stared() {

    flag ? flag = false : flag = true;

    star_style(this, flag);  //style

    create_card(flag);  //card

  }

  //stars icon action
  function star_style(icon, flag) {

    icon.classList.toggle('star_rotate');

  }

  function randscape() {

    var d3_ticker_symbols = document.querySelectorAll('.d3_ticker_symbol');

    //d3 pie chart text fill color
    for(var i=0,n=d3_ticker_symbols.length;i<n;i++) d3_ticker_symbols[i].classList.toggle('d3_ticker_symbol_on');

    //document.body
    document.body.classList.toggle('randscape');

  }

};

start_view();

//history ポートフォリを履歴
function history(e) {

  var contents = `<div>
                  <div class="input_port">
                    <textarea rows="4" cols="40" id="port_memo" placeholder="アセット変更事由"></textarea>
                    <button id="add_history">追加</button>
                    </div>
                  </div>`;

  var add_history = new Modal(id('modal'), id('modal_inner'),contents);

};

//カードを生成 -> 状態更新
function create_card(flag) {

  var data = flag ? stars : all;

  init_port.innerHTML = '';

  for(var key in data) new Card(init_port,key,get(key));

  on_star();

  percent();

}

//updating ticker data
function update(data) {

  var total_balance = 0;
  var my_btc_balaces = {};
  var my_balaces = {};
  var ticks = {}

  for(var key in data) process_data(key,data[key]);

  function process_data(key,data) {

    var tick = data.last;
    var balance = get(key) || 0;

    if(key === 'BTC_JPY') {

      my_btc_balaces[key] = balance * 1;
      my_balaces[key] = balance * 1;

      ticks[key] = 1;

      btc_tick = tick;

      total_balance += balance * 1;

    } else if (balance !== 0 ){

      my_btc_balaces[key] = tick * balance * 1;
      my_balaces[key] = balance * 1;

      ticks[key] = tick;

      total_balance += tick * balance * 1;

    }

    rating(key,tick,balance);

  }

  if( get('historys') !== null ) create_likes_list(get('historys'),ticks);

  card_gradient(my_btc_balaces,total_balance);

  total_balance_by_btc(total_balance);

  my_portfolio = my_balaces;

  set('d3', my_btc_balaces);

}

//display total balance トータルバランス表示
function total_balance_by_btc(balance) {

    id('total').innerHTML = realtime_total_value(balance);

}

//total balance
function realtime_total_value(balance) {

  var jpy = (balance * btc_tick).toFixed(0);

  return `${balance.toFixed(2)}BTC / ¥${jpy}`;

}

//display card data カードデータ更新
function rating(key,tick,balance) {

  var _tick = id(`_${key}`);
  var _btc_balance = id(`bitbase_balance_${key}`);

  if(_tick) {

    _tick.innerHTML = tick;

    key === 'BTC_JPY' ?
      _btc_balance.innerHTML = `${balance} BTC` :
      _btc_balance.innerHTML = `${(tick * balance).toFixed(5)} BTC`;

  }

}

/* --------------    view  --------------- */
//portfolio panel カードオブジェクト
function Card(parent,ts,balance) {

  this.parent = parent;
  this.ts = ts;

  var port = document.createElement('div');
      port.innerHTML = this.ts === 'BTC_JPY' ?
        `<span class='ticker_symbol'>BTC</span>` :
        `<span class='ticker_symbol'>${this.ts.split('_')[1]}</span>`;
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
      result.classList.add('bitcon_balance');

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

  input.addEventListener('keyup', add_balance, false);

  if(_ua.Mobile || _ua.Tablet) {
    star.addEventListener('touchstart', add_stars, false);
  } else {
    star.addEventListener('click', add_stars, false);
  }


  function add_balance() {

    var self = this;

    set(ts,self.value);

    //validation(self.value) === 0 ? set(ts,self.value) : self.value = '半角数字でね';

  }

  function add_stars() {

    var self = this;
    var _id = self.id; //star_BTC_ETH
    var ticker_symbol = _id.split('star_')[1]; //BTC_ETH

    if( id(_id).classList.contains('stared') ) { //remove
      //console.log('stared');
      id(_id).classList.remove('stared');

      for( var key in stars ) {
        if( key === ticker_symbol ) delete stars[key];
      }

    } else { //add
      //console.log('non stared');
      for(var key in all ) {
        if( key === ticker_symbol) stars[key] = all[key];
      }

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

  for( var key in stars ) id(`star_${key}`).classList.add('stared');

}

function percent() {

  var sliders = document.querySelectorAll('.slider');

  if(_ua.Mobile || _ua.Tablet) {
    id('percent').addEventListener('touchstart', slide, false);
  } else {
    id('percent').addEventListener('click', slide, false);
  }

  function slide() {

    this.classList.contains('percent_action') ?
      this.classList.remove('percent_action') :
      this.classList.add('percent_action');

    for(var i=0,n=sliders.length;i<n;i++) {

      sliders[i].classList.toggle('slider_in');

    }

  }

}

/* ---------- visual ------------ */
//percent slieder display & card gradient
function card_gradient(my_btc_balaces, total_balance) {

  var total = 0;

  //各通貨ごとの保有割合の計算
  for(var key in my_btc_balaces) {

    var percent = my_btc_balaces[key]/total_balance * 100;

    if(id(key)) {

      //card gradient
      id(key).style.background = `-webkit-linear-gradient(top, rgba(0, 176, 251, 0.94) 0%,rgba(255,255,255,0.04) ${percent}%)`;

      //display %
      id(`slider_${key}`).innerHTML = `<div class="slider_inner">${percent.toFixed(0)}%</div>`;

    }

  }

}

function pie(json) {

  var data = create_data_for_d3(json);

    console.log(data);

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

  var chart = field.selectAll('path').data(pie(data[1])).enter()
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
          .attr('class', 'd3_ticker_symbol')
          .text(function(d,i){ return data[0][i] === 'BTC_JPY' ? 'BTC' : `${data[0][i].split('BTC_')[1]}`; });

  function create_data_for_d3(json) {

    var jsons = [],keys = [],balances = [];

    for(var key in json ) {

      keys.push(key);
      balances.push(json[key]);

    }

    jsons.push(keys,balances);

    return jsons;

  }

}

function create_likes_list(historys, ticks) {

  id('historys').innerHTML = `<div id="portfolios_head">Portfolio History</div>`;

  for(var i = 0,n = historys.length; i < n; i++ ) {

    var date = new Date(historys[i].date);
    var btc_balance = total_balance(historys[i].history,ticks);
    var memo = historys[i].memo;
    //console.log(btc_balance);
    date = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDay() + 1}`;

    id('historys').innerHTML += `<div class="portfolios" id="${historys[i].date}">
                                  <span class="portfolio_date">${date}</span>
                                  <span class="portfolio_balance"> ${btc_balance.toFixed(2)} BTC </span>
                                  <span class="portfolio_memo">${memo}</span>
                              <div>`;

  }

  function total_balance(history,ticks) {

    var total = 0;

    for(var key in history) key === 'BTC_JPY' ? total += history[key] : total += history[key] * ticks[key];

    return total;

  }

};

function Modal(modal,modal_inner,contents) {

  modal.classList.add('modal_open');
  modal_inner.innerHTML = contents;

  if(_ua.Mobile || _ua.Tablet) {

    id('add_history').addEventListener('touchstart', add_history, false); //set portfolio to localStorage

    modal.addEventListener('touchstart',close, false); //close modal

    //stopPropagation modal_inner
    modal_inner.addEventListener('touchstart', stop , false);

  } else {

    id('add_history').addEventListener('click', add_history, false); //set portfolio to localStorage

    modal.addEventListener('click',close, false); //close modal

    modal_inner.addEventListener('click', stop , false);//stopPropagation modal_inner
  }

  function add_history(e) {

    id('port_memo').value ? Modal.prototype.push_history(e) : alert('アセット変更した理由をおせーて');

    modal.classList.remove('modal_open');
    modal_inner.innerHTML = '';

  }

  function close(e) {

    modal.classList.remove('modal_open');
    modal_inner.innerHTML = '';

  }

  function stop(e) { e.stopPropagation(); }

}

Modal.prototype.push_history = function push_history(e) {

    var historys = get('historys') || [];

    var history = {};
        history['memo'] = id('port_memo').value;
        history['date'] = new Date(e.timeStamp);
        history['history'] = my_portfolio;

    historys.push(history);

    set('historys',historys);

  }

//Tooltip Object
function Tooltip(parent,contents,option) {

  this.parent = parent;

  var tooltip = document.createElement('div');

  var size = font_size(contents,option.height,option.width);

    tooltip.innerHTML = contents;

    this.parent.position = 'relative';
    tooltip.style.height = `${option.height}px`;
    tooltip.style.width = `${option.width}px`;
    tooltip.style.fontSize = '10px';//`${size}px`;
    tooltip.style.lineHeight = '10px';//`${size}px`;

    tooltip.classList.add('tooltip');

    //open tooltip
    this.parent.addEventListener('mouseenter', open , false);

    //close tooltip
    this.parent.addEventListener('mouseleave', function(e) { this.removeChild(tooltip); }, false);

    function open(e) {

      this.appendChild(tooltip);

      if( option.position === 'left' ) {

        tooltip.style.top = `${ this.offsetTop - option.height * 1.5 }px`
        tooltip.style.left = `${ this.offsetLeft }px`

      } else if( option.position === 'right' ) {

        tooltip.style.top = `${ this.offsetTop + option.height }px`;
        tooltip.style.left = `${ this.offsetLeft - option.width }px`;

      }

  }

}

function donate(_id,options) { //options.text = '自分のbitcoin addressを入れる'

  $(function(){
      $(`#${_id}`).qrcode(options);
  });

  id(_id).addEventListener('click', function(){ alert(`カウンターパティーアドレス ${options.text}`);}, false);

}

pie(get('d3'));

new Tooltip(id('history'),`現在のポートフォリオを追加、過去ポートフォリオ比較検証する`,{height: 30, width: 150, position: 'left'});
new Tooltip(id('randscape'),'背景色を変更できます。現在は黒と白のみです',{height: 30, width: 150, position: 'right'});

donate('donate', {text: '1PtibcQsFf8S3uxweTGcFc6WyjoYU1652k', width: 50, height: 50});
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

//adjust font siza
function font_size(contents,height,width) {

  var size;
  var str_num = contents.length;
  var sqr = height * width;

    size = parseInt( width / Math.sqrt( sqr / str_num ));

    //console.log(`文字数${str_num} 可能文字サイズ${size}px`);

    return parseInt(size);

}
