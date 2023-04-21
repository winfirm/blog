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

$(function () {
    debug('width' + screen.width + ',' + screen.height);
    chartWidth = screen.width;
    chartHeight = screen.height / 2.0 - 80;
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
            show_candle_chart('chart1', symbol, obj.digits, obj.point, obj.datas1);
            show_candle_chart('chart2', symbol, obj.digits, obj.point, getFenshiDatas(obj.datas2));
        }
    });
}

function getFenshiDatas(datas){
    let ret = [];
    let item;
    for(i in datas){
        item = datas[i];
        if(isToday(item.time)){
            ret.push(item);
        }        
    }
    return ret;
}

function show_candle_chart(chartid, symbol, digits, point, datas, fitContent) {
    window.ChartObj && ChartObj.changeTitle(symbol);
    reset_element(chartid);

    let barsize = 6;
    let rightspace = 5;
    let chart = LightweightCharts.createChart(document.getElementById(chartid), getconfig(barsize, 'left', rightspace, true, 0));
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
        debug(param)
        crossEnable = !crossEnable
        if (crossEnable) {
            $("#status").text("on");
            //$("#board").css("display", "block");
        } else {
            $("#status").text("");
            //$("#board").css("display", "none");
        }
    });

    chart.subscribeCrosshairMove(param => {
        debug(param)
        if (!param.point) {
            return;
        }
        const y = param.point.y;
        let price = candleSeries.coordinateToPrice(y);
        updatePrice(symbol, price.toFixed(digits));
    });

    candleSeries.setData(datas);

    if(chartid=='chart1'){
        setMaLine(datas, 10, chart, '#ffffff', 1);
        setMaLine(datas, 22, chart, '#ff0000', 1);
        setMaLine(datas, 55, chart, '#0000cc', 1);
    }else{
        setFenshiMaLine(datas, chart, '#ffffff');
        setMaLine(datas, 22, chart, '#ff0000', 1);
        setMaLine(datas, 55, chart, '#0000cc', 1);
        chart.timeScale().fitContent()
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

function isToday(timestamp){
    const date = new Date(timestamp * 1000);
    const today = new Date();
    if(date.getFullYear()==today.getFullYear()
        && date.getMonth()== today.getMonth()
        && date.getDate()==today.getDate()){
            return true;
    }
    return false;
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