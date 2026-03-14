# Feishu Sheets 技能

飞书电子表格完整操作技能 - 支持官方文档所有 **50+ API 接口**。

## 功能分类

### 📊 表格操作 (spreadsheet)
- `create_spreadsheet` - 创建电子表格
- `get_info` - 获取表格基本信息
- `update_spreadsheet` - 修改表格属性

### 📑 工作表操作 (sheet)
- `list_sheets` - 获取所有工作表列表
- `update_sheet` - 更新工作表属性（名称/索引/隐藏）
- `move_dimension` - 移动行列

### 📝 数据读写 (values)
- `read_values` - 读取单个范围数据
- `read_values_batch` - 读取多个范围数据
- `insert_values` - 插入数据（prepend）
- `append_values` - 追加数据（append）
- `write_values` - 写入单个范围
- `write_values_batch` - 写入多个范围
- `clear_values` - 清空范围数据

### 📏 行列操作 (dimension)
- `insert_dimension` - 插入行列
- `add_dimension` - 增加行列
- `update_dimension` - 更新行列（行高列宽）
- `delete_dimension` - 删除行列

### 🎨 样式操作
- `set_cell_style` - 设置单元格样式
- `merge_cells` - 合并单元格
- `unmerge_cells` - 拆分单元格

### 🔍 查找替换
- `find_cells` - 查找单元格
- `replace_cells` - 替换单元格

### 🗂️ 筛选 (filter)
- `create_filter` - 创建筛选
- `get_filter` - 获取筛选
- `update_filter` - 更新筛选
- `delete_filter` - 删除筛选

### 📋 筛选视图 (filter_view)
- `create_filter_view` - 创建筛选视图
- `query_filter_views` - 查询筛选视图
- `get_filter_view` - 获取筛选视图
- `update_filter_view` - 更新筛选视图
- `delete_filter_view` - 删除筛选视图

### 🎯 条件格式 (condition_format)
- `create_condition_format` - 创建条件格式
- `get_condition_formats` - 获取条件格式
- `update_condition_format` - 更新条件格式
- `delete_condition_format` - 删除条件格式

### 🔒 保护范围 (protected_range)
- `add_protected_range` - 增加保护范围
- `get_protected_ranges` - 获取保护范围
- `update_protected_range` - 修改保护范围
- `delete_protected_range` - 删除保护范围

### ✅ 数据校验 (data_validation)
- `set_dropdown` - 设置下拉列表
- `query_dropdowns` - 查询下拉列表设置
- `update_dropdown` - 更新下拉列表设置
- `delete_dropdown` - 删除下拉列表设置

### 🖼️ 浮动图片 (float_image)
- `create_float_image` - 创建浮动图片
- `query_float_images` - 查询浮动图片
- `get_float_image` - 获取浮动图片
- `update_float_image` - 更新浮动图片
- `delete_float_image` - 删除浮动图片

### 🔐 权限管理
- `list_permissions` - 查看协作者权限列表
- `add_permission` - 添加协作者
- `remove_permission` - 移除协作者

### 📁 云盘操作
- `list_files` - 列出云盘文件
- `get_file_info` - 获取文件信息

## 配置方式

在 OpenClaw 配置文件中添加飞书应用凭证：

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_xxxxxxxxxxxxx",
      "appSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "connectionMode": "websocket",
      "domain": "feishu"
    }
  }
}
```

## 使用示例

### 获取工作表列表
```
feishu_sheets action=list_sheets token=RsocsKaUqhObFttylbscuPEInoe
```

### 读取数据
```
feishu_sheets action=read_values token=RsocsKaUqhObFttylbscuPEInoe sheet_id=9e553d range=A1:E10
```

### 写入数据
```
feishu_sheets action=write_values token=RsocsKaUqhObFttylbscuPEInoe sheet_id=9e553d range=A1:E1 values=[["姓名","年龄","城市"],["张三",25,"北京"],["李四",30,"上海"]]
```

### 添加协作者
```
feishu_sheets action=add_permission token=RsocsKaUqhObFttylbscuPEInoe member_type=openid member_id=ou_xxxxxxxxxxxxx perm=edit
```

### 创建筛选视图
```
feishu_sheets action=create_filter_view token=RsocsKaUqhObFttylbscuPEInoe sheet_id=9e553d title="我的视图" range=A1:Z100
```

### 设置条件格式
```
feishu_sheets action=create_condition_format token=xxx sheet_id=9e553d range=A1:A10 criteria={"type":"NUMBER_GREATER_THAN","value":"100"} format={"backgroundColor":{"red":1,"green":0,"blue":0}}
```

## 依赖

- @sinclair/typebox（参数验证）
- Node.js https 模块（内置）

## 移植说明

1. 将此技能目录复制到目标 OpenClaw 的 `workspace/skills/` 目录
2. 在目标 OpenClaw 配置中配置飞书应用凭证
3. 安装依赖：`npm install`
4. 重启网关：`openclaw gateway restart`
5. 技能自动加载，无需额外配置

## 注意事项

- **sheet_id** 必须通过 `list_sheets` 获取，不是工作表名称
- **写入数据** 使用 `values_prepend` 接口，会在指定范围上方插入新行
- **权限管理** 需要应用有足够的 scopes 权限
- **频率限制** 大部分接口 100 次/秒，部分接口 20 次/分钟
- **范围格式** `<sheetId>!<开始>:<结束>` 如 `9e553d!A1:B5`

## 完整文档

查看 `README.md` 获取详细 API 参考、参数说明和故障排查指南。
