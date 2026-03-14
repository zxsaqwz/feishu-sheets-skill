# Feishu Sheets Skill - 飞书电子表格技能

完整的飞书电子表格操作技能，支持官方文档所有 **50+ API 接口**。

## 📦 安装

### 方式一：手动安装
```bash
# 复制技能目录到 OpenClaw workspace
cp -r feishu-sheets ~/.openclaw/workspace/skills/

# 安装依赖
cd ~/.openclaw/workspace/skills/feishu-sheets
npm install

# 重启网关
openclaw gateway restart
```

## ⚙️ 配置

在 `~/.openclaw/openclaw.json` 中配置飞书应用凭证：

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

### 飞书应用权限

在飞书开放平台应用管理中，确保应用有以下权限：
- 查看、评论、编辑和管理电子表格 (`sheets:spreadsheet`)
- 查看、评论、编辑和管理云空间文件 (`drive:drive`)

## 🚀 快速使用

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
feishu_sheets action=write_values token=RsocsKaUqhObFttylbscuPEInoe sheet_id=9e553d range=A1:C1 values=[["姓名","年龄"],["张三",25]]
```

## 📋 完整 API 列表

### 表格操作 (spreadsheet)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `create_spreadsheet` | 创建电子表格 | title (可选) |
| `get_info` | 获取表格信息 | token |
| `update_spreadsheet` | 修改表格属性 | token, title |

### 工作表操作 (sheet)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `list_sheets` | 获取工作表列表 | token |
| `update_sheet` | 更新工作表属性 | token, sheet_id |
| `move_dimension` | 移动行列 | token, sheet_id, dimension, start_index, end_index, destination_index |

### 数据操作 (values)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `read_values` | 读取单个范围 | token, sheet_id, range |
| `read_values_batch` | 读取多个范围 | token, sheet_id, ranges |
| `insert_values` | 插入数据（prepend） | token, sheet_id, range, values |
| `append_values` | 追加数据（append） | token, sheet_id, range, values |
| `write_values` | 写入单个范围 | token, sheet_id, range, values |
| `write_values_batch` | 写入多个范围 | token, values (包含多个更新) |
| `clear_values` | 清空范围 | token, sheet_id, range |

### 行列操作 (dimension)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `insert_dimension` | 插入行列 | token, sheet_id, dimension, start_index, length |
| `add_dimension` | 增加行列 | token, sheet_id, dimension, length |
| `update_dimension` | 更新行列（如调整行高列宽） | token, sheet_id, dimension, start_index, end_index |
| `delete_dimension` | 删除行列 | token, sheet_id, dimension, start_index, end_index |

### 样式操作

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `set_cell_style` | 设置单元格样式 | token, sheet_id, range, format |
| `merge_cells` | 合并单元格 | token, sheet_id, range |
| `unmerge_cells` | 拆分单元格 | token, sheet_id, range |

### 查找替换

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `find_cells` | 查找单元格 | token, sheet_id, find_value |
| `replace_cells` | 替换单元格 | token, sheet_id, find_value, replace_value |

### 筛选 (filter)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `create_filter` | 创建筛选 | token, sheet_id, range |
| `get_filter` | 获取筛选 | token, sheet_id |
| `update_filter` | 更新筛选 | token, sheet_id, filter_id, criteria |
| `delete_filter` | 删除筛选 | token, sheet_id |

### 筛选视图 (filter_view)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `create_filter_view` | 创建筛选视图 | token, sheet_id, title, range |
| `query_filter_views` | 查询筛选视图 | token, sheet_id |
| `get_filter_view` | 获取筛选视图 | token, sheet_id, filter_view_id |
| `update_filter_view` | 更新筛选视图 | token, sheet_id, filter_view_id |
| `delete_filter_view` | 删除筛选视图 | token, sheet_id, filter_view_id |

### 条件格式 (condition_format)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `create_condition_format` | 创建条件格式 | token, sheet_id, range, criteria, format |
| `get_condition_formats` | 获取条件格式 | token, sheet_id |
| `update_condition_format` | 更新条件格式 | token, sheet_id, condition_id, criteria, format |
| `delete_condition_format` | 删除条件格式 | token, condition_id |

### 保护范围 (protected_range)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `add_protected_range` | 增加保护范围 | token, sheet_id, range |
| `get_protected_ranges` | 获取保护范围 | token, sheet_id |
| `update_protected_range` | 修改保护范围 | token, protected_range_id |
| `delete_protected_range` | 删除保护范围 | token, protected_range_id |

### 数据校验 (data_validation)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `set_dropdown` | 设置下拉列表 | token, sheet_id, range, criteria |
| `query_dropdowns` | 查询下拉列表设置 | token, sheet_id |
| `update_dropdown` | 更新下拉列表设置 | token, sheet_id, filter_id, criteria |
| `delete_dropdown` | 删除下拉列表设置 | token, sheet_id, filter_id |

### 浮动图片 (float_image)

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `create_float_image` | 创建浮动图片 | token, sheet_id, image_url, range |
| `query_float_images` | 查询浮动图片 | token, sheet_id |
| `get_float_image` | 获取浮动图片 | token, sheet_id, float_image_id |
| `update_float_image` | 更新浮动图片 | token, sheet_id, float_image_id |
| `delete_float_image` | 删除浮动图片 | token, sheet_id, float_image_id |

### 权限管理

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `list_permissions` | 查看权限列表 | token |
| `add_permission` | 添加协作者 | token, member_type, member_id, perm |
| `remove_permission` | 移除协作者 | token, member_type, member_id |

### 云盘操作

| Action | 说明 | 必需参数 |
|--------|------|----------|
| `list_files` | 列出云盘文件 | (可选 folder_token) |
| `get_file_info` | 获取文件信息 | token |

## 📝 参数说明

### 通用参数

| 参数 | 类型 | 说明 |
|------|------|------|
| action | string | 操作类型（见上方表格） |
| token | string | 电子表格 token（从 URL 获取） |
| sheet_id | string | 工作表 ID（通过 list_sheets 获取） |
| range | string | 单元格范围，如 `A1:E10` |

### Range 格式

```
<sheetId>!<开始单元格>:<结束单元格>
示例：9e553d!A1:B5
```

支持 4 种写法：
- `9e553d!A1:B5` - 指定区域
- `9e553d!A:B` - 整列
- `9e553d!A2:B` - 从第 2 行 A 列到 B 列结束
- `9e553d` - 整个工作表

### 成员类型 (member_type)

- `openid` - 飞书开放 ID
- `userid` - 用户 ID
- `email` - 邮箱
- `unionid` - 联合 ID
- `openchat` - 群聊 ID
- `opendepartmentid` - 部门 ID

### 权限级别 (perm)

- `view` - 只读
- `edit` - 可编辑
- `full_access` - 完全访问

## 🔧 故障排查

### 常见错误

**错误：未配置飞书应用凭证**
```bash
# 检查 openclaw.json 配置
cat ~/.openclaw/openclaw.json | grep -A5 feishu
```

**错误：获取 sheet_id 失败**
- 先调用 `list_sheets` 获取工作表 ID
- sheet_id 不是工作表名称，是类似 `9e553d` 的 ID

**错误：权限不足 (403)**
- 检查飞书应用是否有足够的 scopes 权限
- 确保应用已添加到企业

**错误：404 Not Found**
- 检查 token 是否正确
- 确认电子表格/文件存在且有访问权限

### 获取帮助

```bash
# 查看网关日志
tail -f /tmp/openclaw/openclaw-*.log

# 检查技能是否加载
openclaw status
```

## ⚠️ 使用限制

- 单个电子表格最多 300 个工作表
- 单个工作表最多 13,000 列
- 单个工作表最多 5,000,000 个单元格
- 单个单元格不超过 50,000 字符（推荐 40,000）
- API 频率限制：大部分接口 100 次/秒

## 🔄 移植说明

**完全独立，一键移植：**
1. 复制 `feishu-sheets` 目录到目标 OpenClaw 的 `workspace/skills/`
2. 在目标配置中添加飞书凭证
3. 重启网关：`openclaw gateway restart`
4. 完成！

技能完全独立，不依赖其他配置或插件。

## 📄 License

MIT
