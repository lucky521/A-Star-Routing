A-Star-Routing
==============

A*算法实现模拟路径搜索


## 场景
穿越一片丛林，有高有低，找出最佳行进路线。

## 实现
估值h函数使用曼哈顿距离或切比雪夫距离。

采用JavaScript语言在前端上实现，利用HTML5中canvas画布在浏览器上显示地图和寻路过程。

画布左上角设定为起点，画布右下角设定为终点。

## Function函数对象
* Map 用于随机创建和存储地形数据。每个位置的value值代表了该位置的穿越难度，难度同时反映在颜色深度上。

* PathFinder 用于绘制地图和自动寻路。

* main 负责主函数流程。


## 随机地形生成的方法
现实世界的崇山峻岭或丛林草原必定是连续变化的而不是离散的，所以构造地形的时候也要使地形情况是连续变化的。

1. 生成若干个随机值的点
2. 从中选出值大于阈值max的点（认为是海拔高的地方），令其周围的点高度逐渐递减。
