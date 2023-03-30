---
layout: post
title: 'CentOS 5升级Python版本（2.4->2.7）'
tags:
  - Linux
id: 876
categories:
  - Linux
date: 2014-07-23 20:57:43
---

日前在CentOS上搭建测试环境的时候，遇到需要升级python版本的情况，于是就记录了整个升级的过程：

在CentOS5中自带的Python版本是2.4.3，但是目前许多基于Python的应用软件要求的Python版本应要高于2.4。升级python版本的时候千万不能卸载python 2.4，再安装python2.7，这样会有无穷无尽的麻烦，保守的方式是直接安装python2.7的源码包，也就是python两个版本共存。（因为Centos里面有很多程序是依赖着python，所有最好不要尝试去卸载python2.4）。
<!--more -->

**(1)下载/安装python**
下载Python2.7.2.tgz`（# wget http://www.python.org/ftp/python/2.7.2/Python-2.7.2.tgz)`
<pre>
$tar -zxvf Python2.7.2.tgz 
$cd Python2.7.2 
$./configure
$make && make install 
</pre>
自此,python2.7安装后路径默认是在/usr/local/lib/python2.7 
或者./configure --prefix=/你想安装的路径
查看Python版本： 
$ /usr/local/bin/python2.7 -V 
显示2.7.2就说明安装成功啦

**(2)建立软连接，使系统默认的python指向python2.7 **
正常情况下即使python2.7安装成功后，系统默认指向的python仍然是2.4版本，考虑到yum是基于python2.4才能正常工作，不敢轻易卸载。如何实现将系统默认的python指向到2.7版本呢？ 
<pre>
$mv /usr/bin/python /usr/bin/python.bak （或者rm -rf /usr/bin/python） 
$ln -s /usr/local/bin/python2.7 /usr/bin/python 
</pre>
检验python指向是否成功 
$python -V 

**(3) 解决系统python软链接指向python2.7版本后，yum不能正常工作 **
方法： 
$vim /usr/bin/yum 
将文本编辑显示的第一行
#!/usr/bin/python修改为#!/usr/bin/python2.4，保存修改即可