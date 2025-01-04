---
layout: post
title: "ways to start Metatrader4(MT4) from web url"
date: 2025-01-04 00:00:01
category: "all"
tags: [MT4 , Metatrader4 , web]
---
Any way to stat metatrader4 from web url? There is:

1.open symbol list page:
```
<a href="metatrader4://symbols">Symbols</a>
```

2.open symbol's trade page:
```
<a href="metatrader4://trade/{symbol}">to {symbol}'s trade page</a>
```

example:
```
<a href="metatrader4://trade/EURUSD">to EURUSD's trade page</a>
```

3.open symbol's chart page:
```
<a href="metatrader4://chart/{symbol}">to {symbol}'s chart</a>
```

example:
```
<a href="metatrader4://chart/EURUSD">to EURUSD's chart</a>
```

4.open order list page:
```
<a href="metatrader4://order">Order list</a>
```
