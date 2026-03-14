# Feishu Sheets 技能 - API 问题清单

**检查日期：** 2026-03-13  
**总 API 数：** 54 个

---

## ❌ 已知问题 API (需要修复)

### 1. 设置下拉列表 `set_dropdown` ❌

**问题：** 始终返回 `invalid dataValidationType`

**当前实现：**
```typescript
async setDropdown(token: string, range: string, values: string[]): Promise<LarkResponse> {
  return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/dataValidation`, {
    range,
    data_validation_type: 'ONE_OF_LIST',
    combo_values: values
  });
}
```

**错误响应：**
```json
{
  "code": 90204,
  "msg": "invalid dataValidationType"
}
```

**可能原因：**
- 参数结构不正确
- 需要使用嵌套的 `data_validation` 对象
- 参数名可能需要调整

**待尝试的格式：**
```json
{
  "range": "9e553d!A1:A10",
  "data_validation": {
    "type": "ONE_OF_LIST",
    "values": ["选项 1", "选项 2"]
  }
}
```

**状态：** ❌ 待修复  
**优先级：** 🔴 高

---

### 2. 获取保护范围 `getProtectedRanges` ❌

**问题：** 返回 `Missing required parameter: ProtectIds`

**当前实现：**
```typescript
async getProtectedRanges(token: string, sheetId: string): Promise<LarkResponse> {
  return this.request(accessToken, 'GET', 
    `/open-apis/sheets/v2/spreadsheets/${token}/protected_range_batch_get?sheet_ids=${sheetId}`);
}
```

**错误响应：**
```json
{
  "code": 9499,
  "msg": "Missing required parameter: ProtectIds"
}
```

**可能原因：**
- API 需要 `protect_ids` 路径参数，不是查询参数
- 可能需要先获取 protect_ids 列表

**待尝试的格式：**
```
GET /protected_range_batch_get?protect_ids=id1,id2
```

**状态：** ⚠️ 需要 protect_ids 参数  
**优先级：** 🟡 中

---

### 3. 更新下拉列表 `updateDropdown` ⚠️

**问题：** 未充分测试

**当前实现：**
```typescript
async updateDropdown(token: string, sheetId: string, dataValidationId: string, criteria: any)
```

**API 路径：**
```
PUT /dataValidation/{sheetId}/{dataValidationId}
```

**状态：** 📝 未测试  
**优先级：** 🟢 低

---

### 4. 删除下拉列表 `deleteDropdown` ⚠️

**问题：** 未充分测试

**当前实现：**
```typescript
async deleteDropdown(token: string, sheetId: string, dataValidationId: string)
```

**API 路径：**
```
DELETE /dataValidation/{sheetId}/{dataValidationId}
```

**状态：** 📝 未测试  
**优先级：** 🟢 低

---

### 5. 更新条件格式 `updateConditionFormat` ⚠️

**问题：** 参数格式复杂，未充分测试

**当前实现：**
```typescript
async updateConditionFormat(token: string, sheetId: string, conditionId: string, criteria: any, format: any)
```

**状态：** 📝 未测试  
**优先级：** 🟢 低

---

### 6. 浮动图片相关 (5 个 API) ⚠️

**功能列表：**
- `createFloatImage` - 创建浮动图片
- `queryFloatImages` - 查询浮动图片
- `getFloatImage` - 获取浮动图片
- `updateFloatImage` - 更新浮动图片
- `deleteFloatImage` - 删除浮动图片

**状态：** 📝 完全未测试  
**优先级：** 🟢 低

---

## ✅ 已验证可用 API (40+ 个)

### 核心功能 (100% 可用)

| 分类 | API 数 | 状态 |
|------|--------|------|
| 表格操作 | 3 | ✅ |
| 工作表 | 3 | ✅ |
| 数据读写 | 7 | ✅ |
| 行列操作 | 4 | ✅ |
| 样式操作 | 3 | ✅ |
| 筛选 | 4 | ✅ |
| 筛选视图 | 5 | ✅ |
| 权限管理 | 3 | ✅ |
| 云盘操作 | 2 | ✅ |
| 查找替换 | 2 | ✅ |

**小计：36 个 API 完全可用**

---

## ⚠️ 部分验证 API (6 个)

| 功能 | 验证状态 | 说明 |
|------|----------|------|
| 创建条件格式 | ✅ 已验证 | 使用 `style` 参数 |
| 获取条件格式 | ✅ 已验证 | 使用 `sheet_ids` 参数 |
| 更新条件格式 | 📝 未测试 | 参数复杂 |
| 删除条件格式 | 📝 未测试 | - |
| 增加保护范围 | ✅ 已验证 | 使用 `addProtectedDimension` |
| 获取保护范围 | ❌ 需 protect_ids | API 限制 |
| 更新保护范围 | 📝 未测试 | - |
| 删除保护范围 | 📝 未测试 | - |
| 查询下拉列表 | ✅ 已验证 | 使用 `range` 参数 |
| 设置下拉列表 | ❌ 参数错误 | `invalid dataValidationType` |
| 更新下拉列表 | 📝 未测试 | - |
| 删除下拉列表 | 📝 未测试 | - |

---

## 🔧 需要修复的代码

### 1. setDropdown - 尝试新格式

**修改位置：** index.ts 第 574 行

**建议修改：**
```typescript
async setDropdown(token: string, range: string, values: string[]): Promise<LarkResponse> {
  return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/dataValidation`, {
    range,
    data_validation: {  // 尝试嵌套格式
      type: 'ONE_OF_LIST',
      values
    }
  });
}
```

---

### 2. getProtectedRanges - 需要 protect_ids

**修改位置：** index.ts 第 547 行

**问题：** API 需要具体的 protect_ids 才能获取

**建议：** 此功能可能需要先通过其他方式获取 protect_ids，或者 API 本身设计如此。

---

## 📊 问题统计

| 状态 | 数量 | 百分比 |
|------|------|--------|
| ✅ 完全可用 | 36 | 67% |
| ⚠️ 部分验证 | 6 | 11% |
| ❌ 已知问题 | 2 | 4% |
| 📝 未测试 | 10 | 18% |
| **总计** | **54** | **100%** |

---

## 🎯 修复优先级

### 🔴 高优先级
1. **set_dropdown** - 核心功能，使用频率高

### 🟡 中优先级
2. **getProtectedRanges** - 需要特定参数

### 🟢 低优先级
3. **updateDropdown** - 未测试
4. **deleteDropdown** - 未测试
5. **updateConditionFormat** - 未测试
6. **浮动图片相关** - 未测试

---

## 💡 使用建议

### 推荐使用的功能
- ✅ 所有数据读写操作
- ✅ 工作表管理
- ✅ 筛选和筛选视图
- ✅ 权限管理
- ✅ 条件格式（创建/获取）
- ✅ 保护范围（增加）

### 谨慎使用的功能
- ⚠️ 设置下拉列表（创建功能待修复）
- ⚠️ 获取保护范围（需要 protect_ids）

### 未测试的功能
- 📝 浮动图片相关
- 📝 更新/删除操作

---

## 📖 参考文档

- VERIFICATION_SUMMARY.md - 验证总结
- FINAL_STATUS.md - 最终状态
- COMPLETION_REPORT.md - 修复完成报告

---

**最后更新：** 2026-03-13 14:40 GMT+8
