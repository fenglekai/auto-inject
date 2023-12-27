# AutoInject

ModbusTCP 可视化图形界面连接工具。提供读写操作 api 接口；创建自定义流程任务。

[**接口文档**](./docs/接口说明.md)

## 界面预览

![录屏_auto-inject_20231107083710](https://gitee.com/feng-lekai/blog-image/raw/master/img/%E5%BD%95%E5%B1%8F_auto-inject_20231107083710.gif)

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
   - 写入 modbus 值
   - mongoDB 操作
   - 等待接口调用
   - 完成接口返回
4. 自定义任务流程步骤提供高扩展性任务
5. 任务流程步骤可动态调整，封装单独步骤流程
6. 日志输出
7. 编辑与导入导出任务流程
8. pkg 集成构建无 UI 版本的二进制可执行文件

## 将来实现

1. 优化任务步骤与 modbusTCP 与 mongoDB 频繁连接问题
2. 重置条件设置（目前默认完成任务等待三秒后开始执行监控任务中“监听 modbus 值状态”任务的值是否为“非监听值”，然后重新开始任务）

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
