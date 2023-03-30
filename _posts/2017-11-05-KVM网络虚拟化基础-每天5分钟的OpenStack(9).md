---
layout: post
title: KVM网络虚拟化基础-每天5分钟的OpenStack(9)
categories: Linux
tags: 虚拟化

---

* TOC
{:toc}

![](http://shurriklab.qiniudn.com/kg8z02ffcldcaryhnt0pwlgsw0.png)

网络虚拟化是虚拟化技术中最复杂的部分，学习难度最大。 但因为网络是虚拟化中非常重要的资源，所以再硬的骨头也必须要把它啃下来。 

为了让大家对虚拟化网络的复杂程度有一个直观的认识，请看下图 

![](http://shurriklab.qiniudn.com/gi9e6acegclerg57pybpdnxxhi.png)

这是 OpenStack 官网上给出的计算节点（可以理解为 KVM 的宿主机）虚拟网络的逻辑图，上面的网络设备很多，层次也很复杂。

我第一次看到这张图，也着实被吓了一跳。 

不过大家也不要怕，万丈高楼从地起，虚拟网络再复杂，也是由一些基础的组件构成的。只要我们将这些基础组件的概念和它们之间的逻辑关系搞清楚了，就能深刻理解虚拟网络的架构，那么云环境下的虚拟化网络也就不在话下了。 

下面我们来学习网络虚拟化中最重要的两个东西：Linux Bridge 和 VLAN 

>### Linux Bridge 基本概念

假设宿主机有 1 块与外网连接的物理网卡 eth0，上面跑了 1 个虚机 VM1，现在有个问题是： 如何让 VM1 能够访问外网？ 

至少有两种方案 

1. 将物理网卡eth0直接分配给VM1，但随之带来的问题很多： 宿主机就没有网卡，无法访问了； 新的虚机，比如 VM2 也没有网卡。 下面看推荐的方案 

2. 给 VM1 分配一个虚拟网卡 vnet0，通过 Linux Bridge  br0 将 eth0 和 vnet0 连接起来，如下图所示

![](http://shurriklab.qiniudn.com/s8m2p6j0zy2xz0cswr68t107ii.png)

Linux Bridge 是 Linux 上用来做 TCP/IP 二层协议交换的设备，其功能大家可以简单的理解为是一个二层交换机或者 Hub。多个网络设备可以连接到同一个 Linux Bridge，当某个设备收到数据包时，Linux Bridge 会将数据转发给其他设备。

在上面这个例子中，当有数据到达 eth0 时，br0 会将数据转发给 vnet0，这样 VM1 就能接收到来自外网的数据；

反过来，VM1 发送数据给 vnet0，br0 也会将数据转发到 eth0，从而实现了 VM1 与外网的通信。

现在我们增加一个虚机 VM2，如下图所示

![](http://shurriklab.qiniudn.com/7rqpib71nxzmeinfl67p8386ht.png)

VM2 的虚拟网卡 vnet1 也连接到了 br0 上。

现在 VM1 和 VM2 之间可以通信，同时 VM1 和 VM2 也都可以与外网通信。

有了上面的基础知识，下一节将演示如何在实验环境中实现这套虚拟网络。