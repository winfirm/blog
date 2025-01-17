---
layout: post
title: "Steps to setup Gitea on vps"
date: 2025-01-16 00:00:01
category: "all"
tags: [Gitea , Steps , vps]
---

1.add git user in root terminal

```
sudo apt-get update
sudo apt-get install git 
sudo useradd -m git
sudo passwd git
```

2.login as git, download bintary file from [relase](https://github.com/go-gitea/gitea/releases) page:

```
wegt https://github.com/go-gitea/gitea/releases/download/v1.23.1/gitea-1.23.1-linux-amd64
mv gitea-1.23.1-linux-amd64 gitea
chmod u+x gitea
```

3.run gitea

```
./gitea web
```

4.init Gitea

browse ip:3000 to init gitea, set a administrator

5.enjoy

browse ip:3000 to enjoy Gitea!
