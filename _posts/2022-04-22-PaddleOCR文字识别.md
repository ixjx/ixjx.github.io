---
layout: post
title: PaddleOCR文字识别API搭建
categories: 随编
tags: OCR

---

最近有个需求是进行验证码识别，之前一直用百度的开放OCR API。突然有一天应用报错，一看原来是免费API调用额度用光了。花钱是不可能花钱的，正好之前有用过PaddlePaddle飞桨这个深度学习框架 ~~还是百度的，逮着薅羊毛呢~~，里面有个开源的[PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)，测试下来文本识别效果不输于商用的开放API，那还不整一个?


# 运行环境准备

Windows和Mac用户推荐使用Anaconda搭建Python环境，Linux用户建议使用docker搭建Python环境。

> 推荐环境：
- PaddlePaddle >= 2.1.2
- Python 3.7
- CUDA10.1 / CUDA10.2
- CUDNN 7.6

我用Windows没搭起来，始终报cv2的DLL动态链接库错误，最后还是采用docker方案。

## Docker环境配置

**注意：第一次使用这个镜像，会自动下载该镜像，请耐心等待。您也可以访问[DockerHub](https://hub.docker.com/r/paddlepaddle/paddle/tags/)获取与您机器适配的镜像。**
```bash
# 切换到工作目录下
cd /home/Projects
# 首次运行需创建一个docker容器，再次运行时不需要运行当前命令
# 创建一个名字为ppocr的docker容器，并将当前目录映射到容器的/paddle目录下

#如果您希望在CPU环境下使用docker，使用docker而不是nvidia-docker创建docker
sudo docker run --name ppocr -v $PWD:/paddle --network=host -it registry.baidubce.com/paddlepaddle/paddle:2.1.3-gpu-cuda10.2-cudnn7 /bin/bash

#如果使用CUDA10，请运行以下命令创建容器，设置docker容器共享内存shm-size为64G，建议设置32G以上
# 如果是CUDA11+CUDNN8，推荐使用镜像registry.baidubce.com/paddlepaddle/paddle:2.1.3-gpu-cuda11.2-cudnn8
sudo nvidia-docker run --name ppocr -v $PWD:/paddle --shm-size=64G --network=host -it registry.baidubce.com/paddlepaddle/paddle:2.1.3-gpu-cuda10.2-cudnn7 /bin/bash

# ctrl+P+Q可退出docker 容器，重新进入docker 容器使用如下命令
sudo docker container exec -it ppocr /bin/bash
```

## 安装PaddlePaddle

PaddleOCR是基于PaddlePaddle框架的，首先需要安装PaddlePaddle

- 您的机器安装的是CUDA9或CUDA10，请运行以下命令安装

  ```bash
  python3 -m pip install paddlepaddle-gpu -i https://mirror.baidu.com/pypi/simple
  ```

- 您的机器是CPU，请运行以下命令安装

  ```bash
  python3 -m pip install paddlepaddle -i https://mirror.baidu.com/pypi/simple
  ```

更多的版本需求，请参照[飞桨官网安装文档](https://www.paddlepaddle.org.cn/install/quick)中的说明进行操作。

<a name="12"></a>

## 安装PaddleOCR whl包

```bash
pip install "paddleocr>=2.0.1" # 推荐使用2.0.1+版本
```

## 项目克隆

```bash
【推荐】git clone https://github.com/PaddlePaddle/PaddleOCR
```

如果因为网络问题无法pull成功，也可选择使用码云上的托管：

```bash
git clone https://gitee.com/paddlepaddle/PaddleOCR
```

注：码云托管代码可能无法实时同步本github项目更新，存在3~5天延时，请优先使用推荐方式。

## 安装第三方库
```bash
cd PaddleOCR
pip3 install -r requirements.txt
```

## 服务部署

### 基于PaddleHub Serving的服务部署

hubserving服务部署目录下包括检测、识别、2阶段串联三种服务包，请根据需求选择相应的服务包进行安装和启动。目录结构如下：
```
deploy/hubserving/
  └─  ocr_cls     分类模块服务包
  └─  ocr_det     检测模块服务包
  └─  ocr_rec     识别模块服务包
  └─  ocr_system  检测+识别串联服务包
```

我这里只是用识别模块，目录如下：
```
deploy/hubserving/ocr_rec/
  └─  __init__.py    空文件，必选
  └─  config.json    配置文件，可选，使用配置启动服务时作为参数传入
  └─  module.py      主模块，必选，包含服务的完整逻辑
  └─  params.py      参数文件，必选，包含模型路径、前后处理参数等参数
```

### 快速启动服务
#### 1. 准备环境
```bash
# 安装paddlehub  
# paddlehub 需要 python>3.6.2
pip3 install paddlehub==2.1.0 --upgrade -i https://pypi.tuna.tsinghua.edu.cn/simple
```

#### 2. 下载推理模型
安装服务模块前，需要准备推理模型并放到正确路径。默认使用的是PP-OCRv2模型，默认模型路径为：
```
检测模型：./inference/ch_PP-OCRv2_det_infer/
识别模型：./inference/ch_PP-OCRv2_rec_infer/
方向分类器：./inference/ch_ppocr_mobile_v2.0_cls_infer/
```  

**模型路径可在`params.py`中查看和修改。** 更多模型可以从PaddleOCR提供的[模型库](../../doc/doc_ch/models_list.md)下载，也可以替换成自己训练转换好的模型。

#### 3. 安装服务模块
* 在Linux环境下，安装示例如下：
```bash
# 安装识别服务模块：  
hub install deploy/hubserving/ocr_rec/
```

#### 4. 启动服务
##### 配置文件启动（支持CPU、GPU）
**启动命令：**  
```hub serving start -c config.json```  

其中，`config.json`格式如下：
```python
{
    "modules_info": {
        "ocr_rec": {
            "init_args": {
                "version": "1.0.0",
                "use_gpu": false
            },
            "predict_args": {
            }
        }
    },
    "port": 8867,
    "use_multiprocess": false,
    "workers": 2
}
```

- `init_args`中的可配参数与`module.py`中的`_initialize`函数接口一致。其中，**当`use_gpu`为`true`时，表示使用GPU启动服务**。  
- `predict_args`中的可配参数与`module.py`中的`predict`函数接口一致。

**注意:**  
- 使用配置文件启动服务时，其他参数会被忽略。
- 如果使用GPU预测(即，`use_gpu`置为`true`)，则需要在启动服务之前，设置CUDA_VISIBLE_DEVICES环境变量，如：```export CUDA_VISIBLE_DEVICES=0```，否则不用设置。
- **`use_gpu`不可与`use_multiprocess`同时为`true`**。

#### 5. 发送预测请求
配置好服务端，可使用以下命令发送预测请求，获取预测结果:  

```python tools/test_hubserving.py server_url image_path```  

需要给脚本传递2个参数：  
- **server_url**：服务地址，格式为  
`http://[ip_address]:[port]/predict/[module_name]`  
例如，如果使用配置文件启动识别服务，那么发送请求的url将分别是： 
`http://127.0.0.1:8867/predict/ocr_rec`  

- **image_path**：测试图像路径，可以是单张图片路径，也可以是图像集合目录路径  

访问示例：  
```python tools/test_hubserving.py http://127.0.0.1:8867/predict/ocr_rec ./doc/imgs/```

#### 返回结果格式说明
返回结果为列表（list），列表中的每一项为字典（dict），信息如下：

|字段名称|数据类型|意义|
|----|----|----|
|text|str|文本内容|
|confidence|float| 文本识别置信度或文本角度分类置信度|

#### 效果
![ocr1](https://user-images.githubusercontent.com/4729226/164590320-9d2a855d-dd5d-4fcb-9ceb-27a53b688ef1.png)

可以看到置信度还不错99%，并且能分清字母o和数字0。

后期还可以自己训练模型，以达到更好的识别效果。