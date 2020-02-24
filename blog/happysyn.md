# 个人项目 Happy Synthesizer 总结

## 灵感

所谓的 synthesizer 是音乐领域中的“合成器”，它扮演的角色是在音乐制作中，通过连接一系列输入输出和调整参数制造独特的音色。使用传统合成器合成音色的典型流程包括：通过振荡器产生基本波形（如正弦波、锯齿波、矩形波等），基本波形的加减合成、调制（调幅调频）。外行想要使用传统合成器制作自己想要的音色几乎是不可能的，因为一大堆参数面板实在太过于不直观，无法下手。

作为一个外行，我想要是存在一种更加直观的方式就好了，比如用画笔直接绘制波形来制作声音。使用者能够感受到线条与声音的对应关系，应该会非常有趣。因此我制作了 Happy Synthesizer 这一个 web app

## 主要逻辑

<img src="https://yuzhanchen.github.io/img/Snipaste_2020-02-23_19-56-34.png" alt="主要逻辑示意图" style="zoom: 67%;" />

如图所示，前端包括弹奏和绘画两个页面。当用户首次打开网页时，将定位到弹奏页面并从后端获取一个默认音色。用户可以移动到绘画页面，使用鼠标绘制曲线，点击提交，然后返回绘画页面即可获得自己绘制的音色并弹奏。

后端为运行了 Nginx 服务和 uWsgi 服务的 VPS，Nginx 服务负责维护静态资源和反向代理，uWsgi 服务负责利用 Python 的 numpy  库和 wave 库处理曲线数据并制作相应的音频文件。

## 涉及技术总结

### 前端

前端使用 Vue 框架进行模块化构建。包括弹奏页面和绘画页面

#### 弹奏页面

利用 SVG 实现了一个网页钢琴键盘。

![网页钢琴键盘](https://yuzhanchen.github.io/img/Snipaste_2020-02-23_20-17-30.png)

之所以使用 SVG 是因为一方面我可以利用 Adobe illustrator 方便地绘制我需要的图形，导出为 SVG 元素，并直接嵌入到HTML页面中。另一方面 ，与 Canvas 不同，SVG 基于 XML，这意味着 SVG DOM 中的每个元素都是可用的，我可以给任何元素添加 id、属性，可以用CSS控制其样式，可以用 JavaScript 进行各种 DOM 操作。缺点是当元素过多时会拖累性能，所幸我的应用足够简陋，应该没有这方面的担忧。

上图中每一个钢琴键都是 <svg> 元素下的一个 <path> 子元素。我为每一个 <path> 元素添加了 mousedown, mouseup, mouseenter, mouseleave 事件处理器，实现了鼠标弹奏钢琴的功能。

Tone.js 是一个 WebAudio 框架，它实现了许多类似 DAW（Digital Audio Workstation） 的功能，例如合成器、采样器、常用效果器等。在这里我使用了 Tone.js 的采样器功能：接受一个固定音高的音频文件作为采样，在钢琴键盘触发不同音高的音符时，采样器将以不同的音高将采样播放出来。

#### 绘画页面

绘画页面同样使用了 SVG，实现了简易的网页画板功能。

![网页画板](https://yuzhanchen.github.io/img/Snipaste_2020-02-23_20-17-39.png)

页面中央是一块小黑板。用户可以用鼠标绘制白色线条。具体实现方法是在用户 mousedown 事件发生时向 SVG 元素中增加一个 <polyline> 元素并初始化 points 属性，之后在用户 mousemove 事件发生时向 points 属性中增加数据，使曲线跟着鼠标生长。顺便记得将 mousemove 的 x, y 数据存放在两个数组里，之后用户点击提交时要 POST 给后端服务器。

### 后端

后端 Nginx 服务器负责静态资源与反向代理，笔者只是照着手册进行了配置，并没有深入了解。

uWSGI 也是一个Web服务器，它实现了WSGI、uwsgi、http 等协议。之所以要使用这个服务器是因为我需要用Python 进行曲线数据的处理和制作音频文件，uWSGI 可以将接受到的 http 请求转换为 wsgi 或 uwsgi 协议，使其能够被Python Web 程序处理。在这里我使用了 Django 这一 Python Web 框架，加上numpy和wave库来实现我需要功能。

总结一下，当用户向后端 POST 曲线数据时，http 请求首先到达 Nginx 服务器，然后 Nginx 服务器将请求转发给 uWSGI 服务器，然后 uWSGI 将 http 协议的请求转换为 uwsgi 协议并交给 Python 程序处理。而 Python 程序是使用 Django 框架加 numpy 库和 wave 库编写的，功能是从网络请求中取出需要的x, y 曲线数据（已经与前端约定好格式），然后使用 numpy 进行数据处理，使用 wave 来写入音频文件。最终得到的音频文件被存在 Nginx 管理的静态资源目录中，前端可以在弹奏页面请求到这个音频文件。

以下将要介绍后端进行数据处理与音频文件制作的一些小小细节。

### 曲线数据预处理

我们可以用一系列点的集合来描述一条曲线：

```typescript
// x, y 为长度相等的一维数组
interface curve {
	x : number[];
	y : number[];
}
```

将曲线在时间轴上重复若干次，就可以将其视作音频波形：

![波形示意图](https://yuzhanchen.github.io/img/Snipaste_2020-02-23_16-07-46.png)

为了能够进行曲线的重复操作，需要对前端提交的曲线数据进行了预处理，包括以下操作：

+ 切除曲线往回走的部分

![](https://yuzhanchen.github.io/img/Snipaste_2020-02-24_14-31-19.png)

+ 曲线首尾高度一致

![](https://yuzhanchen.github.io/img/Snipaste_2020-02-24_14-31-33.png)

+ 归一化、缩放、位移，使得曲线满足：

![](https://yuzhanchen.github.io/img/Snipaste_2020-02-24_14-41-55.png)

![](https://yuzhanchen.github.io/img/Snipaste_2020-02-24_14-31-45.png)

以上部分操作使用了 numpy 库。完成预处理完成后得到 y=f(x) 这个函数。之后进行写入音频文件的准备

### 音频文件（.wav）生成

#### .wav 文件头结构解析

WAV是一种音频文件格式，一般采用PCM编码，即对音频波形的直接采样存储。与MP3、AAC等格式不同，它不涉及任何压缩。

WAV 文件符合RIFF规范，其文件头结构描述如下：

```c++
// 文件以 chunk 划分, 每个 chunk 头部使用 8 byte 存放了该 chunk 的标识和大小
struct chunk
{
    char        id[4]; // chunk 标识
    uint32_t    size;  // chunk 大小
};
// 文件头部首先是一个 RIFFHeader，代表该文件符合 RIFF 规范，并表明了文件类型
struct RIFFHeader
{
    // chunk id 为 ”RIFF", size 为整个文件的大小减去 description 的大小
    chunk       descriptor;    
    // type 为 "WAVE"，表示该文件的类型
    char        type[4];        
};
// 紧接着是 WAVEHeader，主要存储了 WAVE 文件的音频编码格式信息
struct WAVEHeader
{
    // chunk id 为 “fmt"，chunk 大小根据需要而定
    chunk       descriptor;  
    uint16_t    audioFormat; 
    uint16_t    numChannels;
    uint32_t    sampleRate;
    uint32_t    byteRate;
    uint16_t    blockAlign;
    uint16_t    bitsPerSample;
    // 可能包含附加信息，可根据 chunk size 判断
};
// 之后是 DATAHeader, DATAHeader 之后紧接的就是音频数据了
struct DATAHeader
{
    // chunk id 为 “data"，size 为之后紧随的二进制数据的大小
    chunk       descriptor;
};
```

尽管事先调查清楚了WAV文件头的格式，但笔者并没有试图自己去写入，而是使用了 Python 的 Wave 模块。

#### .wav 文件音频二进制数据结构

关系到 .wav 文件音频二进制数据结构的格式参数包括：

+ 采样率（sample rate）：每秒采样多少给振幅数据。如 44100 Hz 即每秒包含 44100 个数据
+ 位深（bits per sample）：记录每个采样数据使用的数据类型的大小。一般是 8bit 或 16bit。如果是 8bit，数据类型一般是 uint8_t，而 16bit 一般是 int16_t
+ 声道数（num of channels）：一般是单声道或双声道

例如，一个 44100 Hz，16bit，双声道，时长1秒的音频文件，其音频二进制数据结构为：

| 采样#1 左声道 | 采样#1 右声道 | ...  | 采样#44100 右声道 | 采样#44100 右声道 |
| ------------- | ------------- | ---- | ----------------- | ----------------- |
| 16位整型数    | 16位整型数    | ...  | 16位整型数        | 16位整型数        |

#### 写入指定音高的音频二进制数据

音高可以用声波的频率表示。声波的频率是1秒内波形重复的次数。例如 "A4" 音高，对应频率为 440Hz。即将我们之前获得的曲线在一秒内重复440次。对于44100Hz采样率的音频，就是在44100个采样点内重复曲线440次。

```python
import numpy as np
import wave
import struct

def genWaveBinData(curveData, fileName):
    sampleRate = 44100  # 采样率
    channelCnt = 1  # 单声道
    bitsPerSample = 16  # 位深

    f = wave.open(fileName, 'wb')
    # 借助 wave 模块，设置好格式就可以自动写入文件头
    f.setnchannels(channelCnt)
    f.setsampwidth(bitsPerSample/8)
    f.setframerate(sampleRate)

    duration = 5  # 音频文件总时长
    freq = 440  # 音高

    # 曲线数据预处理
    waveData = prepocessCurve(curveData)

    totalBytes = sampleRate * bitsPerSample/8 * duration
    maxAmplitude = 2**15-1
    frameIndex = 0
    binData = b''

    while(totalBytes > 0):
        # phase 反复从 0 变化到 1，一秒钟（sampleRate 个采样）内反复 freq 次
        phase = (frameIndex * freq % sampleRate)/sampleRate
        # 线性插值，从 waveData 获得 [-1，1] 范围的 amplitudeRatio
        amplitudeRatio = np.interp(
            phase*2-1, waveData['x'], waveData['y'], waveData['y'][0], waveData['y'][-1])
        # amplitudeRatio * maxAmplitude 就是要写入的采样数据值
        # 使用 struct 模块，将数值转换为小端序字节码
        binData += struct.pack("<h", amplitudeRatio*maxAmplitude)
        frameIndex += 1
        totalBytes -= bitsPerSample/8
        
    f.writeframes(binData) # 写入音频二进制数据
    f.close()

```



