---
layout: post
title: 干掉Linux Firefox的Title bar
categories: Linux
tags: Linux

---

　　最近开始使用Firefox，我相信用惯了Chrome/360急速的人看着最上面标签条十分辣眼睛，找了个插件[https://addons.mozilla.org/zh-CN/firefox/user/nanpuyue/](https://addons.mozilla.org/zh-CN/firefox/user/nanpuyue/)需要安装一个脚本，然而我这里的网络打不开gist。。。不过另外３个插件最小化最大化和关闭键倒是用上了


　　参考了[http://eleveni386.7axu.com/blog/post/admin/Linux%E7%94%A8%E6%88%B7%E5%8E%BB%E6%8E%89Firefox-57-%E8%AE%A8%E5%8E%8C%E7%9A%84Title-bar](http://eleveni386.7axu.com/blog/post/admin/Linux%E7%94%A8%E6%88%B7%E5%8E%BB%E6%8E%89Firefox-57-%E8%AE%A8%E5%8E%8C%E7%9A%84Title-bar)


>　思路

　　利用wmctrl找到窗口ID , 使用GDK得到该窗口句柄, 并操作窗口. 去掉窗口装饰器(外边框)


> 准备工具

　　需要wmctrl, 以及pygtk包

　　这两个需要自行安装, 一般发行版本 不自带

> 操作步骤

1. 重命名firefox
`mv /usr/lib/firefox/firefox /usr/lib/firefox/firefox-browser`

2. 创建同名脚本vi firefox
```shell
#!/bin/bash
/usr/lib/firefox/firefox-browser $1 &
sleep 2
F_W_ID=$(wmctrl -l |grep 'Firefox'|awk '{print $1}');
python -c 'from gtk.gdk import window_foreign_new, window_process_all_updates; w = window_foreign_new(int("'$F_W_ID'", 16)); w.set_decorations(0); window_process_all_updates()'
```

3. 给予执行权限
`chomd 777 firefox`

4. 完毕, 截图
![](http://shurriklab.qiniudn.com/20180326170147.png)
