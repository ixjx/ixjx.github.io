---
layout: post
title: 启动第一个KVM虚机-每天5分钟的OpenStack(4)
categories: Linux
tags: 虚拟化

---

* TOC
{:toc}

![](http://shurriklab.qiniudn.com/pp4ipsagt4e4gf522s25nrx2bj.png)

本节演示如何使用 virt-manager 启动 KVM 虚机。

首先通过命令 virt-manager 启动图形界面，点上面的图标创建虚机

![](http://shurriklab.qiniudn.com/xxowgek8n3h4z89y4u1kdnm079.png)

给虚机命名为 kvm1，这里选择从哪里启动虚机。如果是安装新的 OS，可以选择第一项。如果已经有安装好的镜像文件，选最后一项（如上图）

接下来需要告诉 virt-manager 镜像的位置。

![](http://shurriklab.qiniudn.com/5mttqzn5a0fcgnhsdof9l8y9cn.png)

在我的系统中存放了一个 cirros-0.3.3-x86_64-disk.img 镜像文件 。cirros 是一个很小的 linux 镜像，非常适合测试用，大家可以到 http://download.cirros-cloud.net/ 下载，然后放到 /var/lib/libvirt/images/ 目录下，这是 KVM 默认查找镜像文件的地方。

![](http://shurriklab.qiniudn.com/h7a1g3m21b2csfp46gml1d8nz5.png)

为虚拟机分配 CPU 和内存，点击 “Forward”， 再确认一下信息，就可以启动虚机了。

virt-manager 可以对虚机进行各种管理操作，界面直观友好，很容易上手。 同时我们也可以用命令 virsh 管理虚机，比如查看宿主机上的虚机。

```
root@ubuntu:~# virsh list
Id    Name              State
--------------------------------
8     kvm1              running
```

至此，第一个虚机已经跑起来了，采用的都是默认设置，后面我们会逐步讨论有关虚机更细节的内容，比如存储和网卡的设置。


