---
layout: post
title: Docker部署Calico网络
categories: 网络
tags: 容器

---

　　今天交流了NSX-T和K8S的集成，赶紧了解了一下原生开源的Calico网络。

　　Calico是一个纯三层的虚拟网络方案，Calico为每个容器分配一个IP，每个host都是router，host之间采用了BGP协议发布路由，把不同host的容器连接起来。与VxLAN不同的是，Calico不对数据包做额外封装，不需要NAT和端口映射，扩展性和性能都很好。

## 实验环境

Calico依赖etcd在不同主机间共享和交换信息，存储Calico网络状态。我们将在host 192.168.33.10上运行etcd。

Calico网络中的每个主机都需要运行Calico组件，提供容器interface管理、动态路由、动态ACL、报告状态等功能。

将就了之前搭的vagrant，实验环境如下图所示：

![calico1](https://user-images.githubusercontent.com/4729226/59015243-1f572e80-8871-11e9-9c7b-e5493bb6cb16.jpg)

## 首先安装etcd

在192.168.33.10主机上安装etcd:

`yum install -y etcd`

修改etcd配置文件：

```sh
[root@master etc]# cat /etc/etcd/etcd.conf 
#[Member]
#ETCD_CORS=""
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
#ETCD_WAL_DIR=""
#ETCD_LISTEN_PEER_URLS="http://localhost:2380"
ETCD_LISTEN_CLIENT_URLS="http://192.168.33.10:2379"
...
#[Clustering]
#ETCD_INITIAL_ADVERTISE_PEER_URLS="http://localhost:2380"
ETCD_ADVERTISE_CLIENT_URLS="http://192.168.33.10:2379"
...
```

启动etcd服务`systemctl start etcd && systemctl enable etcd`

修改docker配置文件连接etcd:

修改 node1 和 node2 的 Docker daemon 配置文件/etc/docker/daemon.json

连接 etcd：--cluster-store=etcd://192.168.33.10:2379

```sh
[root@node1 ~]# cat /etc/docker/daemon.json 
{
  "registry-mirrors": ["https://x3h8v36l.mirror.aliyuncs.com"],
  "cluster-store": "etcd://192.168.33.10:2379"
}
```

重启 Docker daemon` systemctl daemon-reload && systemctl restart docker.service`

## 部署calicoctl

官方参考文档： https://docs.projectcalico.org/v2.6/getting-started/docker/installation/manual

在node1和node2上下载calicoctl并运行calico容器:

```sh
[root@node1 ~]# wget -O /usr/local/bin/calicoctl https://github.com/projectcalico/calicoctl/releases/download/v1.6.5/calicoctl
[root@node1 ~]# chmod +x /usr/local/bin/calicoctl
```

创建calico配置文件:
```sh
[root@node1 ~]# mkdir /etc/calico/
[root@node1 ~]# vim /etc/calico/calicoctl.cfg
apiVersion: v1
kind: calicoApiConfig
metadata:
spec:
  datastoreType: "etcdv2"
  etcdEndpoints: "http://192.168.33.10:2379"
```

分别在两个节点上创建calico容器，执行后会自动下载calico镜像并运行容器:

```sh
[root@node1 ~]# calicoctl node run --node-image=quay.io/calico/node:v2.6.12 -c /etc/calico/calicoctl.cfg
Running command to load modules: modprobe -a xt_set ip6_tables
Enabling IPv4 forwarding
Enabling IPv6 forwarding
Increasing conntrack limit
Removing old calico-node container (if running).
Running the following command to start calico-node:

docker run --net=host --privileged --name=calico-node -d --restart=always -e NODENAME=node1 -e CALICO_NETWORKING_BACKEND=bird -e CALICO_LIBNETWORK_ENABLED=true -e ETCD_ENDPOINTS=http://192.168.33.10:2379 -v /var/log/calico:/var/log/calico -v /var/run/calico:/var/run/calico -v /lib/modules:/lib/modules -v /run:/run -v /run/docker/plugins:/run/docker/plugins -v /var/run/docker.sock:/var/run/docker.sock quay.io/calico/node:v2.6.12

Image may take a short time to download if it is not available locally.
Container started, checking progress logs.

2019-06-06 07:16:41.433 [INFO][8] startup.go 173: Early log level set to info
2019-06-06 07:16:41.433 [INFO][8] client.go 202: Loading config from environment
2019-06-06 07:16:41.434 [INFO][8] startup.go 83: Skipping datastore connection test
2019-06-06 07:16:41.439 [INFO][8] startup.go 259: Building new node resource Name="node1"
2019-06-06 07:16:41.439 [INFO][8] startup.go 273: Initialise BGP data
2019-06-06 07:16:41.441 [INFO][8] startup.go 467: Using autodetected IPv4 address on interface eth1: 192.168.33.11/24
2019-06-06 07:16:41.441 [INFO][8] startup.go 338: Node IPv4 changed, will check for conflicts
2019-06-06 07:16:41.444 [INFO][8] etcd.go 430: Error enumerating host directories error=100: Key not found (/calico) [11]
2019-06-06 07:16:41.444 [INFO][8] startup.go 530: No AS number configured on node resource, using global value
2019-06-06 07:16:41.448 [INFO][8] etcd.go 105: Ready flag is now set
2019-06-06 07:16:41.452 [INFO][8] client.go 133: Assigned cluster GUID ClusterGUID="05d43659a30f4f08a15f9515fcd0278f"
2019-06-06 07:16:41.471 [INFO][8] startup.go 419: CALICO_IPV4POOL_NAT_OUTGOING is true (defaulted) through environment variable
2019-06-06 07:16:41.471 [INFO][8] startup.go 659: Ensure default IPv4 pool is created. IPIP mode: off
2019-06-06 07:16:41.473 [INFO][8] startup.go 670: Created default IPv4 pool (192.168.0.0/16) with NAT outgoing true. IPIP mode: off
2019-06-06 07:16:41.473 [INFO][8] startup.go 419: FELIX_IPV6SUPPORT is true (defaulted) through environment variable
2019-06-06 07:16:41.473 [INFO][8] startup.go 626: IPv6 supported on this platform: true
2019-06-06 07:16:41.473 [INFO][8] startup.go 419: CALICO_IPV6POOL_NAT_OUTGOING is false (defaulted) through environment variable
2019-06-06 07:16:41.473 [INFO][8] startup.go 659: Ensure default IPv6 pool is created. IPIP mode: off
2019-06-06 07:16:41.475 [INFO][8] startup.go 670: Created default IPv6 pool (fd80:24e2:f998:72d6::/64) with NAT outgoing false. IPIP mode: off
2019-06-06 07:16:41.514 [INFO][8] startup.go 131: Using node name: node1
2019-06-06 07:16:41.814 [INFO][12] client.go 202: Loading config from environment
Starting libnetwork service
Calico node started successfully
```

1. 设置主机网络，例如 enable IP forwarding。

2. 下载并启动 calico-node 容器，calico 会以容器的形式运行（与 weave 类似）。

3. 连接 etcd。

4. calico 启动成功。

查看calico运行状态:

```sh
[root@node1 ~]# calicoctl node status
Calico process is running.

IPv4 BGP status
+---------------+-------------------+-------+----------+--------+
| PEER ADDRESS  |     PEER TYPE     | STATE |  SINCE   |  INFO  |
+---------------+-------------------+-------+----------+--------+
| 192.168.33.12 | node-to-node mesh | start | 07:17:09 | Active |
+---------------+-------------------+-------+----------+--------+

IPv6 BGP status
No IPv6 peers found.

[root@node1 ~]# calicoctl node status
Calico process is running.

IPv4 BGP status
+---------------+-------------------+-------+----------+-------------+
| PEER ADDRESS  |     PEER TYPE     | STATE |  SINCE   |    INFO     |
+---------------+-------------------+-------+----------+-------------+
| 192.168.33.12 | node-to-node mesh | up    | 07:17:13 | Established |
+---------------+-------------------+-------+----------+-------------+

IPv6 BGP status
No IPv6 peers found.

```

创建calico网络：

在 node1 或 node2 上执行如下命令创建 calico 网络 cal_ent1：

`docker network create --driver calico --ipam-driver calico-ipam cal_net1`

- --driver calico 指定使用 calico 的 libnetwork CNM driver。

- --ipam-driver calico-ipam 指定使用 calico 的 IPAM driver 管理 IP。

calico 为 global 网络，etcd 会将 cal_net 同步到所有主机。

## Calico网络结构

在 node1 中运行容器 bbox1 并连接到 cal_net1：

`docker container run --net cal_net1 --name bbox1 -tid busybox`

查看 bbox1 的网络配置:

```sh
[root@node1 ~]# docker exec bbox1 ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
5: cali0@if6: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue 
    link/ether ee:ee:ee:ee:ee:ee brd ff:ff:ff:ff:ff:ff
    inet 192.168.166.128/32 brd 192.168.166.128 scope global cali0
       valid_lft forever preferred_lft forever
```

cali0 是 calico interface，分配的 IP 为 192.168.166.128。cali0 对应 node1 编号 6 的 interface calicce21fc3677@if5

node1 将作为 router 负责转发目的地址为 bbox1 的数据包

```sh
[root@node1 ~]# ip r
default via 10.0.2.2 dev eth0 proto static metric 100 
10.0.2.0/24 dev eth0 proto kernel scope link src 10.0.2.15 metric 100 
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 
192.168.33.0/24 dev eth1 proto kernel scope link src 192.168.33.11 metric 100 
192.168.104.0/26 via 192.168.33.12 dev eth1 proto bird 
192.168.166.128 dev calicce21fc3677 scope link 
blackhole 192.168.166.128/26 proto bird 
```

所有发送到 bbox1 的数据都会发给calicce21fc3677，因为calicce21fc3677 与 cali0 是一对 veth pair，bbox1 能够接收到数据。

接下来我们在 host2 中运行容器 bbox2，也连接到 cal_net1：

```sh
[root@node2 ~]# docker exec bbox2 ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
5: cali0@if6: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue 
    link/ether ee:ee:ee:ee:ee:ee brd ff:ff:ff:ff:ff:ff
    inet 192.168.104.0/32 brd 192.168.104.0 scope global cali0
       valid_lft forever preferred_lft forever
```
IP 为192.168.104.0

node2 添加了两条路由：

```sh
[root@node2 ~]# ip r
default via 10.0.2.2 dev eth0 proto static metric 100 
10.0.2.0/24 dev eth0 proto kernel scope link src 10.0.2.15 metric 100 
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 
192.168.33.0/24 dev eth1 proto kernel scope link src 192.168.33.12 metric 100 
192.168.104.0 dev calib5228fd5fcd scope link 
blackhole 192.168.104.0/26 proto bird 
192.168.166.128/26 via 192.168.33.11 dev eth1 proto bird 
```

1. 目的地址为 node1 容器 subnet 192.168.166.128/26 的路由。
2. 目的地址为本地 bbox2 容器 192.168.104.0 的路由。
3. 注意到node1的路由表，同样的，node1 也自动添加了到 192.168.104.0/26 的路由。

## Calico 的默认连通性

测试一下 bbox1 与 bbox2 的连通性：

```sh
[root@node1 ~]# docker exec bbox1 ping bbox2
PING bbox2 (192.168.104.0): 56 data bytes
64 bytes from 192.168.104.0: seq=0 ttl=62 time=0.996 ms
64 bytes from 192.168.104.0: seq=1 ttl=62 time=0.568 ms
64 bytes from 192.168.104.0: seq=2 ttl=62 time=0.498 ms
64 bytes from 192.168.104.0: seq=3 ttl=62 time=0.539 ms
```

> calico 默认的 policy 规则是：容器只能与同一个 calico 网络中的容器通信。

> 既然这是默认 policy，那就有方法定制 policy，这也是 calico 较其他网络方案最大的特性。