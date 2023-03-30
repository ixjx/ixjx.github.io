---
layout: post
title: 黑科技之Andriod LAMP网站服务器
tags:
  - 黑科技
id: 1004
categories:
  - 转载
date: 2015-01-04 22:31:40
---

　　河畔上看到的，感觉折腾下这个可以有。。。

　　曾经你想建站，可是免费的不好，收费的太贵，
　　曾经你想用自己主机搞定，可是笔记本要用，台式太费电。
　　好吧，你换手机就跟换衣服一样，一定有旧手机在墙角落灰了吧？ 那就拿来用用吧。
　　跟着下面的步骤，你的手机就和VPS一样，可以远程访问，远程上传，远程管理，可以建站。

<!--more -->

　　神器1请到此下载[http://alfanla.com/palapa-web-server/](http://alfanla.com/palapa-web-server/)
　　神器2,3请到百度助手和各大市场搜索正确的名字下载
　　神器4请视自己情况下载和设置。
　　配置好了，你就把手机插上电，和路由器丢在一起，你的个人网站服务器就这么蛋生了！！

　　> 神器1：啪~啦~啪
　　palapa web server (PWS)运行于安卓系统的web服务器。

　　Turn your Android devices into a web and database server with Palapa Web Server, a suite of web developer. This application has been designed for low memory consumption and CPU usage, specially used for smartphone and tablet. Hey, it's free and you don't need a root access to run Palapa Web Server!
　　# Requirements
　　- Internal memory should not be less than 50MB!
　　- ARM based processor
　　- Minimum Android 2.2 Froyo

　　# Features
　　- Lighttpd 1.4.32
　　- PHP 5.5.1
　　- MySQL 5.1.69
　　- Msmtp 1.4.31
　　- phpMyAdmin 4.0.4.1
　　- Web Admin 1.0.1

　　# Default Document Root
　　- Path : /sdcard/pws/www/

　　# Default URL
　　- Address : http://127.0.0.1:8080/

　　# Web Admin Informations
　　- Address : http://127.0.0.1:9999
　　- Username : admin
　　- Password : admin

　　# MySQL Informations
　　- Host : localhost (127.0.0.1)
　　- Port : 3306
　　- Username : root
　　- Password : adminadmin

　　# phpMyAdmin Informations
　　- Address : http://127.0.0.1:9999/phpmyadmin
　　- Username : root
　　- Password : adminadmin

　　# Problem?
　　If something is not working properly, please try to restart your phone.

　　# Known Issues
　　As you know, compatibility issue is a big problem of Android phone, I can't test it in all phones. So if it can't work for your phone, just uninstall it, I'm sorry to waste your time. You also can send a mail to let me know your phone model, if I solve it, I will let you know.

　　[![](http://ixjx-sae.stor.sinaapp.com/uploads/pws-action-17.jpg "pws-action-17")](http://ixjx.sinaapp.com/%e9%bb%91%e7%a7%91%e6%8a%80%e4%b9%8bandriod-lamp%e7%bd%91%e7%ab%99%e6%9c%8d%e5%8a%a1%e5%99%a8/pws-action-17/)

> 神器2：SSH Server

　　安装在手机上保持常开，
　　让你能够通过诸如winSCP的软件管理手机内的文件夹。
　　将这个在手机上设置好后，电脑上安装WINSCP或FTP软件并设置好链接即可。
　　[![](http://ixjx-sae.stor.sinaapp.com/uploads/08b0f53c94a476d676d4eabfa9a0e0ab20141226074413.png "08b0f53c94a476d676d4eabfa9a0e0ab20141226074413")](http://ixjx.sinaapp.com/%e9%bb%91%e7%a7%91%e6%8a%80%e4%b9%8bandriod-lamp%e7%bd%91%e7%ab%99%e6%9c%8d%e5%8a%a1%e5%99%a8/08b0f53c94a476d676d4eabfa9a0e0ab20141226074413/)

> 神器3： VMlite VNC Server

　　让你能够远程控制你的手机
　　将这个安装好后启动保持常开，电脑上通过VNC Viewer访问你的手机
　　[![](http://ixjx-sae.stor.sinaapp.com/uploads/e36f4046bae5014779fb89c5faaefe5d20141226074416.png "e36f4046bae5014779fb89c5faaefe5d20141226074416")](http://ixjx.sinaapp.com/%e9%bb%91%e7%a7%91%e6%8a%80%e4%b9%8bandriod-lamp%e7%bd%91%e7%ab%99%e6%9c%8d%e5%8a%a1%e5%99%a8/e36f4046bae5014779fb89c5faaefe5d20141226074416/)

> 神器4： 极路由自带的DDNS 或者 花生壳DDNS

　　解析你的动态IP从而能使你的手机远程访问。
　　请直接在路由器设置花生壳，并设置端口映射到你的手机
　　极路由：安装动态域名和端口转发插件。

　　其他路由设置花生壳和端口转发：请看自己路由器的支持情况。
　　[ http://hsk.oray.com/]( http://hsk.oray.com/)

　　现在万事具备只差一部android手机。。。