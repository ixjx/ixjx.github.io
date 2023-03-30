---
layout: post
title: 动手实践Linux VLAN-每天5分钟的OpenStack(13)
categories: Linux
tags: 虚拟化

---

* TOC
{:toc}

![](http://shurriklab.qiniudn.com/lwev186yhy5sif09q7cikg7hqi.png)

本节我们来看如何在实验环境中实施和配置如下 VLAN 网络

![](http://shurriklab.qiniudn.com/c2whl6a6g7nfjgqov1b5uqln5e.png)

>### 配置 VLAN

编辑 /etc/network/interfaces，配置 eth0.10、brvlan10、eth0.20 和 brvlan20。

下面用 vmdiff 展示了对 /etc/network/interfaces 的修改

![](http://shurriklab.qiniudn.com/iydr52hykap83a27ze458gxw53.png)

重启宿主机网络，ifconfig 各个网络接口

![](http://shurriklab.qiniudn.com/62wq3giwpztwqc2umaylv0b6xy.png)

用 brctl show 查看当前 Linux Bridge 的配置。

eth0.10 和 eth0.20 分别挂在 brvlan10 和 brvlan20上了

![](http://shurriklab.qiniudn.com/kklzr79otpvz3gknejfuwi3rz4.png)

在宿主机中已经提前创建好了虚机 VM1 和 VM2，现在都处于关机状态

>### 配置 VM1

在 virt-manager 中将 VM1 的虚拟网卡挂到 brvlan10 上。

![](http://shurriklab.qiniudn.com/oinakjnekfls1dldpus6ryxf20.png)

启动 VM1

查看 Bridge，发现 brvlan10 已经连接了一个 vnet0 设备

![](http://shurriklab.qiniudn.com/7gdg4qcde9g4xpanztw4738up7.png)

通过 virsh 确认这就是 VM1 的虚拟网卡。

![](http://shurriklab.qiniudn.com/5atvxy96wlakmscboiiwyndrc0.png)

>### 配置VM2

类似的，将 VM2 的网卡挂在 brvlan20 上

>### 验证 VLAN 的隔离性

Ping 测试结果： VM1 与 VM2 是不通的

原因如下：

1.	VM2 向 VM1 发 Ping 包之前，需要知道 VM1 的 IP 192.168.100.10 所对应的 MAC 地址。VM2 会在网络上广播 ARP 包，其作用就是问 “谁知道 192.168.100.10 的 MAC 地址是多少？”
2.	ARP 是二层协议，VLAN 的隔离作用使得 ARP 只能在 VLAN20 范围内广播，只有 brvlan20 和 eth0.20 能收到，VLAN10 里的设备是收不到的。VM1 无法应答 VM2 发出的ARP包。
3.	VM2 拿不到 VM1 vnet0 的 MAC 地址，也就 Ping 不到 VM1。

> Linux Bridge + VLAN = 虚拟交换机

现在对 KVM 的网络虚拟化做个总结：

物理交换机存在多个 VLAN，每个 VLAN 拥有多个端口。

同一 VLAN 端口之间可以交换转发，不同 VLAN 端口之间隔离。

所以交换机其包含两层功能：交换与隔离。

Linux 的 VLAN 设备实现的是隔离功能，但没有交换功能。

一个 VLAN 母设备（比如 eth0）不能拥有两个相同 ID 的 VLAN 子设备，因此也就不可能出现数据交换情况。

Linux Bridge 专门实现交换功能。

将同一 VLAN 的子设备都挂载到一个 Bridge 上，设备之间就可以交换数据了。

总结起来，Linux Bridge 加 VLAN 在功能层面完整模拟现实世界里的二层交换机。

eth0 相当于虚拟交换机上的 trunk 口，允许 vlan10 和 vlan20 的数据通过

eth0.10，vent0 和 brvlan10 都可以看着 vlan10 的 access 口

eth0.20，vent1 和 brvlan20 都可以看着 vlan20 的 access 口
