//color http://www.360doc.com/content/14/0329/09/4286573_364621220.shtml
//chart https://github.com/tradingview/lightweight-charts/blob/master/docs/candlestick-series.md

var pageScreenX = 0;
var pageScreenY = 0;

var pageIndex = 0;
var isloading = false
var symbols = [];
var symbolsType = 0;

var crossEnable = false;
var chartWidth = 393;
var chartHeight = 450;

var curSymbol = '';
var curPrice = 0.0;

var clickCount = 0;
var seriesType = 0 //forex:0, futures:1, stock:2

$(function () {
    debug('width' + screen.width + ',' + screen.height);
    if (isMobile()) {
        chartWidth = screen.width;
        chartHeight = screen.height / 3.0;
    } else {
        chartWidth = screen.width;
        chartHeight = screen.height / 3.0 - 10;
    }
    $(".chart-body").css("width", chartWidth);

    init_touch();
    init_fav_list();
    reload_symbols();
});

function init_fav_list(){
    let symbolEle = $("#symbol");
    symbolEle.click(e=>{
       let symbol =symbolEle.text();
       if(isFav(symbol)){
            removeFav(symbol);
       }else{
            addFav(symbol);
       }
       show_fav_list();
    });

    show_fav_list();
}

function show_fav_list(){
    let favListEle =  $('#fav_list');
    favListEle.empty();

    let favEle;
    for(let index in favList){
        favEle = document.createElement('div');
        favEle.setAttribute('class','fav_item');
        favEle.innerHTML = favList[index];
        favEle.setAttribute("id", 'favEle_'+index);
        favListEle.append(favEle);

        $('#favEle_'+index).click(e=>{
            let symbol = $('#favEle_'+index).text();
            pageIndex = getPageIndex(symbols, symbol);
            load_chart_item(symbol, 'D1');
        });
    }
}

function reload_symbols() {
    let url = 'https://www.winfirm.com.cn/serv/chart_symbols';
    $.ajax({
        type: 'GET',
        url: url,
        data: '',
        traditional: true,
        success: function (result) {
            let obj = JSON.parse(result);
            symbols = obj.forex;
            seriesType = 0;
            init_charts(symbols);
        }
    });
}

function init_charts(symbols) {
    debug('show_charts');
    pageIndex = 0;
    load_chart_item(symbols[pageIndex], 'D1');
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
            set_load_result(result, symbol);
        }
    });
}

function set_load_result(result, symbol) {
    updateSymbol(symbol);
    let obj = JSON.parse(result);

    window.ChartObj && ChartObj.changeTitle(symbol);
    let datas1 = obj.datas1;
    show_candle_chart('chart1', symbol, obj.digits, obj.point, datas1.slice(datas1.length - 96), false);
    let datas2 = obj.datas2;
    show_candle_chart('chart2', symbol, obj.digits, obj.point, datas2, false);

    let dlen = obj.datas1.length;
    let dkdata = obj.datas1[dlen - 1];
    show_fenshi_chart('chart3', symbol, obj.digits, obj.point, dkdata.time, obj.datas3);
}

function show_candle_chart(chartid, symbol, digits, point, datas, fitContent) {
    reset_element(chartid);

    let barsize = (chartid == 'chart1' ? 8 : 3.5);
    let rightspace = (chartid == 'chart1' ? 5 : 10);
    let cHeight = (chartid == 'chart1') ? (chartHeight - 40) : (chartHeight + 40);
    let chart = LightweightCharts.createChart(document.getElementById(chartid), getconfig(chartWidth, cHeight, barsize, rightspace));

    let candleSeries = chart.addCandlestickSeries({
        upColor: '#ef5350', downColor: '#26a69a',
        borderVisible: false, wickUpColor: '#ef5350',
        wickDownColor: '#26a69a',
        priceFormat: {
            type: 'price',
            precision: digits,
            minMove: point,
        },
        priceLineVisible: false
    });
    candleSeries.priceScale().applyOptions({
        autoScale: true,
        scaleMargins: {
            top: 0.075,
            bottom: 0.1,
        },
    });
    candleSeries.setData(datas);
    chart.subscribeCrosshairMove(crossMoveEvent(symbol, digits, candleSeries));
    chart.subscribeClick(clickEvent(symbol, candleSeries));
    setMaLine(datas, 10, chart, '#ffffff', 0);
    setMaLine(datas, 20, chart, '#ff0000', 0);

    if (chartid == 'chart2') {
        setMaLine(datas, 55, chart, '#0099cc', 1);
    }
    if (fitContent) {
        chart.timeScale().fitContent();
    }
}

function show_fenshi_chart(chartid, symbol, digits, point, dtime, datas3) {
    reset_element(chartid);

    let barsize = 0;
    let rightspace = 3;
    let cHeight = chartHeight - 135;
    let chart = LightweightCharts.createChart(document.getElementById(chartid), getconfig(chartWidth, cHeight, barsize, rightspace));

    let datas = getFenshiDatas(dtime, datas3);
    let lineSeries = chart.addLineSeries({
        lineWidth: 0.55,
        color: '#ffffff',
        priceFormat: {
            type: 'price',
            precision: digits,
            minMove: point
        },
        priceLineVisible: false
    });
    lineSeries.priceScale().applyOptions({
        autoScale: true,
        scaleMargins: {
            top: 0.1,
            bottom: 0.1,
        },
    });
    lineSeries.setData(datas);
    chart.subscribeCrosshairMove(crossMoveEvent(symbol, digits, lineSeries));
    chart.subscribeClick(clickEvent(symbol, lineSeries));

    setFenshiMaLine(datas, chart, '#ffff99');
    setMaLine(datas, 21, chart, '#cc0000', 0);
    chart.timeScale().fitContent();
}

function crossMoveEvent(symbol, digits, series) {
    let fun = param => {
        if (!param.point) {
            return;
        }
        const y = param.point.y;
        let price = series.coordinateToPrice(y);
        updateSymbol(symbol);
        updatePrice(price.toFixed(digits));
    }
    return fun;
}

function clickEvent(symbol, series) {
    let fun = param => {
        if (clickCount == 0) {
            clickCount = 1;
            setTimeout(clickDrop, 1500);
        } else if (clickCount == 1) {
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

function getFenshiDatas(dtime, datas) {
    let ret = [];
    let item;
    for (i in datas) {
        item = datas[i];
        if (isToday(dtime, item.time)) {
            item['value'] = item.close;//线型图，读取value值，而不是close
            ret.push(item);
        }
    }
    return ret;
}

function clickDrop() {
    if (clickCount > 0) {
        clickCount = clickCount - 1;
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

function setFenshiMaLine(datas, chart, color) {
    const smaData = calculateFenshiMA(datas);
    const smaLine = chart.addLineSeries({
        color,
        lineWidth: 1,
    });
    smaLine.setData(smaData);
}

function getconfig(width, height, barSpacing, rightOffset) {
    return {
        width,
        height,
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

        timeScale: {
            rightOffset,
            barSpacing,
            rightBarStaysOnScroll: false,
            fixLeftEdge: false,
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

function updateSymbol(symbol) {
    curSymbol = symbol;
    $("#symbol").text(symbol);
}

function updatePrice(price) {
    curPrice = price;
    if (curPrice) {
        $("#price").text(price);
    }
}

function next_symbol() {
    if (isloading) {
        return;
    }

    curPrice = 0.0;
    $("#info").text("");

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

    curPrice = 0.0;
    $("#info").text("");

    let len = symbols.length
    if (pageIndex > 0) {
        pageIndex--;
    } else {
        pageIndex = len - 1
    }
    symbol = symbols[pageIndex];
    load_chart_item(symbol, 'D1');
}

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

function handler(e) {
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
}

function debug(logString) {
    if (window.ChartObj) {
        ChartObj.printLog(logString);
    } else {
        console.log(logString);
    }
}
