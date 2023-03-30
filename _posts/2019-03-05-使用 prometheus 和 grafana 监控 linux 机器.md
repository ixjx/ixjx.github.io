---
layout: post
title: 使用 prometheus 和 grafana 监控 linux 机器
categories: Linux
tags: 容器

---

* TOC
{:toc}

　　Prometheus 是一个非常优秀的监控工具。准确的说，应该是监控方案。Prometheus 提供了监控数据搜集、存储、处理、可视化和告警一套完整的解决方案。让我们先来看看 Prometheus 的架构。

![prometheus1](https://user-images.githubusercontent.com/4729226/56795946-2a677980-6844-11e9-9cfd-5bc9be82b2e0.jpg)


* prometheus server 位于中心，负责时序数据的收集、存储和查询

* 左边是数据来源，prometheus 统一采用拉取的模式（pull mode）从兼容的 HTTP 接口处获取数据，数据源可以分为三种

　　1. 本身就暴露 prometheus 可读取 metrics 数据的或者专门为某个组件编写的 exporter，称为 Jobs 或者 Exporters，比如 node exporter

　　2. 通过 push gateway 可以把原来 push 类型的数据转换成 pull 类型

　　3. 其他 prometheus server

* 上面是目标自动发现机制。对于生产的很多情况，手动配置所有的 metrics 来源可能会非常繁琐，所以 prometheus 支持 DNS、k8s、Consul 等服务发现机制来动态地获取目标源进行数据抓取

* 右下方是数据输出，一般是用来进行 UI 展示，可以使用 grafana 等开源方案，也可以直接读取 prometheus 的接口进行自主开发

* 右上方是告警部分，用户需要配置告警规则，一旦 alertManager 发现监控数据匹配告警规则，就把告警信息通过邮件、社交账号发送出去

---

　　整个系统使用了三个组件：

* node-exporter：运行在主机上收集操作系统上各种数据的 agent，prometheus 中称为 exporter

* prometheus server：开源的时序数据库，作为数据存储和分析的中心

* grafana：数据展示分析界面，提供各种强大的 dashboard，可以从多个数据源读取数据，其中就包括 prometheus

> NOTE：所有的服务都是通过 docker 启动，需要安装 docker 和 docker-compose


## 运行prometheus

首先，我们创建一个`docker-compose.yml`文件，里面只包含 prometheus 一个服务：
```yml
version: '2'
services:
  prometheus:
    image: prom/prometheus:v2.0.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    ports:
      - '9090:9090'
```

其中比较重要的是`prometheus.yml`文件，它是 Prometheus Server 的配置文件：
```yml
global:
    scrape_interval: 5s
    external_labels:
        monitor: 'my-monitor'
scrape_configs:
    - job_name: 'prometheus'
      static_configs:
          - targets: ['localhost:9090']
```

　　这个配置文件一共分为两个部分：`global`和`scrape_configs`，前者是全局的配置，如果后面的任务没有对特定配置项进行覆盖，这里的选项会生效。这里有两个配置项，`scrape_interval`表示 prometheus server 抓取的周期，如果太频繁会导致 prometheus 压力比较大，如果太久，可能会导致某些关键数据漏掉，推荐根据每个任务的重要性和集群规模分别进行配置。

　　`scrape_configs`配置了每个抓取任务，因此是一个列表，这里我们只有一个任务，那就是抓取 prometheus 本身的 metrics 。配置里面最重要的是`static_configs.targets`，表示要抓取任务的 HTTP 地址，默认会在`/metrics` url 处进行抓取，比如这里就是 http://localhost:9090/metrics。 这是 prometheus 本身提供的监控数据，可以在浏览器中直接查看。

![prometheus2](https://user-images.githubusercontent.com/4729226/56795973-38b59580-6844-11e9-8a1a-809a313c4bab.png)

　　每个数据都是有一个名字和一系列称为 label 的键值对组成的，prometheus 在抓取数据的时候还会自动添加上`instance`（节点的 host:port 标识）和`job`（任务名称）两个 label 作为任务之间的区分。

　　这些数据本身没有时间信息，当 prometheus 抓取的时候会自动添加上当时的时间戳。此外这些数据在客户端会分成四种不同的类型：counter、gauge、histogram 和 summary。更多关于 prometheus metrics 数据类型的说明请查阅官方文档。

　　运行`docker-compose up -d`启动服务，然后在浏览器中打开 http://server-ip:9090/status 查看 prometheus 运行的状态信息

## 使用 node exporter 收集监控数据

　　虽然监控 prometheus 服务自身是件有趣而且有用的事情，但是我们的目标是监控 linux 主机。因为 prometheus 只能从 HTTP 接口的某个地址来拉取监控数据，因此需要一个工具把 linux 提供的系统数据以 HTTP 服务的形式暴露出来。庆幸的是，prometheus 官方社区有很多 exporter，它们负责把某个组件或者系统的监控数据以 prometheus 能理解的方式暴露出来，其中 node exporter 就是导出 unix/linux 系统监控数据的工具。

　　node exporter 主要是从`/proc`中读取 linux 的各种数据，修改 docker-compose.yml 文件，添加上 node-exporter 相关的内容，node-exporter 默认会监听在 9100 端口：
```yml
version: '2'
services:
  prometheus:
    image: prom/prometheus:v2.0.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    ports:
      - '9090:9090'
  node-exporter:
    image: prom/node-exporter:v0.15.2
    ports:
      - '9100:9100'
```

　　为了让 prometheus 收集 node-exporter 的内容，我们需要在配置文件中加上一个单独的任务：
```yml
global:
    scrape_interval: 5s
    external_labels:
        monitor: 'my-monitor'
scrape_configs:
    - job_name: 'prometheus'
      static_configs:
          - targets: ['localhost:9090']
    - job_name: 'node resources'
      scrape_interval: 10s
      static_configs:
        - targets:
          - 'node-exporter:9100'
```

　　因为 docker-compose 会自动做服务到 IP 地址的解析，因此这里可以直接使用 node-exporter:9100 作为地址。

　　再次运行，确认 prometheus 中 targets 列表中有 node-exporter。

## 安装配置 grafana

　　grafana 是一款强大的 dashboard 工具，界面设计很好看，功能强大，可配置性非常灵活。

　　同样，在 docker-compose.yml 文件中加入 grafana 服务：
```yml
version: '2'
services:
  prometheus:
    image: prom/prometheus:v2.11.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    ports:
      - '9090:9090'
  node-exporter:
    image: prom/node-exporter:v0.16.0
    ports:
      - '9100:9100'
  grafana:
    image: grafana/grafana:6.2.5
    volumes:
        - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=pass
    depends_on:
      - prometheus
    ports:
      - '3000:3000'
volumes:
  grafana_data: {}
  prometheus_data: {}
```

　　这里使用 docker 的 volumes 来保存 grafana 和 prometheus 运行过程中产生的数据来保证持久化，而且使用`GF_SECURITY_ADMIN_PASSWORD=pass`环境变量设置 admin 的密码。

　　grafana 本身只是一个 dashboard，它可以从多个数据源中获取数据进行展示，比如我们这里使用的 prometheus。所以在正式配置界面之前，需要先添加数据源，点击 grafana 左上角按钮找到 Data Sources ，进入对应页面。按照下面的内容进行填写，主要是 Type 要选择 prometheus，URL 添加 grafana 服务能访问的 prometheus 地址；Name 字段随便填写一个用来标记来源的名字即可。

![prometheus3](https://user-images.githubusercontent.com/4729226/56796031-5256dd00-6844-11e9-8097-633f55fd1c24.png)

　　然后创建一个 dashboard，并里面添加 graph，在 graph 中添加一个 panel，我们用这个 panel 展示系统的 load 数据。编辑 panel 数据，选择 data source 为之前添加的 prometheus，然后填写 query，系统 node 比较简单，一共是`node_load1`、`node_load5`和 `node_load15`，分别是系统最近一分钟、五分钟和十五分钟的 load 数值。输入完成后点击输入框之外，grafana 会自动更新上面的图表：

![prometheus4](https://user-images.githubusercontent.com/4729226/56796069-61d62600-6844-11e9-9562-067c6a075ea7.png)

　　类似的，可以添加其他的 panel，展示系统方方面的监控数据，比如 CPU、memory、IO、网络等。手动通过界面对 grafana 可以很灵活地创建出很强大的图表，但是这无疑会耗费很多时间，而且 node exporter 这种监控数据是通用的，如果所有人都手动创建一遍无疑是很多重复工作。为此，grafana 支持导入和导出配置，并且提供 [官方社区](https://grafana.com/dashboards) 供大家分享 dashboard 配置。

　　每个 dashboard 都有一个编号，比如 [编号 22 的 dashboard ](https://grafana.com/dashboards/22) 就是专门为 node-exporter 设计的展示图表。在 grafana 中点击导入 dashboard，添加编号选择数据源，就能得到已经配置完整的图表：

![prometheus5](https://user-images.githubusercontent.com/4729226/56796100-6e5a7e80-6844-11e9-9a75-32b6b44fd2b0.png)

　　如果对 dashboard 有什么不满，可以直接在页面进行添加和编辑，然后可以导出 json 文件，以便重复使用。

## 配置告警

　　通过 grafana 图表我们可以知道系统各种指标随着时间的变化，方便轻松判断系统某个资源是否异常。但是我们不能一直盯着 dashboard，还需要系统发生异常的时候能立即通过邮件或者其他方式通知我们，这就是告警的功能。

　　prometheus 提供用户可以自己配置的告警规则，在处理 metrics 数据的时候，如果发现某个规则被触发，就执行对应的告警动作，通过发邮件或者其他方式通知用户。

　　对于我们的单节点主机来说，可以定义两个简单的告警规则：当主机 download 掉，或者 CPU load 持续过高一段时间就发送告警。对此，需要新建一个`alert.rules`文件，用来保存告警规则，按照需求对应的内容如下：
```yml
➜  monitor git:(master) ✗ cat alert.rules
groups:
- name: node-alert
  rules:
  - alert: service_down
    expr: up == 0
    for: 2m
  - alert: high_load
    expr: node_load1 > 0.5
    for: 5m
```

　　在启动 prometheus 服务的时候把告警规则文件 mount 到 service 中，如下添加一个 volume：
```yml
➜  monitor git:(master) ✗ cat docker-compose.yml
version: '2'
services:
  prometheus:
    image: prom/prometheus:v2.0.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alert.rules:/etc/prometheus/alert.rules
 ......
```

　　然后，告知 prometheus 加载这些规则：
```yml
➜  monitor git:(master) ✗ cat prometheus.yml
......
rule_files:
  - 'alert.rules'
```

　　prometheus 还提供了 alertmanager 可以自动化根据告警规则触发对应的动作，一般是各种方式通知用户和管理员，这里就不再介绍了。

## 总结

　　需要注意的是，这只是一个本地的 demo 环境，不能直接在生产上使用。首先我们没有配置安全访问，所有的服务都是 HTTP；其次 docker-compose 运行的话，所有的服务都是在同一台机器上，无法做到分布式监控和高可用。

　　如果想在生产中使用 prometheus 和 grafana，请参考 [官方文档](https://prometheus.io/docs/introduction/overview/) 。