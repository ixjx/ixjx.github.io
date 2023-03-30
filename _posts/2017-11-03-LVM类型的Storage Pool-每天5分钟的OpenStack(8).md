---
layout: post
title: LVM类型的Storage Pool-每天5分钟的OpenStack(8)
categories: Linux
tags: 虚拟化

---

* TOC
{:toc}

![](http://shurriklab.qiniudn.com/rb1ofgr0in5ng5uincqh2rjf3l.png)

>### LVM 类型的 Storage Pool

不仅一个文件可以分配给客户机作为虚拟磁盘，宿主机上 VG 中的 LV 也可以作为虚拟磁盘分配给虚拟机使用。

不过，LV 由于没有磁盘的 MBR 引导记录，不能作为虚拟机的启动盘，只能作为数据盘使用。

这种配置下，宿主机上的 VG 就是一个 Storage Pool，VG 中的 LV 就是 Volume。

LV 的优点是有较好的性能；不足的地方是管理和移动性方面不如镜像文件，而且不能通过网络远程使用。

下面举个例子。

首先，在宿主机上创建了一个容量为 10G 的 VG，命名为 HostVG。

![](http://shurriklab.qiniudn.com/tgbproab3lnb37ninhrpsahpk3.png)

然后创建了一个 Storage Pool 的定义文件 /etc/libvirt/storage/HostVG.xml，内容为

![](http://shurriklab.qiniudn.com/52e4qv5l0nfm9gb5wy2tivlmzp.png)

然后通过 virsh 命令创建新的 Storage Pool “HostVG”

![](http://shurriklab.qiniudn.com/i8xj0gultw6d279pzd6yhk580v.png)

并启用这个 HostVG

![](http://shurriklab.qiniudn.com/0vb8mz9jjbr9tkb49urb8hmgc7.png)

现在我们可以在 virt-manager 中为虚机 kvm1 添加 LV 的虚拟磁盘了。

![](http://shurriklab.qiniudn.com/bhhrmh00u7mk7jz7zuv63fecdi.png)

可以看到 HostVG 已经在 Stroage Pool 的列表中了，选择 HostVG

![](http://shurriklab.qiniudn.com/s3cxphn7uikym4sxz70nb79vvl.png)

为 volume 命名为 newlv 并设置大小 100MB

![](http://shurriklab.qiniudn.com/bbaga3qtp2sat9nd14nmktpqa1.png)

点击 Finish，newlv 创建成功，点击 Choose Volume

![](http://shurriklab.qiniudn.com/hxyjdhht5t7c7gmbp0btylftak.png)

点击 Finish 确认将 newlv 作为 volume 添加到 kvm1

![](http://shurriklab.qiniudn.com/1ndma0hg8b3p70wlo95wofofg8.png)

新 volume 添加成功

在宿主机上则多了一个命名为newlv的LV

![](http://shurriklab.qiniudn.com/ej7ui7ea0fcg10wmc81078wzse.png)

>### 其他类型的Storage Pool

KVM 还支持 iSCSI，Ceph 等多种类型的 Storage Pool，这里就不一一介绍了，最常用的就是目录类型，其他类型可以参考文档 http://libvirt.org/storage.html

下一节我们将开始讨论 KVM 的网络虚拟化原理

