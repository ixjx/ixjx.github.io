---
layout: post
title: SDN网络之Mininet
tags:
  - Linux
id: 937
categories:
  - 网络
date: 2014-09-12 20:40:48
---

> SDN 与 Mininet 概述

　　SDN 即Software Defined Network，是现互联网中一种新型的网络创新架构,其核心技术 OpenFlow 通过网络设备使控制面与数据面分离开来,从而实现网络流量的灵活控制,为网络及应用提供了良好的平台。而 Mininet 是一个轻量级软件定义网络和测试平台；它采用轻量级的虚拟化技术使一个单一的系统看起来像一个完整的网络运行想过的内核系统和用户代码，也可简单理解为 SDN 网络系统中的一种基于进程虚拟化平台，它支持 OpenFlow、OpenvSwith 等各种协议，Mininet 也可以模拟一个完整的网络主机、链接和交换机在同一台计算机上且有助于互动开发、测试和演示，尤其是那些使用 OpenFlow 和 SDN 技术的系统；同时也可将此进程虚拟化的平台下代码迁移到真实的环境中。

<!--more -->

> Mininet 实现的特性

　　支持 OpenFlow、OpenvSwitch 等软定义网路部件
　　支持系统级的还原测试，支持复杂拓扑，自定义拓扑等
　　提供 Python API, 方便多人协作开发
　　很好的硬件移植性与高扩展性
　　支持数千台主机的网络结构

> Miniet 实现与工作流程

　　Mininet 的安装方式比较简单通过 Git 源码和自带的安装脚本方式即可安装在 Linux 系统中，这里我采用了默认安装所有 Mininet 相关的相关套件，如：OpenFlow、POX 等工具会默认保存在当前用户的家目录。其实博士告诉我直接去官网下载封装好的虚拟机镜像更方便。
<pre>
# git clone git://github.com/mininet/mininet
# cd mininet/util/
# ./install.sh -a 
# ls
mininet  of-dissector  oflops  oftest  openflow  pox
</pre>

**创建网络**
![](http://www.ibm.com/developerworks/cn/cloud/library/1404_luojun_sdnmininet/image003.jpg "图 1.简单网络示例图")

　　由于 Mininet 支持自定义网络，这里先引用一个简单网络示例如图 1，在 Mininet 网络系统中直接输入 mn 命令，可以在此系统中创建单层的拓扑网络，从中默认创建了两台 host 和一个交换机，并且激活了控制器和交换机。同时也可以通过命令 net 查看到链路情况，先简单列出了示例，如在 Mininet 系统中启用 Web 服务器与客户端。
<pre>
# mn
*** Creating network
*** Adding controller
*** Adding hosts:
h1 h2
*** Adding switches:
s1
*** Adding links:
(h1, s1) (h2, s1)
*** Configuring hosts
h1 h2
*** Starting controller
*** Starting 1 switches
s1
*** Starting CLI:
mininet>
</pre>

**启用与关闭 Web 服务**
　　在 Mininet 环境中可方便建立一个 Web 服务器，从下面示例中可以看到从 host1 建立了一个 Web 服务器，并从另外一台 Host 主机想 Web 服务器获取 HTTP 请求。
<pre>
mininet> h1 python -m SimpleHTTPServer 80 &     #在主机 h1 开启 Web 服务
mininet> h2 wget - h1                           #主机 h2 上下载 h1 web 站点内容
--2013-11-04 00:05:40--  http://10.0.0.1/ 
Connecting to 10.0.0.1:80... connected.
HTTP request sent, awaiting response... 200 OK
…………
Length: 760 [text/html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 3.2 Final//EN"><html>
<title>Directory listing for /</title>
<li>[.bash_history](.bash_history)
<li>[.wireshark/](.wireshark/)
<li>[install-mininet-vm.sh](install-mininet-vm.sh)
<li>[mininet/](mininet/)
<li>[of-dissector/](of-dissector/)
<li>[oflops/](oflops/)
<li>[oftest/](oftest/)
<li>[openflow/](openflow/)
<li>[pox/](pox/)
</ul>

* * *

</body>
</html>

     0K                                           100% 1.65M=0s
2013-11-04 00:05:40 (1.65 MB/s) - written to stdout [760/760]

mininet> h1 kill %python                       # 杀掉 web 进程
10.0.0.2 - - [04/Nov/2013 00:05:40] "GET / HTTP/1.1" 200 -
bash: line 23: kill: python: ambiguous job spec
</pre>

**自定义拓扑**
　　Mininet 支持自定义拓扑结构，在 mininet/custom 目录下给出了一个实例，如在 topo-2sw-2host.py 文件中定义了一个 mytopo，则可以通过--topo 选项来指定使用这一拓扑:
![](http://www.ibm.com/developerworks/cn/cloud/library/1404_luojun_sdnmininet/image005.gif "图 2\. 自定拓扑示例")

　　由于 Mininet 也支持参数化拓扑，通过 Python 也可以创建一个灵活的拓扑结构,也可根据自定义传递进去的参数进行配置，并且可重用到多个环境中。
<pre>
#!/usr/bin/python

from mininet.topo import Topo
from mininet.net import Mininet
from mininet.util import dumpNodeConnections
from mininet.log import setLogLevel

class SingleSwitchTopo(Topo):
　　def __init__(self, n=2, **opts):
　　Topo.__init__(self, **opts)
　　switch = self.addSwitch('s1')     #添加一个交换机在拓扑中
　　for h in range(n):
　　　　host = self.addHost('h%s' % (h + 1))   #添加主机到拓扑中
　　　　self.addLink(host, switch)   #添加双向连接拓扑

def simpleTest():
　　topo = SingleSwitchTopo(n=4)
　　net = Mininet(topo)    #主要类来创建和管理网络
　　net.start()    #启动拓扑网络
　　print "Dumping host connections"
　　dumpNodeConnections(net.hosts)       #转存文件连接
　　print "Testing network connectivity"     
　　net.pingAll()    #所有节点彼此测试互连
　　net.stop()       #停止网络

if __name__ == '__main__':
　　setLogLevel('info')  # 设置 Mininet 默认输出级别，设置 info 它将提供一些有用的信息
　　simpleTest()
</pre>

**Mininet 常用操作**
`nodes：查看全部节点
net：查看链路信息
dump：输出各节点的信息
h1 ping -c 4 h2：测试主机之间的连通性
iperf：两个节点之间用指定简单的 TCP 测试
iperfudp：两个节点之间用指定款单 udp 进行测试
noecho：运行交互窗口，关闭回应
pingpair：两个主机将互 ping
help：列出命令文档，查看命令帮助： help command
dpctl：在所有叫交换机
exit/quit：退出 mininet 命令行
hX ifconfig：查看当前那主机的 ip 地址，如： h1 ifconfig
py/sh：执行 python 表达式或运行外部 shell 程序`

Mininet入门部分就是这样了，enjoy it!