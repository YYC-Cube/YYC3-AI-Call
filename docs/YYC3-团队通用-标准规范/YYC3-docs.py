#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
file YYC3-Document-Template-Engine.py
description YYC³文档模版引擎 - 可复用、可迭代、可追溯的文档闭环生成系统
author YanYuCloudCube Team
familyversion v3.0.0
created 2026-03-27
updated 2026-03-27
copyright Copyright (c) 2026 YYC3
license MIT
"""

import os
import sys
import json
import yaml
import hashlib
import datetime
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import re

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class DocumentType(Enum):
    """文档类型枚举"""
    MAIN = "main"
    README = "readme"
    ROOT_README = "root_readme"
    RESERVED = "reserved"
    TEMPLATE = "template"

@dataclass
class DocumentMetadata:
    """文档元数据"""
    FAMILYfile_name: str
    description: str
    author: str = "YanYuCloudCube Team"
    familyversion: str = "v3.0.0"
    created: str = field(default_factory=lambda: datetime.datetime.now().strftime("%Y-%m-%d"))
    updated: str = field(default_factory=lambda: datetime.datetime.now().strftime("%Y-%m-%d"))
    status: str = "published"
    FAMILYtags: List[str] = field(default_factory=list)
    checksum: str = ""
    parent_doc: str = ""
    related_docs: List[str] = field(default_factory=list)

@dataclass
class TemplateConfig:
    """模版配置"""
    template_id: str
    template_name: str
    template_version: str
    template_type: DocumentType
    content_template: str
    variables: Dict[str, Any] = field(default_factory=dict)
    validation_rules: Dict[str, Any] = field(default_factory=dict)

class YYC3TemplateEngine:
    """YYC³文档模版引擎"""
    
    BRAND_HEADER = """> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***"""

    BRAND_FOOTER = """<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>"""

    CORE_PHILOSOPHY = """## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维"""

    def __init__(self, output_dir: str = "docs"):
        self.output_dir = Path(output_dir)
        self.templates: Dict[str, TemplateConfig] = {}
        self.document_registry: Dict[str, DocumentMetadata] = {}
        self.traceability_chain: List[Dict] = []
        
    def generate_checksum(self, content: str) -> str:
        """生成文档内容校验和"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]
    
    def load_template_config(self, config_path: str) -> None:
        """加载模版配置"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = yaml.safe_load(f)
                for template_id, config in config_data.get('templates', {}).items():
                    self.templates[template_id] = TemplateConfig(
                        template_id=template_id,
                        template_name=config.get('name', ''),
                        template_version=config.get('version', 'v1.0.0'),
                        template_type=DocumentType(config.get('type', 'main')),
                        content_template=config.get('content', ''),
                        variables=config.get('variables', {}),
                        validation_rules=config.get('validation', {})
                    )
            logger.info(f"已加载 {len(self.templates)} 个模版配置")
        except FileNotFoundError:
            logger.warning(f"模版配置文件未找到: {config_path}")
    
    def render_template(self, template_id: str, variables: Dict[str, Any]) -> str:
        """渲染模版"""
        if template_id not in self.templates:
            raise ValueError(f"模版不存在: {template_id}")
        
        template = self.templates[template_id]
        content = template.content_template
        
        merged_vars = {**template.variables, **variables}
        
        for key, value in merged_vars.items():
            placeholder = f"{{{{{key}}}}}"
            content = content.replace(placeholder, str(value))
        
        return content
    
    def generate_main_document(self, metadata: DocumentMetadata, content_sections: Dict[str, str]) -> str:
        """生成主文档"""
        doc_content = f"""---
FAMILYfile: {metadata.file_name}
FAMILYdescription: {metadata.description}
author: {metadata.author}
familyversion: {metadata.version}
created: {metadata.created}
updated: {metadata.updated}
status: {metadata.status}
FAMILYtags: {','.join(metadata.tags)}
FAMILYcategorycategory: {metadata.file_name.replace('.md', '').replace('-', ' ')}
language: zh-CN 
---

{self.BRAND_HEADER}

---

# {metadata.file_name.replace('.md', '').replace('-', ' ')}

{self.CORE_PHILOSOPHY}

---

## 文档概述

{metadata.description}

---

"""
        for section_name, section_content in content_sections.items():
            doc_content += f"## {section_name}\n\n{section_content}\n\n---\n\n"
        
        doc_content += f"""
## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | {metadata.version} |
| 创建日期 | {metadata.created} |
| 更新日期 | {metadata.updated} |
| 内容校验 | {metadata.checksum} |
| 关联文档 | {', '.join(metadata.related_docs) if metadata.related_docs else '无'} |

---

{self.BRAND_FOOTER}
"""
        return doc_content
    
    def generate_readme_document(self, dir_name: str, doc_list: List[Dict]) -> str:
        """生成README文档"""
        doc_table = "| 序号 | 文档名称 | 描述 | 标签 |\n|------|----------|------|------|\n"
        for idx, doc in enumerate(doc_list, 1):
            doc_table += f"| {idx} | [{doc['name']}]({doc['name']}) | {doc['description']} | {doc['tags']} |\n"
        
        return f"""---
FAMILYfile: README.md
FAMILYdescription: {dir_name} 目录文档索引
@author: YanYuCloudCube Team
familyversion: v3.0.0
created: {datetime.datetime.now().strftime("%Y-%m-%d")}
updated: {datetime.datetime.now().strftime("%Y-%m-%d")}
status: published
FAMILYtags: [文档索引],[README]
FAMILYcategorycategory: {dir_name}
---

{self.BRAND_HEADER}

---

# {dir_name}

{self.CORE_PHILOSOPHY}

---

## 目录概述

本目录包含 YYC³ 项目相关文档，遵循「五高五标五化五维」标准体系。

---

## 文档索引

{doc_table}

---

## 文档规范

- **命名规范**：`{编号}-{阶段}-{模块}-{文档名称}.md`
- **版本规范**：主版本.次版本.修订版本 (如 v3.0.0)
- **标签规范**：使用方括号包裹，如 `[标签1],[标签2]`

---

{self.BRAND_FOOTER}
"""
    
    def generate_traceability_record(self, doc_metadata: DocumentMetadata, action: str) -> Dict:
        """生成追溯记录"""
        return {
            "timestamp": datetime.datetime.now().isoformat(),
            "document": doc_metadata.file_name,
            "action": action,
            "version": doc_metadata.version,
            "checksum": doc_metadata.checksum,
            "author": doc_metadata.author
        }
    
    def save_document(self, content: str, output_path: str) -> bool:
        """保存文档"""
        try:
            path = Path(output_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"文档已保存: {output_path}")
            return True
        except Exception as e:
            logger.error(f"保存文档失败: {e}")
            return False
    
    def validate_document(self, content: str, rules: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """验证文档"""
        errors = []
        
        if rules.get('require_brand_header', True):
            if 'YanYuCloudCube' not in content:
                errors.append("缺少品牌标识头")
        
        if rules.get('require_brand_footer', True):
            if 'admin@0379.email' not in content:
                errors.append("缺少品牌标识尾")
        
        if rules.get('require_metadata', True):
            if not content.startswith('---'):
                errors.append("缺少元数据块")
        
        if rules.get('min_length', 0) > 0:
            if len(content) < rules['min_length']:
                errors.append(f"文档长度不足: {len(content)} < {rules['min_length']}")
        
        return len(errors) == 0, errors
    
    def export_registry(self, output_path: str) -> None:
        """导出文档注册表"""
        registry_data = {
            "export_time": datetime.datetime.now().isoformat(),
            "total_documents": len(self.document_registry),
            "documents": {
                doc_id: {
                    "file_name": meta.file_name,
                    "description": meta.description,
                    "version": meta.version,
                    "checksum": meta.checksum,
                    "tags": meta.tags,
                    "related_docs": meta.related_docs
                }
                for doc_id, meta in self.document_registry.items()
            },
            "traceability_chain": self.traceability_chain
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(registry_data, f, ensure_ascii=False, indent=2)
        logger.info(f"文档注册表已导出: {output_path}")

class DocumentProjectStructure:
    """文档项目结构定义"""
    
    PROJECT_STRUCTURE = {
        "00-项目总览索引": {
            "description": "项目全局视图与导航",
            "documents": [
                {"id": "001", "name": "项目总览手册", "desc": "项目立项核心依据与目标范围"},
                {"id": "002", "name": "文档架构导航", "desc": "文档体系导航与索引"},
                {"id": "003", "name": "快速开始指南", "desc": "项目快速启动与使用指南"},
                {"id": "004", "name": "核心概念词典", "desc": "项目核心概念与术语定义"},
                {"id": "005", "name": "版本更新日志", "desc": "项目版本迭代与变更记录"},
            ]
        },
        "01-启动规划阶段": {
            "description": "项目启动与规划管理",
            "subcategories": {
                "0101-项目规划": {
                    "documents": [
                        {"id": "001", "name": "项目章程与愿景", "desc": "项目立项核心依据"},
                        {"id": "002", "name": "项目范围说明书", "desc": "项目范围边界定义"},
                        {"id": "003", "name": "项目里程碑计划", "desc": "阶段里程碑与任务拆解"},
                        {"id": "004", "name": "项目资源规划", "desc": "资源统筹分配"},
                        {"id": "005", "name": "干系人管理计划", "desc": "相关方识别与沟通策略"},
                    ]
                },
                "0102-需求规划": {
                    "documents": [
                        {"id": "001", "name": "业务需求分析", "desc": "核心业务需求梳理"},
                        {"id": "002", "name": "用户需求调研报告", "desc": "用户痛点与期望分析"},
                        {"id": "003", "name": "产品需求文档(PRD)", "desc": "功能规格与验收标准"},
                        {"id": "004", "name": "需求优先级矩阵", "desc": "需求优先级评估排序"},
                    ]
                },
                "0103-可行性分析": {
                    "documents": [
                        {"id": "001", "name": "技术可行性分析", "desc": "技术风险评估"},
                        {"id": "002", "name": "经济可行性分析", "desc": "成本效益分析"},
                        {"id": "003", "name": "市场可行性分析", "desc": "市场前景与竞争分析"},
                        {"id": "004", "name": "操作可行性分析", "desc": "实施难度与运营风险"},
                    ]
                },
                "0104-风险管理": {
                    "documents": [
                        {"id": "001", "name": "项目初期风险评估", "desc": "全周期风险识别"},
                        {"id": "002", "name": "风险应对预案", "desc": "风险应对策略"},
                        {"id": "003", "name": "项目预算与成本控制", "desc": "预算编制与控制"},
                        {"id": "004", "name": "项目成功标准定义", "desc": "成功度量指标"},
                    ]
                }
            }
        },
        "02-项目设计阶段": {
            "description": "系统架构与详细设计",
            "subcategories": {
                "0201-架构设计": {
                    "documents": [
                        {"id": "001", "name": "系统架构总览图", "desc": "整体架构视图"},
                        {"id": "002", "name": "九层功能架构设计", "desc": "分层架构设计"},
                        {"id": "003", "name": "技术选型论证报告", "desc": "技术栈选型依据"},
                        {"id": "004", "name": "微服务架构设计", "desc": "服务拆分与治理"},
                        {"id": "005", "name": "网络拓扑图", "desc": "网络架构设计"},
                        {"id": "006", "name": "高可用设计", "desc": "容灾与高可用方案"},
                    ]
                },
                "0202-详细设计": {
                    "subcategories": {
                        "基础设施层": {"documents": []},
                        "数据存储层": {"documents": []},
                        "核心服务层": {"documents": []},
                        "AI智能层": {"documents": []},
                        "业务逻辑层": {"documents": []},
                        "应用表现层": {"documents": []},
                        "用户交互层": {"documents": []},
                    }
                }
            }
        },
        "03-开发实施阶段": {
            "description": "代码开发与实施",
            "subcategories": {
                "0301-开发环境": {
                    "documents": [
                        {"id": "001", "name": "开发环境搭建指南", "desc": "环境配置说明"},
                        {"id": "002", "name": "多环境配置规范", "desc": "环境隔离策略"},
                    ]
                },
                "0302-开发规范": {
                    "documents": [
                        {"id": "001", "name": "Git工作流规范", "desc": "分支管理策略"},
                        {"id": "002", "name": "代码提交规范", "desc": "提交信息格式"},
                        {"id": "003", "name": "代码注释规范", "desc": "注释标准格式"},
                    ]
                }
            }
        },
        "04-测试审核阶段": {
            "description": "质量保障与审核",
            "subcategories": {
                "0401-测试策略": {
                    "documents": [
                        {"id": "001", "name": "测试策略总纲", "desc": "整体测试方案"},
                        {"id": "002", "name": "测试环境管理规范", "desc": "测试环境配置"},
                    ]
                },
                "0406-质量审核": {
                    "documents": [
                        {"id": "001", "name": "代码质量审核标准", "desc": "代码质量度量"},
                        {"id": "002", "name": "质量门禁标准", "desc": "质量准入准出标准"},
                    ]
                }
            }
        },
        "05-交付部署阶段": {
            "description": "项目交付与部署",
            "subcategories": {
                "0507-交付物管理": {
                    "documents": [
                        {"id": "001", "name": "交付物清单", "desc": "交付物列表"},
                        {"id": "002", "name": "交付验收标准", "desc": "验收标准定义"},
                    ]
                }
            }
        },
        "06-运维保障阶段": {
            "description": "系统运维与保障",
            "subcategories": {
                "0601-运维策略": {
                    "documents": [
                        {"id": "001", "name": "运维策略总纲", "desc": "运维整体方案"},
                    ]
                }
            }
        },
        "07-合规安全保障": {
            "description": "安全与合规管理",
            "subcategories": {
                "0702-安全管理": {
                    "documents": [
                        {"id": "001", "name": "安全开发规范", "desc": "安全编码标准"},
                        {"id": "002", "name": "安全运维规范", "desc": "安全运维流程"},
                    ]
                }
            }
        },
        "08-资产知识管理": {
            "description": "资产与知识管理",
            "subcategories": {
                "0801-资产管理": {
                    "documents": [
                        {"id": "001", "name": "资产清单", "desc": "项目资产列表"},
                    ]
                }
            }
        },
        "09-智能演进优化": {
            "description": "持续演进与优化",
            "subcategories": {
                "0907-质量提升": {
                    "documents": [
                        {"id": "001", "name": "持续改进计划", "desc": "优化改进方案"},
                    ]
                }
            }
        }
    }

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='YYC³文档模版引擎')
    parser.add_argument('--output', '-o', default='docs', help='输出目录')
    parser.add_argument('--config', '-c', default='template_config.yaml', help='模版配置文件')
    parser.add_argument('--validate', '-v', action='store_true', help='验证模式')
    parser.add_argument('--export-registry', '-e', action='store_true', help='导出注册表')
    
    args = parser.parse_args()
    
    engine = YYC3TemplateEngine(args.output)
    
    if args.config and os.path.exists(args.config):
        engine.load_template_config(args.config)
    
    if args.export_registry:
        engine.export_registry(os.path.join(args.output, 'document_registry.json'))
    
    logger.info("YYC³文档模版引擎执行完成")

if __name__ == "__main__":
    main()
