# 很多人用错了 didChangeDependencies：一次源码级拆解 InheritedWidget 依赖分发

做 Flutter 久了，你大概率写过这样的代码：在 `initState` 里顺手 `Theme.of(context)` 拿个颜色，或者想让某个页面"感知主题变了没"。然后切主题时发现，这个页面的颜色纹丝不动。

问题不在你记错了 API，而在于没搞懂 `didChangeDependencies` 和 `InheritedWidget` 是怎么联动的。这条"状态分发暗线"藏在 Element 层，平时看不见，一旦用错就是各种"不刷新"的灵异现场。

这篇文章从源码讲起，把这条线拆开。

---

## 一、先看痛点：依赖为什么没生效

一个最常见的错误写法：

```dart
class _BadState extends State<BadPage> {
  late Color _accent;

  @override
  void initState() {
    super.initState();
    // 错误示范：在 initState 里读 InheritedWidget
    _accent = Theme.of(context).colorScheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    return Container(color: _accent); // 切主题后这里不会更新
  }
}
```

页面第一次进来的时候颜色是对的。可一旦外层 `Theme` 变了（比如用户切到暗色模式），这个页面死活不跟着变。

原因很直接：`initState` 这辈子只跑一次。你在这里把颜色存进 `_accent` 字段后，就再也没人去更新它了。框架确实会因为 `Theme.of` 内部调用了 `dependOnInheritedWidgetOfExactType` 而把本组件注册成依赖者，但 `didChangeDependencies` 被触发时，你的代码并没有重新读取新值。

把读取动作挪到 `build` 或 `didChangeDependencies` 里，问题立刻消失。后面会解释为什么是这两个地方，而不是 `initState`。

---

## 二、didChangeDependencies 到底什么时候被调用

先理清一个 StatefulWidget 的挂载顺序：

```
构造函数 → createState → [挂载] → initState → didChangeDependencies → build → (运行时) 依赖变化时反复调用 didChangeDependencies → build
```

两个关键点：

1. `didChangeDependencies` 在 `initState` 之后、`build` 之前被调用一次。
2. 之后**只要本组件所依赖的 InheritedWidget 发生变化**，它会被再次调用。

这就是为什么"读依赖"放在它里面是安全的，而放在 `initState` 里不行。

官方文档对 `State.initState` 写得很硬：

> You cannot use `BuildContext.dependOnInheritedWidgetOfExactType` from this method.（你不能在 `initState` 里调用 `BuildContext.dependOnInheritedWidgetOfExactType`。）

而对 `didChangeDependencies` 的注解则是：

> It is safe to call `BuildContext.dependOnInheritedWidgetOfExactType` from this method.（在 `didChangeDependencies` 里调用 `BuildContext.dependOnInheritedWidgetOfExactType` 是安全的。）

底层逻辑是这样的：框架用 `didChangeDependencies` 这个钩子来**重新建立依赖关系并把自己标脏**。你在 `build` 里每调一次 `dependOnInheritedWidgetOfExactType`，Element 都会重新把当前组件挂回祖先 `InheritedElement` 的依赖表里。 `initState` 只调一次，既不在重建循环里，也不承担"重新登记依赖"的职责，所以放那里既不保险，也拿不到后续变化。

[插入配图：StatefulWidget 生命周期中 initState / didChangeDependencies / build 的调用时序图，标注"依赖变化时 didChangeDependencies 被反复回调"，风格：写实科技蓝/高保真时序图]

---

## 三、源码探秘：InheritedElement 怎么管依赖

`InheritedWidget` 本身只是个标记，真正的活儿在 `InheritedElement` 里。它持有一张表：

```dart
// framework.dart 节选
class InheritedElement extends ProxyElement {
  final Map<Element, Object?> _dependents = <Element, Object?>{};
  // ...
}
```

`_dependents` 用 `Element` 当键，记录"谁依赖了我"。注意它是 `Map` 而非 `Set`，值位 `Object?` 是用来支持 `aspect` 这种精细化订阅的（比如 `MediaQuery` 可以按横竖屏、安全区等维度分别通知），本文先不管它。

当子组件调用 `context.dependOnInheritedWidgetOfExactType<T>()` 时，Element 做了三件事：

1. 沿父链向上找到最近的 `InheritedElement<T>`。
2. 调用 `ancestor.updateDependencies(this)`，把自己塞进 `_dependents`。
3. 返回那个 `InheritedWidget` 实例给你。

之后，当这个 `InheritedWidget` 的配置更新（widget 被重建），框架走 `updated`：

```dart
// framework.dart 节选
@override
void updated(InheritedWidget oldWidget) {
  if (updateShouldNotify(oldWidget)) notifyClients(oldWidget);
}

@protected
void notifyClients(InheritedWidget oldWidget) {
  for (final Element child in _dependents.keys) {
    // 逐个通知依赖者：你关心的东西变了
    child.didChangeDependencies();
  }
}
```

`didChangeDependencies` 在 Element 层的默认实现会清空本组件自己的依赖记录，并 `markNeedsBuild()`，于是组件重新 `build`，在 `build` 里再次 `dependOnInheritedWidgetOfExactType` 完成重新登记。

整套机制里，**`updateShouldNotify` 是"要不要打扰下游"的总开关**：

- 返回 `false`：一个依赖者都不通知，下游零重建。
- 返回 `true`：遍历 `_dependents`，挨个触发它们重建。

默认实现要求新旧 widget 不是同一个对象（`oldWidget != newWidget`）。但几乎所有官方 `InheritedWidget` 都重写了它做精确判断：`Theme` 比 `data`，`MediaQuery` 比 `data`，`Directionality` 比 `textDirection`。这直接决定了"改了哪个字段才真正引发重建"，也是性能优化的第一道闸门。

[插入配图：Widget 树与 Element 树中 InheritedElement 依赖注册与通知分发流程图，标注 dependOn 注册进 _dependents、updateShouldNotify 命中后逐节点 didChangeDependencies，风格：写实科技蓝/高保真架构图]

---

## 四、实战：手写一个轻量全局状态管理器

下面用纯 `InheritedWidget` 实现一个最小全局计数器，把上面所有概念串起来。它能在子树任意位置读 `count`、调 `+1`，且只有真正展示 `count` 的组件会随其变化重建。

```dart
// 1) 数据载体：把 count 和回调一起下发
class CounterProvider extends InheritedWidget {
  const CounterProvider({
    super.key,
    required this.count,
    required this.onIncrement,
    required super.child,
  });

  final int count;
  final VoidCallback onIncrement;

  // 约定俗成的查找入口。listen 控制是否建立依赖
  static CounterProvider? of(BuildContext context, {bool listen = true}) {
    if (listen) {
      // 建立监听：把当前 element 注册进祖先 InheritedElement 的 _dependents
      return context.dependOnInheritedWidgetOfExactType<CounterProvider>();
    }
    // 仅获取：拿到 element 取其 widget，但不注册任何依赖
    final element =
        context.getElementForInheritedWidgetOfExactType<CounterProvider>();
    return element?.widget as CounterProvider?;
  }

  // 只有 count 真的变化才通知下游，onIncrement 引用变不变都不管
  @override
  bool updateShouldNotify(covariant CounterProvider oldWidget) {
    return oldWidget.count != count;
  }
}
```

持有状态的父组件。注意 `onIncrement` 只在 `initState` 里创建一次，引用稳定，这样即便子组件用"只读不监听"拿它，拿到的也始终是同一个有效回调。

```dart
class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomeState();
}

class _HomeState extends State<HomePage> {
  int _count = 0;
  late final VoidCallback onIncrement;

  @override
  void initState() {
    super.initState();
    onIncrement = () => setState(() => _count++); // 只创建一次，引用稳定
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: CounterProvider(
          count: _count,
          onIncrement: onIncrement,
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CounterText(),   // 展示 count，需要监听
              SizedBox(height: 12),
              IncrementButton(), // 只触发回调，不需要监听
            ],
          ),
        ),
      ),
    );
  }
}
```

消费组件。`CounterText` 每次 `build` 都重新 `dependOnInheritedWidgetOfExactType`，所以 `count` 一变它就跟着重建：

```dart
class CounterText extends StatelessWidget {
  const CounterText({super.key});

  @override
  Widget build(BuildContext context) {
    final counter = CounterProvider.of(context); // 默认 listen: true
    return Text('当前计数：${counter?.count ?? 0}');
  }
}

class IncrementButton extends StatelessWidget {
  const IncrementButton({super.key});

  @override
  Widget build(BuildContext context) {
    // 它不展示 count，只想拿 onIncrement，所以 listen: false 省一次重建
    final counter = CounterProvider.of(context, listen: false);
    return ElevatedButton(
      onPressed: counter?.onIncrement,
      child: const Text('+1'),
    );
  }
}
```

跑起来后你会看到：`+1` 不断被点，`CounterText` 的数字在跳，而 `IncrementButton` 因为 `listen: false` 不会被这次更新拖着重建。这正是下一节要对比的核心差异。

---

## 五、对比实验：dependOn 与 getElement 的区别

这两个 API 长得像，作用却差很远：

| 方法 | 是否注册依赖 | InheritedWidget 更新时本组件是否重建 | 典型用途 |
| --- | --- | --- | --- |
| `dependOnInheritedWidgetOfExactType<T>()` | 是 | 会（需 `updateShouldNotify` 命中） | 展示依赖值，要随其变化刷新 |
| `getElementForInheritedWidgetOfExactType<T>()` | 否 | 不会 | 只取一次引用、不关心后续变化 |

把两个组件并排放进同一个 `InheritedWidget` 下面，点几次 `+1` 就能看出差别：

```dart
class ListenerChild extends StatefulWidget {
  const ListenerChild({super.key});
  @override
  State<ListenerChild> createState() => _ListenerChildState();
}

class _ListenerChildState extends State<ListenerChild> {
  int _rebuild = 0;

  @override
  Widget build(BuildContext context) {
    _rebuild++;
    // 建立监听：父级 count 一变，这个组件就会重建
    final data = context.dependOnInheritedWidgetOfExactType<CounterProvider>();
    return Text('监听模式  重建次数=$_rebuild  值=${data?.count}');
  }
}

class NonListenerChild extends StatelessWidget {
  const NonListenerChild({super.key});
  @override
  Widget build(BuildContext context) {
    // 仅获取：不建立依赖，父级更新不会触发本组件重建
    final element =
        context.getElementForInheritedWidgetOfExactType<CounterProvider>();
    final data = element?.widget as CounterProvider?;
    return Text('只读模式  值=${data?.count}');
  }
}
```

性能上，区别不在于"谁快"，而在于"要不要重建"。`getElementForInheritedWidgetOfExactType` 省掉的是下游整棵子树的重建开销。凡是只读一次、后续变化与你无关的场合（比如依据某个 inherited 配置做一次路由判断、拿一个回调引用），优先用 `getElementForInheritedWidgetOfExactType`。

---

## 六、避坑与性能优化

### 1. 别在 initState 里调 MediaQuery.of / Theme.of

前面那个 `BadPage` 就是例子。即便 `Theme.of` 内部走了 `dependOnInheritedWidgetOfExactType`，你把它读出来塞进字段后，字段不会自己更新。正确做法：把读取放进 `build`，或者放进 `didChangeDependencies`（如果你需要在依赖变化时做一些非 UI 的副作用，比如重新发起请求、重置某个控制器）。

```dart
class _GoodState extends State<GoodPage> {
  late Color _accent;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // 安全：依赖变化时这里会被再次调用，值始终是最新的
    _accent = Theme.of(context).colorScheme.primary;
    super.setState(() {}); // 如需刷新 UI 可在此触发；放 build 里则连这步都省了
  }

  @override
  Widget build(BuildContext context) {
    // 更常见的写法：直接在这里读，每次 build 都是新值
    final accent = Theme.of(context).colorScheme.primary;
    return Container(color: accent);
  }
}
```

### 2. 避免 InheritedWidget 更新拖垮整棵子树

`updateShouldNotify` 命中后，所有依赖者都会重建。要让重建范围尽量小，有两招：

**给不依赖该值的子组件加 `const`。** `const` 构造函数构建出的 widget 在父组件重建时会被跳过（相同 `const` 实例被复用），不会触发子组件 `build`。

**把"变"和"不变"拆开。** 依赖 `InheritedWidget` 的叶子节点才去 `dependOnInheritedWidgetOfExactType`，周围稳定的结构抽成独立 `const` 子组件：

```dart
class ExpensivePanel extends StatelessWidget {
  const ExpensivePanel({super.key});
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context); // 这里依赖主题
    return Container(
      color: theme.colorScheme.surface,
      // 不变的部分抽成 const 子组件，主题切换时它不会被重建
      child: const _StaticContent(),
    );
  }
}

class _StaticContent extends StatelessWidget {
  const _StaticContent();
  @override
  Widget build(BuildContext context) =>
      const Text('不随主题变化而重建的内容');
}
```

> **小卡片**：判断一个组件要不要依赖某个 InheritedWidget，标准就一句：它构建出的 UI 是否真的会随这个值变化。会，就 `dependOnInheritedWidgetOfExactType`；不会，就别碰，或者改用 `getElementForInheritedWidgetOfExactType` 只读一次。

---

## 七、三句话带走

1. `didChangeDependencies` 在 `initState` 之后、`build` 之前调用，且依赖变化时会反复回调，它是注册和读取 `InheritedWidget` 依赖的安全位置，`initState` 不是。
2. `InheritedElement` 用 `_dependents` 表记录"谁依赖了我"，`updateShouldNotify` 决定要不要逐个通知它们重建，这是整条分发链路的总开关。
3. 能只读不监听就用 `getElementForInheritedWidgetOfExactType`；能给子组件加 `const` 就加，把重建范围压到最小。

把这三句吃透，`InheritedWidget` 相关的"不刷新""乱刷新"基本都能定位到根上。
