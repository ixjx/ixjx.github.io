<?php

$viewpass = ''; // 密码必须大于3位。留空则任何人可以访问
$title = '个人简历';
$subtitle = '个人简历';
$content = '# 个人信息

 - 向佳西/男/1990
 - 本科/电子科技大学网络工程专业
 - 工作年限：5年
 - 个人网站：[https://ixjx.github.io](https://ixjx.github.io)
 - Github: [https://github.com/ixjx](https://github.com/ixjx)

# 联系方式

 - 手机：19923675269
 - Email：vissky1@163.com
 - QQ/微信号：371797442

---

# 工作经历

## 重庆有线电视网络有限公司（ 2013年7月 ~ 至今 ）
#### 系统工程师

主要负责公司网络支撑系统服务器、存储、网络等设备的规划、建设、配置、维护、故障处理等工作

### BCC DHCP项目 
项目主要是用BCC替换掉原cisco CNR系统，BCC基于VMware  ESXi虚拟平台Centos7操作系统，作为主要实施人，我完成了整个系统架构、网络规划、系统配置、业务割接等工作。并完成了BCC系统部署的标准化流程，以便大规模部署。在该系统上线后，DHCP性能经压力测试提升5倍以上，服务器虚拟机由122台减少到20台，承载了整个重庆有线近400W租约。在后期我还针对BCC搭建了一套cacti监控系统，实现自动化监控，自动化运维。

### WAG WLAN项目

项目针对公司原WLAN业务无实名认证，WAG通过建立GRE隧道与AP通信，同时采用TR069协议自动给AP下发配置，终端通过短信认证的方式实现实名认证。WAG基于NFV架构，采用KVM虚拟平台，转发与控制平面分离，采用1+1热备做HA，单台x86服务器能承载1W AP和10W用户。作为项目负责人，我完成了整个系统架构、网络规划、系统配置，以及测试验证和业务割接等工作。系统上线后满足了网监实名认证、审计的要求，帮助公司顺利发展WLAN业务。

### vBNG项目 
项目针对原cisco ASR9010性能瓶颈，采用Juniper vBNG部署方式，同样基于NFV架构，单台x86服务器的KVM环境中创建了2个vBNG实例，分别对应2台独立的vBNG。每个vBNG实例包含控制面（vCP）和转发面（vFP）2个不同的虚拟机。为了提高网络可靠性，采用N+1热备方式，备机通过对其设置PADO延时，当出现单台x86服务器宕机时，用户能够迅速切换至备用vBNG上，实现实时保护。系统上线后2台服务器共承载10W PPPOE拨号用户，有效缓解了ASR9010压力。同时该项目目前为国内最大vBNG部署案例。

---

# 技术栈

以下均为我熟练使用的技能

- 熟悉主流Linux系统，掌握linux下各种命令，熟练使用shell脚本
- 熟悉常用思科、华为、华三等网络设备的配置维护，具有多年系统管理/网络/故障排除经验
- 熟悉虚拟化技术VMware、KVM，云计算openstack、Docker、k8s等相关技术
- 熟悉前端H5、CSS、js等网站开发技术，熟悉后端node，数据库MYSQL、MongoDB等相关技术

---

# 奖项与证书

- 2014年重庆有线电视网络有限公司第六届员工技能竞赛一等奖
- 2014年中国技能大赛--第一届全国有线电视职业技能竞赛决赛三等奖
- 华为NE路由器工程师认证证书
- Casa CMTS Configuration and Troubleshooting认证证书

---

# 致谢
感谢您花时间阅读我的简历，期待能有机会和您共事。';

$data['local'] = 1;


if( strlen( $viewpass ) > 0 && trim($_REQUEST['vpass']) != $viewpass )
{
	$data['errno'] = '0';
	$data['show'] = 0;
	$data['title'] = '';
	$data['subtitle'] = '';
	$data['content'] = '';
}
else
{
	
	$data['errno'] = '0';
	$data['show'] = 1;
	$data['title'] = $title;
	$data['subtitle'] = $subtitle;
	$data['content'] = $content;

}

echo json_encode( $data );
