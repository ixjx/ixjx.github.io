---
layout: post
title: 远程管理KVM虚机-每天5分钟的OpenStack(5)
categories: Linux
tags: 虚拟化

---

* TOC
{:toc}

![](http://shurriklab.qiniudn.com/ou14z5tl35o2ys41se9aqlp3w6.png)

上一节我们通过 virt-manager 在本地主机上创建并管理 KVM 虚机。其实 virt-manager 也可以管理其他宿主机上的虚机。只需要简单的将宿主机添加进来

![](http://shurriklab.qiniudn.com/ssap1zkk7tzw747fa85ueir3bl.png)

填入宿主机的相关信息，确定即可。

接下来，我们就可以像管理本地虚机一样去管理远程宿主机上的虚机了。

![](http://shurriklab.qiniudn.com/s6p4p2ral52q3i9qkf2koanyiu.png)

这里其实有一个要配置的地方。

因为 KVM（准确说是 Libvirt）默认不接受远程管理，需要按下面的内容配置被管理宿主机中的两个文件

/etc/default/libvirt-bin
```
start_libvirtd="yes"
libvirtd_opts="-d -l"
```

/etc/libvirt/libvirtd.conf
```
listen_tls = 0
listen_tcp = 1
unix_sock_group = "libvirtd"
unix_sock_ro_perms = "0777"
unix_sock_rw_perms = "0770"
auth_unix_ro = "none"
auth_unix_rw = "none"
auth_tcp = "none" 
```

然后重启 Libvirtd 服务就可以远程管理了。

下节开始，我们将学习 KVM 是如何实现虚拟化的。