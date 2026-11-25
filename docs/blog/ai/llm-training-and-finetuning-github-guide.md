---
title: 想学大模型训练和微调？GitHub 上这 5 个高星项目够你啃很久了
description: 整理了 GitHub 上 5 个高 Star、经得起检验的大模型开源项目，按“从零手写预训练”和“基座模型微调”两条路线拆解，帮你少走弯路。
date: 2026-11-24
category: AI 与大模型
color: '#8b5cf6'
readTime: 10 min
tags: ['大模型', 'LLM', '微调', 'PyTorch', 'GitHub', '开源项目']
---

# 想学大模型训练和微调？GitHub 上这 5 个高星项目够你啃很久了

想学大模型训练或者微调的人很多，但真正跑通第一个实验的人其实不多。

原因挺现实的。你在网上随便一搜，迎面撞上的要么是几十个小时的纯理论课，听完连一行代码都没写；要么是某个几年前的老仓库，依赖早就报错跑不起来；再不然就是一上来让你准备八卡 A100，普通开发者看一眼配置单就直接关网页了。

我自己折腾过一圈之后，发现最容易让人迷路的地方，其实是把两件完全不同的事混在了一起：

- 一件事是**从 0 到 1 写一个大模型**，重点是搞明白分词、注意力机制、预训练和对齐到底在算什么。
- 另一件事是**拿现成的开源基座做微调**，重点是用 Qwen、Llama、DeepSeek 这些已经很强的模型，喂给它你自己的业务数据，让它听你的话。

这两条路用的工具、需要的算力、花的时间完全不一样。下面这 5 个项目都是 GitHub 上 Star 数极高、社区反复验证过的硬货，我按这两条路线拆开聊，你可以直接按自己的需求挑一个开干。

---

## 第一条路：从 0 到 1 手写并预训练（搞懂底层原理）

如果你不想只停留在调 API 的阶段，想知道 Transformer 里的矩阵到底怎么乘、Loss 是怎么一步步降下去的，看下面这三个项目就够了。

### 1. rasbt/LLMs-from-scratch

GitHub 地址：<https://github.com/rasbt/LLMs-from-scratch>（105k+ Stars）

这个仓库的作者是 Sebastian Raschka，也是《Build a Large Language Model (From Scratch)》这本书的作者。如果你在 GitHub 上只打算精读一个大模型教学项目，我个人最推荐这个。

它全篇用纯 PyTorch 手写，没有套任何黑盒框架。你可以顺着它的章节，从最基础的文本编码和 Tokenizer 写起，自己搭注意力机制和 Transformer Block，接着加载权重、做预训练、做指令微调（SFT），一直写到人类偏好对齐（DPO）。

它最大的好处是克制。每一步都有配套的 Jupyter Notebook 和结构图，把公式直接翻译成了能跑的 Python 代码。读完一遍再亲手跑一遍，大模型在你眼里就不再是什么玄学，而是一堆清清楚楚的张量运算。

### 2. jingyaogong/minimind

GitHub 地址：<https://github.com/jingyaogong/minimind>（68k+ Stars）

很多人看完理论还是手痒，想亲手从零训一个属于自己的模型，但卡在没算力。MiniMind 解决的就是这个问题。

它把模型参数压到了 26M 到 104M 左右。体量小，但完整流程一点没省：数据清洗、预训练（Pretrain）、指令微调（SFT）、LoRA、DPO 对齐全都在里面，后面作者还加了 MoE 混合专家架构和多模态分支。全中文文档，代码注释也写得很细。

用一张普通的消费级显卡（比如 RTX 3090 或 4090），或者去云平台花几块钱租张卡，大概 3 个小时就能跑完全程。实话讲，几十兆参数的模型肯定聊不出什么深度，偶尔还会胡言乱语。但当你盯着屏幕，亲眼看着一堆随机初始化的权重从输出乱码变成能正常说人话，那种对训练流程的体感，看十篇论文都换不来。

### 3. karpathy/nanoGPT

GitHub 地址：<https://github.com/karpathy/nanoGPT>（53k+ Stars）

作者是 Andrej Karpathy，前 OpenAI 联合创始人、前特斯拉 AI 总监。

这个项目的代码干净得有点过分。核心逻辑就两个文件，`model.py` 和 `train.py`，加起来没多少行，就把 GPT-2 级别的训练和微调逻辑完整复刻了出来。

如果你讨厌层层封装的工程框架，就想看最纯粹的实现，直接看 nanoGPT。最好配合他在 YouTube 上的那期长视频《Let's build GPT: from scratch, in code, spelled out.》一起看，边敲代码边听他拆解每一步为什么这么写，效率很高。

---

## 第二条路：对开源基座做微调（工程落地与业务实战）

说实话，大多数做业务开发的同学，根本没必要从零预训练一个模型。开源社区已经把 Qwen 2.5、Llama 3、DeepSeek 这些好底子摆在桌上了，我们要做的，是拿自己的私有数据去调教它们。

这块目前有两个项目基本把生态占满了。

### 4. hiyouga/LLaMA-Factory

GitHub 地址：<https://github.com/hiyouga/LLaMA-Factory>（67k+ Stars）

如果你要在国内做大模型微调，绕不开 LLaMA-Factory。

它支持的模型超过 100 种，市面上常见的大语言模型和多模态模型基本都覆盖了，像 Qwen、DeepSeek、LLaMA、Mistral、ChatGLM 拿来就能用。微调和对齐方法也给得很全，全参数微调、Freeze、LoRA、QLoRA、DoRA，以及 DPO、PPO、ORPO、KTO 都在里面。

它对新手最友好的一点，是自带了一个叫 LLaMA Board 的网页界面。你不用一上来就啃复杂的训练脚本，在浏览器里选好基座模型、配好数据集、调一下学习率和 Batch Size，点一下按钮就能开始训练并实时看 Loss 曲线。等你摸熟了，需要上多卡集群跑大任务，再切回命令行配置就行。

### 5. unslothai/unsloth

GitHub 地址：<https://github.com/unslothai/unsloth>（52k+ Stars）

微调大模型最常遇到的报错是什么？十有八九是显存炸了（CUDA Out of Memory）。

Unsloth 专门治这个病。团队自己手写了底层的 Triton 算子，重写了部分反向传播逻辑。对比标准的 HuggingFace 微调流程，它能把训练速度拉快 2 到 5 倍，显存占用最高能压掉 80%。

这意味着什么？意味着你手里那张 16G 或 24G 显存的消费级显卡，也能顺畅微调 8B、14B 的模型，用 QLoRA 甚至能硬啃 70B。如果你本地连显卡都没有，他们官方维护了几十个 Google Colab 和 Kaggle 的免费 Notebook，点开就能白嫖算力跑一遍 Llama 3 或 Qwen 的微调。

---

## 到底怎么选？

五个项目放在一起，其实边界非常清楚，对照自己的情况选就行：

| 你现在的状态 | 建议先看 | 原因 |
| :--- | :--- | :--- |
| 想彻底搞懂 Transformer 底层原理和代码 | `rasbt/LLMs-from-scratch` | 纯 PyTorch 教学，步骤最细，像一本能跑的教科书 |
| 算力有限，想花几小时亲手训一个完整模型 | `jingyaogong/minimind` | 单卡就能跑完预训练到 DPO 全流程，中文注释全 |
| 喜欢极简代码，想配合经典视频啃核心实现 | `karpathy/nanoGPT` | 两个核心文件讲透 GPT-2，零冗余封装 |
| 手头有业务数据，想直接微调 Qwen/DeepSeek | `hiyouga/LLaMA-Factory` | 支持模型和算法最全，自带 WebUI，上手最快 |
| 显卡显存吃紧，或者想用免费 Colab 体验微调 | `unslothai/unsloth` | 省显存、提速明显，现成的 Notebook 很多 |

最后给个实在点的建议：千万别五个仓库全点一遍 Star，然后放进收藏夹吃灰。

如果这周末你想学原理，就去把 `minimind` 拉下来跑通，或者老老实实敲一遍 `LLMs-from-scratch` 的前四章。如果你手里正好有项目等着微调，直接装个 `LLaMA-Factory`，下个 `Qwen2.5-1.5B` 或 `7B`，自己整理五十到一百条高质量问答数据，跑一次 LoRA。

等你第一次看到模型输出风格因为你喂的数据发生肉眼可见的变化时，很多概念自然就串起来了。

你平时折腾大模型，踩过最坑的显存或环境问题是什么？欢迎在评论区聊聊。
