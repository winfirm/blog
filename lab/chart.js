//color http://www.360doc.com/content/14/0329/09/4286573_364621220.shtml
//chart https://github.com/tradingview/lightweight-charts/blob/master/docs/candlestick-series.md
var chart1;

var chart_w1 = parseInt(1280*0.95);
var chart_h1=parseInt(720*0.75);

var symbols = []
var pageScreenX=0;
var pageScreenY=0;
var pageIndex=0;
var isloading=false
var symbolsType =0;

$(function() {
   console.log('width'+screen.width+','+screen.height);
   chart_w1=screen.width*0.95;
   chart_h1=screen.height*0.75;
   
   $('.chart_main').css('width',chart_w1);
   $('.board').css('width',chart_w1);
   $('.chart_main').css('height',chart_h1);

   init_touch();
   reload_symbols();
   
   $('.symbol_switch').click(function(){
	   console.log('clicked');
	   if(symbolsType==0){
		   symbolsType=1;
	   }else if(symbolsType==1){
		   symbolsType=2;
	   }else if(symbolsType==2){
		   symbolsType=0;
	   }
	   reload_symbols();
   });
   
    $(document).keydown(function(e){
        var code=e.which;
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
	
});

function reset_element(id){
    let doc = document.getElementById(id)
    let child=doc.childNodes[0];
    if(child){
        doc.removeChild(child)
    }  
}

function show_charts(datas){    
	let barsize =6;
	let rightspace = 5;
	if(chart_w1>1000){
		barsize=12;
		rightspace = 10;
	}
    chart1=LightweightCharts.createChart(document.getElementById("chart1"), getconfig(barsize,chart_w1,chart_h1,'left',rightspace,false),{bottom: 0, top: 0.01});
    show_chart_item(chart1,parseInt(datas.digits),parseFloat(datas.point),datas.datas1);
}

function getVolumeData(datas){
	let ret = [];
	for(let index in datas){
		data=datas[index]
		if(data.close>data.open){
			ret.push({time:data.time, value:data.volume,color:'rgba(255,82,82, 0.8)'})
		}else{
			ret.push({time:data.time, value:data.volume,color:'rgba(64, 224, 208, 1)'})
		}
	}
	return ret;
}

function show_chart_item(chart,digits,point,datas){
    let candleSeries = chart.addCandlestickSeries();
    candleSeries.applyOptions({
        upColor: 'rgba(255, 0, 0, 1)',
        downColor: 'rgba(64, 224, 208, 1)',
        borderUpColor: 'rgba(255, 0, 0, 1)',
        borderDownColor: 'rgba(64, 224, 208, 1)',
        wickUpColor: 'rgba(255, 0, 0, 1)',
        wickDownColor: 'rgba(64, 224, 208, 1)',
        priceFormat: {
            type: 'price',
            precision: digits,
            minMove: point,
        },
    });
    candleSeries.setData(datas);
	
	setMaLine(datas,55,chart,'rgba(65, 105, 225, 1)');
	setMaLine(datas,21,chart,'rgba(250, 105, 225, 1)');
	setMaLine(datas,13,chart,'rgba(255, 69, 0, 1)');
	setMaLine(datas,5,chart,'rgba(250, 250, 250, 1)');

	let volumeSeries = chart.addHistogramSeries({
		priceFormat: {
			type: 'volume',
		},
		priceScaleId: '',
		scaleMargins: {
			top: 0.92,
			bottom: 0,
		},
	});
	volumeSeries.setData(getVolumeData(datas));

}

function getconfig(barSpacing,width,height,position,rightOffset,fixLeftEdge,margin){
    return {
        width,
        height,
        
        localization: {
            locale: 'en-US',
            dateFormat: 'yyyy/MM/dd',
            timeFormatter: businessDayOrTimestamp => {
                if (LightweightCharts.isBusinessDay(businessDayOrTimestamp)) {
                    return dateToString(businessDayOrTimestamp)
                }else {
                    return timestampToString(businessDayOrTimestamp)
                }
            }
        },
        priceScale:{
            position,
            scaleMargins:margin,
            drawTicks:false
        },

        timeScale: {
            rightOffset,
            barSpacing,
            rightBarStaysOnScroll:false,
            fixLeftEdge,
            alignLabels: false,
            borderVisible: false,
            
            tickMarkFormatter: (time, tickMarkType, locale) => {
                if (LightweightCharts.isBusinessDay(time)) {
                    return dateToString(time)
                }else {
                    return timestampToString2(time)
                }
            },
        },
        layout: {
            backgroundColor: '#000000',
            textColor: 'rgba(220 , 220 , 255, 0.5)',
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
            mode: LightweightCharts.CrosshairMode.Normal ,
        }
    };    
}

function calculateSMA(data, count){
  var avg = function(data) {
    var sum = 0;
    for (var i = 0; i < data.length; i++) {
       sum += data[i].close;
    }
    return sum / data.length;
  };
  var result = [];
  for (var i=count - 1, len=data.length; i < len; i++){
    var val = avg(data.slice(i - count + 1, i));
    result.push({ time: data[i].time, value: val});
  }
  return result;
}

function setMaLine(datas, count, chart, color){
    const smaData = calculateSMA(datas, count);
    const smaLine = chart.addLineSeries({
        color,
        lineWidth: 1,
    });
    smaLine.setData(smaData);
}

function dateToString(date) {
    return date.year+'-' +date.month+'-'+date.day;
}

function timestampToString(timestamp) {
    const date = new Date(timestamp * 1000);
    const Y = date.getFullYear() + '-';
    const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    const D = date.getDate() + ' ';
    const h = date.getHours() + ':';
    const m = date.getMinutes() + ':';
    const s = date.getSeconds();
    return Y + M + D + h + m + s;
}

function timestampToString2(timestamp) {
    const date = new Date(timestamp * 1000);
    const h = date.getHours() + ':';
    const m = date.getMinutes() + ':';
    const s = date.getSeconds();
    return h + m + s;
}

function refresh_chart_item(symbol){
	change_symbol(symbol);
}

function refresh_chart(){
  symbols ='SHFE.rb2201,sz000001,USDJPY'.split(',');
  if(!symbols){
	  symbol =  $("#symbol_id").text();
	  if(symbol){
		  symbols=[symbol];
	  }else{
		  symbols=['EURUSD','USDJPY'];
	  }
  }
  change_symbol(symbols[0]);
}

const handler = function (e) {
    if(e.originalType=='touchstart'){
        pageScreenX=e.pageX;
        pageScreenY=e.pageY;
    }else if(e.originalType=='touchend'){
        if(e.pageY-pageScreenY>100  && (pageScreenX-e.pageX)<50){
            pre_symbol();
        }else if(pageScreenY-e.pageY>100 && (pageScreenX-e.pageX)<50){
            next_symbol();
        }
    }
};

function init_touch(){
    $(".chart_main").touchInit({preventDefault: false});
    $(".chart_main").on("touch_start", handler);
    $(".chart_main").on("touch_move", handler);
    $(".chart_main").on("touch_end", handler);
}

function next_symbol(){
    if(isloading){
        return;
    }
    let len = symbols.length
    if(pageIndex < (len-1)){
        pageIndex++;
    }else {
        pageIndex=0;
    }
    symbol = symbols[pageIndex];
    change_symbol(symbol);
}

function pre_symbol(){
    if(isloading){
        return;
    }
    let len = symbols.length
    if(pageIndex >0){
        pageIndex--;
    }else{
        pageIndex=len-1
    }
    symbol = symbols[pageIndex];
    change_symbol(symbol);
}

function get_page_index(symbol){
    let len = symbols.length
    for(let i in symbols){
       if(symbols[i]==symbol){
           return i;
       }
    }
    return 0;
}

function change_symbol(symbol){
   times='D1'
   $('.board_content').text(symbol);
   refresh_data(symbol,times);
}

function refresh_data(symbol,times){
    if(isloading){
		return;    
    }
    isloading=true;
  reset_element('chart1')
  
  let url = '/serv/index_json?symbol='+symbol+'&times='+times;
  console.log(url)
  $.ajax({
      type:'get',
      url:url,
      data:'',
      success: function(result ) {
          let obj = JSON.parse(result);
          show_charts(obj);
          isloading=false;
      }
  });
}

function reload_symbols(){
	let url = 'https://www.winfirm.com.cn/serv/chart_symbols';
	console.log(url)
	$.ajax({
	type:'GET',
	url:url,
	dataType:'json',
	data:'',
	traditional: true,
	success: function(result ) {
		  let obj = JSON.parse(result);		  
		  let array= obj.forex;
		  if(symbolsType==0){
			  array= obj.forex;
			  $(".symbol_type").text('Now->forex');
		  }else if(symbolsType==1){
			  array= obj.futures;
			  $(".symbol_type").text('Now->futures');
		  }else if(symbolsType==2){
			  array= obj.stocks;
			  $(".symbol_type").text('Now->stocks');
		  }
		  $(".symbols_box").empty();
		  for(let i=0;i<array.length;i++){
			  $(".symbols_box").append("<a class='symbols_item' href='javascript:change_symbol(\""+array[i]+"\")'>"+array[i]+"</a>");
		  }
		  
		  symbols = array;
		  change_symbol(array[0]);
		}
	});
}
