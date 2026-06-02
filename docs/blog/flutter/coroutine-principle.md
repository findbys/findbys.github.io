---
title: Flutter 中协程原理：把 async/await 讲简单
description: 用简单直觉解释 Dart 和 Flutter 中 Future、async/await、事件循环、微任务队列和 Isolate 的关系。
---

# Flutter 中协程原理：把 async/await 讲简单

很多人学 Flutter 时都会遇到一个问题：Dart 里没有像 Kotlin 那样直接叫 `Coroutine` 的东西，那我们平时说的“协程”到底是什么？

简单说：

> 在 Flutter 里，大家口头说的“协程”，大多数时候指的是 Dart 的异步编程模型：`Future`、`async`、`await`，以及背后的事件循环。

它不是开了一条新线程，也不是让代码真的同时执行。它更像是：

> 代码执行到耗时任务时，先把任务交出去，自己让出执行权；等结果回来，再从暂停的地方继续往下走。

这篇文章就把这件事拆简单。

## 先用一个生活例子理解

假设你去咖啡店买咖啡。

同步写法像这样：

1. 你点咖啡。
2. 你站在柜台前一动不动，等咖啡做好。
3. 咖啡做好后，你才去做下一件事。

异步写法像这样：

1. 你点咖啡。
2. 店员给你一个取餐牌。
3. 你先去找座位、回消息、看文章。
4. 取餐牌响了，你再回来拿咖啡。

`await` 做的事情就像“等取餐牌响”。

但重点是：你不是一直堵在柜台前。你让出了位置，别人可以继续点单，店员也可以继续工作。

Flutter 的 UI 线程也是这样。它很忙，要处理点击、动画、布局、绘制。如果你让它一直等一个耗时任务，界面就会卡住。

## Dart 的“协程”不是线程

先明确一个容易混淆的点：

```dart
final data = await fetchUser();
```

这行代码看起来像“停住等结果”，但它不是把线程阻塞住。

它实际发生的是：

1. 调用 `fetchUser()`，得到一个 `Future`。
2. 当前函数暂停执行。
3. Dart 把后续代码包装成一个回调。
4. UI 线程继续处理别的任务。
5. `Future` 完成后，后续代码被放回队列里执行。

所以 `await` 的本质不是“傻等”，而是“暂停当前异步函数，把执行权还给事件循环”。

这就是它像协程的地方。

## Future 是一张“未来的结果单”

`Future<T>` 可以理解成：

> 现在还没有结果，但未来某个时间点会给你一个 `T`。

比如：

```dart
Future<String> fetchUserName() {
  return Future.delayed(
    const Duration(seconds: 1),
    () => 'findbys',
  );
}
```

这个函数不会立刻返回字符串，而是立刻返回一个 `Future<String>`。

真正的字符串会在 1 秒后出现。

如果不用 `await`，你拿到的是“结果单”：

```dart
final name = fetchUserName();
print(name); // Instance of 'Future<String>'
```

如果使用 `await`，你拿到的才是结果：

```dart
final name = await fetchUserName();
print(name); // findbys
```

可以把 `Future` 想成外卖订单：

- 下单后，你立刻得到订单号。
- 外卖还没到。
- 订单完成时，你才能拿到真正的饭。

## async/await 只是语法糖

下面这段代码：

```dart
Future<void> loadUser() async {
  print('start');
  final name = await fetchUserName();
  print(name);
  print('end');
}
```

可以粗略理解成：

```dart
Future<void> loadUser() {
  print('start');

  return fetchUserName().then((name) {
    print(name);
    print('end');
  });
}
```

也就是说，`async/await` 没有创造一种神秘能力，它只是让异步回调代码写起来像同步代码。

这也是它最大的价值：

> 异步逻辑还是异步的，但阅读体验接近同步。

## 事件循环：Flutter 为什么不会卡住

Dart 运行时有一个很核心的机制：事件循环。

你可以把它理解成一个不断工作的调度员。

它一直在做这件事：

1. 看看有没有任务。
2. 拿出一个任务执行。
3. 执行完再拿下一个。
4. 一直循环。

Flutter 的点击事件、定时器、网络请求完成通知、页面绘制任务，都会进入这个调度系统。

一个简化版流程是：

```text
事件循环开始
  -> 执行一个事件任务
  -> 清空微任务队列
  -> 执行下一个事件任务
  -> 清空微任务队列
  -> ...
```

Dart 里有两个重要队列：

```text
Microtask Queue  微任务队列
Event Queue      事件队列
```

理解这两个队列，很多 `async/await` 的行为就清楚了。

## 微任务队列和事件队列

### 微任务队列

微任务通常是“需要尽快执行的小任务”。

比如：

```dart
scheduleMicrotask(() {
  print('microtask');
});
```

微任务的特点是：

> 当前事件执行完后，会先清空微任务队列，再去处理下一个事件。

### 事件队列

事件队列放的是更普通的异步事件，比如：

- 用户点击
- 定时器
- 网络请求完成
- IO 事件
- Flutter 的绘制调度

比如：

```dart
Future(() {
  print('event');
});
```

它会进入事件队列。

## 一个经典执行顺序例子

看这段代码：

```dart
import 'dart:async';

void main() {
  print('A');

  Future(() {
    print('B');
  });

  scheduleMicrotask(() {
    print('C');
  });

  print('D');
}
```

输出顺序是：

```text
A
D
C
B
```

为什么？

因为主函数本身是当前正在执行的同步任务：

1. 先打印 `A`。
2. `Future(() {})` 放入事件队列。
3. `scheduleMicrotask` 放入微任务队列。
4. 打印 `D`。
5. 当前同步任务结束。
6. 先清空微任务，所以打印 `C`。
7. 再处理事件队列，所以打印 `B`。

一句话总结：

> 同步代码先执行，微任务其次，事件任务最后。

## await 后面的代码去了哪里

再看一个例子：

```dart
Future<void> main() async {
  print('A');

  await Future(() {
    print('B');
  });

  print('C');
}
```

输出：

```text
A
B
C
```

执行过程可以这样理解：

1. 打印 `A`。
2. 遇到 `await`。
3. `Future(() { print('B'); })` 被放进事件队列。
4. `main` 暂停，后面的 `print('C')` 先不执行。
5. Future 执行，打印 `B`。
6. Future 完成。
7. `await` 后面的代码恢复执行，打印 `C`。

所以 `await` 后面的代码不是消失了，而是被 Dart 保存起来，等 Future 完成后再继续。

这就是“协程感”的来源：

> 函数可以暂停，也可以恢复。

## Flutter UI 为什么需要异步

Flutter 主线程要负责很多事情：

- 处理手势
- 执行动画
- 计算布局
- 构建 Widget 树
- 提交绘制指令

如果你在主线程写一个很重的同步任务：

```dart
void onPressed() {
  heavyWork();
  setState(() {});
}
```

界面可能会卡住。

因为事件循环被 `heavyWork()` 占住了，Flutter 没机会处理下一帧。

如果这个任务是网络请求、文件读取、数据库查询，就应该写成异步：

```dart
Future<void> onPressed() async {
  final data = await repository.loadData();
  setState(() {
    user = data;
  });
}
```

这样等待数据时，UI 线程还能继续响应用户操作和刷新界面。

## 但 async/await 不能解决 CPU 密集任务

这是一个很重要的点。

`async/await` 适合处理等待型任务：

- 等网络
- 等文件
- 等数据库
- 等定时器

但如果任务本身要大量计算，比如：

- 解析超大 JSON
- 图片处理
- 大量加密计算
- 复杂数据统计

只写 `async` 不一定有用。

比如：

```dart
Future<void> calculate() async {
  for (var i = 0; i < 1000000000; i++) {
    // heavy calculate
  }
}
```

虽然它是 `async` 函数，但循环本身还是在当前 Isolate 里跑，UI 仍然可能卡。

这种场景要用 `Isolate`。

## Isolate 和协程有什么区别

Dart 里真正能并行执行的东西是 `Isolate`。

你可以这样理解：

```text
async/await：一个人做事，遇到等待就先去处理别的事
Isolate：再找一个人，真正同时干另一件事
```

`async/await` 是并发，不一定并行。

`Isolate` 才是并行。

在 Flutter 中，如果只是网络请求，用 `Future` 和 `await` 就够了。

如果是重计算，可以用：

```dart
final result = await compute(parseLargeJson, jsonString);
```

`compute` 会把任务放到另一个 Isolate 中执行，避免阻塞 UI。

## 常见误区

### 误区一：async 会自动开新线程

不会。

`async` 只是把函数变成返回 `Future` 的异步函数。

```dart
Future<void> foo() async {}
```

它不等于新线程。

### 误区二：await 会阻塞 UI

通常不会。

`await` 会暂停当前异步函数，把执行权交还给事件循环。

真正会阻塞 UI 的，是 await 前后执行的重同步代码。

### 误区三：Future 里的代码一定异步执行

要看你怎么写。

```dart
Future.value(1);
```

这类 Future 很快完成。

而：

```dart
Future(() {
  print('task');
});
```

会把任务放到事件队列。

不要只看 `Future` 这个词，要看任务是如何创建和调度的。

### 误区四：所有异步都应该放 microtask

不应该。

微任务优先级高，如果你疯狂塞微任务，事件队列可能迟迟得不到执行，反而影响 UI。

普通业务异步逻辑，大多数时候用 `Future`、`async/await` 就够了。

## 实战建议

### 1. 网络请求用 async/await 写清楚

```dart
Future<void> loadProfile() async {
  setState(() {
    loading = true;
  });

  try {
    final profile = await api.fetchProfile();
    setState(() {
      user = profile;
    });
  } catch (error) {
    setState(() {
      message = '加载失败，请稍后重试';
    });
  } finally {
    setState(() {
      loading = false;
    });
  }
}
```

这里重点不是炫技，而是让状态变化清楚：

- 开始 loading
- 请求数据
- 成功更新数据
- 失败展示错误
- 最后关闭 loading

### 2. build 方法里不要直接发请求

不要这样写：

```dart
Widget build(BuildContext context) {
  fetchData();
  return Container();
}
```

`build` 可能被频繁调用，这样容易重复请求。

更合适的方式是在 `initState` 里触发：

```dart
@override
void initState() {
  super.initState();
  loadData();
}
```

### 3. setState 前确认页面还在

异步请求回来时，页面可能已经销毁了。

所以可以加：

```dart
if (!mounted) return;

setState(() {
  user = data;
});
```

这能避免一些常见的生命周期问题。

### 4. 大计算交给 Isolate

如果你发现页面掉帧，不要只想着把函数改成 `async`。

要先判断任务类型：

```text
等待型任务：Future + await
计算型任务：Isolate / compute
```

这是 Flutter 性能优化里很关键的一条边界。

## 用一句话总结

Flutter 里的“协程”可以这样理解：

> `async/await` 让函数可以在等待 Future 时暂停，把主线程还给事件循环；Future 完成后，再从暂停的地方继续执行。

再压缩一点：

```text
Future 是未来的结果。
await 是先让出执行权，等结果回来再继续。
事件循环负责安排谁先执行。
Isolate 才负责真正并行计算。
```

把这几个点想明白，Flutter 异步编程就不会再像一团雾。

写异步代码时也不用急着记很多术语，只要先问自己两个问题：

1. 这件事是在“等待”，还是在“计算”？
2. 它会不会占住 UI 线程太久？

答案清楚了，代码该用 `await`、`Future`，还是 `Isolate`，也就自然清楚了。
