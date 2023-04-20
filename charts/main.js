//color http://www.360doc.com/content/14/0329/09/4286573_364621220.shtml
//chart https://github.com/tradingview/lightweight-charts/blob/master/docs/candlestick-series.md
//https://dev.to/onurcelik/calculate-the-exponential-moving-average-ema-with-javascript-29kp

var charts = [];

var pageScreenX = 0;
var pageScreenY = 0;
var pageIndex = 0;
var isloading = false
var symbolsType = 0;

var crossEnable = false;
var chartWidth = 1920;
var chartHeight = 300;

var curSymbol = '';
var curPrice = 0.0;

$(function () {
    console.log('width' + screen.width + ',' + screen.height);
    initGoEasy();
    $("#crossover").click(e=>{
        console.log(`mark Info: ${curSymbol}, ${curPrice}.`);
    });
    $("#crossdown").click(e=>{
        console.log(`mark Info: ${curSymbol}, ${curPrice}.`);
    });
    if(screen.width>=1280){
        chartWidth = (screen.width-24-20)/2.0;
        chartHeight=300;
    }else{
        chartWidth = screen.width-8;
        chartHeight=220;
    }
    
    reload_symbols();
});

function reload_symbols() {
    let url = 'https://www.winfirm.com.cn/serv/chart_symbols';
    console.log(url)
    $.ajax({
        type: 'GET',
        url: url,
        data: '',
        traditional: true,
        success: function (result) {
            let obj = JSON.parse(result);
            let array = obj.forex;
            if (symbolsType == 0) {
                array = obj.forex;
            } else if (symbolsType == 1) {
                array = obj.futures;
            } else if (symbolsType == 2) {
                array = obj.stocks;
            }
            symbols = array;
            init_charts(symbols);
        }
    });
}

function init_charts(symbols) {
    console.log('show_charts');
    let barsize = 6;
    let rightspace = 4;
    
    let chart;
    let chartItem;
    let chartView;
    let rootEle = document.getElementById("rootEle");
    let length = symbols.length;
    for (let index = 0; index < length; index++) {
        chartItem = document.createElement('div');
        chartItem.setAttribute("class", "chart-item");
        rootEle.appendChild(chartItem);

        labelEle = document.createElement('label');
        labelEle.setAttribute("class", "label-item");
        labelEle.innerHTML = symbols[index];
        chartItem.appendChild(labelEle);

        chartView = document.createElement('div');
        chartItem.appendChild(chartView);

        chart = LightweightCharts.createChart(chartView, getconfig(barsize, 'left', rightspace, false));
        load_chart_item(chart, symbols[index], 'H1', false);
    }
}

function load_chart_item(chart,  symbol, times,fitContent) {
    let url = 'https://www.winfirm.com.cn/serv/index_json?symbol=' + symbol + '&times=' + times;
    console.log("url="+url)

    $.ajax({
        type: 'get',
        url: url,
        data: '',
        traditional: true,
        success: function (result) {
            let obj = JSON.parse(result);
            show_chart_item(chart,symbol,obj.digits, obj.point, obj.datas1,fitContent);
        }
    });
}

function show_chart_item(chart, symbol, digits, point, datas,fitContent) {
    let candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350',
        borderVisible: false, wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        priceFormat: {
            type: 'price',
            precision: digits,
            minMove: point,
        }
    });

    chart.subscribeClick(param => {
        console.log(param)
        crossEnable = !crossEnable
        if(crossEnable){
            $("#status").text("on");
        }else{
            $("#status").text("off");
        }
    });

    chart.subscribeCrosshairMove(param => {
        if(!crossEnable){
            console.log("crossEnable off")
            return;
        }

        console.log(param)
        if (!param.point) {
            return;
        }
        const y = param.point.y;
        let price = candleSeries.coordinateToPrice(y);
        updatePrice(symbol,price.toFixed(digits));
    });
    
    candleSeries.setData(datas);

    setMaLine(datas, 10, chart, '#ffffff', 0);
    setMaLine(datas, 22, chart, '#ff0000', 0);
    setMaLine(datas, 55, chart, '#0000cc', 1);

    //fitContent&&chart.timeScale().fitContent()
}

function updatePrice(symbol, price){
    curSymbol = symbol;
    curPrice = price;
    $("#price").text(symbol+':'+price)
}

function setMaLine(datas, count, chart, color, type) {
    const smaData = type == 0 ? calculateEMA(datas, count) : calculateSMA(datas, count);
    const smaLine = chart.addLineSeries({
        color,
        lineWidth: 1,
    });
    smaLine.setData(smaData);
}

function getconfig(barSpacing, position, rightOffset, fixLeftEdge, margin) {
    return {
        width:chartWidth,
        height:chartHeight,
        localization: {
            locale: 'en-US',
            dateFormat: 'yyyy/MM/dd',
            timeFormatter: businessDayOrTimestamp => {
                if (LightweightCharts.isUTCTimestamp(businessDayOrTimestamp)) {
                    return timestampToString(businessDayOrTimestamp);
                } else {
                    return businessDayOrTimestamp;
                }
            }
        },
        priceScale: {
            autoScale: false,
            position,
            scaleMargins: margin,
            drawTicks: false
        },

        timeScale: {
            rightOffset,
            barSpacing,
            rightBarStaysOnScroll: false,
            fixLeftEdge,
            alignLabels: false,
            borderVisible: false,
            tickMarkFormatter: (time, tickMarkType, locale) => {
                if (LightweightCharts.isUTCTimestamp(time)) {
                    return timestampToString(time);
                } else {
                    return time; 
                }
            },
        },
        layout: {
            textColor: 'rgba(220 , 220 , 255, 0.5)',
            background: { type: 'solid', color: 'black' }
        },
        grid: {
            vertLines: {
                color: 'rgba(105 , 105 , 105 , 0.2)',
            },
            horzLines: {
                color: 'rgba(105  , 105  , 105  , 0.2)',
            }
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        }
    };
}

function timestampToString(timestamp) {
    const date = new Date(timestamp * 1000);
    const Y = date.getFullYear() + '-';
    const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    const D = date.getDate() + ' ';
    const h = date.getHours() + ':';
    const m = date.getMinutes()
    return Y + M + D + h + m;
}

function calculateEMA(data, count) {
    const k = 2 / (count + 1);
    var avg = function (data, pema) {
        let ema = data[0].close;
        for (let i = 1; i < data.length; i++) {
            ema = (data[i].close * k) + (pema * (1 - k));
        }
        return ema;
    }

    var result = [];
    var items = [];
    var pema = 0.0;
    for (var i = count - 1, len = data.length; i < len; i++) {
        items = data.slice(i - count + 1, i);
        if (pema == 0.0) {
            pema = items[0].close;
        }
        var val = avg(items, pema);
        pema = val;
        result.push({ time: data[i].time, value: val });
    }
    return result;
}

function calculateSMA(data, count) {
    var avg = function (data) {
        var sum = 0;
        for (var i = 0; i < data.length; i++) {
            sum += data[i].close;
        }
        return sum / data.length;
    };
    var result = [];
    for (var i = count - 1, len = data.length; i < len; i++) {
        var val = avg(data.slice(i - count + 1, i));
        result.push({ time: data[i].time, value: val });
    }
    return result;
}

function showAlert(message){
    var notification = new Notification("Hi",{
        body : message.content,
        icon : 'http://images0.cnblogs.com/news_topic/firefox.gif',
        sound:audioNotification(),
        tag : {} // 可以加一个tag
    });
}

function initGoEasy(){
         //初始化GoEasy对象
         let goEasy = GoEasy.getInstance({
            host:'hangzhou.goeasy.io', //新加坡host：singapore.goeasy.io
            appkey: "BC-7c8e3ea162d946c7b1b358c45d2ac019", //替换为您的应用appkey
            modules: ['pubsub']
        });
         //建立连接
        goEasy.connect({
            onSuccess: function () { //连接成功
                console.log("GoEasy connect successfully.") //连接成功
            },
            onFailed: function (error) { //连接失败
                console.log("Failed to connect GoEasy, code:"+error.code+ ",error:"+error.content);
            }
        });
        //订阅消息
        goEasy.pubsub.subscribe({
            channel: "signal_channel",//替换为您自己的channel
            onMessage: function (message) { //收到消息
                console.log("Channel:" + message.channel + " content:" + message.content);
                showAlert(message);
            },
            onSuccess: function () {
                console.log("Channel订阅成功。");
            },
            onFailed: function (error) {
                console.log("Channel订阅失败, 错误编码：" + error.code + " 错误信息：" + error.content)
            }
        });

        Notification.requestPermission(function(){
            console.log("requestPermission")
        });
}