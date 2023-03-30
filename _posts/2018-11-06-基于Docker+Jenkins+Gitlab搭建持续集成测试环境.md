---
layout: post
title: 基于Docker+Jenkins+Gitlab搭建持续集成测试环境
categories: 随编
tags: 容器

---

　　七牛云的测试域名到期了，所有图片的图床都崩了，早知如此不该图方便，自己做静态资源算了。进入今天的正题，到新公司一个月，项目开发前后端分离，差不多拉通了开发到测试的流程，在此记录一下。

　　随着DevOps理念和敏捷理念的发展，我们希望通过自动化技术，加快项目的迭代。尤其是当使用微服务方案后，面临在大量的项目构建和部署工作，借助于jenkins的持续集成，可以快速把应用打包成docker镜像，实现自动部署。

![jenkins](https://user-images.githubusercontent.com/4729226/56795878-f2f8cd00-6843-11e9-9188-214621243639.png)

如图演示了以下的场景：

- 开发者向自己的gitlab提交了代码

- jenkins通过定时任务检测到了代码有变成，执行自动化构建过程

- jenkins在自动化构建脚本中调用docker命令将构建好的镜像push到私有镜像中心harbor

- 同时，jenkins也可以直接执行remote shell启动构建好的容器

- 构建失败或者成功，可以及时将结果推送给相关人员，比如测试人员，安排测试

- 服务端可以手动通过docker命令，从镜像仓库中心拉取镜像，进行手动部署


> 环境如下:

| 192.168.110.202 | harbor |
| 192.168.110.203 | gitlab jenkins |

　　除了jenkins均采用docker部署。

## 1. 搭建harbor

~~docker run -d -p 5000:5000 -v /opt/docker-registry:/var/lib/registry registry~~ 一开始用的registry，连个UI都没有，使用不便，弃了


[harbor官方安装文档](https://github.com/goharbor/harbor/blob/master/docs/installation_guide.md)

采用offline安装包,在执行./prepare的时候抛出如下异常：

```bash
root@ubuntu:~/harbor# ./prepare 
Fail to generate key file: ./common/config/ui/private_key.pem, cert file: ./common/config/registry/root.crt
```

需要修改prepare文件，将第498行：

`empty_subj = "/C=/ST=/L=/O=/CN=/"`

修改如下：

`empty_subj = "/C=US/ST=California/L=Palo Alto/O=VMware, Inc./OU=Harbor/CN=notarysigner"`

配置daemon.json，去掉docker(每个docker client都需要配置)默认的https的访问`vim /etc/docker/daemon.json`

里面的内容是一个json对象,加上一项insecure-registries，地址自己更改：

```
{
    "insecure-registries":["192.168.1.78"]
}
```

然后重启docker,执行

`systemctl daemon-reload`

`systemctl restart docker`

## 2. 搭建gitlab

```bash
docker run --detach \
--hostname localhost \
--publish 443:443 --publish 80:80 \
--name gitlab \
--restart always \
--volume /opt/gitlab/config:/etc/gitlab \
--volume /opt/gitlab/logs:/var/log/gitlab \
--volume /opt/gitlab/data:/var/opt/gitlab \
gitlab/gitlab-ce:latest
```

　　之后push demo代码。

## 3. jenkins安装

　　这一块比较复杂，不讲了

## 4. 流水线demo

　　前端用npm打包，后端用的maven。

```groovy
pipeline{
    agent {
        label 'master'
    }

    stages{
        stage('拉取代码'){
            steps{
                git branch: 'alarm_system_v2',
                credentialsId: '5d7cb03e-66df-4002-a2d5-70f8aa196ac1',
                url: 'http://192.168.110.8:10080/fehz/react-garden-system.git'
            }
        }

        stage('安装依赖，进行前端代码鉴定'){
            steps{
                nodejs('node-v10.6.0') {
                    sh'''
                    npm -v
                    node -v
                    npm install react-tree-module-web --registry=http://192.168.110.26:8088/repository/npm/
                    npm install react-common-module-web --registry=http://192.168.110.26:8088/repository/npm/
                    npm install
                    npm run lint --force
                    '''
                    checkstyle canComputeNew: false, defaultEncoding: '', healthy: '', pattern: 'eslint.xml', unHealthy: ''
                    hygieiaCodeQualityPublishStep checkstyleFilePattern: '**/*/eslint.xml', findbugsFilePattern: '', jacocoFilePattern: '', junitFilePattern: '', pmdFilePattern: ''
                }
            }
        }

        stage('npm打包'){
            steps{
                nodejs('node-v10.6.0'){
                    hygieiaBuildPublishStep buildStatus: 'InProgress'
                    sh'''
                    npm run build:test
                    cp /var/lib/jenkins/workspace/build_prj/*.js $WORKSPACE/node_modules/connect-cas2/lib/
                    '''
                    hygieiaBuildPublishStep buildStatus: 'Success'
                }
            }
        }

        stage('构建docker镜像'){
            steps{
                sh'''
                ###根据git库设置包名
                jar_name=192.168.110.202/isp/react-garden-alarm-system
                echo "包名:$jar_name"
                docker build -t $jar_name .
                '''
            }
        }

        stage('将docker镜像上传到镜像仓库'){
            steps{
                sh 'docker push 192.168.110.202/isp/react-garden-alarm-system:latest'
                sh 'docker image prune -f'
            }
        }

        stage('测试环境部署'){
            steps{
                sh'''
                echo "登录到192.168.110.211服务器执行部署脚本"
                ssh root@192.168.110.211 "sh /opt/jenkins/deploy.sh react_garden_alarm_system"
                '''
                hygieiaDeployPublishStep applicationName: 'react-garden-system-alarm-dev', artifactDirectory: '', artifactGroup: '', artifactName: '', artifactVersion: '', buildStatus: 'Success', environmentName: 'TEST'
            }
        }
    }
}

```

```groovy
pipeline{
    agent {
        label 'master'
    }

    stages{
        stage('拉取代码'){
            steps{
                git branch: 'develop-isp',
                credentialsId: '5d7cb03e-66df-4002-a2d5-70f8aa196ac1',
                url: 'http://192.168.110.8:10080/liuran/framework-alarm.git/'
            }
        }

        stage('后端代码鉴定'){
            steps{
                build job:'garden-sonar-dev',
                parameters: [string(name: 'choose_service', value: 'framework-alarm-log-sonar')]
                hygieiaSonarPublishStep ceQueryIntervalInSeconds: '10', ceQueryMaxAttempts: '30'
            }
        }

        stage('构建并打包成docker镜像'){
            steps{
                withMaven(jdk: 'jdk', maven: 'apache-maven-3.5.4') {
                    hygieiaBuildPublishStep buildStatus: 'InProgress'
                    sh 'mvn clean package docker:build'
                    hygieiaBuildPublishStep buildStatus: 'Success'
                }
            }
        }

        stage('将docker镜像上传到镜像仓库'){
            steps{
                sh 'docker push 192.168.110.202/isp/java/framework-alarm-log:latest'
                sh 'docker image prune -f'
            }
        }

        stage('测试环境部署'){
            steps{
                sh'''
                echo "登录到192.168.110.211服务器执行脚本"
                ssh root@192.168.110.211 "sh /opt/jenkins/deploy.sh java_framework_alarm_log"
                echo "登录到192.168.110.212部署自动化测试环境"
                ssh root@192.168.110.212 "sh /root/isp-alarm.sh"
                '''
                hygieiaDeployPublishStep applicationName: 'garden-framework-alarm-log-dev', artifactDirectory: 'target', artifactGroup: 'com.letv.dashboard', artifactName: '*.jar', artifactVersion: '', buildStatus: 'Success', environmentName: 'TEST'
            }
        }
    }

    /*post {
        always {
            
            echo 'One way or another, I have finished'
  
        }
        success {
            echo 'I succeeeded!'
			hygieiaBuildPublishStep buildStatus: 'Success'
        }
        unstable {
            echo 'I am unstable :/'
			hygieiaBuildPublishStep buildStatus: 'Unstable'
        }
        failure {
            echo 'I failed :('
			hygieiaBuildPublishStep buildStatus: 'Failure'
			
        }
        changed {
            echo 'Things were different before...'
        }
    }*/
}
```

后面可以加个post阶段给老大发邮件。。

`deploy.sh`参考
```bash
#!/bin/sh

login_harbor(){

    REGISTRY="192.168.110.202"
    HARBOR_USER="admin"
    HARBOR_PASSWD="Harbor12345"

    docker login -u ${HARBOR_USER} -p ${HARBOR_PASSWD} ${REGISTRY}
}

deploy_new_container(){
    # $1 : $CONTAINER_NAME
    # $2 : $OLD_IMAGE_NAME 
    # $3 : $IMAGE_NAME 
    # $4 : $PORT 
    cid=$(docker ps -a | grep "$1" | awk '{print $1}')
    if [ -n "$cid" ];then
        docker rm -f $cid
    fi
    echo "******删除旧容器完成******"

    iid=$(docker images | grep "$2" | awk '{print $3}')
    if [ -n "$iid" ];then
        docker rmi -f $iid
    fi
    echo "******删除旧镜像完成******"

    docker pull $3
    echo "******拉取新镜像完成******"

    if [[ $3 =~ "java" ]];then
        docker run -d --restart always -p $4:$4 --name $1 -e JAVA_OPTS="-Denv=UAT" $3
        echo "******远程部署后端容器完成******"
    elif [[ $3 =~ "react" ]];then
        docker run -d --restart always -p $4:$4 --name $1 -e ENV_OPTS="--env test" $3
        echo "******远程部署前端容器完成******"
    else
        echo "镜像名字不合法，请确认!"
    fi
}

# 后端微服务
java_framework_alarm_log(){
    CONTAINER_NAME="java-alarm-test"
    OLD_IMAGE_NAME="192.168.110.202/isp/java/framework-alarm-log"
    IMAGE_NAME="192.168.110.202/isp/java/framework-alarm-log:latest"
    PORT="8086"

    deploy_new_container $CONTAINER_NAME $OLD_IMAGE_NAME $IMAGE_NAME $PORT
}

java_isp_ias(){
    CONTAINER_NAME="java-ias-test"
    OLD_IMAGE_NAME="192.168.110.202/isp/java/isp-ias"
    IMAGE_NAME="192.168.110.202/isp/java/isp-ias:latest"
    PORT="8089"

    deploy_new_container $CONTAINER_NAME $OLD_IMAGE_NAME $IMAGE_NAME $PORT
}

# 前端
react_garden_alarm_system(){
    CONTAINER_NAME="react-alarm-test"
    OLD_IMAGE_NAME="192.168.110.202/isp/react-garden-alarm-system"
    IMAGE_NAME="192.168.110.202/isp/react-garden-alarm-system:latest"
    PORT="8003"

    deploy_new_container $CONTAINER_NAME $OLD_IMAGE_NAME $IMAGE_NAME $PORT
}

react_garden_inbreak_system(){
    CONTAINER_NAME="react-ias-test"
    OLD_IMAGE_NAME="192.168.110.202/isp/react-garden-inbreak-system"
    IMAGE_NAME="192.168.110.202/isp/react-garden-inbreak-system:latest"
    PORT="8005"

    deploy_new_container $CONTAINER_NAME $OLD_IMAGE_NAME $IMAGE_NAME $PORT
}

login_harbor

case $1 in 
    java_framework_alarm_log)
        java_framework_alarm_log
    ;;
    java_isp_ias)
        java_isp_ias
    ;;
    react_garden_alarm_system)
        react_garden_alarm_system
    ;;
    react_garden_inbreak_system)
        react_garden_inbreak_system
    ;;
    *)
    echo "请输入正确参数!
    java_framework_alarm_log
    java_isp_ias
    react_garden_alarm_system
    react_garden_inbreak_system"
    ;;
esac
```


## 5. 问题

1. gitlab需通过root账号登录，允许本地webhook。这是因为gitlab和jenkins在同一个节点部署，实际分开部署不会有这个问题

```bash
gitlab-rails console production   #gitlab居然是用ruby写的
u = User.where(email: 'admin@example.com').first
u.password='new_password'
u.save!
```

gitlab配置Admin area：

Setting->Network->Outbound requests

勾选Allow requests to the local network from hooks and services

jenkins配置：

Jenkins-->Jenkins Manages-->Configure System，找到GitLab配置，去掉勾选

系统管理-->全局安全配置，勾选匿名用户具有可读权限和去掉CSRF防止跨站点请求伪造