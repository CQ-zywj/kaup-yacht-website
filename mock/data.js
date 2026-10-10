window.MarineData = {
  "categories": [
    {
      "id": "boats",
      "name": {
        "zh": "整艇",
        "en": "Complete vessels"
      },
      "description": {
        "zh": "从休闲游艇到商用工作艇",
        "en": "From leisure yachts to working vessels"
      },
      "subcategories": [
        {
          "id": "yacht",
          "name": {
            "zh": "动力游艇",
            "en": "Motor yachts"
          }
        },
        {
          "id": "workboat",
          "name": {
            "zh": "商用工作艇",
            "en": "Workboats"
          }
        },
        {
          "id": "sailboat",
          "name": {
            "zh": "帆船",
            "en": "Sailboats"
          }
        }
      ],
      "fields": [
        {
          "key": "boat_type",
          "label": {
            "zh": "艇型",
            "en": "Vessel type"
          },
          "type": "enum",
          "options": [
            {
              "value": "yacht",
              "label": {
                "zh": "游艇",
                "en": "Yacht"
              }
            },
            {
              "value": "workboat",
              "label": {
                "zh": "工作艇",
                "en": "Workboat"
              }
            },
            {
              "value": "sailboat",
              "label": {
                "zh": "帆船",
                "en": "Sailboat"
              }
            }
          ],
          "required": true
        },
        {
          "key": "material",
          "label": {
            "zh": "船体材质",
            "en": "Hull material"
          },
          "type": "enum",
          "options": [
            {
              "value": "FRP",
              "label": {
                "zh": "玻璃钢",
                "en": "FRP"
              }
            },
            {
              "value": "Aluminum",
              "label": {
                "zh": "铝合金",
                "en": "Aluminum"
              }
            },
            {
              "value": "Steel",
              "label": {
                "zh": "钢",
                "en": "Steel"
              }
            }
          ],
          "required": true
        },
        {
          "key": "length",
          "label": {
            "zh": "总长（m）",
            "en": "Length (m)"
          },
          "type": "number",
          "options": [],
          "required": true
        },
        {
          "key": "power",
          "label": {
            "zh": "动力类型",
            "en": "Propulsion"
          },
          "type": "enum",
          "options": [
            {
              "value": "diesel",
              "label": {
                "zh": "柴油",
                "en": "Diesel"
              }
            },
            {
              "value": "electric",
              "label": {
                "zh": "电动",
                "en": "Electric"
              }
            },
            {
              "value": "hybrid",
              "label": {
                "zh": "混合动力",
                "en": "Hybrid"
              }
            }
          ],
          "required": true
        },
        {
          "key": "speed",
          "label": {
            "zh": "航速（kn）",
            "en": "Speed (kn)"
          },
          "type": "number",
          "options": [],
          "required": true
        }
      ],
      "industry_id": "marine"
    },
    {
      "id": "equipment",
      "name": {
        "zh": "配件设备",
        "en": "Parts & equipment"
      },
      "description": {
        "zh": "航行、动力与甲板系统",
        "en": "Navigation, propulsion and deck systems"
      },
      "subcategories": [
        {
          "id": "navigation",
          "name": {
            "zh": "航行设备",
            "en": "Navigation"
          }
        },
        {
          "id": "engine",
          "name": {
            "zh": "动力系统",
            "en": "Propulsion"
          }
        },
        {
          "id": "deck",
          "name": {
            "zh": "甲板设备",
            "en": "Deck equipment"
          }
        }
      ],
      "fields": [
        {
          "key": "compatible",
          "label": {
            "zh": "适配船型",
            "en": "Compatible vessel"
          },
          "type": "enum",
          "options": [
            {
              "value": "yacht",
              "label": {
                "zh": "游艇",
                "en": "Yacht"
              }
            },
            {
              "value": "commercial",
              "label": {
                "zh": "商船",
                "en": "Commercial"
              }
            },
            {
              "value": "all",
              "label": {
                "zh": "通用",
                "en": "Universal"
              }
            }
          ],
          "required": true
        },
        {
          "key": "brand",
          "label": {
            "zh": "品牌",
            "en": "Brand"
          },
          "type": "text",
          "options": [],
          "required": true
        },
        {
          "key": "model",
          "label": {
            "zh": "型号",
            "en": "Model"
          },
          "type": "text",
          "options": [],
          "required": true
        }
      ],
      "industry_id": "marine"
    },
    {
      "id": "coatings",
      "name": {
        "zh": "涂装养护",
        "en": "Coatings & care"
      },
      "description": {
        "zh": "专业船用涂装与合规方案",
        "en": "Marine coatings and compliance solutions"
      },
      "subcategories": [
        {
          "id": "antifouling",
          "name": {
            "zh": "防污涂料",
            "en": "Antifouling"
          }
        },
        {
          "id": "primer",
          "name": {
            "zh": "防腐底漆",
            "en": "Primers"
          }
        },
        {
          "id": "care",
          "name": {
            "zh": "养护用品",
            "en": "Care products"
          }
        }
      ],
      "fields": [
        {
          "key": "afs",
          "label": {
            "zh": "AFS 合规",
            "en": "AFS compliance"
          },
          "type": "enum",
          "options": [
            {
              "value": "compliant",
              "label": {
                "zh": "符合",
                "en": "Compliant"
              }
            },
            {
              "value": "pending",
              "label": {
                "zh": "待确认",
                "en": "Pending"
              }
            }
          ],
          "required": true
        },
        {
          "key": "voc",
          "label": {
            "zh": "VOC 标准",
            "en": "VOC standard"
          },
          "type": "enum",
          "options": [
            {
              "value": "low",
              "label": {
                "zh": "低 VOC",
                "en": "Low VOC"
              }
            },
            {
              "value": "standard",
              "label": {
                "zh": "标准 VOC",
                "en": "Standard VOC"
              }
            }
          ],
          "required": true
        },
        {
          "key": "msds",
          "label": {
            "zh": "MSDS 链接",
            "en": "MSDS URL"
          },
          "type": "url",
          "options": [],
          "required": true
        },
        {
          "key": "un_number",
          "label": {
            "zh": "UN 编号",
            "en": "UN number"
          },
          "type": "text",
          "options": [],
          "required": true
        },
        {
          "key": "hazard_class",
          "label": {
            "zh": "危险等级",
            "en": "Hazard class"
          },
          "type": "text",
          "options": [],
          "required": true
        },
        {
          "key": "transport",
          "label": {
            "zh": "运输限制",
            "en": "Transport restrictions"
          },
          "type": "text",
          "options": [],
          "required": true
        }
      ],
      "industry_id": "marine"
    },
    {
      "id": "services",
      "name": {
        "zh": "衍生服务",
        "en": "Marine services"
      },
      "description": {
        "zh": "检验、物流与设计服务",
        "en": "Inspection, logistics and design"
      },
      "subcategories": [
        {
          "id": "inspection",
          "name": {
            "zh": "检验认证",
            "en": "Inspection"
          }
        },
        {
          "id": "logistics",
          "name": {
            "zh": "跨境物流",
            "en": "Logistics"
          }
        },
        {
          "id": "design",
          "name": {
            "zh": "设计咨询",
            "en": "Design consulting"
          }
        }
      ],
      "fields": [
        {
          "key": "service_type",
          "label": {
            "zh": "服务类型",
            "en": "Service type"
          },
          "type": "enum",
          "options": [
            {
              "value": "inspection",
              "label": {
                "zh": "检验认证",
                "en": "Inspection"
              }
            },
            {
              "value": "logistics",
              "label": {
                "zh": "国际物流",
                "en": "Logistics"
              }
            },
            {
              "value": "design",
              "label": {
                "zh": "船舶设计",
                "en": "Marine design"
              }
            }
          ],
          "required": true
        },
        {
          "key": "region",
          "label": {
            "zh": "服务地区",
            "en": "Service region"
          },
          "type": "enum",
          "options": [
            {
              "value": "asia",
              "label": {
                "zh": "亚洲",
                "en": "Asia"
              }
            },
            {
              "value": "global",
              "label": {
                "zh": "全球",
                "en": "Global"
              }
            },
            {
              "value": "europe",
              "label": {
                "zh": "欧洲",
                "en": "Europe"
              }
            }
          ],
          "required": true
        },
        {
          "key": "content",
          "label": {
            "zh": "服务内容",
            "en": "Service scope"
          },
          "type": "textarea",
          "options": [],
          "required": true
        }
      ],
      "industry_id": "marine"
    },
    {
      "id": "bearings",
      "industry_id": "bearings",
      "name": {
        "zh": "轴承",
        "en": "Bearings"
      },
      "description": {
        "zh": "精密传动与工业配套",
        "en": "Precision components for industrial applications"
      },
      "subcategories": [
        {
          "id": "ball",
          "name": {
            "zh": "球轴承",
            "en": "Ball bearings"
          }
        },
        {
          "id": "roller",
          "name": {
            "zh": "滚子轴承",
            "en": "Roller bearings"
          }
        },
        {
          "id": "special",
          "name": {
            "zh": "专用轴承",
            "en": "Special bearings"
          }
        }
      ],
      "fields": [
        {
          "key": "inner_diameter",
          "label": {
            "zh": "内径（mm）",
            "en": "Bore diameter (mm)"
          },
          "type": "number",
          "options": [],
          "required": true
        },
        {
          "key": "precision",
          "label": {
            "zh": "精度等级",
            "en": "Precision class"
          },
          "type": "enum",
          "options": [
            {
              "value": "P0",
              "label": {
                "zh": "P0",
                "en": "P0"
              }
            },
            {
              "value": "P6",
              "label": {
                "zh": "P6",
                "en": "P6"
              }
            },
            {
              "value": "P5",
              "label": {
                "zh": "P5",
                "en": "P5"
              }
            },
            {
              "value": "P4",
              "label": {
                "zh": "P4",
                "en": "P4"
              }
            }
          ],
          "required": true
        },
        {
          "key": "bearing_material",
          "label": {
            "zh": "材质",
            "en": "Material"
          },
          "type": "enum",
          "options": [
            {
              "value": "chrome",
              "label": {
                "zh": "轴承钢",
                "en": "Chrome steel"
              }
            },
            {
              "value": "stainless",
              "label": {
                "zh": "不锈钢",
                "en": "Stainless steel"
              }
            }
          ],
          "required": true
        }
      ]
    },
    {
      "id": "machine-tools",
      "industry_id": "machine-tools",
      "name": {
        "zh": "机床",
        "en": "Machine tools"
      },
      "description": {
        "zh": "数控加工与智能制造",
        "en": "CNC machining and manufacturing"
      },
      "subcategories": [
        {
          "id": "lathe",
          "name": {
            "zh": "车床",
            "en": "Lathes"
          }
        },
        {
          "id": "milling",
          "name": {
            "zh": "铣床",
            "en": "Milling machines"
          }
        },
        {
          "id": "grinding",
          "name": {
            "zh": "磨床",
            "en": "Grinding machines"
          }
        }
      ],
      "fields": [
        {
          "key": "machining_type",
          "label": {
            "zh": "加工类型",
            "en": "Machining type"
          },
          "type": "enum",
          "options": [
            {
              "value": "turning",
              "label": {
                "zh": "车削",
                "en": "Turning"
              }
            },
            {
              "value": "milling",
              "label": {
                "zh": "铣削",
                "en": "Milling"
              }
            },
            {
              "value": "grinding",
              "label": {
                "zh": "磨削",
                "en": "Grinding"
              }
            }
          ],
          "required": true
        },
        {
          "key": "spindle_speed",
          "label": {
            "zh": "主轴转速（rpm）",
            "en": "Spindle speed (rpm)"
          },
          "type": "number",
          "options": [],
          "required": true
        },
        {
          "key": "travel_x",
          "label": {
            "zh": "X 轴行程（mm）",
            "en": "X-axis travel (mm)"
          },
          "type": "number",
          "options": [],
          "required": true
        }
      ]
    },
    {
      "id": "agriculture",
      "industry_id": "agriculture",
      "name": {
        "zh": "农产品",
        "en": "Agricultural products"
      },
      "description": {
        "zh": "粮食、油料与特色农产",
        "en": "Grains, oilseeds and specialty crops"
      },
      "subcategories": [
        {
          "id": "grain",
          "name": {
            "zh": "粮食",
            "en": "Grains"
          }
        },
        {
          "id": "oilseed",
          "name": {
            "zh": "油料作物",
            "en": "Oilseeds"
          }
        },
        {
          "id": "specialty",
          "name": {
            "zh": "特色农产品",
            "en": "Specialty crops"
          }
        }
      ],
      "fields": [
        {
          "key": "origin",
          "label": {
            "zh": "产地",
            "en": "Origin"
          },
          "type": "text",
          "options": [],
          "required": true
        },
        {
          "key": "crop_year",
          "label": {
            "zh": "收获年份",
            "en": "Harvest year"
          },
          "type": "number",
          "options": [],
          "required": true
        },
        {
          "key": "grade",
          "label": {
            "zh": "等级",
            "en": "Grade"
          },
          "type": "enum",
          "options": [
            {
              "value": "A",
              "label": {
                "zh": "A",
                "en": "A"
              }
            },
            {
              "value": "B",
              "label": {
                "zh": "B",
                "en": "B"
              }
            },
            {
              "value": "C",
              "label": {
                "zh": "C",
                "en": "C"
              }
            }
          ],
          "required": true
        },
        {
          "key": "packaging",
          "label": {
            "zh": "包装规格",
            "en": "Packaging"
          },
          "type": "text",
          "options": [],
          "required": true
        }
      ]
    },
    {
      "id": "forestry",
      "industry_id": "forestry",
      "name": {
        "zh": "木材与林产",
        "en": "Timber & forestry"
      },
      "description": {
        "zh": "木材加工与林产供应",
        "en": "Timber processing and forest products"
      },
      "subcategories": [
        {
          "id": "timber",
          "name": {
            "zh": "原木与板材",
            "en": "Logs & lumber"
          }
        },
        {
          "id": "panels",
          "name": {
            "zh": "人造板",
            "en": "Wood panels"
          }
        },
        {
          "id": "forest-products",
          "name": {
            "zh": "林产品",
            "en": "Forest products"
          }
        }
      ],
      "fields": [
        {
          "key": "species",
          "label": {
            "zh": "树种",
            "en": "Wood species"
          },
          "type": "enum",
          "options": [
            {
              "value": "pine",
              "label": {
                "zh": "松木",
                "en": "Pine"
              }
            },
            {
              "value": "birch",
              "label": {
                "zh": "桦木",
                "en": "Birch"
              }
            },
            {
              "value": "oak",
              "label": {
                "zh": "橡木",
                "en": "Oak"
              }
            }
          ],
          "required": true
        },
        {
          "key": "moisture",
          "label": {
            "zh": "含水率（%）",
            "en": "Moisture content (%)"
          },
          "type": "number",
          "options": [],
          "required": true
        },
        {
          "key": "dimensions",
          "label": {
            "zh": "尺寸规格",
            "en": "Dimensions"
          },
          "type": "text",
          "options": [],
          "required": true
        }
      ]
    },
    {
      "id": "chemicals",
      "industry_id": "chemicals",
      "name": {
        "zh": "石化与化工",
        "en": "Petrochemicals & chemicals"
      },
      "description": {
        "zh": "工业原料与精细化工",
        "en": "Industrial materials and specialty chemicals"
      },
      "subcategories": [
        {
          "id": "petrochemical",
          "name": {
            "zh": "石化原料",
            "en": "Petrochemicals"
          }
        },
        {
          "id": "specialty",
          "name": {
            "zh": "精细化工",
            "en": "Specialty chemicals"
          }
        },
        {
          "id": "materials",
          "name": {
            "zh": "化工材料",
            "en": "Chemical materials"
          }
        }
      ],
      "fields": [
        {
          "key": "chemical_name",
          "label": {
            "zh": "化学品名称",
            "en": "Chemical name"
          },
          "type": "text",
          "options": [],
          "required": true
        },
        {
          "key": "cas_number",
          "label": {
            "zh": "CAS 编号",
            "en": "CAS number"
          },
          "type": "text",
          "options": [],
          "required": true
        },
        {
          "key": "purity",
          "label": {
            "zh": "纯度（%）",
            "en": "Purity (%)"
          },
          "type": "number",
          "options": [],
          "required": true
        },
        {
          "key": "msds",
          "label": {
            "zh": "MSDS 链接",
            "en": "MSDS URL"
          },
          "type": "url",
          "options": [],
          "required": false
        }
      ]
    }
  ],
  "industries": [
    {
      "id": "marine",
      "name": {
        "zh": "船舶与游艇",
        "en": "Vessels & yachts"
      },
      "description": {
        "zh": "整艇、配件设备、涂装养护与服务",
        "en": "Vessels, equipment, coatings and services"
      },
      "category_ids": [
        "boats",
        "equipment",
        "coatings",
        "services"
      ]
    },
    {
      "id": "bearings",
      "name": {
        "zh": "轴承",
        "en": "Bearings"
      },
      "description": {
        "zh": "精密传动与工业配套",
        "en": "Precision components for industrial applications"
      },
      "category_ids": [
        "bearings"
      ]
    },
    {
      "id": "machine-tools",
      "name": {
        "zh": "机床",
        "en": "Machine tools"
      },
      "description": {
        "zh": "数控加工与智能制造",
        "en": "CNC machining and manufacturing"
      },
      "category_ids": [
        "machine-tools"
      ]
    },
    {
      "id": "agriculture",
      "name": {
        "zh": "农产品",
        "en": "Agricultural products"
      },
      "description": {
        "zh": "粮食、油料与特色农产",
        "en": "Grains, oilseeds and specialty crops"
      },
      "category_ids": [
        "agriculture"
      ]
    },
    {
      "id": "forestry",
      "name": {
        "zh": "木材与林产",
        "en": "Timber & forestry"
      },
      "description": {
        "zh": "木材加工与林产供应",
        "en": "Timber processing and forest products"
      },
      "category_ids": [
        "forestry"
      ]
    },
    {
      "id": "chemicals",
      "name": {
        "zh": "石化与化工",
        "en": "Petrochemicals & chemicals"
      },
      "description": {
        "zh": "工业原料与精细化工",
        "en": "Industrial materials and specialty chemicals"
      },
      "category_ids": [
        "chemicals"
      ]
    }
  ],
  "products": [
    {
      "id": "p01",
      "category_id": "boats",
      "subcategory_id": "yacht",
      "i18n": {
        "zh": {
          "title": "海岚 42 尺飞桥游艇",
          "description": "海岚 42 尺飞桥游艇，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Hailan 42 Flybridge Yacht",
          "description": "Hailan 42 Flybridge Yacht, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/boats.svg",
        "assets/media/boats-detail.svg"
      ],
      "parameters": {
        "boat_type": "yacht",
        "material": "FRP",
        "length": 12.8,
        "power": "diesel",
        "speed": 28
      },
      "certifications": [
        {
          "type": "CCS",
          "number": "DEMO-CCS-0001"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s1",
        "name": {
          "zh": "海岚船艇制造有限公司",
          "en": "Hailan Marine Manufacturing"
        },
        "country": "China",
        "verified": true,
        "products_count": 24
      },
      "trade": {
        "moq": 1,
        "unit": "set",
        "lead_time": 30,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 185000,
        "price_max": 212750,
        "currency": "USD"
      },
      "updated_at": "2026-10-08T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p02",
      "category_id": "boats",
      "subcategory_id": "workboat",
      "i18n": {
        "zh": {
          "title": "远航 18m 铝合金工作艇",
          "description": "远航 18m 铝合金工作艇，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Voyager 18m Aluminum Workboat",
          "description": "Voyager 18m Aluminum Workboat, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/boats.svg",
        "assets/media/boats-detail.svg"
      ],
      "parameters": {
        "boat_type": "workboat",
        "material": "Aluminum",
        "length": 18,
        "power": "diesel",
        "speed": 24
      },
      "certifications": [
        {
          "type": "ABS",
          "number": "DEMO-ABS-0002"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s2",
        "name": {
          "zh": "远航海洋装备有限公司",
          "en": "Voyager Ocean Equipment"
        },
        "country": "China",
        "verified": true,
        "products_count": 27
      },
      "trade": {
        "moq": 1,
        "unit": "set",
        "lead_time": 32,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 320000,
        "price_max": 368000,
        "currency": "USD"
      },
      "updated_at": "2026-10-07T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p03",
      "category_id": "boats",
      "subcategory_id": "yacht",
      "i18n": {
        "zh": {
          "title": "清源 10m 纯电动观光艇",
          "description": "清源 10m 纯电动观光艇，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Qingyuan 10m Electric Cruiser",
          "description": "Qingyuan 10m Electric Cruiser, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/boats.svg",
        "assets/media/boats-detail.svg"
      ],
      "parameters": {
        "boat_type": "yacht",
        "material": "FRP",
        "length": 10,
        "power": "electric",
        "speed": 12
      },
      "certifications": [
        {
          "type": "DNV",
          "number": "DEMO-DNV-0003"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s3",
        "name": {
          "zh": "蓝湾船舶技术有限公司",
          "en": "Bluebay Marine Technology"
        },
        "country": "China",
        "verified": true,
        "products_count": 30
      },
      "trade": {
        "moq": 1,
        "unit": "set",
        "lead_time": 34,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 95000,
        "price_max": 109250,
        "currency": "USD"
      },
      "updated_at": "2026-10-06T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p04",
      "category_id": "boats",
      "subcategory_id": "sailboat",
      "i18n": {
        "zh": {
          "title": "蓝湾 38 尺远洋帆船",
          "description": "蓝湾 38 尺远洋帆船，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Bluebay 38 Offshore Sailboat",
          "description": "Bluebay 38 Offshore Sailboat, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/boats.svg",
        "assets/media/boats-detail.svg"
      ],
      "parameters": {
        "boat_type": "sailboat",
        "material": "FRP",
        "length": 11.6,
        "power": "hybrid",
        "speed": 9
      },
      "certifications": [
        {
          "type": "CCS",
          "number": "DEMO-CCS-0004"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s4",
        "name": {
          "zh": "海固海事服务有限公司",
          "en": "SeaGuard Marine Services"
        },
        "country": "China",
        "verified": true,
        "products_count": 33
      },
      "trade": {
        "moq": 1,
        "unit": "set",
        "lead_time": 36,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 128000,
        "price_max": 147200,
        "currency": "USD"
      },
      "updated_at": "2026-10-05T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p05",
      "category_id": "equipment",
      "subcategory_id": "navigation",
      "i18n": {
        "zh": {
          "title": "N7 多功能船用导航仪",
          "description": "N7 多功能船用导航仪，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "N7 Marine Navigation Display",
          "description": "N7 Marine Navigation Display, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/equipment.svg",
        "assets/media/equipment-detail.svg"
      ],
      "parameters": {
        "compatible": "all",
        "brand": "NAVSEA",
        "model": "N7"
      },
      "certifications": [
        {
          "type": "ABS",
          "number": "DEMO-ABS-0005"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s1",
        "name": {
          "zh": "海岚船艇制造有限公司",
          "en": "Hailan Marine Manufacturing"
        },
        "country": "China",
        "verified": true,
        "products_count": 36
      },
      "trade": {
        "moq": 10,
        "unit": "set",
        "lead_time": 38,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 680,
        "price_max": 782,
        "currency": "USD"
      },
      "updated_at": "2026-10-04T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p06",
      "category_id": "equipment",
      "subcategory_id": "engine",
      "i18n": {
        "zh": {
          "title": "M280 船用柴油动力系统",
          "description": "M280 船用柴油动力系统，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "M280 Marine Diesel Engine",
          "description": "M280 Marine Diesel Engine, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/equipment.svg",
        "assets/media/equipment-detail.svg"
      ],
      "parameters": {
        "compatible": "commercial",
        "brand": "OCEANPOWER",
        "model": "M280"
      },
      "certifications": [
        {
          "type": "DNV",
          "number": "DEMO-DNV-0006"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s2",
        "name": {
          "zh": "远航海洋装备有限公司",
          "en": "Voyager Ocean Equipment"
        },
        "country": "China",
        "verified": true,
        "products_count": 39
      },
      "trade": {
        "moq": 10,
        "unit": "set",
        "lead_time": 40,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 12500,
        "price_max": 14375,
        "currency": "USD"
      },
      "updated_at": "2026-10-03T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p07",
      "category_id": "equipment",
      "subcategory_id": "deck",
      "i18n": {
        "zh": {
          "title": "不锈钢电动锚机 1500W",
          "description": "不锈钢电动锚机 1500W，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "1500W Stainless Electric Windlass",
          "description": "1500W Stainless Electric Windlass, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/equipment.svg",
        "assets/media/equipment-detail.svg"
      ],
      "parameters": {
        "compatible": "yacht",
        "brand": "SEADECK",
        "model": "W1500"
      },
      "certifications": [
        {
          "type": "CCS",
          "number": "DEMO-CCS-0007"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s3",
        "name": {
          "zh": "蓝湾船舶技术有限公司",
          "en": "Bluebay Marine Technology"
        },
        "country": "China",
        "verified": true,
        "products_count": 42
      },
      "trade": {
        "moq": 10,
        "unit": "set",
        "lead_time": 42,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 850,
        "price_max": 977,
        "currency": "USD"
      },
      "updated_at": "2026-10-02T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p08",
      "category_id": "equipment",
      "subcategory_id": "navigation",
      "i18n": {
        "zh": {
          "title": "AIS 船舶自动识别系统",
          "description": "AIS 船舶自动识别系统，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Class B AIS Transponder",
          "description": "Class B AIS Transponder, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/equipment.svg",
        "assets/media/equipment-detail.svg"
      ],
      "parameters": {
        "compatible": "all",
        "brand": "NAVSEA",
        "model": "AIS-B"
      },
      "certifications": [
        {
          "type": "ABS",
          "number": "DEMO-ABS-0008"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s4",
        "name": {
          "zh": "海固海事服务有限公司",
          "en": "SeaGuard Marine Services"
        },
        "country": "China",
        "verified": true,
        "products_count": 45
      },
      "trade": {
        "moq": 10,
        "unit": "set",
        "lead_time": 44,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 420,
        "price_max": 483,
        "currency": "USD"
      },
      "updated_at": "2026-10-08T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p09",
      "category_id": "coatings",
      "subcategory_id": "antifouling",
      "i18n": {
        "zh": {
          "title": "蓝盾低 VOC 无锡防污涂料",
          "description": "蓝盾低 VOC 无锡防污涂料，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "BlueShield Low-VOC Antifouling",
          "description": "BlueShield Low-VOC Antifouling, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/coatings.svg",
        "assets/media/coatings-detail.svg"
      ],
      "parameters": {},
      "certifications": [
        {
          "type": "DNV",
          "number": "DEMO-DNV-0009"
        }
      ],
      "compliance": {
        "afs": "compliant",
        "voc": "low",
        "msds": "assets/media/msds-sample.txt",
        "un_number": "UN 1263",
        "hazard_class": "3",
        "transport": "IMDG / Sea freight only"
      },
      "supplier": {
        "id": "s1",
        "name": {
          "zh": "海岚船艇制造有限公司",
          "en": "Hailan Marine Manufacturing"
        },
        "country": "China",
        "verified": true,
        "products_count": 48
      },
      "trade": {
        "moq": 10,
        "unit": "kg",
        "lead_time": 46,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 28,
        "price_max": 32,
        "currency": "USD"
      },
      "updated_at": "2026-10-07T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p10",
      "category_id": "coatings",
      "subcategory_id": "primer",
      "i18n": {
        "zh": {
          "title": "海固环氧防腐底漆",
          "description": "海固环氧防腐底漆，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "SeaGuard Epoxy Marine Primer",
          "description": "SeaGuard Epoxy Marine Primer, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/coatings.svg",
        "assets/media/coatings-detail.svg"
      ],
      "parameters": {},
      "certifications": [
        {
          "type": "CCS",
          "number": "DEMO-CCS-0010"
        }
      ],
      "compliance": {
        "afs": "compliant",
        "voc": "low",
        "msds": "assets/media/msds-sample.txt",
        "un_number": "UN 1263",
        "hazard_class": "3",
        "transport": "IMDG / Sea freight only"
      },
      "supplier": {
        "id": "s2",
        "name": {
          "zh": "远航海洋装备有限公司",
          "en": "Voyager Ocean Equipment"
        },
        "country": "China",
        "verified": true,
        "products_count": 51
      },
      "trade": {
        "moq": 10,
        "unit": "kg",
        "lead_time": 48,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 18,
        "price_max": 21,
        "currency": "USD"
      },
      "updated_at": "2026-10-06T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p11",
      "category_id": "coatings",
      "subcategory_id": "care",
      "i18n": {
        "zh": {
          "title": "游艇甲板养护清洁剂",
          "description": "游艇甲板养护清洁剂，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Yacht Deck Care Cleaner",
          "description": "Yacht Deck Care Cleaner, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/coatings.svg",
        "assets/media/coatings-detail.svg"
      ],
      "parameters": {},
      "certifications": [
        {
          "type": "ABS",
          "number": "DEMO-ABS-0011"
        }
      ],
      "compliance": {
        "afs": "compliant",
        "voc": "low",
        "msds": "assets/media/msds-sample.txt",
        "un_number": "UN 1263",
        "hazard_class": "3",
        "transport": "IMDG / Sea freight only"
      },
      "supplier": {
        "id": "s3",
        "name": {
          "zh": "蓝湾船舶技术有限公司",
          "en": "Bluebay Marine Technology"
        },
        "country": "China",
        "verified": true,
        "products_count": 54
      },
      "trade": {
        "moq": 10,
        "unit": "kg",
        "lead_time": 50,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 12,
        "price_max": 14,
        "currency": "USD"
      },
      "updated_at": "2026-10-05T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p12",
      "category_id": "coatings",
      "subcategory_id": "antifouling",
      "i18n": {
        "zh": {
          "title": "防污涂层样例 · 合规待补全",
          "description": "防污涂层样例 · 合规待补全，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Antifouling Sample · Compliance Pending",
          "description": "Antifouling Sample · Compliance Pending, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/coatings.svg",
        "assets/media/coatings-detail.svg"
      ],
      "parameters": {},
      "certifications": [
        {
          "type": "DNV",
          "number": "DEMO-DNV-0012"
        }
      ],
      "compliance": {
        "afs": "pending",
        "voc": "standard"
      },
      "supplier": {
        "id": "s4",
        "name": {
          "zh": "海固海事服务有限公司",
          "en": "SeaGuard Marine Services"
        },
        "country": "China",
        "verified": true,
        "products_count": 57
      },
      "trade": {
        "moq": 10,
        "unit": "kg",
        "lead_time": 52,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 22,
        "price_max": 25,
        "currency": "USD"
      },
      "updated_at": "2026-10-04T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p13",
      "category_id": "services",
      "subcategory_id": "inspection",
      "i18n": {
        "zh": {
          "title": "船舶交付前检验服务",
          "description": "船舶交付前检验服务，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Pre-delivery Vessel Inspection",
          "description": "Pre-delivery Vessel Inspection, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/services.svg",
        "assets/media/services-detail.svg"
      ],
      "parameters": {
        "service_type": "inspection",
        "region": "asia",
        "content": {
          "zh": "船体、动力及安全系统现场检验",
          "en": "On-site hull, propulsion and safety inspection"
        }
      },
      "certifications": [
        {
          "type": "CCS",
          "number": "DEMO-CCS-0013"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s1",
        "name": {
          "zh": "海岚船艇制造有限公司",
          "en": "Hailan Marine Manufacturing"
        },
        "country": "China",
        "verified": true,
        "products_count": 60
      },
      "trade": {
        "moq": 1,
        "unit": "set",
        "lead_time": 54,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 1800,
        "price_max": 2070,
        "currency": "USD"
      },
      "updated_at": "2026-10-03T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p14",
      "category_id": "services",
      "subcategory_id": "logistics",
      "i18n": {
        "zh": {
          "title": "游艇跨境运输与清关",
          "description": "游艇跨境运输与清关，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Cross-border Yacht Shipping",
          "description": "Cross-border Yacht Shipping, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/services.svg",
        "assets/media/services-detail.svg"
      ],
      "parameters": {
        "service_type": "logistics",
        "region": "global",
        "content": {
          "zh": "吊装、海运及目的港清关协调",
          "en": "Lifting, sea transport and port customs coordination"
        }
      },
      "certifications": [
        {
          "type": "ABS",
          "number": "DEMO-ABS-0014"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s2",
        "name": {
          "zh": "远航海洋装备有限公司",
          "en": "Voyager Ocean Equipment"
        },
        "country": "China",
        "verified": true,
        "products_count": 63
      },
      "trade": {
        "moq": 1,
        "unit": "set",
        "lead_time": 56,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 2500,
        "price_max": 2875,
        "currency": "USD"
      },
      "updated_at": "2026-10-02T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p15",
      "category_id": "services",
      "subcategory_id": "design",
      "i18n": {
        "zh": {
          "title": "船舶结构设计与技术咨询",
          "description": "船舶结构设计与技术咨询，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "Marine Structural Design",
          "description": "Marine Structural Design, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/services.svg",
        "assets/media/services-detail.svg"
      ],
      "parameters": {
        "service_type": "design",
        "region": "global",
        "content": {
          "zh": "结构方案、工程图纸及技术咨询",
          "en": "Structural concepts, engineering drawings and consulting"
        }
      },
      "certifications": [
        {
          "type": "DNV",
          "number": "DEMO-DNV-0015"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s3",
        "name": {
          "zh": "蓝湾船舶技术有限公司",
          "en": "Bluebay Marine Technology"
        },
        "country": "China",
        "verified": true,
        "products_count": 66
      },
      "trade": {
        "moq": 1,
        "unit": "set",
        "lead_time": 58,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 3500,
        "price_max": 4025,
        "currency": "USD"
      },
      "updated_at": "2026-10-08T08:00:00Z",
      "status": "published"
    },
    {
      "id": "p16",
      "category_id": "services",
      "subcategory_id": "inspection",
      "i18n": {
        "zh": {
          "title": "欧洲目的港验船与交付",
          "description": "欧洲目的港验船与交付，面向专业船舶采购的结构化产品样例。可按项目需求提供规格确认与出口贸易方案。此信息为原型演示数据。"
        },
        "en": {
          "title": "European Port Survey & Delivery",
          "description": "European Port Survey & Delivery, a structured sourcing example for marine buyers. Specifications and export terms can be discussed for your project. All information is demo data."
        }
      },
      "media": [
        "assets/media/services.svg",
        "assets/media/services-detail.svg"
      ],
      "parameters": {
        "service_type": "inspection",
        "region": "europe",
        "content": {
          "zh": "目的港检验及交付协调",
          "en": "Destination port survey and delivery coordination"
        }
      },
      "certifications": [
        {
          "type": "CCS",
          "number": "DEMO-CCS-0016"
        }
      ],
      "compliance": {},
      "supplier": {
        "id": "s4",
        "name": {
          "zh": "海固海事服务有限公司",
          "en": "SeaGuard Marine Services"
        },
        "country": "China",
        "verified": true,
        "products_count": 69
      },
      "trade": {
        "moq": 1,
        "unit": "set",
        "lead_time": 60,
        "incoterms": [
          "FOB",
          "CIF",
          "EXW"
        ],
        "price_min": 2200,
        "price_max": 2530,
        "currency": "USD"
      },
      "updated_at": "2026-10-07T08:00:00Z",
      "status": "published"
    }
  ]
};
