---
layout: post
title: Read-only file system
date: 2016-02-15 21:23:37
categories: Linux
tags: Linux

---

　　春节过完刚上班就遇到个奇怪的问题，今天在公司艹脚本时，发布脚本突然报Read-only file system的错误，春节之前一直还用的好好的。。。登录到远程服务器上，发现只要涉及到修改/保存等需要写磁盘操作的命令都无法使用（如tar、mv、rm、chmod、chown、wget等命令），总是提示Read-only file system，也就是说系统是只读的，什么也写不了。

　　查看服务器上的fstab文件，cat /etc/fstab，其中发现这样一条记录
　　`/dev/VolGroup00/LogVol00 /                       ext3    errors=remount-ro        1 1`

　　怎么根目录挂载成只读了，然后cat /proc/mounts也发现
　　`/dev/root / ext3 ro,data=ordered 0 0`

　　网上查了下，这种情况通常都是由于系统发现磁盘硬件故障或文件系统中文件被损坏之后而采取的保护机制导致的。
　　为了保护数据不破坏分区中已有内容，Linux在挂载文件系统时就只用read-only只读方式加载了。至于挂载的文件系统为什么会莫名地变成以只读方式挂载的具体原因，这就不知道了。

　　如果能够确认数据和系统的文件没有被损坏，修复fstab文件配置后只要重新R/W加载再重启就能够恢复正常: 
　　`mount -o remount rw /dev/root /`

　　如果机器上有重要文件，在重新加载文件系统前可以用scp将其备份到远程主机上：
　　`scp -r import_dir/import_file user@host:~`

　　之所以使用scp命令备份重要目录/文件到远程主机上，而不用tar命令打包压缩后再传输，因为在用tar命令打包压缩文件时会涉及到写磁盘操作，这还是会引起Read-only file system的错误。