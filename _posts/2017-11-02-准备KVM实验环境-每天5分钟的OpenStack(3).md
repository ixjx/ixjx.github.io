---
layout: post
title: 准备KVM实验环境-每天5分钟的OpenStack(3)
categories: Linux
tags: 虚拟化

---

* TOC
{:toc}

![](http://shurriklab.qiniudn.com/766sdfyh0itqp1rkzvq4pa91qn.png)

KVM 是 OpenStack 使用最广泛的 Hypervisor，本节介绍如何搭建 KVM 实验环境。

>### 安装KVM

上一节说了，KVM 是 2 型虚拟化，是运行在操作系统之上的，所以我们先要装一个 Linux。Ubuntu、Redhat、CentOS 都可以，这里我们以 Ubuntu14.04 为例。

基本的 Ubuntu 操作系统装好之后，安装 KVM 需要的包。

`sudo apt-get install qemu-kvm qemu-system libvirt-bin virt-manager bridge-utils vlan`

通过这些安装包我们顺便复习一下上一节介绍的 KVM 的相关知识。

1. qemu-kvm 和 qemu-system 是 KVM 和 QEMU 的核心包，提供 CPU、内存和 IO 虚拟化功能

2. libvirt-bin 就是 libvirt，用于管理 KVM 等 Hypervisor

3. virt-manager 是 KVM 图形化管理工具

4. bridge-utils 和 vlan，主要是网络虚拟化需要，KVM 网络虚拟化的实现是基于 linux-bridge 和 VLAN，后面我们会讨论。

Ubuntu 默认不安装图形界面，手工安装一下。

apt 默认会到官网上去下载安装包，速度很慢，我们可以使用国内的镜像站点。

配置/etc/apt/sources.list 
```
deb http://mirrors.163.com/ubuntu/ trusty main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ trusty-security main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ trusty-updates main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ trusty-proposed main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ trusty-backports main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ trusty main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ trusty-security main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ trusty-updates main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ trusty-proposed main restricted universe multiverse
deb-src http://mirrors.163.com/ubuntu/ trusty-backports main restricted universe multiverse
```

然后执行下面命令更新安装包 index

`apt update`

Redhat 和 CentOS 安装相对简单，安装过程中选择虚拟化和图形组件就可以了。

小窍门：Ubuntu 默认是不允许 root 通过 ssh 直接登录的，可以修改 /etc/ssh/sshd_config，设置 

`PermitRootLogin yes`

然后重启 ssh 服务即可

>### 在虚拟机上做实验

作为 2型虚拟化的 KVM，是支持虚拟化嵌套，这使得我们可以在虚拟机中实验 KVM。 比如我在 VMWare Workstation 中安装了一个 Ubuntu14.04 的虚拟机，为了能让 KVM 能创建 嵌套的虚机，要把 CPU 的虚拟化功能打开。如下图在 VMWare 中设置以下 CPU 的模式。(实验中虚拟机安装KVM，网络桥接不通)

![](http://shurriklab.qiniudn.com/jw8q0btbyx5375vzt80e5jw0zf.png)

Ubuntu 启动后，用以下命令确认 CPU 支持虚拟化
```
# egrep -o '(vmx|svm)' /proc/cpuinfo
# vmx
```
 确认 Libvirtd 服务已经启动
 
 KVM 准备就绪，下一节我们将创建虚拟机。
