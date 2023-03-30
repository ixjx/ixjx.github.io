---
layout: post
title: pytorch学习6-分类问题Logistic回归
categories: pytorch
tags: AI
---





在前篇中提到的耗时效益的问题，是线性回归问题，也就是输入和输出间有数值上的关系。

| x(hours) | y(points) |
| -------- | --------- |
| 1        | 2         |
| 2        | 4         |
| 3        | 6         |
| 4        | ?         |

如果将y的值记为是否合格，此问题就变换成一个（二）分类问题。

| x(hours) | y(pass or fail) |
| -------- | --------------- |
| 1        | fail(0)         |
| 2        | fail(0)         |
| 3        | pass(1)         |
| 4        | ?               |

实际上是计算在4工时下是否合格的概率，即对概率的计算与比较，而非类别之间的数值比较。

分类问题中，实际上是对概率的计算与比较，而非类别之间的数值比较

下文中介绍常见的`MNIST`数据集。

![MINIST](https://user-images.githubusercontent.com/4729226/191885088-19a0d1b6-7da9-44b4-9e31-d7e9bb9bf3e0.png)

数据集规格：

1. Training_set： 60000
2. Test_set： 10000
3. Classes： 10



## **逻辑回归**

### **二分类问题**

分类问题是非0即1的问题，由于隐藏条件的限制


$$
P(\widehat y=1)+P(\widehat y=0) = 1
$$


对于二分类问题结果的预测，仅需要计算在0或1的条件下即可得到答案。

通常计算
$$
P(\widehat y=1)
$$


### **逻辑函数**

在线性回归问题中，所利用的模型为


$$
\widehat y = \omega x+b
$$


此时的
$$
\widehat y \in R
$$
，但当问题为分类问题时，所求结果的值域应当发生改变，变为一个概率即
$$
\widehat y \in [0,1]
$$


因此，需要引入逻辑函数（sigmod）来实现。


$$
\sigma(x) = \frac{1}{1+e^{-x}}
$$


**本函数原名为logistics函数，属于sigmod类函数**，由于其特性优异，代码中的sigmod函数就指的是该函数。其函数图像为

![image-20210302151314093](https://user-images.githubusercontent.com/4729226/191887717-42527619-3ec8-4d63-a50e-9991aa071e81.png)

特点：

1. 函数值在0到1之间变化明显（导数大）
2. 在趋近于0和1处函数逐渐平滑（导数小）
3. 函数为饱和函数[[1\]](http://biranda.top/Pytorch学习笔记007——分类问题/#fn1)
4. 单调增函数

除上述以外，还有其他类的sigmod函数。

![image-20210302152008499](https://user-images.githubusercontent.com/4729226/191887864-e23154d6-bd72-4f81-bfe0-b958c526a601.png)

### **模型变化**

#### **模型结构变化**

![image-20210302153609035](https://user-images.githubusercontent.com/4729226/191888156-8d53c83d-f279-4e0a-8856-395d9e127899.png)

#### **Loss变化**

原先是计算两个标量数值间的差距，也就是数轴上的距离。

现在为了计算两个概率之间的差异，需要利用到交叉熵的理论。

![image-20210302153738384](https://user-images.githubusercontent.com/4729226/191888194-9e6bee9e-5ee2-4777-9989-10394df333fd.png)

这一段信息论有点懵，看不懂。。。

总之二分类模型中的Loss改用交叉熵计算，即BCE


$$
Loss = -(y log(\widehat y)+(1-y)log((1-\widehat y))
$$


在mini-batch损失函数的计算中


$$
Loss = -\frac{1}{N}\sum_{n=1}^N y_nlog(\widehat y_n) + (1-y_n)log(1-\widehat y_n)
$$


### **代码部分**

```python
import torch.nn.functional as F
import torch

x_data = torch.Tensor([[1.0],[2.0],[3.0]])
y_data = torch.Tensor([[0.0],[0.0],[1.0]])

#改用LogisticRegressionModel 同样继承于Module
class LogisticRegressionModel(torch.nn.Module):
    def __init__(self):
        super(LogisticRegressionModel, self).__init__()
        self.linear = torch.nn.Linear(1,1)

    def forward(self, x):
        #对原先的linear结果进行sigmod激活
        y_pred = F.sigmoid(self.linear(x))
        return y_pred
model = LogisticRegressionModel()

#构造的criterion对象所接受的参数为（y',y） 改用BCE
criterion = torch.nn.BCELoss(size_average=False)
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for epoch in range(1000):
    y_pred = model(x_data)
    loss = criterion(y_pred,y_data)
    print(epoch,loss)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

print('w = ', model.linear.weight.item())
print('b = ', model.linear.bias.item())

x_test = torch.Tensor([[4.0]])
y_test = model(x_test)

print('y_pred = ',y_test.data)
```

![微信截图_20220923114602](https://user-images.githubusercontent.com/4729226/191888684-177fac0a-faff-4d23-bc62-e67d517bb968.png)





本文参考自[B站《PyTorch深度学习实践》P6](https://www.bilibili.com/video/BV1Y7411d7Ys?p=6)

