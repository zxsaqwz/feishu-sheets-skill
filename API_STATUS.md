# Feishu Sheets API 状态说明

**更新日期：** 2026-03-13  
**基于：** 飞书开放平台官方文档

---

## ✅ 已验证可用 (Production Ready)

以下功能已经过充分测试，可以稳定使用：

### 表格操作
- ✅ `create_spreadsheet` - 创建电子表格
- ✅ `get_info` - 获取表格信息
- ✅ `update_spreadsheet` - 修改表格属性

### 工作表操作
- ✅ `list_sheets` - 获取工作表列表
- ✅ `update_sheet` - 更新工作表属性
- ✅ `move_dimension` - 移动行列

### 数据操作
- ✅ `read_values` - 读取单个范围
- ✅ `read_values_batch` - 读取多个范围
- ✅ `insert_values` - 插入数据 (prepend)
- ✅ `append_values` - 追加数据 (append)
- ✅ `write_values` - 写入单个范围
- ✅ `write_values_batch` - 写入多个范围
- ✅ `clear_values` - 清空范围

### 行列操作
- ✅ `insert_dimension` - 插入行列
- ✅ `add_dimension` - 增加行列
- ✅ `update_dimension` - 更新行列
- ✅ `delete_dimension` - 删除行列

### 样式操作
- ✅ `set_cell_style` - 设置单元格样式
- ✅ `merge_cells` - 合并单元格
- ✅ `unmerge_cells` - 拆分单元格

### 筛选
- ✅ `create_filter` - 创建筛选（需要 range, col, filter_type）
- ✅ `get_filter` - 获取筛选
- ✅ `update_filter` - 更新筛选
- ✅ `delete_filter` - 删除筛选

### 筛选视图
- ✅ `create_filter_view` - 创建筛选视图
- ✅ `query_filter_views` - 查询筛选视图
- ✅ `get_filter_view` - 获取筛选视图
- ✅ `update_filter_view` - 更新筛选视图
- ✅ `delete_filter_view` - 删除筛选视图

### 条件格式
- ✅ `get_condition_formats` - 获取条件格式
- ⚠️ `create_condition_format` - 需要特定参数格式
- ⚠️ `update_condition_format` - 需要特定参数格式
- ⚠️ `delete_condition_format` - 需要特定参数格式

### 权限管理
- ✅ `list_permissions` - 获取权限列表
- ✅ `add_permission` - 添加协作者
- ✅ `remove_permission` - 移除协作者

### 云盘操作
- ✅ `list_files` - 列出云盘文件
- ✅ `get_file_info` - 获取文件信息

---

## ⚠️ 需要特定参数格式

以下功能 API 可用，但需要特定的参数格式，建议参考官方文档使用：

### 保护范围
**API 路径：** `/open-apis/sheets/v2/spreadsheets/{token}/protected_dimension`

**正确参数格式：**
```json
{
  "sheet_id": "9e553d",
  "protected_range": {
    "range": "9e553d!A1:B5",
    "description": "保护说明"
  }
}
```

**注意：** 不是直接传 `range` 和 `description`，需要嵌套在 `protected_range` 对象中。

### 数据校验 (下拉列表)
**API 路径：** `/open-apis/sheets/v2/spreadsheets/{token}/dataValidation`

**查询参数：**
- 使用 `range` 参数，不是 `sheet_id`
- 示例：`?range=9e553d!A1:C10`

**设置参数格式：**
```json
{
  "range": "9e553d!D1:D10",
  "data_validation_rule": {
    "type": "ONE_OF_LIST",
    "values": ["选项 1", "选项 2", "选项 3"]
  }
}
```

### 查找单元格
**API 路径：** `/open-apis/sheets/v3/spreadsheets/{token}/sheets/{sheet_id}/find`

**正确参数格式：**
```json
{
  "find_condition": {
    "value": "查找内容",
    "match_criteria": {
      "match_case": false,
      "match_entire_cell": false
    }
  }
}
```

**注意：** 不是 `find: { value: 'xxx' }`，而是 `find_condition` 对象。

---

## ❌ 需要进一步调试

以下功能在测试中遇到问题，需要参考官方文档进一步调试：

### 增加保护范围
- API 返回：`Missing required parameter: AddProtectedDimension`
- 可能需要使用不同的 API 路径或参数结构

### 设置下拉列表
- API 返回：`invalid dataValidationType`
- 需要确认正确的参数格式

---

## 📖 官方文档参考

- 电子表格概述：https://open.feishu.cn/document/ukTMukTMukTM/uATMzUjLwEzM14CMxMTN/overview
- 条件格式：https://open.feishu.cn/document/ukTMukTMukTM/uATMzUjLwEzM14CMxMTN/conditionformat/condition-format-set
- 保护范围：https://open.feishu.cn/document/ukTMukTMukTM/ugDNzUjL4QzM14CO0MTN
- 数据校验：https://open.feishu.cn/document/ukTMukTMukTM/uATMzUjLwEzM14CMxMTN/datavalidation/set-dropdown
- 查找替换：https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/find

---

## 💡 使用建议

### 推荐直接使用
以下功能已充分验证，可以放心使用：
- 所有数据操作（读/写/插入/追加）
- 工作表管理
- 筛选视图
- 权限管理

### 建议参考文档使用
以下功能建议使用前查看官方文档：
- 条件格式（参数复杂）
- 保护范围（参数嵌套）
- 数据校验（参数格式特殊）
- 查找替换（参数结构特殊）

### 调试技巧
1. 使用飞书开放平台的 **API 调试工具** 测试参数
2. 查看返回的错误信息中的 `field_violations` 字段
3. 参考官方文档的 **请求体示例**

---

## 🔄 更新计划

- [ ] 保护范围 API 参数调试
- [ ] 数据校验 API 参数调试
- [ ] 查找替换 API 参数调试
- [ ] 添加更多使用示例
- [ ] 补充错误处理
