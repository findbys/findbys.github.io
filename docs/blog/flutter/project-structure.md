---
title: Flutter 工程化实战：大型项目目录结构划分与解耦指南
description: 告别层级混沌！从 Feature-First 架构到 core/shared 职责边界划分，聊聊 Flutter 项目怎么放代码才好维护、易扩展。
date: 2026-08-06
category: Flutter
readTime: 15 min
tags: ['Flutter', '工程化', '目录架构', 'Dart']
---

# Flutter 工程化实战：大型项目目录结构划分与解耦指南

写 Flutter 项目时，最怕两件事：一是后期找一个页面要在 `controllers`、`views` 和 `models` 三个几百个文件的文件夹里来回翻；二是修改一个通用组件，莫名其妙崩了三个无关的业务页。

一个好维护的 Flutter 目录结构，重点不是套用了什么高大上的设计模式，而是**让团队成员在想改代码时，能在 3 秒内找到文件；在新增功能时，知道代码该往哪里放。**

这篇文章记录我在多个 Flutter 团队项目中打磨出的目录规划方案。

---

## 1. 为什么层级分包（Layer-First）是后期噩梦？

很多刚接触 Flutter 的同学习惯按文件类型建目录（Layer-First）：

```text
lib/
├── models/
│   ├── user.dart
│   ├── product.dart
│   └── order.dart
├── views/
│   ├── login_page.dart
│   ├── home_page.dart
│   └── detail_page.dart
└── controllers/
    ├── login_controller.dart
    ├── home_controller.dart
    └── detail_controller.dart
```

这种结构在项目前两周非常顺手，只要按文件类型往里放就行。

但当项目页面超过 20 个、业务开始复杂时问题就来了：你要改一个“购物车”功能，需要在 `views/cart_page.dart`、`controllers/cart_controller.dart` 和 `models/cart_item.dart` 之间频繁跳跃。如果购物车里再细分几百行子小组件，目录就会乱成一团。

![Layer-First 与 Feature-First 架构对比示意图](/images/flutter_layer_vs_feature.jpg)
*图 1：按层划分（左，文件交错散落）与按业务功能划分（右，高内聚独立模块）的对比*

**更好的做法是按业务功能分包（Feature-First）。**

---

## 2. 推荐的项目目录结构

一个兼顾可扩展性与团队协作的 Flutter 目录树结构如下：

```text
lib/
├── main.dart
├── app/                  # 1. 应用全局配置
│   ├── config/           # 环境配置 (env, constants)
│   ├── routes/           # 路由定义与拦截
│   ├── theme/            # 主题与设计规范 (colors, typography)
│   └── app.dart          # MaterialApp / Provider 根节点
│
├── core/                 # 2. 技术基础设施 (与具体业务无关)
│   ├── network/          # Http/Dio 封装、拦截器、错误码
│   ├── storage/          # SharedPreferences/Hive 封装
│   ├── utils/            # 格式化、防抖、校验等无状态工具
│   └── error/            # 全局异常捕获与自定义 Exception
│
├── shared/               # 3. 业务通用层 (跨模块复用)
│   ├── widgets/          # 全局业务组件 (如 UserAvatar, OrderStatusBadge)
│   ├── models/           # 全局通用实体 (如 UserProfile, PageParams)
│   └── constants/        # 全局业务常量
│
└── features/             # 4. 业务功能模块 (按业务拆分)
    ├── auth/             # 登录/认证模块
    │   ├── data/         # 数据源、API 请求、Repository 实现
    │   ├── domain/       # 业务模型、Repository 接口 (可选)
    │   └── presentation/ # UI 界面与状态
    │       ├── controllers/
    │       ├── pages/
    │       └── widgets/  # 仅该模块内使用的局部子小组件
    ├── home/             # 首页模块
    └── profile/          # 个人中心模块
```

---

## 3. 各分层的职责划分与铁律

### `app/` —— 启动与全局外壳
只放应用级别的初始化配置。比如 `main.dart` 里面只做 `WidgetsFlutterBinding.ensureInitialized()` 和全局服务初始化，然后直接跑 `app/app.dart`。

路由（如 `go_router` 或 `auto_route`）定义在 `app/routes/` 中，不要在页面文件里硬编码字符串路径。

---

### `core/` 与 `shared/` 的区别在哪？

这是大家最容易搞混的地方。划分原则很简单：

![Core 与 Shared 边界示意图](/images/flutter_core_vs_shared.jpg)
*图 2：Core 层（纯基础设施）与 Shared 层（带业务属性公共资源）的职责边界划分*

* **`core/` 是纯技术基建，把它拔出来放到另一个做外卖或电商的项目里，一行不用改就能用。** 比如 Dio 的封装、日志打印工具、日期格式化工具。
* **`shared/` 是带业务属性的公共资源。** 比如包含了你公司 UI 设计语言的按钮 `AppButton`、用户头像 `UserAvatar`，或者全局共享的 `UserModel`。

如果一个 Widget 既包含了 Dio 请求又带了业务逻辑，绝不能放 `core/`。

---

### `features/` —— 按功能内聚

每个 feature（比如 `auth` 认证模块）就像一个微型的独立 App，内部自行管理数据和界面：

![Feature 模块内部架构层次图](/images/flutter_feature_architecture.jpg)
*图 3：Feature 内部层级（Data 接口数据层 -> Controller 状态层 -> Page/Widgets 表现层）*

1. **`data/`**：负责发请求、读缓存、解析 JSON。
2. **`presentation/pages/`**：只放完整的页面 Widget（如 `login_page.dart`）。
3. **`presentation/widgets/`**：把页面拆碎后的局部组件。比如登录页面的“验证码倒计时按钮”，它只在登录页用，就留在 `auth/presentation/widgets/` 下，别丢去 `shared/` 污染全局。
4. **`presentation/controllers/`**：状态管理逻辑（如 BLoC / Riverpod / GetX / Provider）。界面只负责渲染，逻辑全部写在 Controller 或 Notifier 里。

---

## 4. 防乱防坑的 3 条经验

### ① 业务模块（features）之间绝不直接交叉 import
比如 `profile` 模块的页面，不要直接 `import '../../features/home/presentation/widgets/home_header.dart'`。

一旦模块之间互相引用，解耦就成了空话，以后想拆分或者重构会极其痛苦。
* **页面跳转**：通过 `app/routes` 的全局路由操作。
* **数据共享**：将公共数据状态提升到 `shared`，或者通过全局状态服务传递。

### ② 谨慎使用 `export` 桶文件（Barrel Files）
有些同学喜欢在每个文件夹下建一个 `index.dart` 并把里面的文件全部 `export` 出来，以便外部只需要一行 `import`。

在 Flutter/Dart 中，过度的桶文件会导致：
1. **热重载（Hot Reload）变慢**，因为 Dart 编译器需要处理更复杂的依赖树。
2. 极其容易触发**循环依赖报错**（Circular dependency）。

建议只在 `shared/widgets/index.dart` 这种确实包含几十个通用组件的地方做适度导出，业务模块内部不需要搞 `index.dart`。

### ③ 项目太大时，用多 package 隔离
如果团队有 5 人以上，或者代码量达到了几万行，可以利用 Flutter 原生支持的 `packages/` 机制：

在根目录下创建 `packages/`，把 `core` 或特别大的业务模块直接拆成本地 Dart Package：

```text
my_app/
├── packages/
│   ├── core_network/     # 独立网络包
│   └── feature_payment/  # 独立支付包
└── pubspec.yaml
```

在主项目的 `pubspec.yaml` 中通过 `path: ./packages/core_network` 引入。利用物理目录的边界，强制保证团队成员不会乱写跨模块调用。

---

## 总结

工程化没有标准答案，但良好的目录划分能让开发体验大幅提升。

总结起来就三点：
1. **小组件就近放，通用组件往上提。**
2. **业务按功能模块（features）切块，技术基建归 `core`，业务公共归 `shared`。**
3. **模块之间靠路由和全局状态解耦，绝不互相私自依赖。**
