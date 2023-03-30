---
layout: post
title: Nornir自定义Task插件-3
categories: 网络自动化
tags: nornir

---

接上篇，之前我们一直是用的nornir_netmiko作为Task。所谓Task，是一个可重用的代码段，可为单个host实现某些功能。用python的话来说，`它是一个将Task作为第一个参数并返回Result的函数`。

调用Task函数的方法也和Python中的自定义函数有点不一样，必须在nr.run()里配合另外一个Task函数来调用。这也说明一个Task可以调用其他Task，它可以允许你通过组合较小的构建块来构建更复杂的功能。

netmiko与paramiko好比一个是自动挡汽车，一个是手动档汽车。自动挡虽然方便，但往往有更多的限制，netmiko需要自己去适配各个型号的网络设备，匹正则写驱动；而paramiko则只提供一个ssh通道，需要开发人员明确网络设备输入的命令。

站在网络工程师的角度来看，个人认为paramiko更为实用。~~再加上我们本身基于adminset的自动化运维平台底层也是采用paramiko~~

在[https://nornir.tech/nornir/plugins/](https://nornir.tech/nornir/plugins/)可以看到nornir已经支持paramiko，不过大概看了下源码后发现该作者目前只实现了一个paramiko_command，更偏向与服务器的交互。不过嘛，在nornir框架下自定义一个Task也很简单，这里我简单的重写了paramiko_commands:

`paramiko_commands.py`
```python
from typing import List
from nornir.core.task import Result, Task
from nornir_paramiko.plugins.connections import CONNECTION_NAME
from nornir_paramiko.exceptions import CommandError

from paramiko.agent import AgentRequestHandler
import time

def paramiko_commands(task: Task, commands: List) -> Result:
    """
    Executes a command remotely on the host
    Arguments:
        commands (``List``): commands to execute
    Returns:
        Result object with the following attributes set:
          * result (``str``): stderr or stdout
          * stdout (``str``): stdout
          * stderr (``str``): stderr
    Raises:
        :obj:`nornir.core.exceptions.CommandError`: when there is a command error
    """
    client = task.host.get_connection(CONNECTION_NAME, task.nornir.config)

    chan = client.invoke_shell()
    for command in commands:
        chan.send(command+'\n')

    time.sleep(0.5)
    chan.close()
    with chan.makefile() as f:
        stdout = f.read().decode()
    with chan.makefile_stderr() as f:
        stderr = f.read().decode()

    task.host.close_connection(CONNECTION_NAME)

    client.close()

    #测试中发现client.close()无效，暂时手动传入退出命令
    #2022.2.15 update:坑爹的地方可能是因为程序跑的太快了，回显压根没来得及写入stdout
    #解决的办法就是加个延时，让程序在读stdout之前中断一下

    # client.close()
    # exit_status_code = chan.recv_exit_status()

    # if exit_status_code:
    #     raise CommandError(command, exit_status_code, stdout, stderr)

    result = stderr if stderr else stdout
    return Result(result=result, host=task.host)

```

`demo.py`
```python
from nornir import InitNornir
from nornir.core.plugins.inventory import InventoryPluginRegister
# from nornir_netmiko import netmiko_send_command, netmiko_send_config
from nornir_paramiko.plugins.tasks import paramiko_command, paramiko_commands
from nornir_utils.plugins.functions import print_result
from nornir.core.task import Result

from cmdb import CMDBInventory

InventoryPluginRegister.register("CMDBInventory", CMDBInventory)

# device_type改为platform也是兼容的
devices = [
    {'ip': '192.168.11.11', 'username': 'python', 'password': '123', 'device_type': 'huawei'}, {
        'ip': '192.168.11.12', 'username': 'python', 'password': '123', 'platform': 'huawei'},
]

nr = InitNornir(
    runner={
        "plugin": "threaded",
        "options": {
            "num_workers": 100,
        },
    },
    inventory={
        "plugin": "CMDBInventory",
        "options": {
            "devices": devices,
        },
    },
)

commands = ['sys', 'dis this']
# commands = ['sys', 'int loopback0', 'des paramiko',
#             'ip address 1.1.1.1 32']

results = nr.run(task=paramiko_commands, commands=commands)

print_result(results)

```