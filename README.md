<div align="center">

![vutron-logo](src/renderer/public/images/vutron-logo.webp)

Quick Start Templates for **[Vite](https://vitejs.dev)** + **[Vue 3](https://vuejs.org)** + **[Electron](https://www.electronjs.org)**

**Vutron** is a preconfigured template for developing `Electron` cross-platform desktop apps. It uses `Vue 3` and allows you to build a fast development environment with little effort.

</div>

# AutoInject

ModbusTCP 可视化图形界面连接工具。提供读写操作 api 接口；创建自定义流程任务。

[**接口文档**](./docs/接口说明.md)

## 技术栈

- Electron
- Vue
- Vite
- Koa
- Socket.IO

基于 Vutron 开源项目二次开发

## 功能

1. 读取寄存器接口以及 websocket 监控 modbus 状态
2. 写入 modbus 值
3. 流程任务模块
   - 监听 modbus 值状态
   - 调用接口（POST、GET）
   - 写入 modbus 值步骤
4. 自定义任务流程步骤提供高扩展性任务
5. 任务流程步骤可动态调整，封装单独步骤流程
6. 日志输出
7. 编辑与导入导出任务流程
8. pkg 集成构建无 UI 版本的二进制可执行文件

## 将来实现

1. 添加调用 token 接口并储存到任务缓存步骤
2. 添加传入数据接口
3. 添加监控传入数据步骤
4. 优化任务步骤与 modbusTCP 与 mongoDB 频繁连接问题

## 快速开始

开发环境:

- linux
- node 16.16.0
- pnpm

```
pnpm install
pnpm dev
```

### Koa 后台单独启动

```
pnpm dev:server
```

## 构建方式

### 客户端构建

```
pnpm build:win
pnpm build:linux
```

### pkg 构建

```
pnpm pkg:win
pnpm pkg:linux
```

### 下载编译环境问题

1. 下载缓慢建议去https://github.com/vercel/pkg-fetch/releases下载离线包
2. 在命令行环境设置`export PKG_CACHE_PATH=/home/root/pkg_cache_path`
3. 再次运行构建命令会在预设目录下生成版本文件夹，把离线包放入该文件夹再次运行命令即可
