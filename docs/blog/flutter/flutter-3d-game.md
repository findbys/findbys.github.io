---
title: Flutter 3D 游戏开发实战：用 three_dart 从旋转立方体到完整小游戏
description: 不依赖 Unity，不嵌入原生引擎，仅用 Flutter + three_dart 构建一个可运行的 3D 小游戏。从场景搭建、渲染循环、输入交互到碰撞计分，完整代码与真实渲染截图一应俱全。
date: 2026-08-24
category: Flutter
readTime: 22 min
tags: ['Flutter', 'three_dart', '3D 游戏', 'flutter_gl', '游戏开发']
---

# Flutter 3D 游戏开发实战：用 three_dart 从旋转立方体到完整小游戏

Flutter 做 APP 已经很顺手，但一提到 3D 游戏，很多人第一反应就是"得换 Unity"。其实如果只是轻量级的 3D 小游戏、原型演示或者带 3D 交互的页面，完全可以在 Flutter 里直接跑起来。

这篇文章参考了那篇 [Flutter Dio 网络封装实战](https://mp.weixin.qq.com/s/0Zs7cp5ct8OSbNa6Spbpfg) 的写法思路：先讲清楚问题，再给出选型对比，然后逐段贴代码、逐段讲原理。主题换成 3D 游戏，技术栈用 `three_dart` + `flutter_gl`，最后会交付一个可玩的"宝石接取"小游戏。

---

## 1. 为什么要在 Flutter 里做 3D 游戏？

先说明白边界：Flutter 本身是个 2D UI 框架，它并不自带 3D 渲染管线。如果你的目标是做大型 3D 开放世界，请直接上 Unity 或 Unreal，再用 `flutter_unity_widget` 嵌入。

但下面这几类场景，用纯 Flutter 做 3D 很划算：

- **小体量的 3D 休闲游戏**：接水果、跑酷、弹球、益智解谜，画面不复杂，规则简单。
- **带 3D 展示的营销页**：产品 360° 旋转、场景化配置器、互动介绍。
- **快速原型验证**：需要一周出 demo 给产品和投资人看，热重载比 Unity 构建快得多。
- **统一多端代码**：一套 Dart 代码同时跑在 iOS、Android、Web、桌面。

核心诉求就一句话：**"不用换技术栈，把 3D 能力补进来"**。

---

## 2. Flutter 3D 技术选型对比

市面上有几条路，先列张表看清楚：

| 方案 | 上手难度 | 性能 | 包体积 | 平台支持 | 适合场景 |
|------|----------|------|--------|----------|----------|
| **three_dart** | 低 | 中 | 小 | iOS / Android / Web / 桌面 | 轻量 3D 游戏、3D 展示页、原型 |
| **flutter_unity_widget** | 中 | 高 | 大 | iOS / Android | 重度 3D 游戏、Unity 项目复用 |
| **flame** | 低 | 中 | 小 | 全平台 | 2D 游戏为主，3D 能力有限 |
| **raylib + FFI** | 中 | 中高 | 中 | 视 FFI 封装而定 | 需要自定义渲染逻辑 |
| **flutter_gl 手写 OpenGL** | 高 | 高 | 小 | iOS / Android | 渲染层自研、特殊需求 |

我这次选的是 `three_dart`。原因很直接：

1. **纯 Dart 实现**，不需要把 Unity 打包进 APK。
2. **API 几乎照搬 Three.js**，如果你写过 Web 3D，迁移成本极低。
3. **three_dart_jsm** 提供了现成的 `ThreeDartWidget`，能直接嵌进 Flutter Widget 树。
4. 对我们这个"宝石接取"小游戏来说，性能完全够用。

---

## 3. 环境准备与第一个 3D 场景

### 3.1 添加依赖

在 `pubspec.yaml` 里加入下面三个包：

```yaml
dependencies:
  flutter:
    sdk: flutter
  three_dart: ^0.0.15
  three_dart_jsm: ^0.0.15
  flutter_gl: ^0.0.10
```

`three_dart` 是核心渲染库，`three_dart_jsm` 提供 `ThreeDartWidget`，`flutter_gl` 负责 OpenGL 上下文绑定。三者通常要一起用。

### 3.2 渲染一个旋转立方体

先搭一个最简页面：场景、相机、灯光、立方体、渲染循环。每一步都能单独看懂。

```dart
import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:three_dart/three_dart.dart' as THREE;
import 'package:three_dart_jsm/three_dart_jsm.dart' as THREE_JSM;

class RotatingCubePage extends StatefulWidget {
  const RotatingCubePage({super.key});

  @override
  State<RotatingCubePage> createState() => _RotatingCubePageState();
}

class _RotatingCubePageState extends State<RotatingCubePage> {
  late THREE.Scene scene;
  late THREE.PerspectiveCamera camera;
  late THREE.WebGLRenderer renderer;
  late THREE.Mesh cube;

  @override
  void initState() {
    super.initState();
    _initScene();
  }

  void _initScene() {
    // 1. 场景
    scene = THREE.Scene();
    scene.background = THREE.Color(0x0a0e1a);

    // 2. 相机：75° 视场角，近截面 0.1，远截面 1000
    camera = THREE.PerspectiveCamera(75, 1.0, 0.1, 1000);
    camera.position.set(0, 2.5, 7);
    camera.lookAt(THREE.Vector3(0, 0.5, 0));

    // 3. 灯光：环境光 + 方向光
    scene.add(THREE.AmbientLight(0xffffff, 0.5));
    final dirLight = THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    // 4. 地面：一个灰色网格平面
    final planeGeo = THREE.PlaneGeometry(12, 12);
    final planeMat = THREE.MeshStandardMaterial({'color': 0x1a2332});
    final plane = THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -math.pi / 2;
    scene.add(plane);

    // 5. 立方体
    final geometry = THREE.BoxGeometry(1.5, 1.5, 1.5);
    final material = THREE.MeshStandardMaterial({'color': 0x22d3ee});
    cube = THREE.Mesh(geometry, material);
    cube.position.set(0, 1.25, 0);
    scene.add(cube);
  }

  void _onAnimate(double delta) {
    // 每帧旋转一点
    cube.rotation.y += 0.015;
    cube.rotation.x += 0.008;
    renderer.render(scene, camera);
  }

  @override
  void dispose() {
    // 必须释放 WebGL 上下文，否则反复重建页面会崩溃
    renderer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();

    return Scaffold(
      body: THREE_JSM.ThreeDartWidget(
        onSetupRenderer: (r) => renderer = r,
        onAnimate: _onAnimate,
        scene: scene,
        camera: camera,
      ),
    );
  }
}
```

跑起来之后，你会看到一个立方体在深色背景上慢慢旋转，地面还有一点点反光。

![第一个 3D 场景：旋转立方体](/images/flutter_3d_cube.png)
*图 1：基础场景包含相机、环境光、方向光、网格地面和一个旋转立方体*

**关键点：**

- `ThreeDartWidget` 内部已经创建了 `WebGLRenderer`，我们通过 `onSetupRenderer` 拿到它的引用。
- 画面比例变化时，要同步更新 `camera.aspect`，否则画面会拉伸。
- `dispose()` 里一定要调用 `renderer.dispose()`。这是容易踩的坑：不释放 WebGL 上下文的话，iOS 上页面进出 8 次左右就会闪退。

---

## 4. 从小场景到小游戏：3D 宝石接取

### 4.1 玩法设计

规则很简单：

- 屏幕下方有一个挡板（Paddle）。
- 宝石从空中随机位置落下。
- 玩家拖动屏幕左右移动挡板。
- 接到宝石 +10 分；漏接 -1 点生命。
- 生命归零，游戏结束。

这是一个足够小的闭环，但能覆盖 3D 游戏开发的全部核心环节：**建模、输入、运动、碰撞、计分、HUD**。

![游戏运行画面：宝石接取](/images/flutter_3d_game.png)
*图 2：游戏场景包含网格地面、青色挡板、下落宝石和 HUD*

### 4.2 项目结构

```
lib/
├── main.dart
├── game/
│   ├── gem_game.dart          # 游戏主 Widget
│   ├── scene_manager.dart      # 3D 场景初始化
│   ├── game_loop.dart          # 更新逻辑：宝石运动、碰撞、计分
│   └── models.dart             # Paddle / Gem 数据模型
└── ui/
    └── hud.dart                # 得分与生命值 HUD
```

把 3D 渲染、游戏逻辑、UI 层拆开，后面加功能才不会乱。

### 4.3 场景初始化：地面、挡板、宝石

把刚刚的立方体替换成游戏元素：

```dart
import 'package:three_dart/three_dart.dart' as THREE;
import 'dart:math' as math;

class SceneManager {
  late THREE.Scene scene;
  late THREE.PerspectiveCamera camera;
  late THREE.Mesh paddle;
  final List<Gem> gems = [];

  SceneManager();

  void init() {
    scene = THREE.Scene();
    scene.background = THREE.Color(0x0a0e1a);

    camera = THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    camera.position.set(0, 3, 9);
    camera.lookAt(THREE.Vector3(0, 1.5, -2));

    // 灯光
    scene.add(THREE.AmbientLight(0xffffff, 0.45));
    final dirLight = THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 6, 5);
    scene.add(dirLight);

    // 地面：棋盘格可以用两个交替颜色的 Plane 拼成
    _buildFloor(12, 12);

    // 挡板
    paddle = THREE.Mesh(
      THREE.BoxGeometry(3.2, 0.35, 1.2),
      THREE.MeshStandardMaterial({'color': 0x06b6d4}),
    );
    paddle.position.set(0, 0.45, -1);
    scene.add(paddle);
  }

  void _buildFloor(int rows, int cols) {
    final cellW = 24.0 / cols;
    final cellH = 24.0 / rows;
    final darkMat = THREE.MeshStandardMaterial({'color': 0x0f1522});
    final lightMat = THREE.MeshStandardMaterial({'color': 0x182136});

    for (int i = 0; i < cols; i++) {
      for (int j = 0; j < rows; j++) {
        final cell = THREE.Mesh(
          THREE.PlaneGeometry(cellW - 0.05, cellH - 0.05),
          (i + j).isEven ? lightMat : darkMat,
        );
        cell.rotation.x = -math.pi / 2;
        cell.position.set(
          -12 + i * cellW + cellW / 2,
          0,
          -12 + j * cellH + cellH / 2,
        );
        scene.add(cell);
      }
    }
  }

  THREE.Mesh createGem(int colorHex) {
    final mesh = THREE.Mesh(
      THREE.OctahedronGeometry(0.55, 0),
      THREE.MeshStandardMaterial({
        'color': colorHex,
        'roughness': 0.3,
        'metalness': 0.4,
      }),
    );
    return mesh;
  }
}
```

`OctahedronGeometry` 比 `SphereGeometry` 更"钻石感"，而且面数少，对性能友好。宝石颜色用 `0xff4d6d`（红）、`0x4ade80`（绿）、`0x38bdf8`（蓝）、`0xfbbf24`（金）这种高饱和色，在深色背景下会很醒目。

---

## 5. 游戏循环、输入与碰撞

### 5.1 数据模型

```dart
class Paddle {
  double x = 0;
  double z = -1;
  static const width = 3.2;
}

class Gem {
  THREE.Mesh mesh;
  double speedY;
  bool caught = false;

  Gem({required this.mesh, required this.speedY});
}

class GameState {
  int score = 0;
  int hp = 10;
  bool isGameOver = false;
}
```

### 5.2 每一帧做什么

```dart
import 'dart:math' as math;
import 'package:three_dart/three_dart.dart' as THREE;

class GameLoop {
  final SceneManager scene;
  final GameState state;
  final void Function()? onUpdate;
  final _random = math.Random();

  double _spawnTimer = 0;

  GameLoop(this.scene, this.state, {this.onUpdate});

  void update(double delta) {
    if (state.isGameOver) return;

    // 1. 宝石下落
    for (final gem in scene.gems) {
      if (gem.caught) continue;
      gem.mesh.position.y -= gem.speedY * delta;
      gem.mesh.rotation.y += 1.5 * delta;
      gem.mesh.rotation.z += 0.8 * delta;
    }

    // 2. 碰撞检测：宝石与挡板
    final paddleX = scene.paddle.position.x;
    for (final gem in scene.gems) {
      if (gem.caught) continue;

      final g = gem.mesh.position;
      if (g.y < 0.55 && g.y > 0.15) {
        // 只需要判断水平距离
        if ((g.x - paddleX).abs() < Paddle.width / 2 + 0.4) {
          gem.caught = true;
          state.score += 10;
          _removeGem(gem);
        }
      }

      // 3. 漏接判定
      if (g.y < -1) {
        gem.caught = true;
        state.hp -= 1;
        _removeGem(gem);
        if (state.hp <= 0) state.isGameOver = true;
      }
    }

    // 4. 定时生成新宝石
    _spawnTimer += delta;
    if (_spawnTimer > 0.8) {
      _spawnTimer = 0;
      _spawnGem();
    }

    onUpdate?.call();
  }

  void _spawnGem() {
    final colors = [0xff4d6d, 0x4ade80, 0x38bdf8, 0xfbbf24, 0xc084fc];
    final mesh = scene.createGem(colors[_random.nextInt(colors.length)]);
    mesh.position.set(
      _random.nextDouble() * 8 - 4, // x 范围 [-4, 4]
      5.0,
      -_random.nextDouble() * 4 - 1, // z 范围 [-5, -1]
    );
    scene.scene.add(mesh);
    scene.gems.add(Gem(mesh: mesh, speedY: 2.0 + _random.nextDouble() * 1.5));
  }

  void _removeGem(Gem gem) {
    scene.scene.remove(gem.mesh);
    gem.mesh.geometry?.dispose();
    (gem.mesh.material as THREE.Material?)?.dispose();
    scene.gems.remove(gem);
  }

  void movePaddle(double dx) {
    scene.paddle.position.x += dx;
    scene.paddle.position.x = scene.paddle.position.x.clamp(-4.0, 4.0);
  }
}
```

**碰撞这里用了最简化的距离判断**。原因是挡板和宝石都不是复杂模型，不需要上物理引擎。水平方向差值小于 `(挡板半宽 + 宝石半径)` 就算接住。

### 5.3 输入：拖动移动挡板

Flutter 的触摸输入天然适合包一层 `GestureDetector`：

```dart
GestureDetector(
  onPanUpdate: (details) {
    // 把屏幕水平位移映射到挡板位置
    final dx = details.delta.dx / MediaQuery.of(context).size.width * 10;
    gameLoop.movePaddle(dx);
  },
  child: THREE_JSM.ThreeDartWidget(
    onSetupRenderer: (r) => renderer = r,
    onAnimate: _onAnimate,
    scene: sceneManager.scene,
    camera: sceneManager.camera,
  ),
)
```

`gameLoop.movePaddle` 里只要把 `paddle.position.x` 限制在 `[-4, 4]` 之间，别跑出屏幕就行。

---

## 6. HUD 与状态同步

3D 画面由 WebGL 绘制，Flutter Widget 只能"叠"在画布上方做 HUD。用 `Stack` 包一层就行：

```dart
import 'package:three_dart_jsm/three_dart_jsm.dart' as THREE_JSM;

@override
Widget build(BuildContext context) {
  return Scaffold(
    body: Stack(
      children: [
        THREE_JSM.ThreeDartWidget(
          onSetupRenderer: (r) => renderer = r,
          onAnimate: _onAnimate,
          scene: sceneManager.scene,
          camera: sceneManager.camera,
        ),
        Positioned(
          top: 12,
          left: 18,
          child: Text(
            '得分  ${state.score}',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Positioned(
          top: 12,
          right: 18,
          child: Row(
            children: [
              Text(
                '生命',
                style: TextStyle(color: Colors.white, fontSize: 22),
              ),
              SizedBox(width: 8),
              Container(
                width: 180,
                height: 18,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.cyanAccent),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: state.hp / 10,
                  child: Container(color: Colors.greenAccent),
                ),
              ),
            ],
          ),
        ),
        if (state.isGameOver)
          Center(
            child: Container(
              padding: EdgeInsets.all(24),
              color: Colors.black87,
              child: Text(
                '游戏结束\n最终得分：${state.score}',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 24),
              ),
            ),
          ),
      ],
    ),
  );
}
```

![动态视角下的 3D 游戏场景](/images/flutter_3d_gameplay.png)
*图 3：换个角度看，地面棋盘格、挡板和下落宝石的空间关系更清晰*

---

## 7. 性能优化与注意事项

把 demo 跑起来不难，但想让帧率稳在 60fps，下面几点要注意。

### 7.1 必须释放 WebGL 资源

前面已经强调过 `renderer.dispose()`。除此之外，不再使用的 `Geometry` 和 `Material` 也要手动 dispose，否则显存会持续增长。

```dart
gem.mesh.geometry?.dispose();
(gem.mesh.material as THREE.Material?)?.dispose();
```

### 7.2 不要每帧创建新对象

下面这种写法看着自然，但会把帧率拖死：

```dart
// 错误示范
void update(double delta) {
  final newPos = THREE.Vector3(x, y, z); // 每帧 new 一个 Vector3
  mesh.position.copy(newPos);
}
```

3D 游戏里每帧都会创建大量临时对象，GC 压力一上来，低端机立刻掉帧。正确做法是直接修改现有对象：

```dart
mesh.position.set(x, y, z);
mesh.rotation.y += delta;
```

### 7.3 合并相同材质的物体

如果场景里有 100 个完全一样的石头，不要创建 100 个独立 Mesh。用 `THREE.InstancedMesh` 一次绘制，能显著减少 draw call。

```dart
final geometry = THREE.BoxGeometry(0.5, 0.5, 0.5);
final material = THREE.MeshStandardMaterial({'color': 0x888888});
final mesh = THREE.InstancedMesh(geometry, material, 100);
```

### 7.4 合理设置 camera.near / far

把 `far` 设小一点，可以减少深度冲突（z-fighting），也能省一点 GPU。我们的小游戏 `far: 50` 就够了，没必要 `1000`。

### 7.5 Web 平台要单独测

`flutter_gl` 在 Web 上的适配偶尔会有纹理或上下文问题。如果目标包含 Web，建议尽早跑一次 Chrome 构建，别等到上线前才发现。

---

## 8. 总结

用 `three_dart` 在 Flutter 里做 3D 小游戏，整体流程并不复杂：

1. **`ThreeDartWidget` 负责把 WebGL 渲染结果变成 Flutter Widget**。
2. **用 Three.js 那一套 API 搭场景**：Scene、Camera、Light、Geometry、Material、Mesh。
3. **把游戏逻辑拆出去**：Paddle 移动、Gem 下落、碰撞计分、状态管理都不要在 Widget 里写。
4. **Flutter Widget 叠在 3D 画面上做 HUD**。
5. **记得 dispose，记得复用对象**。

它并不是要"取代 Unity"，而是让你**在不换技术栈的前提下，快速补齐 Flutter 的 3D 能力**。中小型 3D 游戏、产品展示页、互动原型，用它都够。

如果你已经跑通了旋转立方体，下一步可以试着加这些：

- 给宝石加粒子拖尾（用 Points 或 Sprite）。
- 加音效与震动反馈。
- 用 `InstancedMesh` 做一个真正的"宝石雨"。
- 把相机改成跟随挡板的轨道视角。

3D 游戏的坑不会比 2D 多多少，关键是有个能跑起来的最小闭环，再一圈一圈往外扩。
