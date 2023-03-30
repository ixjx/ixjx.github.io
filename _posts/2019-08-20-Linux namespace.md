---
layout: post
title: Linux namespace
categories: Linux
tags: 容器

---

之前做过一段时间 docker 相关的工作，只能算熟悉相关命令，很多原理都似是而非。面试的时候被问过一个简单的问题：容器间资源的隔离是怎么实现的？当时只知道是靠 namespace ，但是具体实现不清楚。

最近深入看了下 Linux namespace ，通过 network namespace 实验了 docker 的 bridge 网络。

在每个容器中，我们都可以看到文件系统，网卡等资源，这些资源看上去是容器自己的。拿网卡来说，每个容器都会认为自己有一块独立的网卡，即使 host 上只有一块物理网卡。

**namespace 就是 Linux 内核用来隔离内核资源的方式。**通过 namespace 可以让一些进程只能看到与自己相关的一部分资源，而另外一些进程也只能看到与它们自己相关的资源，这两拨进程根本就感觉不到对方的存在。具体的实现方式是把一个或多个进程的相关资源指定在同一个 namespace 中。

Linux namespaces 是对全局系统资源的一种封装隔离，使得处于不同 namespace 的进程拥有独立的全局系统资源，改变一个 namespace 中的系统资源只会影响当前 namespace 里的进程，对其他 namespace 中的进程没有影响。

我们可以从 docker 实现者的角度考虑该如何实现一个资源隔离的容器。比如是不是可以通过 chroot 命令切换根目录的挂载点，从而隔离文件系统。为了在分布式的环境下进行通信和定位，容器必须要有独立的 IP、端口和路由等，这就需要对网络进行隔离。同时容器还需要一个独立的主机名以便在网络中标识自己。接下来还需要进程间的通信、用户权限等的隔离。最后，运行在容器中的应用需要有进程号(PID)，自然也需要与宿主机中的 PID 进行隔离。也就是说这六种隔离能力是实现一个容器的基础，让我们看看 linux 内核的 namespace 特性为我们提供了什么样的隔离能力：

![image](https://user-images.githubusercontent.com/4729226/63321909-b0a84e00-c354-11e9-8179-ee7aca298e6e.png)


这里我们就深入了解下network namespace：

**Network namespace 在逻辑上是网络堆栈的一个副本，它有自己的路由、防火墙规则和网络设备。** 默认情况下，子进程继承其父进程的 network namespace。也就是说，如果不显式创建新的 network namespace，所有进程都从 init 进程继承相同的默认 network namespace。

每个新创建的 network namespace 默认有一个本地环回接口 lo，除此之外，所有的其他网络设备(物理/虚拟网络接口，网桥等)只能属于一个 network namespace。每个 socket 也只能属于一个 network namespace。

### ip netns 命令
ip netns 命令用来管理 network namespace。本文将使用 ip netns 命令来创建和操作 network namespace。(最近发现`ip`比`ifconfig`好用多了)

### 创建 network namespace

先查看一下默认的 network namespace 的 ID：

![image](https://user-images.githubusercontent.com/4729226/63323053-683e5f80-c357-11e9-9f1d-d382e7f39ea7.png)

然后通过 ip netns add 命令创建名为 mynet 的 network namespace：

![image](https://user-images.githubusercontent.com/4729226/63323179-ba7f8080-c357-11e9-8642-60d728246a39.png)

从上图可以看出，在名为 mynet 的 network namespace 创建成功后，/var/run/netns 目录下多了一个名为 mynet 文件。ip netns exec 子命令可以在对应的 network namespace 中执行命令，下面我们就通过它在 mynet network namespace 中创建一个 bash 进程，并查看 network namespace 的 ID：

![image](https://user-images.githubusercontent.com/4729226/63324843-7f7f4c00-c35b-11e9-9e91-91fd2fa52841.png)

这是一个完全不同的 network namespace ID，而且默认shell也变了，说明当前的 bash 进程运行在一个隔离的 network 环境中。接下来让我们看看新的 network namespace 中都有什么：

![image](https://user-images.githubusercontent.com/4729226/63324922-ac336380-c35b-11e9-9767-308b536ef4ec.png)

每个新创建的 network namespace 默认有一个本地环回接口 lo，并且这个接口是处于关闭状态的。下面我们就启动这个接口：

![image](https://user-images.githubusercontent.com/4729226/63324996-d6852100-c35b-11e9-981f-d95726142cec.png)

启动 lo 接口后我们可以看到其 IP 地址，并且能够 ping 通。

### 在两个 network namespace 之间通信

network namespace 之间是相互隔离的，我们可以使用 veth 设备把两个 network namespace 连接起来进行通信。veth 设备是虚拟的以太网设备。它们可以充当 network namespace 之间的通道，也可以作为独立的网络设备使用。**veth 设备总是被成对的创建，并且这一对设备总是连接在一起的，所以一般称之为 veth pair。**需要注意的是，veth pair 无法单独存在，删除其中一个，另一个也会自动消失。接下来的示例我们就演示如何使用 veth pair 在两个 network namespace 直接通信。示例中我们使用 ip link 命令来创建和管理 veth pair。

**第一步，先创建两个 network namespace net0 和 net1**
```sh
ip netns add net0
ip netns add net1
```

**第二步，创建一对命名的 veth 设备**

默认情况下会自动为 veth pair 生成名称，这里为了易于辨识，我们在创建时指定 veth pair 的名称：
```sh
ip link add vethmother type veth peer name vethfather
```

![image](https://user-images.githubusercontent.com/4729226/63325674-34fecf00-c35d-11e9-8a1e-09443031db75.png)

如图所示，veth pair 在主机上表现为两个网卡。

**第三步，把这一对 veth pair 分别放到 network namespace net0 和 net1中**
```sh
ip link set vethmother netns net0
ip link set vethfather netns net1
ip netns exec net0 ip addr
ip netns exec net1 ip addr
```

![image](https://user-images.githubusercontent.com/4729226/63325799-71322f80-c35d-11e9-9403-4b6ab5d95c77.png)

查看 net0 和 net1 中的网络资源，发现各自多了一个网卡，也就是 veth 设备的两个端点。注意，当我们把 veth pair 分配到 network namespace 中后，在主机上就看不到它们了。

**第四步，给这些 veth pair 分配 IP 并启用它们**
```sh
ip netns exec net0 ip link set vethmother up
ip netns exec net0 ip addr add 10.0.1.1/24 dev vethmother
ip netns exec net0 ip route
ip netns exec net1 ip link set vethfather up
ip netns exec net1 ip addr add 10.0.1.2/24 dev vethfather
ip netns exec net1 ip route
```
下面通过 ping 命令来验证两个 network namespace 是否可以通信：
```sh
ip netns exec net0 ping -c 3 10.0.1.2
```

![image](https://user-images.githubusercontent.com/4729226/63326000-e998f080-c35d-11e9-816b-03b39bff47b2.png)

至此，我们构建了一个如下结构的虚拟网络：

![image](https://user-images.githubusercontent.com/4729226/63326036-f9b0d000-c35d-11e9-9b76-2670ab5c18f2.png)

### 通过 bridge 连接 network namespace

虽然 veth pair 可以实现两个 network namespace 之间的通信，但是当需要在多个 network namespace 之间通信的时候，光靠 veth pair 就不行了。我们可以使用 Linux 提供的虚拟交换机，来完成这样的功能。下面的示例演示如何通过虚拟交换机(这里就是一个虚拟网桥)连接多个 network namespace。

**第一步，先添加一个叫 mybridge0 的网桥**
```sh
ip link add mybridge0 type bridge
ip link set dev mybridge0 up
ip addr
```

对主机来说其实就是新添加了一个网络接口。

**第二步，创建 network namespace 和 veth 设备**
```sh
ip netns add net0
ip link add veth0 type veth peer name veth0p 

ip link set dev veth0p netns net0
ip netns exec net0 ip link set dev veth0p name eth0
ip netns exec net0 ip addr add 10.0.1.1/24 dev eth0
ip netns exec net0 ip link set dev eth0 up
ip netns exec net0 ip addr
```

![image](https://user-images.githubusercontent.com/4729226/63326429-cfabdd80-c35e-11e9-90a8-a41327b7c57a.png)

上图显示 network namespace net0 中的 eth0 网卡已经启动了。下面把 veth 设备的另一端连接到网桥 mybridge0 上：
```sh
ip link set dev veth0 master mybridge0
ip link set dev veth0 up
```

**第三步，重复第二步创建 net1 和 net2，并连接到网桥**

给 mybridge0 设置 IP：
```sh
ip link set dev mybridge0 down
ip addr add 10.0.1.254/24 dev mybridge0
ip link set dev mybridge0 up
ip addr
```

通过 bridge link 命令查看网桥的信息如下：

![image](https://user-images.githubusercontent.com/4729226/63326917-c8390400-c35f-11e9-8b5c-3700bab628b5.png)

这时就可以在不同的 network namespace 之间通信了：

![image](https://user-images.githubusercontent.com/4729226/63329053-d38e2e80-c363-11e9-9ef5-02199d26cd5a.png)

我们创建的网络拓扑结构如下所示：

![image](https://user-images.githubusercontent.com/4729226/63327204-57461c00-c360-11e9-8340-7d948ff3d0d8.png)

### 总结

通过 network namespace 可以创建相互独立的网络栈，从而实现网络的隔离。其中 network namespace 之间通过 bridge 通信的方式已经与 docker 网络的 bridge 模式非常类似了，剩下的不过就是开启ip.forward，添加NAT规则等等。