---
title: 深入 Dart 事件循环：单线程如何撑起高并发
description: 从 Event Loop、Microtask Queue、Event Queue 的优先级调度，到与 JavaScript 事件循环的本质差异，再到 UI 卡顿避坑，一篇讲透 Dart 异步的底层运转。
date: 2026-08-27
category: Dart
tags: [Dart, Flutter, 事件循环, 异步, 并发, Isolate]
---

# 深入 Dart 事件循环：单线程如何撑起高并发

`async` / `await` 几乎每天都在写，可真要问一句"下面这段代码的打印顺序是什么"，能答对的 Flutter 开发者其实不多。

我见过不少人把异步当成"后台开线程"来理解，结果一旦遇到卡顿、死循环、或是一段顺序对不上的输出，就完全说不清原因。这篇文章想把这层窗户纸捅破：Dart 是单线程的，它能处理高并发，靠的是**事件循环（Event Loop）**这一套机制，而不是多线程。

读完你应该能讲清楚三件事：事件循环怎么转、微任务队列为什么总被优先处理、以及 UI 卡顿到底卡在哪。

> [!NOTE]
> 本文所有结论都基于 Dart 官方规范与设计哲学，关键论点处附了官方文档链接，可以放心引用。

## 一、痛点：单线程凭什么处理高并发

先纠正一个常见误解。

单线程不等于"一次只能干一件事"，它指的是**同一时刻只有一条执行流在跑**。高并发的"并发感"来自另一套东西：代码被切成很多小块（事件），由一个永不阻塞的循环轮流调度。

你可以把 App 的一生想成一条时间轴：启动、结束，中间不断冒出各种事件：点了一下屏幕、网络回来了、定时器到点了、计时器响了。Dart 用一个事件循环把这些事件一个一个取出来处理，处理完再取下一个。

::: tip 关键认知
Dart 代码都跑在一个叫 **Isolate** 的容器里。每个 Isolate 有自己独立的一块内存，外加一条跑着事件循环的线程。别的 Isolate 碰不到这块内存，这就是"隔离"这个名字的由来。
:::

> [!WARNING]
> 因为是单线程，这条线程**绝对不能阻塞**。一旦某个事件的处理卡住，后面排队的点击、渲染、网络回调全都会跟着卡。后面讲 UI 掉帧时还会回到这一点。

## 二、核心机制：事件循环到底在转什么

官方对事件循环的描述非常直白：它从一个队列里取最老的事件，处理它，再取下一条，如此往复，直到队列空了就等着下一个事件进来。

![单 Isolate 结构示意图](/images/dart_eventloop_isolate.png)

### 2.1 两套队列，一套优先级

事件循环真正处理的有**两个队列**，这是理解执行顺序的核心：

- **Microtask Queue（微任务队列）**：优先级高，事件循环每次空闲时先把它**清空**，再去碰下一个事件。
- **Event Queue（事件队列）**：存外部事件，比如用户输入、I/O、定时器、Isolate 间消息。

调度规则可以这样记：

```
事件循环每处理完一个事件：
  1. 先把 Microtask 队列彻底排空
  2. 再取 Event 队列里的下一个事件
  3. 重复
```

所以微任务总能在"下一个事件"之前插队完成。这也是为什么 `scheduleMicrotask` 调度出来的代码，会比大多数 `Future` 闭包先跑。

![Microtask 与 Event 双队列优先级图](/images/dart_eventloop_queues.png)

### 2.2 谁进哪个队列

这是最容易混淆的地方，我直接列清楚：

| 调度方式 | 进哪个队列 | 说明 |
| --- | --- | --- |
| `scheduleMicrotask(() {})` | Microtask | 显式塞进微任务 |
| `await` 后面的续体 | Microtask | `await` 本质是把后面的代码包成 `.then` 回调 |
| `Future.value(x).then(...)` | Microtask | 已完成的 future，回调走微任务 |
| `Future(() => ...)` 的闭包 | **Event** | 闭包本身是一个事件，不是微任务 |
| `Timer` / `Future.delayed` | Event | 定时器本质是事件 |
| 用户点击、I/O 完成、绘制 | Event | 外部事件天然进 Event 队列 |

::: warning 一个反直觉的点
`Future(() => print('x'))` 里的闭包**不会立刻执行**，也不会进微任务队列，而是作为一个**事件**被丢进 Event Queue。要等当前同步代码和所有微任务都清空了，才轮到它。

很多人以为 `Future` 就是"稍后、但尽快"，其实"尽快"指的是微任务级别；`Future` 构造函数里的活儿，排在微任务之后。
:::

## 三、和 JavaScript 事件循环到底差在哪

两者骨架很像：都是单线程 + 事件循环 + 微任务队列 + 宏任务（事件）队列，微任务都优先。但细节上有几处会让跨语言的人栽跟头。

| 对比项 | Dart | JavaScript |
| --- | --- | --- |
| 异步闭包何时执行 | `Future(() => ...)` 的闭包进 **Event 队列**，异步执行 | `new Promise((resolve) => {...})` 的执行器**同步执行** |
| 微任务来源 | `scheduleMicrotask`、await 续体、`Future.value` | `queueMicrotask`、Promise 的 `.then` / `await` |
| 渲染环节 | Flutter 有独立 vsync/渲染管线，不在事件循环定义里 | 浏览器的 `requestAnimationFrame` 与渲染绑定在事件循环里 |
| 重计算怎么办 | **Isolate**（独立线程，消息传递） | Web Worker（独立线程，消息传递） |
| 内存模型 | Isolate 间不共享，只能传消息 | Worker 间不共享，结构化克隆传消息 |

最该记住的是**第一条**。下面两段等价语义的代码，执行时机完全不同：

```dart
// Dart：闭包是事件，异步跑
Future(() => print('Dart future'));
print('Dart sync');
// 输出顺序：Dart sync → Dart future
```

```js
// JavaScript：执行器同步跑
new Promise((resolve) => { console.log('JS promise'); resolve(); });
console.log('JS sync');
// 输出顺序：JS promise → JS sync
```

也就是说，在 JS 里 `Promise` 执行器会当场把代码跑了；在 Dart 里 `Future` 的闭包要等事件循环轮到它。这个差异不搞清楚，迁移代码或面试时很容易翻车。

`await` 的语义两边倒是一致的：它后面的续体都是微任务，所以 `await` 之后的代码总在"当前事件处理完、微任务排空"之后。

## 四、实战：一段代码看穿执行顺序

光说规则不够，直接上题。先看这道经典题。

```dart
void main() {
  print('1');                                  // ① 同步
  Future(() => print('2'));                    // ② 闭包进 Event 队列
  scheduleMicrotask(() => print('3'));         // ③ 进 Microtask 队列
  Future(() => print('4')).then((_) => print('5')); // ④ 闭包进 Event；then 回调是微任务
  print('6');                                  // ⑤ 同步
}
```

**逐行解析：**

1. `print('1')` 同步执行，输出 `1`。
2. `Future(() => print('2'))` 把闭包 `2` 丢进 Event 队列。
3. `scheduleMicrotask(() => print('3'))` 把 `3` 丢进 Microtask 队列。
4. `Future(() => print('4'))` 把闭包 `4` 丢进 Event 队列；`.then` 注册的回调 `5` 会在 `4` 完成后作为**微任务**入队（此刻还没入队）。
5. `print('6')` 同步执行，输出 `6`。

同步代码结束，事件循环开始工作：

- 先排空 Microtask 队列，此时只有 `3`，输出 `3`。
- Microtask 空了，取 Event 队列第一个事件 `2`，输出 `2`。
- 再取下一个事件 `4`，输出 `4`；`4` 完成后，`.then` 回调 `5` 作为微任务入队。
- 排空 Microtask 队列，`5` 输出。

**最终输出：**

```
1
6
3
2
4
5
```

再来一道带 `async` / `await` 的，很多人会在这里判断错顺序：

```dart
Future<void> foo() async {
  print('foo 1');
  await bar();
  print('foo 2');
}

Future<void> bar() async {
  print('bar 1');
  await Future(() => print('bar 2'));
  print('bar 3');
}

void main() {
  print('start');
  foo();
  print('end');
}
```

**执行顺序：**

1. `start`。
2. 调用 `foo()`，同步打印 `foo 1`。
3. `await bar()`：进入 `bar()`，打印 `bar 1`。
4. `await Future(() => print('bar 2'))`：闭包 `bar 2` 进 Event 队列；`bar` 在此挂起，返回一个未完成的 future；`foo` 也跟着挂起。
5. `end`。
6. 同步结束。Event 队列里有 `bar 2` 这个事件。
7. 处理 `bar 2`，打印 `bar 2`；其 future 完成，把 `bar` 的续体 `bar 3` 作为微任务入队。
8. 排空微任务，打印 `bar 3`；`bar()` 整体完成，把 `foo` 的续体 `foo 2` 作为微任务入队。
9. 排空微任务，打印 `foo 2`。

**最终输出：**

```
start
foo 1
bar 1
end
bar 2
bar 3
foo 2
```

![经典题执行时序图](/images/dart_eventloop_timeline.png)

## 五、避坑指南：UI 卡顿的真凶

讲完原理，落到实战最该避的坑。

**卡顿不是网络慢，是主 Isolate 被你自己的代码堵死了。** 事件循环一次只处理一个事件，处理期间线程被独占。如果你在某个事件（比如一次 `build`、一次点击回调）里写了大量同步计算，或者往微任务队列里塞了一堆重活，后面的渲染事件就一直排不上，界面就掉帧、点不动。

::: danger 重计算别放在主 Isolate
下面这种写法在列表大、计算重时会直接卡死 UI：

```dart
// 错误示范：在主 Isolate 同步跑重计算
final result = heavyCompute(bigList); // 几十毫秒甚至上百毫秒的阻塞
```

正确做法是把活儿丢到独立 Isolate，让主线程继续渲染：

```dart
// 正确示范：Flutter 提供的 compute 开一个临时 Isolate
final result = await compute(heavyCompute, bigList);
```

`compute` 和 `Isolate.spawn` 都会新建一个 Isolate，它有自己的内存和事件循环，算完把结果通过消息传回来。主 Isolate 这边的事件循环不受影响，widget 树照常重建。
:::

![Isolate 计算分流图](/images/dart_eventloop_offload.png)

::: tip 判断标准
遇到下面两种情况，就该想 Isolate 了：
- 一段同步代码跑超过 16 毫秒（一帧预算），且来源是 CPU 计算而非 I/O。
- 用 `Timeline` / DevTools 的 CPU 面板看到某次事件占用时间异常长。
:::

## 六、总结

如果只能记住三句话：

1. **Dart 单线程靠事件循环撑并发**，所有异步 API 都是"告诉循环稍后跑这段代码"的语法糖。
2. **微任务优先**：每次事件处理完，先把 Microtask 队列清空，再取下一个 Event；`Future(() => ...)` 的闭包是事件，排在所有微任务之后。
3. **重活在 Isolate**：主 Isolate 一旦被同步计算或微任务堆满，UI 就卡；CPU 密集交给 `compute` / `Isolate.spawn`。

把这三句和第四节的两段输出对一遍，事件循环基本就算真懂了。

## 结语

感谢你看到这里。事件循环这东西，初看是概念，写多了就是肌肉记忆，但很多人卡在"会写 `await` 却说不清顺序"的阶段，希望这篇能帮你补上那块拼图。

如果觉得有用，欢迎关注公众号，后续会持续拆解 Flutter / Dart 的底层原理和实战 Demo。

也欢迎在留言区告诉我你想弄懂的技术难点、某个框架原理，或者一个具体的场景 Demo。我会去查官方资料、写代码验证，再整理成能直接上手跑的实战教程回馈给大家。

## 参考与权威引用

- Dart 官方博客：Isolates and event loops —— <https://dart.dev/blog/dart-asynchronous-programming-isolates-and-event-loops>
- Dart 语言导览：异步支持（Asynchrony support） —— <https://dart.dev/guides/language/language-tour#asynchrony-support>
- Dart 并发：Isolates 与事件循环 —— <https://dart.dev/language/concurrency>
- Flutter 文档：异步编程与后台工作 —— <https://docs.flutter.dev/development/data-and-backend/async>
- Flutter API：`compute` 函数 —— <https://api.flutter.dev/flutter/foundation/compute-constant.html>
- 归档文章：The Event Loop and Dart（微任务队列细节） —— <https://web.archive.org/web/20170704074724/https://webdev.dartlang.org/articles/performance/event-loop>
