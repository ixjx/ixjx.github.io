---
layout: post
title: Nornir自定义Processor-4
categories: 网络自动化
tags: nornir

---

到目前为止我们都是通过`print_result`打印执行结果，理所当然的我们可以自定义一个处理器(Processor)插件来达到相同的结果。

它就是一个可以处理任务的装饰器，在不改变任务结果的前提下，让我们可以自己编写代码对任务结果进行加工，添加私货，为处理任务提供了更多的扩展性。

同时由于Processor插件基于事件的特性，可以异步处理事件，在某一台主机完成任务后立即处理任务结果，而无需等待其他主机完成。

参考官网文档，我们先写一个打印一些信息的processor：

```python
class PrintProcessor:  # 自定义processor
    def task_started(self, task: Task) -> None:
        """
        This method is called right before starting the task
        """
        print(f">>> starting task: {task.name}")

    def task_completed(self, task: Task, result: AggregatedResult) -> None:
        """
        This method is called when all the hosts have completed executing their respective task
        """
        print(f">>> completed task: {task.name}")

    def task_instance_started(self, task: Task, host: Host) -> None:
        """
        This method is called before a host starts executing its instance of the task
        """
        pass

    def task_instance_completed(
        self, task: Task, host: Host, result: MultiResult
    ) -> None:
        """
        This method is called when a host completes its instance of a task
        """
        print(f"  - {host.name}: - {result.result}")

    def subtask_instance_started(self, task: Task, host: Host) -> None:
        """
        This method is called before a host starts executing a subtask
        """
        pass

    def subtask_instance_completed(
        self, task: Task, host: Host, result: MultiResult
    ) -> None:
        """
        This method is called when a host completes executing a subtask
        """
        pass
```

可以看出一个processor插件就是一个类，需要实现一些事件的方法，从名字也能简单看出每个方法是什么时候调用。

再来一个保存信息的processor：

```python
class SaveResultToDict:
    def __init__(self, data: Dict[str, None]) -> None:
        self.data = data

    def task_started(self, task: Task) -> None:
        self.data[task.name] = {}
        self.data[task.name]["task started"] = True

    def task_completed(self, task: Task, result: AggregatedResult) -> None:
        self.data[task.name]["task completed"] = True

    def task_instance_started(self, task: Task, host: Host) -> None:
        self.data[task.name][host.name] = {"host started": True}

    def task_instance_completed(
        self, task: Task, host: Host, result: MultiResult
    ) -> None:
        self.data[task.name][host.name] = {
            "host completed": True,
            "host result": result.result,
        }

    def subtask_instance_started(self, task: Task, host: Host) -> None:
        pass  # to keep example short and sweet we ignore subtasks

    def subtask_instance_completed(
        self, task: Task, host: Host, result: MultiResult
    ) -> None:
        pass  # to keep example short and sweet we ignore subtasks
```

`demo`
```python
import json
from nornir import InitNornir
from nornir.core.plugins.inventory import InventoryPluginRegister
from nornir_paramiko.plugins.tasks import paramiko_command, paramiko_commands

from lab2.cmdb import CMDBInventory
from typing import Dict

from nornir.core.inventory import Host
from nornir.core.task import AggregatedResult, MultiResult, Result, Task

InventoryPluginRegister.register("CMDBInventory", CMDBInventory)

# device_type改为platform也是兼容的
devices = [
    {'ip': '192.168.11.11', 'username': 'python',
        'password': '123', 'device_type': 'huawei'},
    {'ip': '192.168.11.12', 'username': 'python',
        'password': '123', 'platform': 'huawei'},
    {'ip': '192.168.11.13', 'username': 'python',
        'password': '123', 'platform': 'huawei'},
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

data = {}
commands = ['sys', 'dis this', 'return', 'quit']

nr_with_processors = nr.with_processors([PrintProcessor(), SaveResultToDict(data)])

nr_with_processors.run(task=paramiko_commands,
                       name='paramiko processors', commands=commands)

print(json.dumps(data, indent=4))
```