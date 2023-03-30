---
layout: post
title: pytorch学习16-transformer流量预测
categories: pytorch
tags: AI
---





### **前言**

前文提到，2017年Google机器翻译团队次发表论文[《Attention Is All You Need》](https://arxiv.org/abs/1706.03762)详细介绍了注意力机制，并在近年广泛的应用在深度学习中的各个领域。都到注意力机制了，自然也要聊聊变形金刚——transformer。





正如论文的题目所说的，transformer中抛弃了传统的CNN和RNN，整个网络结构完全是由attention机制组成。更准确地讲，transformer由且仅由multi-head attenion和feed-forward network（外加残差连接和Layer Norm）组成。一个基于transformer的可训练的神经网络可以通过堆叠编码器和解码器的形式进行搭建，作者的实验是通过搭建编码器和解码器各6层，总共12层的encoder-decoder，并在机器翻译中取得了BLEU值新高。

<img width="485" alt="transformer_network" src="https://user-images.githubusercontent.com/4729226/210315774-7b333f3b-2f45-44e5-a749-6caf59b71a01.png">

作者采用attention机制的原因是考虑到RNN（或者LSTM，GRU等）的计算限制为是顺序的，也就是说RNN相关算法只能从左向右依次计算或者从右向左依次计算，这种机制带来了两个问题：

1. 时间片 t 的计算依赖 t−1 时刻的计算结果，这样限制了模型的并行能力；
2. 顺序计算的过程中信息会丢失，尽管LSTM等门机制的结构一定程度上缓解了长期依赖的问题，但是对于特别长期的依赖现象，LSTM依旧无能为力。

transformer解决了上面两个问题，首先它使用了attention机制，将序列中的任意两个位置之间的距离是缩小为一个常量；其次它不是类似RNN的顺序结构，因此具有更好的并行性，符合现有的GPU框架。论文原文给出transformer的定义是：

> Transformer is the first transduction model relying entirely on self-attention to compute representations of its input and output without using sequence aligned RNNs or convolution。



### **基于transformer的流量预测**

在这里并不会讲transformer实现细节，网络上类似教程很多，pytorch同样也有实现，直接调包就行。这里主要说一下transformer在流量预测中，或者说时间序列预测任务中需要注意的点。

#### **单步预测**

在时间序列预测中，标准的transformer模型的自回归解码不可避免地会引入巨大的累积误差。一个方法是将输入维度由1改为144（即6 \* 24），输出维度也相应改为144，即一天的数据量。这样仅仅是增大训练的数据量就行了

#### **Positional Encoding**

transformer为了并行，不会学习时间依赖关系，也就是时间序列的自相关性。为了解决这个问题，必须将每个特征的位置信息添加到输入中。这样，自注意力将具有给定时间戳和当前时间戳之间的相对距离的上下文，作为自注意力相关性的重要指标。

在流量预测中，位置编码实现如下：时间戳被表示为三个元素——天、小时和分钟，这是因为流量数据基本是以天为周期循环，并且数据集每10分钟更新一次。为了如实地表示每个数据类型，每个元素被分解为正弦分量和余弦分量。这样，23点和1点在空间上很接近，就像这两个小时在时间上很接近一样。同样的概念也适用于分钟和天，所有元素都是循环表示的。

![微信截图_20230103143710](https://user-images.githubusercontent.com/4729226/210310176-6b27a876-cbf4-41c5-8143-958796a7cffb.png)

```python
# 时间戳位置编码,参数为datetime对象
def position_encoding(datetime):
    position = {}
    # month = datetime.month
    day = datetime.day
    hour = datetime.hour
    minute = datetime.minute

    # months_in_year = 12
    days_in_month = 30
    hours_in_day = 24
    mins_in_hour = 60

    # position['sin_month'] = np.sin(2*np.pi*month/months_in_year)
    # position['cos_month'] = np.cos(2*np.pi*month/months_in_year)
    position['sin_day'] = np.sin(2*np.pi*day/days_in_month)
    position['cos_day'] = np.cos(2*np.pi*day/days_in_month)
    position['sin_hour'] = np.sin(2*np.pi*hour/hours_in_day)
    position['cos_hour'] = np.cos(2*np.pi*hour/hours_in_day)
    position['sin_minute'] = np.sin(2*np.pi*minute/mins_in_hour)
    position['cos_minute'] = np.cos(2*np.pi*minute/mins_in_hour)

    return position
```



### **训练**

实验中使用与加入注意力机制的seq2seq模型相同的超参数，transformer训练结果无论是拟合度还是最低loss都要差一个数量级，这个结果也很有意思。

![vs](https://user-images.githubusercontent.com/4729226/210317094-663d66e0-5fc9-4bf2-be92-1bed1f57a538.png)



### **总结**

1. 深度学习，或者说机器学习的“天下没有免费的午餐”定理，即不存在一种确切的模型在所有数据集上均表现很好。transformer即使横扫NLP领域，没想到在流量预测这个case翻车。
2. 直接抛弃RNN和CNN虽然非常cool，但是它也使模型丧失了捕捉序列特征的能力，RNN + attention的seq2seq模型可能会带来更好的效果。 
3. transformer失去的位置(时间)信息其实在时序数据中非常重要，而论文中在特征向量中加入Positional Encoding也只是一个权宜之计，并没有改变transformer结构上的固有缺陷。
