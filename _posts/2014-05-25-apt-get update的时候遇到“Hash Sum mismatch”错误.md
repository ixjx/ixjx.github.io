---
layout: post
title: apt-get update的时候遇到“Hash Sum mismatch”错误
tags:
  - Linux
id: 804
categories:
  - Linux
date: 2014-05-25 00:10:38
---

这两天在折腾Kali，把原来的backtrack5卸了，蛋疼的是国内（好像）没有Kali的源，有也是速度极慢。

想着反正都是基于Debian，机智的用ubuntu的源，结果在运行apt-get update的时候遇到以下错误：

<pre>
W: Failed to fetch bzip2:/var/lib/apt/lists/partial/mirrors.163.com_ubuntu_dists_quantal-updates_main_binary-i386_Packages  Hash Sum mismatch  

E: Some index files failed to download. They have been ignored, or old ones used instead.  
</pre>

关于这个ERROR的原因，答案挺多，不过总的来说就是`提供源的服务器`的问题。可能是因为网络问题导致tcp包没有发送完整，也有可能是因为服务器那边繁忙所以没有处理你的请求，也有可能是因为服务器那边进行了缓存导致软件列表不是最新的，等等。。。

网上的解决方法挺多的：
（1）我是用这个方法解决的，by [this](http://blog.webfuns.net/archives/1520.html)
`
sudo apt-get clean
sudo apt-get update --fix-missing  
`

（2）删掉/var/lib/apt/lists 这个目录下的东西，by [this](http://askubuntu.com/questions/41605/trouble-downloading-updates-due-to-a-hash-sum-mismatch-error)
`
sudo rm -fR /var/lib/apt/lists/* 
sudo mkdir /var/lib/apt/lists/partial 
sudo apt-get update
`

（3）也有可能不是通过（1）解决的，因为解决的时候换了个地方的网，不知道有没有网络的原因 =.=

装个nginx各种问题，一会403一会service restart不了一会配置改错了。。。。。

好在后来看log解决了，工作后发现看log真心重要啊，能解决好多问题，以后一定得重视。