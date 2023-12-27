# 任务API

## taskName

任务名称

**类型：String**

## taskList

任务列表

**类型：Array**

### type 

任务类型

**类型：String**

**可选值：**

- readModbus
- request
- writeModbus
- MongoDBOperation
- waitApi
- apiCallback

**描述：**

- readModbus: 监听 modbus 值状态 
- request: 调用接口（POST、GET） 
- writeModbus: 写入 modbus 值
- MongoDBOperation: mongoDB 操作
- waitApi: 等待接口调用
- apiCallback: 完成接口返回

### status

任务状态

**类型：Number**

**默认值：0**

**描述：**

- 0: 未执行 
- 1: 执行中 
- 2: 执行成功 
- 3: 执行失败

### data

子任务数据

**类型：Array | Object**

**描述：**

```typescript
export interface readParams {
  ip: string
  port: number | string
  readAddress: number | string
  readValue: number | string // 需要监测值
  watchValue: number | null // 当前监测值
  method: 'readCoils' | 'readDiscreteInputs' | 'readHoldingRegisters' | 'readInputRegisters'
}
export interface writeParams {
  ip: string
  port: number | string
  writeAddress: number | string
  writeValue: number | string
  method: 'writeSingleCoil' | 'writeSingleRegister'
}

interface selectedResponse {
  [value: string]: {
    step: number
    // ['0->selected', 'body->select']
    selected: Array<string>
  }
}

export interface apiParams {
  method: string
  url: string
  data: any
  useResponse: boolean
  beforeResponse: selectedResponse
}

export interface DBParams {
  url: string
  method: 'findDB' | 'updateDB' | 'removeDB' | 'insertDB'
  DBName: string
  tabName: string
  data: any
  setData: any
  useResponse: boolean
  beforeResponse: {
    data: selectedResponse
    setData?: selectedResponse
  }
}
```



### resultData

任务返回

**类型：Any**

## taskStatus

任务状态

**类型：Number**

**默认值：0**

**描述：**

- 0: 未执行 
- 1: 执行中 
- 2: 执行成功 
- 3: 执行失败



## 示例

```json
{
    "taskName": "Task_17",
    "taskList": [
        {
            "type": "readModbus",
            "status": 0,
            "data": [
                {
                    "ip": "localhost",
                    "port": "8888",
                    "readAddress": "5",
                    "readValue": "0",
                    "watchValue": null,
                    "method": "readCoils"
                }
            ],
            "resultData": true
        },
        {
            "type": "request",
            "status": 0,
            "data": {
                "method": "GET",
                "url": "http://localhost:3000/test",
                "data": [
                    {
                        "name": "taskID",
                        "value": "00001"
                    },
                    {
                        "name": "vehicle",
                        "value": "1"
                    }
                ],
                "useResponse": false,
                "beforeResponse": {}
            },
            "resultData": {
                "taskID": "00001",
                "vehicle": "1"
            }
        },
        {
            "type": "MongoDBOperation",
            "status": 0,
            "data": {
                "url": "localhost:27017",
                "method": "findDB",
                "DBName": "auto_inject",
                "tabName": "vehicle_tray",
                "data": {
                    "status": 0
                },
                "setData": {},
                "useResponse": true,
                "beforeResponse": {
                    "data": {
                        "vehicle": {
                            "step": 1,
                            "selected": [
                                "vehicle"
                            ]
                        }
                    },
                    "setData": {}
                }
            },
            "resultData": []
        },
        {
            "type": "request",
            "status": 0,
            "data": {
                "method": "POST",
                "url": "http://localhost:3000/test",
                "data": "{}",
                "useResponse": true,
                "beforeResponse": {
                    "taskID": {
                        "step": 1,
                        "selected": [
                            "taskID"
                        ]
                    },
                    "position": {
                        "step": 2,
                        "selected": [
                            "0->vehicle",
                            "0->location",
                            "0->point"
                        ]
                    }
                }
            },
            "resultData": {
                "taskID": "00001",
                "position": "undefinedundefinedundefined"
            }
        },
        {
            "type": "waitApi",
            "status": 0,
            "data": {},
            "resultData": true
        },
        {
            "type": "readModbus",
            "status": 0,
            "data": [
                {
                    "ip": "localhost",
                    "port": "8888",
                    "readAddress": "10",
                    "readValue": "0",
                    "watchValue": null,
                    "method": "readCoils"
                }
            ],
            "resultData": true
        },
        {
            "type": "writeModbus",
            "status": 0,
            "data": {
                "ip": "localhost",
                "port": "8888",
                "writeAddress": "20",
                "writeValue": "1",
                "method": "writeSingleCoil"
            },
            "resultData": true
        },
        {
            "type": "apiCallback",
            "status": 0,
            "data": {},
            "resultData": true
        }
    ],
    "taskStatus": 0
}
```

