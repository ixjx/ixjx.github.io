---
layout: post
title: 理解virbr0-每天5分钟的OpenStack(11)
categories: Linux
tags: 虚拟化

---

* TOC
{:toc}

![](http://shurriklab.qiniudn.com/mirmi0r2wdu6jfu7pwhohydz8s.png)

virbr0 是 KVM 默认创建的一个 Bridge，其作用是为连接其上的虚机网卡提供 NAT 访问外网的功能。

virbr0 默认分配了一个IP 192.168.122.1，并为连接其上的其他虚拟网卡提供 DHCP 服务。

下面我们演示如何使用 virbr0。

在 virt-manager 打开 VM1 的配置界面，网卡 Source device 选择 “default”，将 VM1 的网卡挂在 virbr0 上。

![](http://shurriklab.qiniudn.com/v67cryj4viy664kcdp02t63vrt.png)

启动 VM1，brctl show 可以查看到 vnet0 已经挂在了 virbr0 上。
```
# brctl show
bridge name     bridge id               STP enabled     interfaces
br0             8000.000c298decbe       no                    eth0
virbr0          8000.fe540075dd1a       yes                   vnet0
```

virbr0 使用 dnsmasq 提供 DHCP 服务，可以在宿主机中查看该进程信息
```
# ps -elf|grep dnsmasq
5 S libvirt+  2422     1  0  80   0 -  7054 poll_s 11:26 ?        00:00:00 /usr/sbin/dnsmasq --conf-file=/var/lib/libvirt/dnsmasq/default.conf
```
在 /var/lib/libvirt/dnsmasq/ 目录下有一个 default.leases 文件，当 VM1 成功获得 DHCP 的 IP 后，可以在该文件中查看到相应的信息
```
# cat /var/lib/libvirt/dnsmasq/default.leases
1441525677 52:54:00:75:dd:1a 192.168.122.6 ubuntu *
```

上面显示 192.168.122.6 已经分配给 MAC 地址为 52:54:00:75:dd:1a 的网卡，这正是 vnet0 的 MAC。之后就可以使用该 IP 访问 VM1 了。

需要说明的是，使用 NAT 的虚机 VM1 可以访问外网，但外网无法直接访问 VM1。

因为 VM1 发出的网络包源地址并不是 192.168.122.6，而是被 NAT 替换为宿主机的 IP 地址了。

这个与使用 br0 不一样，在 br0 的情况下，VM1 通过自己的 IP 直接与外网通信，不会经过 NAT 地址转换。

下节我们讨论 vlan 在 linux bridge 中的实现

