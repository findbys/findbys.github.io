---
title: CSS 动画基础详细教程：从 transition 到 keyframes
description: 系统讲解 CSS 动画基础，包括 transition、transform、animation、keyframes、缓动函数、性能优化和常见实战效果。
---

# CSS 动画基础详细教程：从 transition 到 keyframes

CSS 动画看起来很炫，但底层其实不复杂。

你可以先记住一句话：

> CSS 动画就是让元素的某些样式，在一段时间里从一个状态变化到另一个状态。

比如按钮从浅色变深色，卡片从下方浮上来，图标轻轻旋转，弹窗从透明变清晰，这些本质都是“样式变化”。

这篇文章会从最基础的 `transition` 讲到 `animation` 和 `@keyframes`，再讲动画性能和实战写法。

## CSS 动画主要有两种方式

CSS 里最常用的动画方式有两类：

```text
transition：适合两个状态之间的过渡
animation：适合更复杂、可自动播放的动画
```

简单理解：

- `transition` 像“状态变化时顺滑一点”。
- `animation` 像“我提前写好一段动画剧本，让它自己播放”。

## transition：最简单的动画

先看一个按钮：

```html
<button class="btn">Hover me</button>
```

```css
.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  background: #222;
  color: #fff;
  transition: background 0.25s ease, transform 0.25s ease;
}

.btn:hover {
  background: #f4c36f;
  transform: translateY(-2px);
}
```

这段代码的意思是：

1. 正常状态下，按钮是黑色。
2. 鼠标移上去，按钮变成金色，并向上移动 2px。
3. 因为设置了 `transition`，所以变化不是瞬间完成，而是在 `0.25s` 内平滑完成。

## transition 的基本语法

完整写法是：

```css
transition: property duration timing-function delay;
```

分别表示：

```text
property         要过渡的属性
duration         动画持续时间
timing-function  速度曲线
delay            延迟多久开始
```

例子：

```css
.box {
  transition: opacity 0.3s ease 0.1s;
}
```

意思是：

- 让 `opacity` 变化时产生过渡。
- 持续 `0.3s`。
- 使用 `ease` 曲线。
- 延迟 `0.1s` 开始。

## 同时过渡多个属性

可以这样写：

```css
.card {
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}
```

也可以偷懒：

```css
.card {
  transition: all 0.25s ease;
}
```

但实际项目里更推荐写具体属性。

原因是：

> `all` 可能会把不该动画的属性也带上，造成性能问题或奇怪的过渡效果。

## 哪些属性适合做动画

最推荐做动画的是：

```text
transform
opacity
```

比如：

```css
.box {
  transform: translateX(20px) scale(1.1);
  opacity: 0.8;
}
```

为什么推荐它们？

因为浏览器处理 `transform` 和 `opacity` 通常更高效，不容易触发布局重排。

不太推荐频繁动画的属性：

```text
width
height
top
left
margin
padding
```

不是说不能用，而是它们更容易影响布局，动画多了可能卡。

## transform：动画里的核心武器

`transform` 用来改变元素的形态和位置。

常见能力有：

```css
transform: translateX(20px);  /* 横向移动 */
transform: translateY(-10px); /* 纵向移动 */
transform: scale(1.1);        /* 缩放 */
transform: rotate(8deg);      /* 旋转 */
transform: skewX(10deg);      /* 倾斜 */
```

可以组合：

```css
.card:hover {
  transform: translateY(-6px) scale(1.02);
}
```

注意顺序会影响结果：

```css
transform: translateX(20px) rotate(10deg);
```

和：

```css
transform: rotate(10deg) translateX(20px);
```

视觉结果可能不一样。

如果你刚开始学，不用纠结太深，只要先记住：

> 多个 transform 可以连着写，但顺序会参与计算。

## transform-origin：控制旋转和缩放的中心

默认情况下，元素围绕自己的中心旋转。

```css
.box {
  transform-origin: center;
}
```

你也可以改成左上角：

```css
.box {
  transform-origin: left top;
}
```

比如一个箭头围绕尖端旋转，就可以设置旋转中心：

```css
.arrow {
  transform-origin: 90% 50%;
}
```

这个属性在做图标、指针、卡片翻转时很有用。

## timing-function：动画速度曲线

动画不是只看“多久完成”，还要看“怎么完成”。

常见曲线：

```css
transition-timing-function: linear;
transition-timing-function: ease;
transition-timing-function: ease-in;
transition-timing-function: ease-out;
transition-timing-function: ease-in-out;
```

它们的直觉是：

```text
linear       匀速
ease         默认自然变化
ease-in      慢慢开始
ease-out     快速开始，慢慢停下
ease-in-out  慢开始，慢结束
```

日常 UI 动画里，`ease-out` 很常用。

比如元素入场：

```css
.panel {
  transition: transform 0.28s ease-out, opacity 0.28s ease-out;
}
```

因为现实世界里很多移动都是“快起来，然后慢慢停住”，所以 `ease-out` 会更自然。

## cubic-bezier：自定义速度曲线

如果内置曲线不够用，可以用 `cubic-bezier`。

```css
.card {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
```

不用一开始就记四个参数的数学意义。

你可以先理解为：

> `cubic-bezier` 是更细腻的动画手感调节器。

常见好用的曲线：

```css
/* 温柔、有弹性但不夸张 */
cubic-bezier(0.22, 1, 0.36, 1)

/* 干脆利落 */
cubic-bezier(0.4, 0, 0.2, 1)

/* 轻微回弹 */
cubic-bezier(0.34, 1.56, 0.64, 1)
```

如果你不知道选哪个，UI 过渡可以先用：

```css
ease-out
```

再慢慢调。

## animation：更完整的动画剧本

`transition` 适合从 A 状态到 B 状态。

但如果你想让元素自动播放、循环、分阶段变化，就要用 `animation`。

比如一个加载点：

```html
<div class="dot"></div>
```

```css
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f4c36f;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}
```

这里的 `pulse` 就是一段动画剧本。

## animation 的基本语法

常见写法：

```css
animation: name duration timing-function delay iteration-count direction fill-mode;
```

比如：

```css
.box {
  animation: fadeUp 0.6s ease-out 0.2s both;
}
```

拆开看：

```text
fadeUp   动画名称
0.6s     持续时间
ease-out 速度曲线
0.2s     延迟
both     动画前后都保留关键帧状态
```

更完整的拆分写法：

```css
.box {
  animation-name: fadeUp;
  animation-duration: 0.6s;
  animation-timing-function: ease-out;
  animation-delay: 0.2s;
  animation-fill-mode: both;
}
```

项目里两种写法都可以。

简单动画用简写，复杂动画用拆分写法更清楚。

## @keyframes：定义动画过程

`@keyframes` 用来定义动画从哪里来，到哪里去。

最简单：

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
```

也可以用百分比：

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}
```

百分比适合写多阶段动画。

比如扫光效果：

```css
@keyframes shine {
  0% {
    transform: translateX(-120%) skewX(-18deg);
  }

  60%, 100% {
    transform: translateX(120%) skewX(-18deg);
  }
}
```

## animation-fill-mode：动画结束后停在哪里

这是新手很容易忽略的属性。

比如：

```css
.title {
  animation: fadeUp 0.6s ease-out;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

如果没有 `animation-fill-mode`，动画结束后元素可能回到默认样式。

通常入场动画会写：

```css
.title {
  animation: fadeUp 0.6s ease-out both;
}
```

`both` 的意思是：

- 动画开始前，应用第一帧状态。
- 动画结束后，保留最后一帧状态。

很多入场动画都应该加 `both`。

## animation-delay：做错峰动画

错峰动画可以让一组元素更有层次。

```html
<div class="list">
  <div class="item">A</div>
  <div class="item">B</div>
  <div class="item">C</div>
</div>
```

```css
.item {
  opacity: 0;
  animation: fadeUp 0.5s ease-out both;
}

.item:nth-child(1) {
  animation-delay: 0s;
}

.item:nth-child(2) {
  animation-delay: 0.08s;
}

.item:nth-child(3) {
  animation-delay: 0.16s;
}
```

效果就是：A、B、C 依次出现。

这个技巧非常适合：

- 卡片列表
- 导航菜单
- 标签云
- 首页首屏文字

## hover 动画实战：卡片上浮

这是最常见的 UI 动画之一。

```html
<article class="card">
  <h3>CSS Animation</h3>
  <p>Learn animation from basics.</p>
</article>
```

```css
.card {
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fff;
  transition:
    transform 0.25s ease-out,
    box-shadow 0.25s ease-out,
    border-color 0.25s ease-out;
}

.card:hover {
  transform: translateY(-6px);
  border-color: rgba(244, 195, 111, 0.5);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}
```

这个动画的重点是：

- 移动用 `transform`。
- 阴影和边框只做轻微变化。
- 时间不要太长，`0.2s` 到 `0.3s` 通常够了。

## 入场动画实战：内容从下方浮现

```css
.hero-title {
  opacity: 0;
  animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.hero-desc {
  opacity: 0;
  animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
}

.hero-actions {
  opacity: 0;
  animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.24s both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

这里通过延迟时间，让标题、描述、按钮依次出现。

这类动画高级感的关键不是“动得多”，而是：

> 节奏清楚，位移克制，透明度自然。

## 循环动画实战：漂浮效果

```css
.floating-icon {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}
```

漂浮动画适合装饰元素。

注意不要太快，否则容易廉价。

建议：

```text
持续时间：3s 到 6s
位移距离：4px 到 12px
曲线：ease-in-out
```

## 扫光动画实战

扫光常用于按钮、标题、徽标。

```html
<span class="shine-text">Creative Space</span>
```

```css
.shine-text {
  position: relative;
  display: inline-block;
  overflow: hidden;
  font-weight: 700;
}

.shine-text::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 0%,
    transparent 38%,
    rgba(255, 255, 255, 0.55) 48%,
    transparent 58%,
    transparent 100%
  );
  transform: translateX(-120%) skewX(-16deg);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0%, 45% {
    transform: translateX(-120%) skewX(-16deg);
  }

  75%, 100% {
    transform: translateX(120%) skewX(-16deg);
  }
}
```

扫光动画很容易过度。

要想高级一点：

- 不要一直高亮。
- 中间留足停顿。
- 光线透明度不要太强。

## 加载动画实战：三个点

```html
<div class="loading">
  <span></span>
  <span></span>
  <span></span>
</div>
```

```css
.loading {
  display: flex;
  gap: 6px;
  align-items: center;
}

.loading span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f4c36f;
  animation: loadingDot 0.9s ease-in-out infinite;
}

.loading span:nth-child(2) {
  animation-delay: 0.12s;
}

.loading span:nth-child(3) {
  animation-delay: 0.24s;
}

@keyframes loadingDot {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
```

这个例子结合了：

- `animation`
- `@keyframes`
- `nth-child`
- `animation-delay`

是很适合练手的小动画。

## 性能优化：动画为什么会卡

浏览器渲染页面，大致会经历这些阶段：

```text
样式计算 -> 布局 -> 绘制 -> 合成
```

如果你动画的是 `width`、`height`、`top`、`left`，可能会让浏览器反复重新布局。

如果你动画的是 `box-shadow`、`filter`，可能会增加绘制压力。

如果你动画的是 `transform`、`opacity`，通常更容易走合成层，性能更稳定。

所以常见建议是：

```text
移动：优先 transform: translate
缩放：优先 transform: scale
旋转：优先 transform: rotate
淡入淡出：优先 opacity
```

## will-change 要谨慎使用

你可能见过：

```css
.box {
  will-change: transform;
}
```

它是在告诉浏览器：

> 这个元素接下来可能要变化，请提前做准备。

但不要到处加。

`will-change` 用多了会占用更多内存。

适合用在少量、明确会动画的核心元素上：

```css
.cursor,
.hero-card {
  will-change: transform;
}
```

不要这样：

```css
* {
  will-change: transform;
}
```

这不是优化，是给浏览器添堵。

## 尊重用户的减少动态偏好

有些用户不喜欢强动画，甚至会因为动画感到不适。

CSS 提供了媒体查询：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

如果是比较重的动画，比如大面积位移、闪烁、视差滚动，最好考虑这个设置。

动画是体验增强，不应该变成体验负担。

## 写 CSS 动画的判断流程

你可以按这个顺序想：

```text
1. 只是 hover、active、展开收起？
   用 transition。

2. 需要自动播放、循环、多阶段？
   用 animation + keyframes。

3. 是移动、缩放、旋转、透明度？
   优先 transform 和 opacity。

4. 动画很多或者元素很多？
   注意性能，减少 layout 和 paint。

5. 动画会不会影响阅读？
   控制节奏，避免过度。
```

## 最后总结

CSS 动画并不神秘。

先记住这几个核心点：

```text
transition：两个状态之间的平滑过渡
animation：一段完整的动画剧本
@keyframes：定义动画过程
transform：移动、缩放、旋转的核心工具
opacity：淡入淡出的核心工具
timing-function：决定动画手感
```

如果你想让动画更高级，不一定要加很多效果。

更重要的是：

- 动得有理由。
- 节奏要舒服。
- 幅度要克制。
- 性能要稳定。
- 不要打扰用户完成任务。

好的 CSS 动画应该像一个细心的引导者，让用户更自然地理解界面发生了什么，而不是抢走用户的注意力。
