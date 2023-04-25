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

function isToday(dtime, timestamp) {
    let date = new Date(timestamp * 1000);
    if (date.getFullYear() >= dtime.year
        && (date.getMonth() + 1) >= dtime.month
        && date.getDate() >= dtime.day) {
        return true;
    }
    return false;
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

function calculateAvg(data) {
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

function calculateFenshiMA(data) {
    var result = [];
    for (var i = 0, len = data.length; i < len; i++) {
        var val = calculateAvg(data.slice(0, i));
        result.push({ time: data[i].time, value: val });
    }
    return result;
}