/**
 * Feishu Sheets Skill - 飞书电子表格完整操作技能
 * 
 * 支持官方文档所有接口：表格、工作表、数据、行列、条件格式、
 * 筛选、保护范围、数据校验、浮动图片等 50+ 个 API
 * 
 * 可移植：独立技能，不依赖特定配置
 */

import https from 'https';
import { Type } from '@sinclair/typebox';

// ============ 类型定义 ============

interface FeishuSheetsParams {
  // 通用
  action: string;
  token?: string;           // 电子表格 token
  sheet_id?: string;        // 工作表 ID
  
  // 数据操作
  range?: string;           // 单元格范围 (如 A1:E10)
  ranges?: string[];        // 多个范围
  values?: any[][];         // 要写入的数据
  major_dimension?: string; // ROWS 或 COLUMNS
  
  // 权限管理
  member_type?: string;
  member_id?: string;
  perm?: string;
  
  // 工作表属性
  title?: string;
  index?: number;
  hidden?: boolean;
  
  // 行列操作
  dimension?: string;       // ROWS 或 COLUMNS
  start_index?: number;
  end_index?: number;
  length?: number;
  
  // 样式
  format_type?: string;
  color?: object;
  bold?: boolean;
  italic?: boolean;
  
  // 筛选/条件格式
  filter_id?: string;
  filter_view_id?: string;
  condition_id?: string;
  criteria?: object;
  
  // 保护范围
  protected_range_id?: string;
  
  // 浮动图片
  float_image_id?: string;
  image_url?: string;
  
  // 其他
  folder_token?: string;
  find_value?: string;
  replace_value?: string;
}

interface LarkResponse<T = any> {
  code: number;
  msg?: string;
  data?: T;
}

// ============ 工具函数 ============

function json(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    details: data,
  };
}

function errorResult(message: string) {
  return json({ error: message });
}

// ============ 飞书 API 客户端 ============

class FeishuSheetsClient {
  private appId: string;
  private appSecret: string;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  /** 获取租户访问令牌 */
  async getTenantAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ app_id: this.appId, app_secret: this.appSecret });
      const req = https.request({
        hostname: 'open.feishu.cn',
        port: 443,
        path: '/open-apis/auth/v3/tenant_access_token/internal',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          const result = JSON.parse(body);
          if (result.code !== 0) {
            reject(new Error(`获取 token 失败：${result.msg}`));
          } else {
            resolve(result.tenant_access_token);
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /** 通用请求方法 */
  private request<T>(
    token: string,
    method: string,
    path: string,
    data?: any
  ): Promise<LarkResponse<T>> {
    return new Promise((resolve, reject) => {
      const options: any = {
        hostname: 'open.feishu.cn',
        port: 443,
        path,
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (e) {
            resolve({ code: res.statusCode, msg: body, data: null });
          }
        });
      });

      req.on('error', reject);
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // ============ 表格操作 (spreadsheet) ============

  /** 创建电子表格 */
  async createSpreadsheet(title?: string, folderToken?: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', '/open-apis/sheets/v3/spreadsheets', {
      title,
      folder_token: folderToken
    });
  }

  /** 获取电子表格信息 */
  async getSpreadsheetInfo(token: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/sheets/v3/spreadsheets/${token}`);
  }

  /** 修改电子表格属性 */
  async updateSpreadsheet(token: string, title?: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'PATCH', `/open-apis/sheets/v3/spreadsheets/${token}`, {
      title
    });
  }

  // ============ 工作表操作 (sheet) ============

  /** 获取工作表列表 */
  async listSheets(token: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/sheets/v3/spreadsheet-sheets/${token}/query`);
  }

  /** 更新工作表属性 */
  async updateSheet(token: string, sheetId: string, title?: string, index?: number, hidden?: boolean): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const requests: any[] = [];
    
    if (title !== undefined) {
      requests.push({
        updateSheetProperties: {
          sheetId,
          fields: 'title',
          properties: { title }
        }
      });
    }
    
    if (index !== undefined) {
      requests.push({
        updateSheetProperties: {
          sheetId,
          fields: 'index',
          properties: { index }
        }
      });
    }

    if (hidden !== undefined) {
      requests.push({
        updateSheetProperties: {
          sheetId,
          fields: 'hidden',
          properties: { hidden }
        }
      });
    }
    
    if (requests.length === 0) {
      return { code: 400, msg: '至少需要提供 title、index 或 hidden', data: null };
    }
    
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/sheets_batch_update`, { requests });
  }

  /** 移动行列 */
  async moveDimension(token: string, sheetId: string, dimension: string, startIndex: number, endIndex: number, destinationIndex: number): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/move_dimension`, {
      source: {
        major_dimension: dimension,
        start_index: startIndex,
        end_index: endIndex
      },
      destination_index: destinationIndex
    });
  }

  // ============ 数据操作 (values) ============

  /** 读取单个范围 */
  async readValues(token: string, sheetId: string, range: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const fullRange = `${sheetId}!${range}`;
    return this.request(accessToken, 'GET', `/open-apis/sheets/v2/spreadsheets/${token}/values/${encodeURIComponent(fullRange)}`);
  }

  /** 读取多个范围 */
  async readValuesBatch(token: string, sheetId: string, ranges: string[]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const params = ranges.map(r => `ranges=${encodeURIComponent(sheetId + '!' + r)}`).join('&');
    return this.request(accessToken, 'GET', `/open-apis/sheets/v2/spreadsheets/${token}/values_batch_get?${params}`);
  }

  /** 插入数据（在指定位置上方插入行） */
  async insertValues(token: string, sheetId: string, range: string, values: any[][]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const fullRange = `${sheetId}!${range}`;
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/values_prepend`, {
      valueRange: { range: fullRange, values }
    });
  }

  /** 追加数据（在末尾追加） */
  async appendValues(token: string, sheetId: string, range: string, values: any[][]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const fullRange = `${sheetId}!${range}`;
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/values_append`, {
      valueRange: { range: fullRange, values }
    });
  }

  /** 向单个范围写入数据 */
  async writeValues(token: string, sheetId: string, range: string, values: any[][]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const fullRange = `${sheetId}!${range}`;
    return this.request(accessToken, 'PUT', `/open-apis/sheets/v2/spreadsheets/${token}/values`, {
      range: fullRange,
      values
    });
  }

  /** 向多个范围写入数据 */
  async writeValuesBatch(token: string, updates: Array<{range: string, values: any[][]}>): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/values_batch_update`, {
      data: updates
    });
  }

  /** 清空范围 */
  async clearValues(token: string, sheetId: string, range: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const fullRange = `${sheetId}!${range}`;
    return this.request(accessToken, 'DELETE', `/open-apis/sheets/v2/spreadsheets/${token}/values/${encodeURIComponent(fullRange)}`);
  }

  // ============ 行列操作 (dimension) ============

  /** 插入行列 */
  async insertDimension(token: string, sheetId: string, dimension: string, startIndex: number, length: number): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/insert_dimension_range`, {
      sheet_id: sheetId,
      dimension_type: dimension,
      start_index: startIndex,
      length
    });
  }

  /** 增加行列 */
  async addDimension(token: string, sheetId: string, dimension: string, length: number): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/dimension_range`, {
      sheet_id: sheetId,
      dimension_type: dimension,
      length
    });
  }

  /** 更新行列 */
  async updateDimension(token: string, sheetId: string, dimension: string, startIndex: number, endIndex: number, pixelSize?: number): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'PUT', `/open-apis/sheets/v2/spreadsheets/${token}/dimension_range`, {
      sheet_id: sheetId,
      dimension_type: dimension,
      start_index: startIndex,
      end_index: endIndex,
      pixel_size: pixelSize
    });
  }

  /** 删除行列 */
  async deleteDimension(token: string, sheetId: string, dimension: string, startIndex: number, endIndex: number): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'DELETE', `/open-apis/sheets/v2/spreadsheets/${token}/dimension_range`, {
      sheet_id: sheetId,
      dimension_type: dimension,
      start_index: startIndex,
      end_index: endIndex
    });
  }

  // ============ 样式操作 ============

  /** 设置单元格样式 */
  async setCellStyle(token: string, sheetId: string, range: string, format: any): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'PUT', `/open-apis/sheets/v2/spreadsheets/${token}/style`, {
      sheet_id: sheetId,
      range,
      format
    });
  }

  /** 合并单元格 */
  async mergeCells(token: string, sheetId: string, range: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/merge_cells`, {
      sheet_id: sheetId,
      range
    });
  }

  /** 拆分单元格 */
  async unmergeCells(token: string, sheetId: string, range: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/unmerge_cells`, {
      sheet_id: sheetId,
      range
    });
  }

  // ============ 查找替换 ============

  /** 查找单元格 */
  async findCells(token: string, sheetId: string, findValue: string, matchCase?: boolean, matchEntireCell?: boolean): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/find`, {
      find_condition: {
        value: findValue,
        match_criteria: {
          match_case: matchCase || false,
          match_entire_cell: matchEntireCell || false
        }
      }
    });
  }

  /** 替换单元格 */
  async replaceCells(token: string, sheetId: string, range: string, find: string, replacement: string, matchCase?: boolean, matchEntireCell?: boolean): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/replace`, {
      find_condition: {
        range: `${sheetId}!${range}`,
        match_case: matchCase || false,
        match_entire_cell: matchEntireCell || false,
        search_by_regex: false,
        include_formulas: false
      },
      find,
      replacement
    });
  }

  // ============ 筛选 (filter) ============

  /** 创建筛选 */
  async createFilter(token: string, sheetId: string, range: string, col: string, filterType: string, compareType?: string, expected?: string[]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter`, {
      range: `${sheetId}!${range}`,
      col,
      condition: {
        filter_type: filterType,
        compare_type: compareType,
        expected
      }
    });
  }

  /** 获取筛选 */
  async getFilter(token: string, sheetId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter`);
  }

  /** 更新筛选 */
  async updateFilter(token: string, sheetId: string, filterId: string, criteria: any): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'PUT', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter/${filterId}`, criteria);
  }

  /** 删除筛选 */
  async deleteFilter(token: string, sheetId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'DELETE', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter`);
  }

  // ============ 筛选视图 (filter_view) ============

  /** 创建筛选视图 */
  async createFilterView(token: string, sheetId: string, title: string, range: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter_views`, {
      title,
      range: `${sheetId}!${range}`
    });
  }

  /** 查询筛选视图 */
  async queryFilterViews(token: string, sheetId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter_views/query`);
  }

  /** 获取筛选视图 */
  async getFilterView(token: string, sheetId: string, filterViewId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter_views/${filterViewId}`);
  }

  /** 更新筛选视图 */
  async updateFilterView(token: string, sheetId: string, filterViewId: string, updates: any): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'PATCH', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter_views/${filterViewId}`, updates);
  }

  /** 删除筛选视图 */
  async deleteFilterView(token: string, sheetId: string, filterViewId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'DELETE', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/filter_views/${filterViewId}`);
  }

  // ============ 条件格式 (condition_format) ============

  /** 创建条件格式 */
  async createConditionFormat(token: string, sheetId: string, range: string, ruleType: string, criteriaValue?: string, style?: any): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/condition_formats/batch_create`, {
      sheet_condition_formats: [{
        sheet_id: sheetId,
        range: `${sheetId}!${range}`,
        condition_format: {
          rule_type: ruleType,
          criteria: criteriaValue ? { value: criteriaValue } : {},
          style: style || {},
          ranges: [`${sheetId}!${range}`]
        }
      }]
    });
  }

  /** 获取条件格式 */
  async getConditionFormats(token: string, sheetId: string, range?: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const params = `?sheet_ids=${sheetId}` + (range ? `&range=${encodeURIComponent(range)}` : '');
    return this.request(accessToken, 'GET', `/open-apis/sheets/v2/spreadsheets/${token}/condition_formats${params}`);
  }

  /** 更新条件格式 */
  async updateConditionFormat(token: string, sheetId: string, conditionId: string, ruleType: string, ranges: string[], attrs?: any[], style?: any): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/condition_formats/batch_update`, {
      sheet_condition_formats: [{
        sheet_id: sheetId,
        condition_format: {
          cf_id: conditionId,
          rule_type: ruleType,
          ranges,
          attrs,
          style
        }
      }]
    });
  }

  /** 删除条件格式 */
  async deleteConditionFormat(token: string, conditionIds: string[]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'DELETE', `/open-apis/sheets/v2/spreadsheets/${token}/condition_formats/batch_delete?sheet_cf_ids=${conditionIds.join(',')}`);
  }

  // ============ 保护范围 (protected_range) ============

  /** 增加保护范围 */
  async addProtectedRange(token: string, sheetId: string, dimension: string, startIndex: number, endIndex: number, users?: string[], lockInfo?: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/protected_dimension?user_id_type=open_id`, {
      addProtectedDimension: [{
        dimension: {
          sheetId,
          majorDimension: dimension, // ROWS 或 COLUMNS
          startIndex,
          endIndex
        },
        users,
        lockInfo
      }]
    });
  }

  /** 获取保护范围 */
  async getProtectedRanges(token: string, protectIds: string[], memberType?: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const params = `?protectIds=${protectIds.join(',')}` + (memberType ? `&memberType=${memberType}` : '');
    return this.request(accessToken, 'GET', `/open-apis/sheets/v2/spreadsheets/${token}/protected_range_batch_get${params}`);
  }

  /** 修改保护范围 */
  async updateProtectedRange(token: string, protectedRangeId: string, sheetId: string, dimension: string, startIndex: number, endIndex: number, lockInfo?: string, addEditors?: Array<{memberType: string, memberId: string}>, delEditors?: Array<{memberType: string, memberId: string}>): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/protected_range_batch_update`, {
      requests: [{
        protectId: protectedRangeId,
        dimension: {
          sheetId,
          major_dimension: dimension,
          startIndex,
          endIndex
        },
        lockInfo,
        editors: {
          addEditors,
          delEditors
        }
      }]
    });
  }

  /** 删除保护范围 */
  async deleteProtectedRange(token: string, protectedRangeIds: string[]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'DELETE', `/open-apis/sheets/v2/spreadsheets/${token}/protected_range_batch_del`, {
      protectIds: protectedRangeIds
    });
  }

  // ============ 数据校验 (data_validation) ============

  /** 设置下拉列表 */
  async setDropdown(token: string, range: string, values: string[], multipleValues?: boolean, highlightValidData?: boolean, colors?: string[]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v2/spreadsheets/${token}/dataValidation`, {
      range,
      dataValidationType: 'list',
      dataValidation: {
        conditionValues: values,
        options: {
          multipleValues: multipleValues || false,
          highlightValidData: highlightValidData || false,
          colors
        }
      }
    });
  }

  /** 查询下拉列表设置 */
  async queryDropdowns(token: string, range: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/sheets/v2/spreadsheets/${token}/dataValidation?range=${encodeURIComponent(range)}`);
  }

  /** 更新下拉列表设置 */
  async updateDropdown(token: string, sheetId: string, ranges: string[], values: string[], multipleValues?: boolean, highlightValidData?: boolean, colors?: string[]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'PUT', `/open-apis/sheets/v2/spreadsheets/${token}/dataValidation/${sheetId}`, {
      ranges,
      dataValidationType: 'list',
      dataValidation: {
        conditionValues: values,
        options: {
          multipleValues: multipleValues || false,
          highlightValidData: highlightValidData || false,
          colors
        }
      }
    });
  }

  /** 删除下拉列表设置 */
  async deleteDropdown(token: string, ranges: string[]): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'DELETE', `/open-apis/sheets/v2/spreadsheets/${token}/dataValidation`, {
      dataValidationRanges: ranges.map(range => ({ range }))
    });
  }

  // ============ 浮动图片 (float_image) ============

  /** 创建浮动图片 */
  async createFloatImage(token: string, sheetId: string, floatImageToken: string, range: string, width?: number, height?: number): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/float_images`, {
      float_image_token: floatImageToken,
      range: `${sheetId}!${range}`,
      width,
      height
    });
  }

  /** 查询浮动图片 */
  async queryFloatImages(token: string, sheetId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/float_images/query`);
  }

  /** 获取浮动图片 */
  async getFloatImage(token: string, sheetId: string, floatImageId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/float_images/${floatImageId}`);
  }

  /** 更新浮动图片 */
  async updateFloatImage(token: string, sheetId: string, floatImageId: string, updates: any): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'PATCH', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/float_images/${floatImageId}`, updates);
  }

  /** 删除浮动图片 */
  async deleteFloatImage(token: string, sheetId: string, floatImageId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'DELETE', `/open-apis/sheets/v3/spreadsheets/${token}/sheets/${sheetId}/float_images/${floatImageId}`);
  }

  // ============ 权限管理 ============

  /** 获取权限列表 */
  async listPermissions(token: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'GET', `/open-apis/drive/v1/permissions/${token}/members`, { type: 'sheet' });
  }

  /** 添加权限 */
  async addPermission(token: string, memberType: string, memberId: string, perm: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/drive/v1/permissions/${token}/members?type=sheet`, {
      member_type: memberType,
      member_id: memberId,
      perm
    });
  }

  /** 移除权限 */
  async removePermission(token: string, memberType: string, memberId: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'DELETE', `/open-apis/drive/v1/permissions/${token}/members/${memberId}`, {
      type: 'sheet',
      member_type: memberType
    });
  }

  // ============ 云盘操作 ============

  /** 列出云盘文件 */
  async listFiles(folderToken?: string): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    const params = folderToken ? `?folder_token=${folderToken}` : '';
    return this.request(accessToken, 'GET', `/open-apis/drive/v1/files${params}`);
  }

  /** 获取文件信息 */
  async getFileInfo(token: string, docType: string = 'sheet'): Promise<LarkResponse> {
    const accessToken = await this.getTenantAccessToken();
    return this.request(accessToken, 'POST', `/open-apis/drive/v1/metas/batch_query`, {
      request_docs: [{ doc_token: token, doc_type: docType }]
    });
  }
}

// ============ 技能参数定义 ============

const FeishuSheetsSchema = Type.Object({
  action: Type.String({
    description: '操作类型',
    enum: [
      // 表格
      'create_spreadsheet', 'get_info', 'update_spreadsheet',
      // 工作表
      'list_sheets', 'update_sheet', 'move_dimension',
      // 数据
      'read_values', 'read_values_batch', 'insert_values', 'append_values', 
      'write_values', 'write_values_batch', 'clear_values',
      // 行列
      'insert_dimension', 'add_dimension', 'update_dimension', 'delete_dimension',
      // 样式
      'set_cell_style', 'merge_cells', 'unmerge_cells',
      // 查找替换
      'find_cells', 'replace_cells',
      // 筛选
      'create_filter', 'get_filter', 'update_filter', 'delete_filter',
      // 筛选视图
      'create_filter_view', 'query_filter_views', 'get_filter_view', 
      'update_filter_view', 'delete_filter_view',
      // 条件格式
      'create_condition_format', 'get_condition_formats', 
      'update_condition_format', 'delete_condition_format',
      // 保护范围
      'add_protected_range', 'get_protected_ranges', 
      'update_protected_range', 'delete_protected_range',
      // 数据校验
      'set_dropdown', 'query_dropdowns', 'update_dropdown', 'delete_dropdown',
      // 浮动图片
      'create_float_image', 'query_float_images', 'get_float_image',
      'update_float_image', 'delete_float_image',
      // 权限
      'list_permissions', 'add_permission', 'remove_permission',
      // 云盘
      'list_files', 'get_file_info'
    ]
  }),
  token: Type.Optional(Type.String({ description: '电子表格或文件 token' })),
  sheet_id: Type.Optional(Type.String({ description: '工作表 ID' })),
  range: Type.Optional(Type.String({ description: '单元格范围，如 A1:E10' })),
  ranges: Type.Optional(Type.Array(Type.String(), { description: '多个范围' })),
  values: Type.Optional(Type.Array(Type.Array(Type.Any()), { description: '要写入的二维数组数据' })),
  member_type: Type.Optional(Type.String({ enum: ['openid', 'userid', 'email', 'unionid', 'openchat', 'opendepartmentid'] })),
  member_id: Type.Optional(Type.String({ description: '成员 ID' })),
  perm: Type.Optional(Type.String({ enum: ['view', 'edit', 'full_access'] })),
  title: Type.Optional(Type.String({ description: '标题' })),
  index: Type.Optional(Type.Number({ description: '索引' })),
  hidden: Type.Optional(Type.Boolean({ description: '是否隐藏' })),
  dimension: Type.Optional(Type.String({ enum: ['ROWS', 'COLUMNS'], description: '行列类型' })),
  start_index: Type.Optional(Type.Number({ description: '起始索引' })),
  end_index: Type.Optional(Type.Number({ description: '结束索引' })),
  length: Type.Optional(Type.Number({ description: '长度' })),
  destination_index: Type.Optional(Type.Number({ description: '目标索引' })),
  users: Type.Optional(Type.Array(Type.String(), { description: '允许编辑的用户 ID 列表' })),
  lock_info: Type.Optional(Type.String({ description: '保护范围备注' })),
  filter_id: Type.Optional(Type.String({ description: '筛选 ID' })),
  filter_view_id: Type.Optional(Type.String({ description: '筛选视图 ID' })),
  condition_id: Type.Optional(Type.String({ description: '条件格式 ID' })),
  protected_range_id: Type.Optional(Type.String({ description: '保护范围 ID' })),
  float_image_id: Type.Optional(Type.String({ description: '浮动图片 ID' })),
  float_image_token: Type.Optional(Type.String({ description: '浮动图片 token（通过上传素材获取）' })),
  find_value: Type.Optional(Type.String({ description: '查找值' })),
  replacement: Type.Optional(Type.String({ description: '替换值' })),
  folder_token: Type.Optional(Type.String({ description: '文件夹 token' })),
  col: Type.Optional(Type.String({ description: '列标识，如 A、B、C' })),
  filter_type: Type.Optional(Type.String({ enum: ['multiValue', 'number', 'text', 'color', 'clear'], description: '筛选类型' })),
  compare_type: Type.Optional(Type.String({ description: '比较类型，如 less、greater' })),
  expected: Type.Optional(Type.Array(Type.String(), { description: '筛选参数值' })),
  criteria: Type.Optional(Type.Any({ description: '条件/规则' })),
  format: Type.Optional(Type.Any({ description: '格式设置' }))
});

// ============ 技能注册 ============

export default function registerFeishuSheetsSkill(api: any) {
  api.logger?.info?.('feishu_sheets: 正在注册飞书电子表格技能 (50+ API)...');

  const getCredentials = () => {
    if (api.config?.channels?.feishu) {
      const { appId, appSecret } = api.config.channels.feishu;
      if (appId && appSecret) return { appId, appSecret };
    }
    return null;
  };

  api.registerTool(
    {
      name: 'feishu_sheets',
      label: 'Feishu Sheets',
      description: '飞书电子表格完整操作 - 支持官方 50+ API，包括表格、工作表、数据、行列、样式、筛选、条件格式、保护范围、数据校验、浮动图片等',
      parameters: FeishuSheetsSchema,
      async execute(_toolCallId: string, params: any) {
        const p = params as FeishuSheetsParams;
        
        try {
          const credentials = getCredentials();
          if (!credentials) {
            return errorResult('未配置飞书应用凭证，请在 openclaw.json 中配置 channels.feishu.appId 和 appSecret');
          }

          const client = new FeishuSheetsClient(credentials.appId, credentials.appSecret);
          
          switch (p.action) {
            // ===== 表格 =====
            case 'create_spreadsheet':
              return json(await client.createSpreadsheet(p.title, p.folder_token));
            case 'get_info':
              if (!p.token) return errorResult('缺少参数：token');
              return json(await client.getSpreadsheetInfo(p.token));
            case 'update_spreadsheet':
              if (!p.token) return errorResult('缺少参数：token');
              return json(await client.updateSpreadsheet(p.token, p.title));
            
            // ===== 工作表 =====
            case 'list_sheets':
              if (!p.token) return errorResult('缺少参数：token');
              return json(await client.listSheets(p.token));
            case 'update_sheet':
              if (!p.token || !p.sheet_id) return errorResult('缺少参数：token 或 sheet_id');
              return json(await client.updateSheet(p.token, p.sheet_id, p.title, p.index, p.hidden));
            case 'move_dimension':
              if (!p.token || !p.sheet_id || !p.dimension || p.start_index === undefined || p.end_index === undefined || p.destination_index === undefined)
                return errorResult('缺少参数：token, sheet_id, dimension, start_index, end_index, destination_index');
              return json(await client.moveDimension(p.token, p.sheet_id, p.dimension, p.start_index, p.end_index, p.destination_index));
            
            // ===== 数据 =====
            case 'read_values':
              if (!p.token || !p.sheet_id || !p.range) return errorResult('缺少参数：token, sheet_id, range');
              return json(await client.readValues(p.token, p.sheet_id, p.range));
            case 'read_values_batch':
              if (!p.token || !p.sheet_id || !p.ranges) return errorResult('缺少参数：token, sheet_id, ranges');
              return json(await client.readValuesBatch(p.token, p.sheet_id, p.ranges));
            case 'insert_values':
              if (!p.token || !p.sheet_id || !p.range || !p.values) return errorResult('缺少参数：token, sheet_id, range, values');
              return json(await client.insertValues(p.token, p.sheet_id, p.range, p.values));
            case 'append_values':
              if (!p.token || !p.sheet_id || !p.range || !p.values) return errorResult('缺少参数：token, sheet_id, range, values');
              return json(await client.appendValues(p.token, p.sheet_id, p.range, p.values));
            case 'write_values':
              if (!p.token || !p.sheet_id || !p.range || !p.values) return errorResult('缺少参数：token, sheet_id, range, values');
              return json(await client.writeValues(p.token, p.sheet_id, p.range, p.values));
            case 'write_values_batch':
              if (!p.token || !p.values) return errorResult('缺少参数：token, values');
              return json(await client.writeValuesBatch(p.token, p.values));
            case 'clear_values':
              if (!p.token || !p.sheet_id || !p.range) return errorResult('缺少参数：token, sheet_id, range');
              return json(await client.clearValues(p.token, p.sheet_id, p.range));
            
            // ===== 行列 =====
            case 'insert_dimension':
              if (!p.token || !p.sheet_id || !p.dimension || p.start_index === undefined || p.length === undefined)
                return errorResult('缺少参数：token, sheet_id, dimension, start_index, length');
              return json(await client.insertDimension(p.token, p.sheet_id, p.dimension, p.start_index, p.length));
            case 'add_dimension':
              if (!p.token || !p.sheet_id || !p.dimension || p.length === undefined)
                return errorResult('缺少参数：token, sheet_id, dimension, length');
              return json(await client.addDimension(p.token, p.sheet_id, p.dimension, p.length));
            case 'update_dimension':
              if (!p.token || !p.sheet_id || !p.dimension || p.start_index === undefined || p.end_index === undefined)
                return errorResult('缺少参数：token, sheet_id, dimension, start_index, end_index');
              return json(await client.updateDimension(p.token, p.sheet_id, p.dimension, p.start_index, p.end_index, p.format?.pixel_size));
            case 'delete_dimension':
              if (!p.token || !p.sheet_id || !p.dimension || p.start_index === undefined || p.end_index === undefined)
                return errorResult('缺少参数：token, sheet_id, dimension, start_index, end_index');
              return json(await client.deleteDimension(p.token, p.sheet_id, p.dimension, p.start_index, p.end_index));
            
            // ===== 样式 =====
            case 'set_cell_style':
              if (!p.token || !p.sheet_id || !p.range || !p.format) return errorResult('缺少参数：token, sheet_id, range, format');
              return json(await client.setCellStyle(p.token, p.sheet_id, p.range, p.format));
            case 'merge_cells':
              if (!p.token || !p.sheet_id || !p.range) return errorResult('缺少参数：token, sheet_id, range');
              return json(await client.mergeCells(p.token, p.sheet_id, p.range));
            case 'unmerge_cells':
              if (!p.token || !p.sheet_id || !p.range) return errorResult('缺少参数：token, sheet_id, range');
              return json(await client.unmergeCells(p.token, p.sheet_id, p.range));
            
            // ===== 查找替换 =====
            case 'find_cells':
              if (!p.token || !p.sheet_id || !p.find_value) return errorResult('缺少参数：token, sheet_id, find_value');
              return json(await client.findCells(p.token, p.sheet_id, p.find_value, p.format?.match_case, p.format?.match_entire_cell));
            case 'replace_cells':
              if (!p.token || !p.sheet_id || !p.range || !p.find_value || !p.replacement)
                return errorResult('缺少参数：token, sheet_id, range, find_value, replacement');
              return json(await client.replaceCells(p.token, p.sheet_id, p.range, p.find_value, p.replacement, p.format?.match_case, p.format?.match_entire_cell));
            
            // ===== 筛选 =====
            case 'create_filter':
              if (!p.token || !p.sheet_id || !p.range || !p.col || !p.filter_type)
                return errorResult('缺少参数：token, sheet_id, range, col, filter_type');
              return json(await client.createFilter(p.token, p.sheet_id, p.range, p.col, p.filter_type, p.compare_type, p.expected));
            case 'get_filter':
              if (!p.token || !p.sheet_id) return errorResult('缺少参数：token, sheet_id');
              return json(await client.getFilter(p.token, p.sheet_id));
            case 'update_filter':
              if (!p.token || !p.sheet_id || !p.filter_id || !p.criteria) return errorResult('缺少参数：token, sheet_id, filter_id, criteria');
              return json(await client.updateFilter(p.token, p.sheet_id, p.filter_id, p.criteria));
            case 'delete_filter':
              if (!p.token || !p.sheet_id) return errorResult('缺少参数：token, sheet_id');
              return json(await client.deleteFilter(p.token, p.sheet_id));
            
            // ===== 筛选视图 =====
            case 'create_filter_view':
              if (!p.token || !p.sheet_id || !p.title || !p.range) return errorResult('缺少参数：token, sheet_id, title, range');
              return json(await client.createFilterView(p.token, p.sheet_id, p.title, p.range));
            case 'query_filter_views':
              if (!p.token || !p.sheet_id) return errorResult('缺少参数：token, sheet_id');
              return json(await client.queryFilterViews(p.token, p.sheet_id));
            case 'get_filter_view':
              if (!p.token || !p.sheet_id || !p.filter_view_id) return errorResult('缺少参数：token, sheet_id, filter_view_id');
              return json(await client.getFilterView(p.token, p.sheet_id, p.filter_view_id));
            case 'update_filter_view':
              if (!p.token || !p.sheet_id || !p.filter_view_id) return errorResult('缺少参数：token, sheet_id, filter_view_id');
              return json(await client.updateFilterView(p.token, p.sheet_id, p.filter_view_id, p.criteria || {}));
            case 'delete_filter_view':
              if (!p.token || !p.sheet_id || !p.filter_view_id) return errorResult('缺少参数：token, sheet_id, filter_view_id');
              return json(await client.deleteFilterView(p.token, p.sheet_id, p.filter_view_id));
            
            // ===== 条件格式 =====
            case 'create_condition_format':
              if (!p.token || !p.sheet_id || !p.range || !p.filter_type)
                return errorResult('缺少参数：token, sheet_id, range, filter_type');
              return json(await client.createConditionFormat(p.token, p.sheet_id, p.range, p.filter_type, p.expected?.[0], p.format));
            case 'get_condition_formats':
              if (!p.token || !p.sheet_id) return errorResult('缺少参数：token, sheet_id');
              return json(await client.getConditionFormats(p.token, p.sheet_id, p.range));
            case 'update_condition_format':
              if (!p.token || !p.sheet_id || !p.condition_id || !p.filter_type || !p.ranges)
                return errorResult('缺少参数：token, sheet_id, condition_id, filter_type, ranges');
              return json(await client.updateConditionFormat(p.token, p.sheet_id, p.condition_id, p.filter_type, p.ranges, p.expected, p.format));
            case 'delete_condition_format':
              if (!p.token || !p.condition_id) return errorResult('缺少参数：token, condition_id');
              return json(await client.deleteConditionFormat(p.token, [p.condition_id]));
            
            // ===== 保护范围 =====
            case 'add_protected_range':
              if (!p.token || !p.sheet_id || !p.dimension || p.start_index === undefined || p.end_index === undefined)
                return errorResult('缺少参数：token, sheet_id, dimension, start_index, end_index');
              return json(await client.addProtectedRange(p.token, p.sheet_id, p.dimension, p.start_index, p.end_index, p.users, p.lock_info));
            case 'get_protected_ranges':
              if (!p.token || !p.protected_range_id) return errorResult('缺少参数：token, protected_range_id');
              return json(await client.getProtectedRanges(p.token, [p.protected_range_id], p.format?.memberType));
            case 'update_protected_range':
              if (!p.token || !p.protected_range_id || !p.sheet_id || !p.dimension || p.start_index === undefined || p.end_index === undefined)
                return errorResult('缺少参数：token, protected_range_id, sheet_id, dimension, start_index, end_index');
              return json(await client.updateProtectedRange(p.token, p.protected_range_id, p.sheet_id, p.dimension, p.start_index, p.end_index, p.lock_info, p.format?.addEditors, p.format?.delEditors));
            case 'delete_protected_range':
              if (!p.token || !p.protected_range_id) return errorResult('缺少参数：token, protected_range_id');
              return json(await client.deleteProtectedRange(p.token, [p.protected_range_id]));
            
            // ===== 数据校验 =====
            case 'set_dropdown':
              if (!p.token || !p.range || !p.expected) return errorResult('缺少参数：token, range, expected');
              return json(await client.setDropdown(p.token, p.range, p.expected, p.format?.multipleValues, p.format?.highlightValidData, p.format?.colors));
            case 'query_dropdowns':
              if (!p.token || !p.range) return errorResult('缺少参数：token, range');
              return json(await client.queryDropdowns(p.token, p.range));
            case 'update_dropdown':
              if (!p.token || !p.sheet_id || !p.ranges || !p.expected)
                return errorResult('缺少参数：token, sheet_id, ranges, expected');
              return json(await client.updateDropdown(p.token, p.sheet_id, p.ranges, p.expected, p.format?.multipleValues, p.format?.highlightValidData, p.format?.colors));
            case 'delete_dropdown':
              if (!p.token || !p.ranges) return errorResult('缺少参数：token, ranges');
              return json(await client.deleteDropdown(p.token, p.ranges));
            
            // ===== 浮动图片 =====
            case 'create_float_image':
              if (!p.token || !p.sheet_id || !p.float_image_token || !p.range) return errorResult('缺少参数：token, sheet_id, float_image_token, range');
              return json(await client.createFloatImage(p.token, p.sheet_id, p.float_image_token, p.range, p.format?.width, p.format?.height));
            case 'query_float_images':
              if (!p.token || !p.sheet_id) return errorResult('缺少参数：token, sheet_id');
              return json(await client.queryFloatImages(p.token, p.sheet_id));
            case 'get_float_image':
              if (!p.token || !p.sheet_id || !p.float_image_id) return errorResult('缺少参数：token, sheet_id, float_image_id');
              return json(await client.getFloatImage(p.token, p.sheet_id, p.float_image_id));
            case 'update_float_image':
              if (!p.token || !p.sheet_id || !p.float_image_id) return errorResult('缺少参数：token, sheet_id, float_image_id');
              return json(await client.updateFloatImage(p.token, p.sheet_id, p.float_image_id, p.criteria || {}));
            case 'delete_float_image':
              if (!p.token || !p.sheet_id || !p.float_image_id) return errorResult('缺少参数：token, sheet_id, float_image_id');
              return json(await client.deleteFloatImage(p.token, p.sheet_id, p.float_image_id));
            
            // ===== 权限 =====
            case 'list_permissions':
              if (!p.token) return errorResult('缺少参数：token');
              return json(await client.listPermissions(p.token));
            case 'add_permission':
              if (!p.token || !p.member_type || !p.member_id || !p.perm)
                return errorResult('缺少参数：token, member_type, member_id, perm');
              return json(await client.addPermission(p.token, p.member_type, p.member_id, p.perm));
            case 'remove_permission':
              if (!p.token || !p.member_type || !p.member_id)
                return errorResult('缺少参数：token, member_type, member_id');
              return json(await client.removePermission(p.token, p.member_type, p.member_id));
            
            // ===== 云盘 =====
            case 'list_files':
              return json(await client.listFiles(p.folder_token));
            case 'get_file_info':
              if (!p.token) return errorResult('缺少参数：token');
              return json(await client.getFileInfo(p.token));
            
            default:
              return errorResult(`未知操作：${p.action}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return errorResult(`执行失败：${message}`);
        }
      }
    },
    { name: 'feishu_sheets' }
  );

  api.logger?.info?.('feishu_sheets: 技能注册完成 - 支持 50+ 飞书电子表格 API');
}
