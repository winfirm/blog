var favList = []

let favlistStr = localStorage.getItem('favlist');
if (favlistStr) {
    favList = JSON.parse(favlistStr);
}

function isFav(symbol) {
    let item;
    for (let index in favList) {
        item = favList[index];
        if (item == symbol) {
            return true;
        }
    }
    return false;
}

function addFav(symbol) {
    favList.push(symbol);
    updateFavData(favList);
}

function removeFav(symbol) {
    let ret = [];
    let item;
    for (let index in favList) {
        item = favList[index];
        if (!(symbol == item)) {
            ret.push(item);
        }
    }
    favList = ret;
    updateFavData(ret);
}

function updateFavData(data) {
    localStorage.setItem('favlist', JSON.stringify(data));
}

function getTimeFrame() {
    let times = localStorage.getItem('times');
    if (!times) {
        times = 'D1';
    }
    return times;
}

function switchTimeFrame() {
    let times = getTimeFrame();
    if (times == 'D1') {
        times = 'W1';
    } else if (times = 'W1') {
        times = 'D1';
    }
    localStorage.setItem('times', times);
    return times;
}