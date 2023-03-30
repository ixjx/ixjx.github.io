---
layout: post
title: pytorch学习5-pytorch实现线性回归
categories: pytorch
tags: AI
---





终于到pytorch（本文使用1.12.1版本）实战了，利用pytorch进行深度学习一般分为以下4步：

1. 准备数据集（Prepare dataset）
2. 设计用于计算最终结果的模型（Design model）
3. 构造损失函数及优化器（Construct loss and optimizer）
4. 设计循环周期（Training cycle）——前馈、反馈、更新



## **以线性模型为例**

题目如前，数据如表所示：

| x(hours) | y(points) |
| -------- | --------- |
| 1        | 2         |
| 2        | 4         |
| 3        | 6         |
| 4        | ?         |

构建线性模型


$$
\widehat y = \omega x +b
$$

### **准备数据**

在原先的题设中，
$$
x,\widehat y \in R
$$


在pytorch中，若使用mini-batch的算法，一次性求出一个批量的y^，则需要x以及y^作为矩阵参与计算，此时利用其**广播**机制，可以将原标量参数ω扩写为同维度的矩阵 [w] ,参与运算而不改变其Tensor的性质。

对于矩阵，行表示样本，列表示特征。

```python
import torch
#数据作为矩阵参与Tensor计算，并行计算可利用GPU加速
x_data = torch.Tensor([[1.0],[2.0],[3.0]])
y_data = torch.Tensor([[2.0],[4.0],[6.0]])
```

### **构造计算图**

在如下线性模型的计算图中，红框区域为线性单元，其中的ω以及b是需要反复训练确定的，在设计时，需要率先设计出此二者的**维度**。

而由于公式
$$
\widehat y = \omega x +b
$$


因此，只要确定了y^以及x的维度，就可以确定上述两个量的维度大小。

![image-20210302100645010](https://user-images.githubusercontent.com/4729226/191685289-d2e67128-df19-4926-ae4d-d9d9f27b7374.png)

按照上述理论，由于前边的计算过程都是针对矩阵的，因此最后的loss也是矩阵，但由于要进行**反向传播**调整参数，因此loss应当是个标量，因此要对矩阵[loss]内的每个量求和求均值(MSE)。


$$
loss = \frac{1}{N}\Sigma
\begin{bmatrix}
{loss_1}\\
{\vdots}\\
{loss_n}\\
\end{bmatrix}
$$


```python
#固定继承于Module
class LinearModel(torch.nn.Module):
    #构造函数初始化
    def __init__(self):
        #调用父类的init
        super(LinearModel, self).__init__()
        #Linear对象包括weight(w)以及bias(b)两个成员张量
        self.linear = torch.nn.Linear(1,1)

    #前馈函数forward，对父类函数中的overwrite
    def forward(self, x):
        #调用linear中的call()，以利用父类forward()计算wx+b
        y_pred = self.linear(x)
        return y_pred
    #反馈函数backward由module自动根据计算图生成
model = LinearModel()
```

### **构造Loss和Optimizer**

在公式中可知，由于Loss的计算也是有张量参与的计算，因此仍然需要进行计算图的构造。即在设计中也需要继承于Module的类和方法。

```python
criterion = torch.nn.MSELoss(size_average=False)
```

其中的MSELoss也是继承于nn.Module



优化器Optimizer并不构建计算图，生成的优化器对象可以直接对整个模型进行优化。

```python
#model.parameters()用于检查模型中所能进行优化的张量
#learningrate(lr)表学习率，可以统一也可以不统一
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

```

### **模型训练**

1. 前馈计算预测值与损失函数
2. forward前馈计算预测值即损失loss
3. 梯度或前文清零并进行backward
4. 更新参数

```python
for epoch in range(100):
    #前馈计算y_pred
    y_pred = model(x_data)
    #前馈计算损失loss
    loss = criterion(y_pred,y_data)
    #打印调用loss时，会自动调用内部__str__()函数，避免产生计算图
    print(epoch,loss)
    #梯度清零
    optimizer.zero_grad()
    #梯度反向传播，计算图清除
    loss.backward()
    #根据传播的梯度以及学习率更新参数
    optimizer.step()
```

### **测试模型**

```python
#Output
print('w = ', model.linear.weight.item())
print('b = ', model.linear.bias.item())

#TestModel
x_test = torch.Tensor([[4.0]])
y_test = model(x_test)

print('y_pred = ',y_test.data)
```

![训练1000轮](https://user-images.githubusercontent.com/4729226/191688736-5a5ffaa9-f5b9-470a-9062-223b37b5e772.png)



### **整体代码**

```python
import torch
#数据作为矩阵参与Tensor计算
x_data = torch.Tensor([[1.0],[2.0],[3.0]])
y_data = torch.Tensor([[2.0],[4.0],[6.0]])

#固定继承于Module
class LinearModel(torch.nn.Module):
    #构造函数初始化
    def __init__(self):
        #调用父类的init
        super(LinearModel, self).__init__()
        #Linear对象包括weight(w)以及bias(b)两个成员张量
        self.linear = torch.nn.Linear(1,1)

    #前馈函数forward，对父类函数中的overwrite
    def forward(self, x):
        #调用linear中的call()，以利用父类forward()计算wx+b
        y_pred = self.linear(x)
        return y_pred
    #反馈函数backward由module自动根据计算图生成
model = LinearModel()

#构造的criterion对象所接受的参数为（y',y）
criterion = torch.nn.MSELoss(size_average=False)
#model.parameters()用于检查模型中所能进行优化的张量
#learningrate(lr)表学习率，可以统一也可以不统一
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for epoch in range(1000):
    #前馈计算y_pred
    y_pred = model(x_data)
    #前馈计算损失loss
    loss = criterion(y_pred,y_data)
    #打印调用loss时，会自动调用内部__str__()函数，避免产生计算图
    print(epoch,loss)
    #梯度清零
    optimizer.zero_grad()
    #梯度反向传播，计算图清除
    loss.backward()
    #根据传播的梯度以及学习率更新参数
    optimizer.step()

 #Output
print('w = ', model.linear.weight.item())
print('b = ', model.linear.bias.item())

#TestModel
x_test = torch.Tensor([[4.0]])
y_test = model(x_test)

print('y_pred = ',y_test.data)
```







本文参考自[B站《PyTorch深度学习实践》P5](https://www.bilibili.com/video/BV1Y7411d7Ys?p=5)

