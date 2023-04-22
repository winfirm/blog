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
var chartWidth = 393;
var chartHeight = 450;

var curSymbol = '';
var curPrice = 0.0;

var clickCount=0;

$(function () {
    debug('width' + screen.width + ',' + screen.height);
    chartWidth = screen.width<450?screen.width:screen.width;
    chartHeight = screen.height / 3.0 - 50;
    $("#crossover").click(e => {
        debug(`mark Info: ${curSymbol}, ${curPrice}.`);
    });
    $("#crossdown").click(e => {
        debug(`mark Info: ${curSymbol}, ${curPrice}.`);
    });

    init_touch();
    reload_symbols();
});

function reload_symbols() {
    let url = 'https://www.winfirm.com.cn/serv/chart_symbols';
    debug(url)
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
    debug('show_charts');
    pageIndex = 0;
    load_chart_item(symbols[pageIndex], 'D1');
}

function next_symbol() {
    if (isloading) {
        return;
    }
    let len = symbols.length
    if (pageIndex < (len - 1)) {
        pageIndex++;
    } else {
        pageIndex = 0;
    }
    symbol = symbols[pageIndex];
    load_chart_item(symbol, 'D1');
}

function pre_symbol() {
    if (isloading) {
        return;
    }
    let len = symbols.length
    if (pageIndex > 0) {
        pageIndex--;
    } else {
        pageIndex = len - 1
    }
    symbol = symbols[pageIndex];
    load_chart_item(symbol, 'D1');
}

function load_chart_item(symbol, times) {
    if (isloading) {
        return;
    }
    isloading = true;
    let url = 'https://www.winfirm.com.cn/serv/index_json?symbol=' + symbol + '&times=' + times;
    $.ajax({
        type: 'get',
        url: url,
        data: '',
        traditional: true,
        success: function (result) {
            isloading = false;
            let obj = JSON.parse(result);

            window.ChartObj && ChartObj.changeTitle(symbol);
            show_candle_chart('chart1', symbol, obj.digits, obj.point, obj.datas1);
            show_candle_chart('chart2', symbol, obj.digits, obj.point, obj.datas2);

            let dlen = obj.datas1.length;
            let dkdata = obj.datas1[dlen-1];
            show_fenshi_chart('chart3', symbol, obj.digits, obj.point, dkdata.time, obj.datas3);
        }
    });
}

function show_candle_chart(chartid, symbol, digits, point, datas) {
    reset_element(chartid);

    let barsize = (chartid=='chart1'?7.5:4.5);
    let rightspace =  (chartid=='chart1'?6:15);
    let chart = LightweightCharts.createChart(document.getElementById(chartid), getconfig(barsize, 'left', rightspace, true, 0));
    
    let candleSeries = chart.addCandlestickSeries({
        upColor: '#ef5350', downColor: '#26a69a',
        borderVisible: false, wickUpColor: '#ef5350',
        wickDownColor: '#26a69a',
        priceFormat: {
            type: 'price',
            precision: digits,
            minMove: point,
        }
    })

    candleSeries.setData(datas);
    chart.subscribeCrosshairMove(crossMoveEvent(symbol,digits, candleSeries));
    chart.subscribeClick(clickEvent(symbol,candleSeries));

    setMaLine(datas, 10, chart, '#ffffff', 1);
    setMaLine(datas, 22, chart, '#ff0000', 1);
   
    if(chartid=='chart2'){
        setMaLine(datas, 55, chart, '#0099cc', 1);
    }
}

function show_fenshi_chart(chartid, symbol, digits, point, dtime, datas3) {
    reset_element(chartid);

    let barsize = 1.5;
    let rightspace = 3;
    let chart = LightweightCharts.createChart(document.getElementById(chartid), getconfig(barsize, 'left', rightspace, true, 0));

    let datas = getFenshiDatas(dtime, datas3);
    let lineSeries = chart.addLineSeries({
        lineWidth:1,
        color:'#ffffff',
        priceFormat: {
            type: 'price',
            precision: digits,
            minMove: point
        }
    });

    lineSeries.setData(datas);
    chart.subscribeCrosshairMove(crossMoveEvent(symbol,digits, lineSeries));
    chart.subscribeClick(clickEvent(symbol,lineSeries));

    setFenshiMaLine(datas, chart, '#ffff99');
    setMaLine(datas, 55, chart, '#0099cc', 0);
    setMaLine(datas, 21, chart, '#ff0000', 0);
    //chart.timeScale().fitContent();
}

function crossMoveEvent(symbol,digits, series){
    let fun = param=>{
        debug(param)
        if (!param.point) {
            return;
        }
        const y = param.point.y;
        let price = series.coordinateToPrice(y);
        updatePrice(symbol, price.toFixed(digits));
    }
    return fun;
}

function clickEvent(symbol, series){
    let fun = param=>{
        if(clickCount==0){
            clickCount=1;
            setTimeout(clickDrop,1500);
        } else if(clickCount==1){
            clickCount = 0;
            debug("double click");
            const myPriceLine = {
                price: curPrice,
                color: '#3179F5',
                lineWidth: 1,
                lineStyle: 2, // LineStyle.Dashed
                axisLabelVisible: true,
                title: 'up',
            };
            series.createPriceLine(myPriceLine);
        }
    }
    return fun;
}


function getFenshiDatas(dtime, datas){
    let ret = [];
    let item;
    for(i in datas){
        item = datas[i];
        if(isToday(dtime, item.time)){
            item['value'] =  item.close;//线型图，读取value值，而不是close
            ret.push(item);
        }
    }
    return ret;
}

function isToday(dtime,  timestamp){
    let date = new Date(timestamp*1000);
    if(date.getFullYear()>=dtime.year 
    && (date.getMonth()+1)>=dtime.month
    && date.getDate()>=dtime.day){
        return true;
    }
    return false;
}

function clickDrop(){
    if(clickCount>0){
        clickCount = clickCount-1;
    }
}

function setMaLine(datas, count, chart, color, type) {
    const smaData = type == 0 ? calculateEMA(datas, count) : calculateSMA(datas, count);
    const smaLine = chart.addLineSeries({
        color,
        lineWidth: 1,
    });
    smaLine.setData(smaData);
}

function setFenshiMaLine(datas, chart, color){
    const smaData = calculateFenshiMA(datas);
    const smaLine = chart.addLineSeries({
        color,
        lineWidth: 1,
    });
    smaLine.setData(smaData);
}

function getconfig(barSpacing, position, rightOffset, fixLeftEdge, margin) {
    return {
        width: chartWidth,
        height: chartHeight,
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

function reset_element(id) {
    let doc = document.getElementById(id)
    let child = doc.childNodes[0];
    if (child) {
        doc.removeChild(child)
    }
}

function updatePrice(symbol, price) {
    curSymbol = symbol;
    curPrice = price;
    if (curPrice) {
        $("#info").text('price:' + price)
    }
}

const handler = function (e) {
    if (e.originalType == 'touchstart') {
        pageScreenX = e.pageX;
        pageScreenY = e.pageY;
    } else if (e.originalType == 'touchend') {
        if (e.pageY - pageScreenY > 100 && (pageScreenX - e.pageX) < 50) {
            pre_symbol();
        } else if (pageScreenY - e.pageY > 100 && (pageScreenX - e.pageX) < 50) {
            next_symbol();
        }
    }
};

function init_touch() {
    $(document).keydown(function (e) {
        var code = e.which;
        switch (code) {
            case 38:
                break;
            case 40:
                break;
            case 37:
                pre_symbol();
                break;
            case 39:
                next_symbol();
                break;
            default:
                return;
        }
    });
    $(".chart-container").touchInit({ preventDefault: false });
    $(".chart-container").on("touch_start", handler);
    $(".chart-container").on("touch_move", handler);
    $(".chart-container").on("touch_end", handler);
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

function calculateAvg(data){
    var sum = 0;
    for (var i = 0; i < data.length; i++) {
        sum += data[i].close;
    }
    return sum / data.length;
}

function calculateSMA(data, count) {
    var result = [];
    for (var i = count - 1, len = data.length; i < len; i++) {
        var val = calculateAvg(data.slice(i - count + 1, i));
        result.push({ time: data[i].time, value: val });
    }
    return result;
}

function calculateFenshiMA(data){
    var result = [];
    for (var i = 0, len = data.length; i < len; i++) {
        var val = calculateAvg(data.slice(0, i));
        result.push({ time: data[i].time, value: val });
    }
    return result;
}

function debug(logString){
    if(window.ChartObj){
        ChartObj.printLog(logString);
    }else{
        console.log(logString);
    }
}
