---
title: Flutter Riverpod Clean Architecture：一份可直接落地的生产级模板
description: 介绍 GitHub 开源项目 ssoad/flutter_riverpod_clean_architecture，详解 Clean Architecture 四层划分、Screaming Architecture 目录组织、Riverpod 依赖注入，并给出从 Domain 到 UI 的完整代码示例。
date: 2026-08-25
category: Flutter
readTime: 18 min
tags: ['Flutter', 'Riverpod', 'Clean Architecture', 'ssoad', '状态管理']
---

# Flutter Riverpod Clean Architecture：一份可直接落地的生产级模板

Flutter 项目做久了，总会反复遇到几个问题：状态管理和业务逻辑搅在一起、网络请求散落各处、改一个接口要动十几处文件、单元测试写不下去。不是 Flutter 本身的问题，是项目结构没想清楚。

这篇文章参考了 [Flutter Dio 网络封装实战](https://mp.weixin.qq.com/s/0Zs7cp5ct8OSbNa6Spbpfg) 的写法：先讲清楚问题，再给出架构图，然后逐段贴代码、逐段讲原理。主题换成 **Clean Architecture + Riverpod**，源码来自 GitHub 上的 [ssoad/flutter_riverpod_clean_architecture](https://github.com/ssoad/flutter_riverpod_clean_architecture)。

这个模板把 Clean Architecture 的四层结构、Screaming Architecture 的目录组织、Riverpod 的依赖注入串在了一起，并且配好了 `generate_feature.sh` 脚本、CI/CD 工作流、严格 lint 规则。你可以把它当作新项目的起点，也可以只借鉴它的分层思路。

---

## 1. 这个项目解决了什么问题

先列出它想解决的常见问题：

| 痛点 | 没有架构时 | 这个模板的做法 |
|------|------------|----------------|
| 业务逻辑和 UI 耦合 | `setState` 里直接调接口、解析 JSON | UseCase 承载业务逻辑，UI 只消费状态 |
| 数据来源分散 | `Dio` 调用散落在 Provider 和 Widget 里 | DataSource 统一封装，Repository 组合多个来源 |
| 测试困难 | Widget 里直接依赖网络，Mock 成本高 | Domain / Data 层不依赖 Flutter，可独立单元测试 |
| 依赖方向混乱 | 底层模型被上层直接 import | 依赖指向内圈，外层依赖内圈抽象 |
| 新功能重复造轮子 | 每次新建 feature 手动建七八个目录 | `./generate_feature.sh --name xxx` 一键生成 |

一句话：它给了一套 **"结构先于代码"** 的工程约定，让团队协作时少很多口头对齐。

---

## 2. Clean Architecture 的四层划分

这个模板用 Clean Architecture 的同心圆模型组织代码，依赖方向永远指向圆心。

![Clean Architecture 分层与依赖方向](/images/flutter_arch_layers.png)

四层的职责划分如下：

| 层级 | 代表目录 | 职责 | 依赖规则 |
|------|----------|------|----------|
| **实体层 Entities** | `domain/entities/` | 纯 Dart 业务对象，如 `User`、`Post` | 不依赖任何外部框架 |
| **用例层 Use Cases** | `domain/usecases/` | 单一业务逻辑单元，如 `LoginUseCase` | 只依赖 Entity 和 Repository 抽象 |
| **接口适配器层** | `data/repositories/`、`data/models/` | Repository 实现、JSON 模型、Provider 适配 | 依赖 Domain，实现抽象 |
| **框架与驱动层** | `presentation/screens/`、Dio、Hive | UI、网络、本地存储、第三方库 | 最外层，依赖所有内层 |

**内圈不知道外圈的存在**。`UserEntity` 不会 import `dio` 或 `flutter/material.dart`，`LoginUseCase` 只认识 `AuthRepository` 接口。依赖倒置之后，中间那层业务逻辑可以单独测，以后换网络库或数据库也不用改到 UI。

---

## 3. Screaming Architecture 的目录组织

传统的 MVC 或按类型分层（models/、views/、controllers/）的问题是，打开项目后看不出来它"是做什么的"。Screaming Architecture 要求 **目录先喊出业务功能**。

这个模板把每个业务功能都封装成一个自包含模块：

![单个 Feature 的 Screaming Architecture 结构](/images/flutter_arch_feature.png)

一个典型的 feature 长这样：

```text
lib/features/auth/
├── domain/
│   ├── entities/user_entity.dart
│   ├── repositories/auth_repository.dart
│   └── usecases/login_usecase.dart
├── data/
│   ├── datasources/auth_remote_datasource.dart
│   ├── models/user_model.dart
│   └── repositories/auth_repository_impl.dart
├── presentation/
│   ├── providers/auth_provider.dart
│   ├── screens/login_screen.dart
│   └── widgets/
└── providers/
    └── auth_providers.dart          # 数据层依赖注入
```

这种组织方式的好处：

1. **边界清晰**：改登录功能，基本只在 `auth/` 目录里动。
2. **可删除**：一个 feature 不要了，直接删掉整个目录，不会留下零散的引用。
3. **可并行开发**：两个人分别做 `auth` 和 `survey`，冲突概率低。

---

## 4. 一次数据请求的完整生命周期

在贴代码之前，先理解一条请求是怎么从最外层 UI 走到最内层 Domain，再返回状态的。

![一次数据请求的完整生命周期](/images/flutter_arch_flow.png)

流程说明：

1. **Screen** 触发事件，比如用户点击登录按钮。
2. **Provider (Notifier)** 接收事件，调用 UseCase。
3. **UseCase** 执行业务逻辑，调用 Repository 抽象。
4. **RepositoryImpl** 组合一个或多个 DataSource 完成实际数据获取。
5. **DataSource** 执行 Dio 请求、Hive 查询等具体操作。
6. 结果以 `Either<Failure, T>` 的形式逐层返回，UI 根据成功或失败渲染不同状态。

注意：UI 永远不直接碰 DataSource，UseCase 永远不直接碰 Dio。每一层只和相邻层打交道。

---

## 5. 完整代码示例：从 Domain 到 UI

下面以登录功能为例，把四层代码依次展开。代码做了精简，但保留了这套架构的主要模式。

### 5.1 Domain：定义业务对象和契约

`UserEntity` 是纯 Dart 类，没有任何框架依赖：

```dart
// features/auth/domain/entities/user_entity.dart
class UserEntity {
  final String id;
  final String email;
  final String name;

  const UserEntity({
    required this.id,
    required this.email,
    required this.name,
  });
}
```

`AuthRepository` 是抽象接口，定义了领域层需要的数据契约：

```dart
// features/auth/domain/repositories/auth_repository.dart
import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failure.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<Either<Failure, UserEntity>> login({
    required String email,
    required String password,
  });

  Future<Either<Failure, void>> logout();
}
```

`LoginUseCase` 是单一职责的业务逻辑单元。它只关心"登录需要做什么"，不关心数据从哪来：

```dart
// features/auth/domain/usecases/login_usecase.dart
import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failure.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class LoginUseCase {
  final AuthRepository _repository;

  const LoginUseCase(this._repository);

  Future<Either<Failure, UserEntity>> call({
    required String email,
    required String password,
  }) {
    // 这里可以加入通用校验：格式检查、日志、埋点等
    return _repository.login(email: email, password: password);
  }
}
```

### 5.2 Data：实现数据层

`UserModel` 负责 JSON 和 Entity 之间的转换：

```dart
// features/auth/data/models/user_model.dart
import '../../domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.email,
    required super.name,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
    };
  }
}
```

`AuthRemoteDataSource` 封装具体的网络请求。它只负责"发请求"，不做业务判断：

```dart
// features/auth/data/datasources/auth_remote_datasource.dart
import 'package:dio/dio.dart';
import '../models/user_model.dart';

class AuthRemoteDataSource {
  final Dio _dio;

  AuthRemoteDataSource(this._dio);

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });

    return UserModel.fromJson(response.data['user']);
  }
}
```

`AuthRepositoryImpl` 是 Repository 接口的具体实现，它组合 DataSource，并把异常转换为 `Failure`：

```dart
// features/auth/data/repositories/auth_repository_impl.dart
import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failure.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;

  AuthRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, UserEntity>> login({
    required String email,
    required String password,
  }) async {
    try {
      final user = await _remoteDataSource.login(
        email: email,
        password: password,
      );
      return Right(user);
    } on DioException catch (e) {
      return Left(ServerFailure(message: e.message ?? '登录失败'));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    // 实现略
    return const Right(null);
  }
}
```

### 5.3 DI：用 Riverpod 组装依赖

`auth_providers.dart` 负责把 DataSource、Repository、UseCase 串起来。这是唯一知道"具体实现"的地方：

```dart
// features/auth/providers/auth_providers.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/datasources/auth_remote_datasource.dart';
import '../data/repositories/auth_repository_impl.dart';
import '../domain/usecases/login_usecase.dart';

// 1. 提供 Dio 实例（实际项目中通常放在 core/network）
final dioProvider = Provider<Dio>((ref) => Dio(BaseOptions(baseUrl: 'https://api.example.com')));

// 2. 提供 DataSource
final authRemoteDataSourceProvider = Provider((ref) {
  return AuthRemoteDataSource(ref.watch(dioProvider));
});

// 3. 提供 Repository 实现
final authRepositoryProvider = Provider((ref) {
  return AuthRepositoryImpl(ref.watch(authRemoteDataSourceProvider));
});

// 4. 提供 UseCase
final loginUseCaseProvider = Provider((ref) {
  return LoginUseCase(ref.watch(authRepositoryProvider));
});
```

Riverpod 的 `Provider` 在这里承担了依赖注入容器的角色。它让依赖关系显式化，并且天然支持覆盖（override），方便测试时注入 Mock。

### 5.4 Presentation：UI 只消费状态

`AuthNotifier` 用 Riverpod 2.0 的 `AsyncNotifier` 管理登录状态：

```dart
// features/auth/presentation/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/user_entity.dart';
import '../../providers/auth_providers.dart';

final authNotifierProvider = AsyncNotifierProvider<AuthNotifier, UserEntity?>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<UserEntity?> {
  @override
  Future<UserEntity?> build() async => null;

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();

    final useCase = ref.read(loginUseCaseProvider);
    final result = await useCase(email: email, password: password);

    result.fold(
      (failure) => state = AsyncError(failure.message, StackTrace.current),
      (user) => state = AsyncData(user),
    );
  }
}
```

`LoginScreen` 非常薄，只负责展示和转发事件：

```dart
// features/auth/presentation/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('登录')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(controller: _emailController, decoration: const InputDecoration(labelText: '邮箱')),
            TextField(controller: _passwordController, decoration: const InputDecoration(labelText: '密码'), obscureText: true),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: authState.isLoading
                  ? null
                  : () => ref.read(authNotifierProvider.notifier).login(
                        _emailController.text,
                        _passwordController.text,
                      ),
              child: authState.isLoading
                  ? const CircularProgressIndicator()
                  : const Text('登录'),
            ),
            if (authState.hasError)
              Text('错误：${authState.error}', style: const TextStyle(color: Colors.red)),
          ],
        ),
      ),
    );
  }
}
```

到这里，一个完整的请求链路就打通了。每一层的职责单一，修改任何一层都不会意外破坏另一层。

---

## 6. 为什么 Riverpod 特别适合 Clean Architecture

Riverpod 不是 Clean Architecture 的唯一选择，但它确实让一些事情更自然：

| Clean Architecture 需求 | Riverpod 的对应能力 |
|-------------------------|---------------------|
| 依赖注入 | `Provider`、`AsyncNotifierProvider` 显式声明依赖 |
| 依赖可覆盖 | `ProviderScope(overrides: [...])` 方便测试 |
| 状态生命周期 | Provider 随作用域自动销毁，避免内存泄漏 |
| 异步状态管理 | `AsyncValue` 统一处理 loading / error / data |
| 组合式依赖 | `ref.watch()` 自动重建依赖链 |

尤其是 `AsyncValue`，它把 UI 层从 `try/catch` 和 `isLoading` 标志位里解放出来，让 Screen 只关心三种状态：加载中、出错了、有数据。

---

## 7. 快速生成新功能

这个模板最让人省心的是 `generate_feature.sh`。新建功能不用再手动建十几个目录：

```bash
./generate_feature.sh --name order
```

执行后会生成：

```text
lib/features/order/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
├── data/
│   ├── datasources/
│   ├── models/
│   └── repositories/
├── presentation/
│   ├── providers/
│   ├── screens/
│   └── widgets/
├── providers/
│   └── order_providers.dart
└── tests/...
```

除此之外，模板还配了：

- `./rename_app.sh`：批量改应用名和包名。
- `./generate_icons.sh`：一张 1024x1024 图片生成全平台图标。
- GitHub Actions：自动跑测试和静态分析。

这些脚本说明作者想的不只是搭个架构，而是让这套东西在真实工程里能跑起来。

---

## 8. 什么时候用这个模板，什么时候不用

**适合的场景：**

- 中大型 Flutter 项目，生命周期超过半年。
- 团队多人协作，需要明确的代码边界。
- 业务复杂，需要大量单元测试保证核心逻辑。
- 未来可能要换网络库或本地存储方案。

**不太适合的场景：**

- 快速原型或一次性 demo，分层会带来额外样板代码。
- 极小型的工具类 APP，业务逻辑极少。
- 团队对 Riverpod 和函数式编程完全陌生，需要预留学习成本。

---

## 9. 总结

[ssoad/flutter_riverpod_clean_architecture](https://github.com/ssoad/flutter_riverpod_clean_architecture) 比一般的"Hello World"模板走得更远。它把 Clean Architecture 的分层、Screaming Architecture 的目录约定、Riverpod 的状态管理，以及一套工程化脚本放在了一起。

如果只能记三样东西：

1. **依赖指向内圈**：Entity 和 UseCase 保持纯 Dart，不依赖框架。
2. **功能即模块**：每个 feature 自带完整的四层结构，边界清晰。
3. **Riverpod 当胶水**：Provider 组装依赖，Notifier 管理状态，`AsyncValue` 简化 UI。

新项目选型架构，或者老项目想重构结构，都可以把它 fork 下来看看。至少，看完你会对"Flutter 项目到底该怎么分层"有个更具体的答案。
