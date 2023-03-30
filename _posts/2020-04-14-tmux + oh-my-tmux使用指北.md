---
layout: post
title: tmux + oh-my-tmux使用指北
categories: Linux
tags: tmux

---

* TOC
{:toc}

> ### tmux是什么

　　我们在linux服务器上的工作一般都是通过一个终端连接软件连接到远端系统进行操作，例如使用xshell或者SecureCRT工具通过ssh进行远程连接。

　　在使用过程中，如果要做比较耗时的操作，例如有时候进行编译，或者下载大文件需要比较长的时间，一般情况下是下班之后直接运行希望第二天早上过来运行完成，这样就不用耽误工作时间。但是网络有时候不稳定，或者timeout，可能在半夜会出现连接断掉的情况，一旦连接断掉，所执行的程序也就中断，当然可以写一个脚本后台运行，但是总不能每次都写脚本吧。

　　那么有没有一种工具可以解决这样的问题呢，当然是有的了，比如这里提到的tmux。其实类似tmux的工具还有很多。例如gnu screen等。

　　tmux使用更简单，功能也更强大，当在tmux中工作的时候，即使关掉CRT的连接窗口，再次连接，进入tmux的会话之前的工作仍然在继续。

　　tmux是一个linux下面的工具，在使用之前需要安装，配置使用[oh-my-tmux](https://github.com/gpakosz/.tmux)（取名类似oh-my-zsh）。

　　tmux中有3种概念，会话(session)，窗口(window)，窗格(pane)。会话有点像是tmux的服务，在后端运行，可以通过tmux命令创建这种服务，并且可以通过tmux命令查看。一个session可以包含多个window，一个window可以被分割成多个pane。首先来看一下tmux的会话。

> ### tmux的session

1. `tmux new -s mysession1` 新建名为mysession1的会话  
![1](https://user-images.githubusercontent.com/4729226/79189057-57e17480-7e53-11ea-911a-126c3fefd1a8.png)
可以看到进入session之后的显示，在下面有一条状态栏。

2. `ctrl+b d` 退出会话，回到shell的终端环境  
当前在tmux的会话环境中，使用一个快捷键`ctrl+b d`。  
这里提一下，tmux 窗口有大量的快捷键。所有快捷键都要通过前缀键唤起。默认的前缀键是`Ctrl+b`，oh-my-tmux新增了`Ctrl+a`。举例来说，帮助命令的快捷键是`Ctrl+b ?`。在后面的描述中，我们说的终端环境是指使用SecureCRT进入远程linux之后但是没有进入tmux的会话环境的状态。

3. `tmux ls` 终端环境查看会话列表  
在终端环境中执行`tmux ls`  
可以看到在列出的列表中，只有1行，说明只有一个session。 
![2](https://user-images.githubusercontent.com/4729226/79189704-0803ad00-7e55-11ea-9b5d-bf6ca1c5a138.png)

4. `ctrl+b s` 会话环境查看会话列表

5. `tmux a -t mysession1` 终端环境进入会话

6. `tmux kill-session -t mysession1`终端环境销毁会话

7. `tmux rename -t old_session_name  new_session_name` 终端环境重命名会话 
   `ctrl + b $`会话环境重命名会话
   
> ### tmux的window

　　一个tmux的会话(session)中可以有多个窗口(window)，每个窗口又可以分割成多个pane(窗格)。工作的最小单位其实是窗格。默认情况下在一个window中，只有一个大窗格，占满整个窗口区域。

　　参考之前新创建的会话中会默认创建一个窗口，名字是zsh，可以通过`crtl+b ,` (前缀键之后按一个逗号)来修改当前窗口的名字。

1. `ctrl+b c` 创建window

2. 切换window  
`ctrl+b 1` 切换到1号window，依次类推  
`ctrl+b w` (windows的首字母) 列出当前session所有window，通过上、下键切换窗口

3. `ctrl+b & ` 关闭window 或者直接exit

> ### tmux的pane

　　这个是最好玩的了，tmux的一个window可以被分成多个pane(窗格)，可以做出分屏的效果。

![3](https://user-images.githubusercontent.com/4729226/79191375-fe7c4400-7e58-11ea-8d45-81c4cb98ff68.png)


1. `ctrl+b %` 垂直分屏  
   `ctrl+b "` 水平分屏
   
2. 切换pane  
`ctrl+b o ` 依次切换当前窗口下的各个pane  
`ctrl+b 上下左右` 根据按箭方向选择切换到某个pane  
`ctrl+b Space(空格键)` 对当前窗口下的所有pane重新排列布局，每按一次，换一种样式  
`ctrl+b z` 最大化当前pane，再按一次后恢复

3. `ctrl+b x` 关闭pane  或者直接exit

> ### tmux window中的历史输出查看

　　在tmux里面，因为每个窗口的历史内容已经被tmux接管了。

　　当我们在每 个tmux的window之间进行来回切换，来回操作，没有办法看到一个window里面屏幕上的历史输出，没办法使用鼠标滚动(例如在CRT中)查看之前的内容。

　　如果要看当前窗口的历史内容，通过在当前的tmux window 按 `ctrl-b`，然后就可以用PgUp/PgDn来浏览历史输出了，按q退出。