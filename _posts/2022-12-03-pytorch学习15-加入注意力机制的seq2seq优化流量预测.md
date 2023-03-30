---
layout: post
title: pytorch学习15-加入注意力机制的seq2seq优化流量预测
categories: pytorch
tags: AI
---







seq2seq序列到序列模型，是从一个序列生成另外一个序列。 它涉及两个过程：一个是理解前一个序列的编码器，另一个是用理解到的内容来生成新的序列的解码器。至于序列所采用的模型可以是RNN，LSTM，GRU，其它序列模型等。上述的过程和我们大脑理解东西的过程很相似，`听到一句话，理解之后，尝试组装答案，进行回答`，一般用于机器翻译等NLP领域。当然用来优化我们的流量预测模型也是没问题的。

![seq2seq](https://user-images.githubusercontent.com/4729226/209892572-2be0b459-5b51-4c8e-8e49-9f64953a246a.png)



### **seq2seq的不足**

其他部分和直接用RNN建模区别不大，缺点还是比较明显的。由于context包含原始序列中的所有信息，它的长度就成了限制模型性能的瓶颈。除此之外，如果按照上述方式实现，只用到了编码器的最后一个隐层状态，信息利用率低下。另一方面RNN解码器根据context 生成输出目标序列， 然而，并非所有输入都对解码具有相同的贡献度，比如明天的预测流量可能受前1天的影响最大，受7天前影响最小 。 有什么方法能改变上下文变量context呢？ 答案就是注意力机制。



### **注意力机制**

Attention机制最早由Google机器学习团队于2014年提出，2017年Google机器翻译团队再次发表论文[《Attention Is All You Need》](https://arxiv.org/abs/1706.03762)详细介绍了注意力机制，并在近年广泛的应用在深度学习中的各个领域，比如大名鼎鼎的Transformer、BERT。

简单理解，注意力即权重，权重就是注意力，注意力机制就是一个加权求和的计算过程。其中一种计算缩放点积注意力的公式如下：

![attention](https://user-images.githubusercontent.com/4729226/205429606-713bc74e-047c-4f87-8da6-2a13226a2413.png)

其中Q是query，K是key，V是value，dk为k的维度(由于Q和K长度相等，也等于Q的维度)。计算过程如下：

1. 根据query和key计算两者的相似性或相关性，常见方法有求两者的向量点积、求两者cosine相似度、引入额外的神经网络来求值。
2. 对步骤1的原始分值进行softmax归一化处理后得到权重
3. 根据权重系数对value进行加权求和



### **注意力实现**

缩放点积注意力的实现就是套入上述公式计算，使用了dropout进行模型正则化。

```python
class DotProductAttention(torch.nn.Module):
    """缩放点积注意力机制"""
    def __init__(self, dropout, **kwargs):
        super(DotProductAttention, self).__init__(**kwargs)
        self.dropout = torch.nn.Dropout(dropout)

    # queries的形状：(batch_size，查询的个数，d)
    # keys的形状：(batch_size，键－值对的个数，d)
    # values的形状：(batch_size，键－值对的个数，值的维度)
    def forward(self, queries, keys, values):
        dk = keys.shape[-1]
        scores = torch.bmm(queries, keys.transpose(1,2)) / (dk**0.5)
        self.attention_weights = torch.nn.functional.softmax(scores, dim=-1)
        return torch.bmm(self.dropout(self.attention_weights), values)
```



### **编码器**

编码器将长度可变的输入序列转换成 形状固定的上下文变量c， 并且将输入序列的信息在该上下文变量中进行编码。实现中使用最后一个时间步的隐状态hidden即可，其shape为(num_layers, batch_size, hidden_size)

```python
class Seq2SeqEncoder(Encoder):
    def __init__(self, input_size, hidden_size, num_layers, dropout=0, **kwargs):
        super().__init__()
        self.gru = torch.nn.GRU(input_size=input_size, hidden_size=hidden_size,
                                num_layers=num_layers, dropout=dropout, batch_first=True)

    def forward(self, x, *args):
        output, hidden = self.gru(x)
        return output, hidden
```



### **解码器**

当实现解码器时， 我们直接使用编码器最后一个时间步的隐状态来初始化解码器的隐状态。 这就要求使用RNN实现的编码器和解码器具有相同数量的层和隐藏单元。

编码器在所有时间步的最终层隐状态，将作为注意力的k和v。

在每个解码时间步骤中，解码器上一个时间步的最终层隐状态将用作q，实现中为了简单只预测一个时间步，所以使用编码器的最后时间步最终层隐状态。

为了进一步包含经过编码的输入序列的信息，注意力输出和解码器输入进行拼接（concat）作为解码器输入。在最后时刻输出的隐藏状态hidden的基础上，使用一个全连接层得到预测输出。

```python
# add attention
class Seq2SeqDecoder(Decoder):
    def __init__(self, input_size, hidden_size, output_size, num_layers, dropout=0, **kwargs):
        super().__init__()
        self.gru = torch.nn.GRU(input_size=input_size+hidden_size,
                                hidden_size=hidden_size, num_layers=num_layers, dropout=dropout, batch_first=True)
        self.attention = DotProductAttention(dropout=dropout)
        self.relu = torch.nn.ReLU()
        self.linear1 = torch.nn.Linear(hidden_size, 1024)
        self.linear2 = torch.nn.Linear(1024, output_size)

    def init_hidden(self, enc_outputs, *args):
        outputs, hidden_state = enc_outputs
        return outputs, hidden_state

    def forward(self, x, hidden):
        # enc_output.shape(b,s,h)    hidden_state.shape(num_layer,b,h)
        enc_output, hidden_state = hidden
        # 编码器最终时间步的全层隐状态，将作为初始化解码器的隐状态
        # 编码器在所有时间步的最终层隐状态，将作为注意力的k和v
        # 解码器上一个时间步的最终层隐状态将用作q
        # for i in x:
        query = torch.unsqueeze(hidden_state[-1], dim=1)   # query.shape(b,1,h)
        # context.shape(b,1,h)
        context = self.attention(query, enc_output, enc_output)
        att_context = context.repeat(1, x.shape[1], 1)      # shape(b,s,h)
        x_and_context = torch.cat((x, att_context), dim=2)  # shape(b,s,i+h)
        output, hidden_state = self.gru(x_and_context, hidden_state)
        output = output[:, -1, :]
        output = self.linear1(self.relu(output))
        output = self.linear2(self.relu(output))
        self._attention_weights = self.attention.attention_weights
        return output, hidden_state

    @property
    def attention_weights(self):
        return self._attention_weights
```



### **整体代码**

```python
import datetime
import copy
import os
import torch
import numpy as np
import matplotlib.pyplot as plt
from torch.utils.data import Dataset
from torch.utils.data import DataLoader
from django.db.models.query import QuerySet
from .models import ThpDataset
from .coder import Encoder, Decoder

# plt.style.use('seaborn-whitegrid')
# 显示中文
plt.rcParams['font.sans-serif'] = 'SimHei'
plt.rcParams['axes.unicode_minus'] = False

# Seq2Seq模型参数
DAY_SIZE = 142
INPUT_SIZE = DAY_SIZE*12
HIDDEN_SIZE = 2048
NUM_HEADS = 8
MID_SIZE = 1024
OUTPUT_SIZE = DAY_SIZE*1
SEQ_LEN = 7
NUM_LAYERS = 3
DROPOUT = 0.1

# Seq2Seq训练参数
EPOCH = 1000
LR = 0.001
BATCH_SIZE = 16

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')


class DotProductAttention(torch.nn.Module):
    """缩放点积注意力机制"""

    def __init__(self, dropout, **kwargs):
        super(DotProductAttention, self).__init__(**kwargs)
        self.dropout = torch.nn.Dropout(dropout)

    # queries的形状：(batch_size，查询的个数，d)
    # keys的形状：(batch_size，键－值对的个数，d)
    # values的形状：(batch_size，键－值对的个数，值的维度)
    def forward(self, queries, keys, values):
        dk = keys.shape[-1]
        scores = torch.bmm(queries, keys.transpose(1, 2)) / (dk**0.5)
        self.attention_weights = torch.nn.functional.softmax(scores, dim=-1)
        return torch.bmm(self.dropout(self.attention_weights), values)


class Seq2SeqEncoder(Encoder):
    def __init__(self, input_size, hidden_size, num_layers, dropout=0, **kwargs):
        super().__init__(**kwargs)
        self.gru = torch.nn.GRU(input_size=input_size, hidden_size=hidden_size,
                                num_layers=num_layers, dropout=dropout, batch_first=True)

    def forward(self, x, *args):
        output, hidden = self.gru(x)
        return output, hidden

# add multihead_attention
class Seq2SeqDecoder(Decoder):
    def __init__(self, input_size, hidden_size, output_size, num_layers, dropout=0, **kwargs):
        super().__init__(**kwargs)
        self.gru = torch.nn.GRU(input_size=input_size+hidden_size,
                                hidden_size=hidden_size, num_layers=num_layers, dropout=dropout, batch_first=True)
        self.attention = torch.nn.MultiheadAttention(
            hidden_size, num_heads=NUM_HEADS, dropout=dropout, batch_first=True)
        self.relu = torch.nn.ReLU()
        self.linear1 = torch.nn.Linear(hidden_size, MID_SIZE)
        self.linear2 = torch.nn.Linear(MID_SIZE, output_size)

    def init_hidden(self, enc_outputs, *args):
        outputs, hidden_state = enc_outputs
        return outputs, hidden_state

    def forward(self, x, hidden):
        # enc_output.shape(b,s,h)    hidden_state.shape(num_layer,b,h)
        enc_output, hidden_state = hidden
        # 编码器最终时间步的全层隐状态，将作为初始化解码器的隐状态
        # 编码器在所有时间步的最终层隐状态，将作为注意力的k和v
        # 解码器上一个时间步的最终层隐状态将用作q
        # for i in x:
        query = torch.unsqueeze(hidden_state[-1], dim=1)   # query.shape(b,1,h)

        context, attention_weights = self.attention(
            query, enc_output, enc_output)  # shape(b,1,h)
        att_context = context.repeat(1, x.shape[1], 1)      # 广播成shape(b,s,h)
        x_and_context = torch.cat((x, att_context), dim=-1)  # shape(b,s,i+h)
        output, hidden_state = self.gru(x_and_context, hidden_state)
        output = output[:, -1, :]
        output = self.linear1(self.relu(output))
        output = self.linear2(self.relu(output))
        self._attention_weights = attention_weights
        return output, hidden_state

    @property
    def attention_weights(self):
        return self._attention_weights


class EncoderDecoder(torch.nn.Module):
    """编码器-解码器架构的基类"""

    def __init__(self, encoder, decoder, **kwargs):
        super(EncoderDecoder, self).__init__(**kwargs)
        self.encoder = encoder
        self.decoder = decoder

    def forward(self, enc_x, dec_x, *args):
        enc_outputs = self.encoder(enc_x, *args)
        dec_hidden = self.decoder.init_hidden(enc_outputs, *args)
        return self.decoder(dec_x, dec_hidden)


# 时间戳位置编码
def position_encoding(datetime):
    position = {}
    day = datetime.day
    hour = datetime.hour
    minute = datetime.minute

    days_in_month = 30
    hours_in_day = 24
    mins_in_hour = 60

    position['sin_day'] = np.sin(2*np.pi*day/days_in_month)
    position['cos_day'] = np.cos(2*np.pi*day/days_in_month)
    position['sin_hour'] = np.sin(2*np.pi*hour/hours_in_day)
    position['cos_hour'] = np.cos(2*np.pi*hour/hours_in_day)
    position['sin_minute'] = np.sin(2*np.pi*minute/mins_in_hour)
    position['cos_minute'] = np.cos(2*np.pi*minute/mins_in_hour)

    return position


def load_data(thpdataset_lines, train=True):
    # 数据载入预处理
    assert isinstance(thpdataset_lines, (QuerySet, list)
                      ), '原始数据需传入QuerySet或list'
    # 组装原始数据，列表
    src_data = []
    for thpdataset_line in thpdataset_lines:
        position = position_encoding(thpdataset_line.created_at)
        src_data.append(thpdataset_line.device_num)
        src_data.append(thpdataset_line.dxcc_usage)
        src_data.append(thpdataset_line.thp_2)
        src_data.append(thpdataset_line.thp_1)
        src_data.append(position['sin_day'])
        src_data.append(position['cos_day'])
        src_data.append(position['sin_hour'])
        src_data.append(position['cos_hour'])
        src_data.append(position['sin_minute'])
        src_data.append(position['cos_minute'])
        src_data.append(thpdataset_line.mean_thp)
        src_data.append(thpdataset_line.thp)

    # 列表转换为数组
    np_data = np.array(src_data, dtype=np.float32)
    feature_names = ['device_num', 'dxcc_usage', 'thp_2', 'thp_1', 'sin_day',
                     'cos_day', 'sin_hour', 'cos_hour', 'sin_minute', 'cos_minute', 'mean_thp', 'thp']

    # 一维数组转换为矩阵, N行12列
    np_data = np_data.reshape(-1, len(feature_names))
    np_data = np_data[-(np_data.shape[0]//DAY_SIZE)*DAY_SIZE:]  # 取整

    if train:
        # 计算训练数据集的最大最小值
        max, min = np_data.max(axis=0), np_data.min(axis=0)
        # 记录训练数据的归一化参数，在预测时对数据做反归一化
        np.savez('deeplearn/st_train_param.npz', max=max, min=min)
        # 对数据进行归一化处理
        np_data = (np_data - min) / (max - min)
        # 转换为 (n,142*12)
        np_data = np_data.reshape(-1, INPUT_SIZE)
        # 划分训练测试集
        offset = len(np_data)
        train_data, test_data = np_data[:offset-1], np_data[offset-8:]

        return train_data, test_data, max, min
    else:
        # 加载训练数据的最大最小值
        seq2seq_train_param = np.load('deeplearn/st_train_param.npz')
        max, min = seq2seq_train_param['max'], seq2seq_train_param['min']
        # 对数据进行归一化处理
        np_data = (np_data - min) / (max - min)
        np_data = np_data.reshape(-1, INPUT_SIZE)

        return np_data, max, min


class Seq2SeqTrainDataset(Dataset):
    def __init__(self, np_data):
        # 生成序列数据
        x, y = self.extract_data(np_data)

        self.x_data = torch.from_numpy(x)  # shape(n, seq_len, INPUT_SIZE)
        self.y_data = torch.from_numpy(
            y).reshape(-1, OUTPUT_SIZE)  # shape(n, OUTPUT_SIZE)

        # 获得reshape后数据集行数n, 即batch_size
        self.len = self.x_data.shape[0]

    @staticmethod
    def extract_data(np_data, seq_len=SEQ_LEN):
        x, y = [], []
        for i in range(len(np_data) - seq_len):
            x.append(np_data[i:i+seq_len])
            y.append(np_data[i+seq_len])
        x = np.array(x)
        y = np.array(y).reshape(-1, OUTPUT_SIZE, 12)[:, :, [-1]]  # 取流量那一列作为标签
        return x, y

    # 获得索引方法
    def __getitem__(self, index):
        return self.x_data[index], self.y_data[index]

    # 获得数据集长度
    def __len__(self):
        return self.len


# 模型
encoder = Seq2SeqEncoder(INPUT_SIZE, HIDDEN_SIZE, NUM_LAYERS, DROPOUT)
decoder = Seq2SeqDecoder(INPUT_SIZE, HIDDEN_SIZE,
                         OUTPUT_SIZE, NUM_LAYERS, DROPOUT)
model = EncoderDecoder(encoder, decoder)
# 损失函数
criterion = torch.nn.MSELoss()
# 优化器
optimizer = torch.optim.Adam(model.parameters(), lr=LR)
# 学习率调整器 adam不需手动调整学习率
# scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
#     optimizer=optimizer, verbose=True)


def train():
    # 读取训练数据并划分训练集和测试集
    now = datetime.datetime.now()
    start = now - datetime.timedelta(days=60)
    thpdataset_lines = ThpDataset.objects.filter(
        created_at__gte=start, created_at__lte=now, perf_name='水土')

    train_data, test_data, max, min = load_data(thpdataset_lines, train=True)

    train_dataset = Seq2SeqTrainDataset(train_data)
    test_dataset = Seq2SeqTrainDataset(test_data)

    train_loader = DataLoader(
        dataset=train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=4, pin_memory=True)
    test_loader = DataLoader(dataset=test_dataset,
                             batch_size=BATCH_SIZE, shuffle=False, num_workers=4, pin_memory=True)

    print(f"[{now.strftime('%Y-%m-%d %H:%M:%S')}]水土训练开始, 训练集长度为:{len(train_dataset)}, 测试集长度为:{len(test_dataset)}")

    if os.path.exists('deeplearn/st_model_param.pkl'):
        model.load_state_dict(torch.load('deeplearn/st_model_param.pkl'))

    train_loss_list, test_loss_list = [], []
    best_loss = 1
    best_model_state = None
    model.to(device)
    x, y = test_dataset[:]
    x, y = x.to(device), y.to(device)
    for epoch in range(EPOCH):
        model.train()
        train_loss = 0
        for i, data in enumerate(train_loader, 0):
            # 准备数据dataloader会将按batch_size返回的数据整合成矩阵加载
            inputs, labels = data
            inputs, labels = inputs.to(device), labels.to(device)
            # 强制学习
            dec_inputs = inputs
            y_pred, _ = model(inputs, dec_inputs)
            loss = criterion(y_pred, labels)
            train_loss += loss.item()
            # if epoch % 10 == 0:
            #     print(epoch, i, loss.item())
            # 反向传播求梯度
            optimizer.zero_grad()
            loss.backward()
            # 更新
            optimizer.step()

        # train_loss /= len(train_loader)
        train_loss_list.append(train_loss)
        # 调整学习率
        # scheduler.step(train_loss)

        # 测试
        model.eval()
        with torch.no_grad():
            dec_inputs = x
            y_pred, _ = model(x, dec_inputs)
            test_loss = criterion(y_pred, y).item()

        test_loss_list.append(test_loss)

        # y_base = x.reshape(-1, SEQ_LEN, DAY_SIZE, 12)[:, -1, :, -1]  #上一天的流量
        # 得到最好那次的模型
        if test_loss < best_loss:
            best_loss = test_loss
            best_y_pred = y_pred
            best_model_state = copy.deepcopy(model.state_dict())
            attention_weights = model.decoder.attention_weights.cpu()

        if (epoch+1) % 100 == 0:
            print(
                f'epoch:{epoch+1}/{EPOCH}, train_loss:{train_loss}, test_loss:{test_loss}, best_loss:{best_loss:.4f}')

    # 保存模型参数
    if best_model_state is not None:
        torch.save(best_model_state, 'deeplearn/st_model_param.pkl')
        print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]水土模型保存完毕! attention_weights:{attention_weights}")
        # 对测试结果做反归一化处理
        best_y_pred = best_y_pred.cpu().numpy() * (max[-1] - min[-1]) + min[-1]
        y = y.cpu().numpy() * (max[-1] - min[-1]) + min[-1]

        best_y_pred = best_y_pred*8/1000/1000/1000
        y = y*8/1000/1000/1000

        plt.subplot(2, 1, 1)
        plt.grid(True)
        plt.title('水土训练数据')
        plt.plot(y.flatten(), label='真实流量')
        plt.plot(best_y_pred.flatten(), label='预测流量')
        plt.ylabel('流量,Gb/s')
        plt.legend()

        plt.subplot(2, 1, 2)
        plt.grid(True)
        plt.plot(train_loss_list, label='train_loss')
        plt.plot(test_loss_list, label='test_loss')
        plt.ylabel('损失值')
        plt.legend()

        plt.savefig('deeplearn/st_test.png')
        plt.close()

    else:
        print('本次训练没有得到更新!')

```



最后打印attention权重，可以看出明天的预测流量受前1天数据影响的权重最大，7天前的最小，这也和实际情况相符。

![image-20221203155736556](https://user-images.githubusercontent.com/4729226/205431015-08ed9515-b5b8-45d5-bcac-a961a368ffd8.png)
