# More Color Mouse (更多色彩光标)

![Foundry VTT Version](https://img.shields.io/badge/Foundry%20VTT-v14%2B-brightgreen)
![Downloads](https://img.shields.io/github/downloads/Heldea-xianmiao/more-color-mouse-fvtt-mod/total)

为 Foundry VTT 添加多彩的自定义鼠标光标和绚丽的拖尾特效。让你的鼠标指针不再单调！

## 功能特性 (Features)

本模组允许每位玩家在客户端自行配置鼠标光标的样式，主要功能包括：

*   **自定义光标外观**
    *   **多种形状**：内置 12 种几何形状，包括圆形、空心圆环、正方形、星星、爱心、三角形、菱形、十字准心、箭头、月牙、五边形、六边形。
    *   **自定义图片**：支持上传并使用自己的 PNG 图片作为鼠标光标。
    *   **尺寸调节**：自由调整光标的大小。

*   **炫彩颜色模式**
    *   **彩虹模式**：开启后光标颜色会随时间不断流转变化，形成彩虹效果。
    *   **静态颜色**：关闭彩虹模式后，可指定一个固定的颜色。

*   **动态拖尾效果**
    *   **7 种拖尾样式**：线性拖尾、粒子发射、图片重复、光晕拖尾、丝带拖尾、虚线拖尾、圆点拖尾。
    *   **长度调节**：支持调节拖尾的停留时长。
    *   **8 种粒子预设**：扩散、火焰（上升）、雪花（下落）、魔法闪烁（静止闪耀）、气泡（上浮）、烟雾（飘散）、重力（抛物线）、闪电（瞬间）。

*   **沉浸式体验**
    *   **隐藏系统指针**：提供选项强制隐藏操作系统默认的鼠标指针，仅显示自定义光标。

*   **GM 广播功能**
    *   **GM 可设置并广播**自己的光标配置给所有在线玩家。
    *   **玩家可选择跟随**：开启后自动应用 GM 广播的光标设置，关闭则使用自己的独立配置。

*   **客户端独立配置**
    *   所有设置均为客户端级别，每位玩家（包括 GM 和玩家）都可以拥有自己独特的鼠标样式，互不干扰。

## 配置选项 (Settings)

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 启用自定义光标 | 总开关 | 开启 |
| 隐藏系统默认光标 | 强制隐藏系统鼠标指针 | 关闭 |
| 拖尾停留时间/长度 | 轨迹保留的帧数，数值越大拖尾越长 | 20 |
| 光标形状 | 12 种内置形状可选 | 圆形 |
| 自定义光标图片 | 上传 PNG 图片作为光标 | 无 |
| 光标大小 | 光标图形的半径或尺寸 | 8 |
| 彩虹模式 | 颜色自动循环变化 | 开启 |
| 光标颜色 | 彩虹模式关闭时的静态颜色 | 红色 |
| 拖尾颜色 | 单独设置拖尾颜色，留空则跟随光标颜色 | 无 |
| 自定义拖尾图片 | 图片重复样式使用的图片 | 无 |
| 拖尾样式 | 线性/粒子/图片/光晕/丝带/虚线/圆点 | 线性拖尾 |
| 粒子特效预设 | 8 种粒子行为预设 | 扩散 |
| 跟随房主的光标设置 | 玩家选择是否跟随 GM 广播的配置 | 关闭 |

## 技术优化 (Optimizations)

*   **智能动画调度**：禁用时完全停止动画循环，避免 CPU 空转。
*   **窗口 Resize 防抖**：使用 requestAnimationFrame 防抖，避免频繁重置 Canvas 导致闪烁。
*   **内存管理**：切换设置时自动清理残留粒子和轨迹数据。
*   **鼠标离开处理**：鼠标移出窗口时自动隐藏拖尾，避免边缘残留。
*   **零 jQuery 依赖**：全面使用原生 DOM API，兼容 Foundry VTT v14 AppV2。

## 安装说明 (Installation)

### 自动安装
1. 在 Foundry VTT 界面的 **Add-on Modules** 标签页中点击 **Install Module**。
2. 搜索 `More Color Mouse` 或直接输入 Manifest URL。

### 手动安装
1. 在 Manifest URL 框中输入：
   ```
   https://github.com/Heldea-xianmiao/more-color-mouse-fvtt-mod/releases/latest/download/module.json
   ```
2. 点击 **Install**。

## 使用方法 (Usage)

1. 启动并进入你的 Foundry VTT 世界。
2. 前往右侧边栏的 **Game Settings**。
3. 点击 **Configure Settings**。
4. 切换到 **Module Settings** 标签页。
5. 找到 **More Color Mouse** 并在菜单中调整你的偏好设置。
6. (GM 专用) 配置完成后，点击页面底部的广播按钮将设置同步给所有在线玩家。

## 更新日志 (Changelog)

### v1.3.0
- 修复 settings 保存后回退的 bug（时序问题 + onChange 异常保护）
- 禁用时完全停止动画循环，避免 CPU 空转
- 切换设置时自动清理残留粒子和轨迹数据
- 窗口 resize 添加 requestAnimationFrame 防抖
- 全面移除 jQuery 依赖，采用原生 DOM API
- 鼠标离开窗口时自动隐藏拖尾
- 设置项全面本地化，新增英文翻译
- 添加 .gitignore

### v1.2.0
- 优化粒子性能，新增粒子预设（火焰、雪花、魔法闪烁）
- 新增拖尾图片样式
- 修复已知 bug

### v1.1.0
- 初始版本发布

## 贡献与反馈

如果您发现任何 Bug 或有新功能建议，欢迎提交 [Issue](https://github.com/Heldea-xianmiao/more-color-mouse-fvtt-mod/issues)。

## License

MIT License
