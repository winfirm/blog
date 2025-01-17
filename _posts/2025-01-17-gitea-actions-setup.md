---
layout: post
title: "Gitea actions setup"
date: 2025-01-17 00:00:01
category: "all"
tags: [Gitea , Actions , setups]
---
Take a binary way as example, [links](refer: https://docs.gitea.com/usage/actions/act-runner)

#### 1.donwload and config act_runner

download from [release](https://gitea.com/gitea/act_runner/releases) page: 

```
wget https://gitea.com/gitea/act_runner/releases/download/v0.2.11/act_runner-0.2.11-darwin-amd64
mv act_runner-0.2.11-darwin-amd64 act_runner #rename
chmod u+x act_runner #make it executable
```

config act_runner([refer](https://docs.gitea.com/usage/actions/act-runner)):
```
./act_runner --version #see version
./act_runner generate-config #generate config.yaml
./act_runner --config config.yaml register # input token and host 
./act_runner daemon --config config.yaml #run act_runner
```

if run daemon got a error:
```
daemon Docker Engine socket not found and docker_hsot config was invalid...
```
we need to change config.yaml's labels.(refer [link](https://forum.gitea.com/t/error-when-executing-act-runner-daemon/7667/2))


#### 2.Workflows

to use workflow, you need install nodejs:

```
sudo apt-get install nodejs
```

add build config file for rep: .gitea/workflows/build.yaml

```
name: Gitea Actions Demo
run-name: ${{ gitea.actor }} is testing out Gitea Actions 🚀
on: [push]

jobs:
  Explore-Gitea-Actions:
    runs-on: ubuntu-20.04
    steps:
      - run: echo "🎉 The job was automatically triggered by a ${{ gitea.event_name }} event."
      - run: echo "🐧 This job is now running on a ${{ runner.os }} server hosted by Gitea!"
      - run: echo "🔎 The name of your branch is ${{ gitea.ref }} and your repository is ${{ gitea.repository }}."
      - name: Check out repository code
        uses: actions/checkout@v4
      - run: echo "💡 The ${{ gitea.repository }} repository has been cloned to the runner."
      - run: echo "🖥️ The workflow is now ready to test your code on the runner."
      - name: List files in the repository
        run: |
          ls ${{ gitea.workspace }}
      - run: echo "🍏 This job's status is ${{ job.status }}."
```
