function isAndroid() {
    var u = navigator.userAgent;
    return (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1);
}

function isIphone() {
    var u = navigator.userAgent;
    return u.indexOf('iPhone') > -1;
}

function isIpad() {
    var u = navigator.userAgent;
    return u.indexOf('iPad') > -1;
}

function isMobile() {
    var u = navigator.userAgent;
    return (!!u.match(/AppleWebKit.*Mobile.*/) || u.indexOf('iPad') > -1);
}

function getPageIndex(symbols,symbol){
    if(symbols){
        return symbols.indexOf(symbol);
    }
    return 0;
}

function timestampToString(timestamp) {
    const date = new Date(timestamp * 1000);
    const Y = date.getFullYear() + '-';
    const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    const D = date.getDate() + ' ';
    const h = date.getHours() + ':';
    const m = date.getMinutes()
    return M + D + h + m;
}

function calculateEMA(data, count) {
    const k = 2 / (count + 1);
    let ema;
    let avg = function (data, pema) {
        ema = data[0].close;
        for (let i = 1; i < data.length; i++) {
            ema = (data[i].close * k) + (pema * (1 - k));
        }
        return ema;
    }

    let result = [];
    let items = [];
    let pema = 0.0;
    let val = 0.0;
    for (let i = count - 1, len = data.length; i < len; i++) {
        items = data.slice(i - count + 1, i);
        if (pema == 0.0) {
            pema = items[0].close;
        }
        val = avg(items, pema);
        pema = val;
        result.push({ time: data[i].time, value: val });
    }
    return result;
}

function calculateAvg(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i].close;
    }
    return sum / data.length;
}

function calculateSMA(data, count) {
    let result = [];
    let val= 0.0;
    for (let i = count - 1, len = data.length; i < len; i++) {
        val = calculateAvg(data.slice(i - count + 1, i));
        result.push({ time: data[i].time, value: val });
    }
    return result;
}

function calculateFenshiMA(data) {
    let result = [];
    let val= 0.0;
    for (let i = 0, len = data.length; i < len; i++) {
        val = calculateAvg(data.slice(0, i));
        result.push({ time: data[i].time, value: val });
    }
    return result;
}