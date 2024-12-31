---
layout: post
title: "using frp to access local web from public"
date: 2024-12-31 00:00:01
category: "all"
tags: [frp , local , public]
---

#### 1. on server side
download [frp](https://github.com/fatedier/frp/releases) software, use follow to server client：
```
./frps -c frps.toml
```

server config frps.toml: 
```
bindPort = 7000
vhostHTTPPort = 8090
auth.token = "test1234567890"

webServer.addr = "0.0.0.0"
webSerer.port = 7500
webServer.user = "admin"
webServer.password = "admin123456"
```

#### 2. on client side

download frp software, use follow to start client: 
```
./frpc -c frpc.toml
```

client config frpc.toml: 
```
serverAddr = "xx.xx.xx.xx" #server ip address
serverPort = 7000
auth.token = "test1234567890"

#local web inflate
[[proxies]]
name = "web"
type = "http"
localPort = 8080 
customDomains = ["abc.xyz.com"]
```

#### 3. access by public

http://xx.xx.xx.xx:8090

