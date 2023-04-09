//color http://www.360doc.com/content/14/0329/09/4286573_364621220.shtml
//chart https://github.com/tradingview/lightweight-charts/blob/master/docs/candlestick-series.md
//https://dev.to/onurcelik/calculate-the-exponential-moving-average-ema-with-javascript-29kp

var charts = [];
var symbols = []

var pageScreenX = 0;
var pageScreenY = 0;
var pageIndex = 0;
var isloading = false
var symbolsType = 0;

symbols.push("EURUSD");
symbols.push("USDJPY");
symbols.push("USDCHF");
symbols.push("USDCAD");
symbols.push("AUDUSD");
symbols.push("GBPUSD");
symbols.push("NZDUSD");
symbols.push("EURJPY");
symbols.push("EURCHF");
symbols.push("EURGBP");
symbols.push("EURNZD");
symbols.push("EURCAD");
symbols.push("EURAUD");
symbols.push("GBPJPY");
symbols.push("GBPCHF");
symbols.push("GBPNZD");
symbols.push("GBPCAD");
symbols.push("GBPAUD");
symbols.push("AUDCHF");
symbols.push("AUDJPY");
symbols.push("AUDCAD");
symbols.push("AUDNZD");
symbols.push("NZDJPY");
symbols.push("NZDCHF");
symbols.push("NZDCAD");
symbols.push("CHFJPY");

var length = symbols.length;
var crossEnable = false;


$(function () {
    console.log('width' + screen.width + ',' + screen.height);
    init_charts();
    reload_symbols();

    $("#setcross").click(e=>{
        console.log("click");
        crossEnable = !crossEnable;
        updateCross();
    });
    updateCross();
});

function updateCross(){
    if(crossEnable){
        $("#setcross").text('on');
    }else{
        $("#setcross").text('off');
    }
}

function init_charts() {
    console.log('show_charts');
    let barsize = 6;
    let rightspace = 4;
    
    let chart;
    let chartItem;
    let chartView;
    let rootEle = document.getElementById("rootEle");
    for (let index = 0; index < length; index++) {
        chartItem = document.createElement('div');
        chartItem.setAttribute("class", "chart-item");
        rootEle.appendChild(chartItem);

        labelEle = document.createElement('label');
        labelEle.setAttribute("class", "label-item");
        labelEle.innerHTML = symbols[index];
        chartItem.appendChild(labelEle);

        chartView = document.createElement('div');
        chartView.setAttribute("class", "chart-view");
        chartItem.appendChild(chartView);

        chart = LightweightCharts.createChart(chartView, getconfig(barsize, 'left', rightspace, false));
        charts.push(chart);
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

function show_chart_all() {
    times = 'H1';
    for (let i=0;i<length;i++) {
        load_chart_item(charts[i], symbols[i], times, false);
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
            show_chart_item(chart,obj.digits, obj.point, obj.datas1,fitContent);
        }
    });
}

function show_chart_item(chart, digits, point, datas,fitContent) {
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

        if(param.point){
            const x = param.point.x;
            const y = param.point.y;
            console.log(`The data point x: ${x}, y: {y}`);

            const data = param.seriesData.get(candleSeries);
            if(data){
                let price = candleSeries.coordinateToPrice(y);
                console.log(`The price is click: ${price}` )
            }
        }
    });

    candleSeries.setData(datas);

    setMaLine(datas, 10, chart, '#ffffff', 0);
    setMaLine(datas, 22, chart, '#ff0000', 0);
    setMaLine(datas, 55, chart, '#0000cc', 1);

    fitContent&&chart.timeScale().fitContent()
}

function getconfig(barSpacing, position, rightOffset, fixLeftEdge, margin) {
    return {
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
            backgroundColor: '#000000',
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
            show_chart_all();
        }
    });
}
