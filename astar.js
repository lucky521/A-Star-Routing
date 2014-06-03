var myPath,
	map,
	start,
	end,
	context,

	DRAW_PATH_INTERVAL = 20, //绘制速度控制
	TILE_SIZE = 3,  //画面精细度控制
	WALL_THRESHOLD = 0.005,
    H_FUNCTION = ''; //h函数设定： 'manhattan' or 'chebyshev'
/////////////////////////////////////////////////

function main() {
    //canvas用于绘制图形
	var canvas = document.createElement('canvas'),
		size = TILE_SIZE,
		x = Math.floor(window.innerWidth / size), //获取浏览器窗口尺寸
		y = Math.floor(window.innerHeight / size);
		
	//创建一个Map对象
	map = new Map({
		tileSize: size,
		xTiles: x,
		yTiles: y,
		wallThreshold: WALL_THRESHOLD
	});
	
	map.doTerrain(0.9, 0.1, 0.05); //为Map对象设定随机地形
	
	start = [0, 0]; //寻路的起末位置
	end = [x-1, y-1];

	canvas.width = size * x;
	canvas.height = size * y;
	context = canvas.getContext('2d'); //获取画布环境
	document.body.appendChild(canvas); //将画布加入到浏览器窗口中
    
	myPath = new PathFinder(map); //创建寻路对象
	
	myPath.draw(context); //绘制出图像
	
    
    //对寻路算法计时
	var sTime = Date.now();
	var myRoute = myPath.find(start, end, H_FUNCTION, context);
	var eTime = Date.now();
	console.log('Found the route in', eTime - sTime, 'ms.');
    
	myPath.drawRoute(myRoute, context); //绘制出路线
    
}
/////////////////////////////////////////////////

function Map(props) {
	
	this.map = []; //二维数组
	
	this.options = { //配置选项，有默认值
    tileSize: 10,
    xTiles: 10,
    yTiles: 20,
    wallThreshold: 0.5
	};
	//从参数赋值给配置选项
	for(var i in props) {
		this.options[i] = props[i];
	}
	
	//随机点初始化：在map中随机添加随机点
	this.initialize = function() {
		var i = 0,
			j,
			numX = this.options.xTiles,
			numY = this.options.yTiles,
			current,
			random,
			m = Math,
			tile,
			walls = this.options.wallThreshold;
			
		for(i; i < numX; ++i) {
			
			current = [];
			
			for(j = 0; j < numY; ++j) {
				
				random = m.random(); //0.0 ~ 1.0 之间的一个伪随机数
				
				tile = random < walls ? 1 : 0.1;
								
				current.push(tile);
				
			}
			this.map.push(current);
			
		}
	};


	this.initialize(); // 自动执行初始化函数
	
    //返回邻居方块
	this.getPeakNeighbours = function(peak, max) {
		var x = peak.x,
			y = peak.y,
			out = [];
		// top
		if(this.map[x][y-1] && this.map[x][y-1] < max) {
			out.push({
				x: x,
				y: y-1
			});
		}
		// bottom
		if(this.map[x][y+1] && this.map[x][y+1] < max) {
			out.push({
				x: x,
				y: y+1
			});
		}
		// left
		if(this.map[x-1] && this.map[x-1][y] && this.map[x-1][y] < max) {
			out.push({
				x: x-1,
				y: y
			});
		}
		// right
		if(this.map[x+1] && this.map[x+1][y] && this.map[x+1][y] < max) {
			out.push({
				x: x+1,
				y: y
			});
		}
		return out;
	};
	
	this.doTerrain = function(max, min, decrement) {
		var x, y,
			peaks = [];
		
        //从map中挑出值大于max的位置
		for(x = 0; x < this.map.length; ++x) {
			
			for(y = 0; y < this.map[x].length; ++y) {
				
				if(this.map[x][y] >= max) {
					peaks.push({
						x: x,
						y: y
					});
				}	
			}
		}
		
		for(var i = 0, il = peaks.length; i < il; ++i) {
			var neighbours = this.getPeakNeighbours(peaks[i], max);
			
			for(var n = 0; n < neighbours.length; ++n) {
				this.map[neighbours[n].x][neighbours[n].y] = max - decrement; //将peaks中每个点的邻居赋值
			}
			
		}
		
		if(max > min) {
			max = max - decrement;
			arguments.callee.call(this, max, min, decrement); //函数递归：地形扩散到四周，且值递减
		}
		
	};
}

/////////////////////////////////////////////////

function PathFinder(map) {
	
	this.map = map;
	this.grid = null;
	this.result = null;
	
    //估计函数h ：使用的是曼哈顿距离
	this.heuristics = {
		manhattan: function(ax, ay, bx, by) {
			var abs = Math.abs,
				result = ( abs(ax - bx) + abs(ay - by) );
				
			return result;
		},
		chebyshev: function(ax, ay, bx, by) {
			var abs = Math.abs;
			return Math.max( abs(ax - bx), abs(ay - by) )
		}
	};
	
	
    //绘制整张画布
	this.draw = function(context) {
		var y = 0, x,
			map = this.map.map,
			opts = this.map.options,
			tileSize = opts.tileSize,
			xTiles = opts.xTiles,
			yTiles = opts.yTiles,
			colour;
        
		for(x = 0; x < xTiles; ++x) {
			for(y = 0; y < yTiles; ++y) {
                context.fillStyle = 'rgba(0,' + Math.floor(Math.random()*255) +',0,' + map[x][y] + ')'; //选取颜色
				context.fillRect(x*tileSize, y*tileSize, tileSize, tileSize); //绘制
			}
		}
	};
	
    //在context按一定速度上绘制出路径route
	this.drawRoute = function(route, context) {
		var size = this.map.options.tileSize,
			that = this,
			i = 0;
		
		context.fillStyle = 'rgba(255, 0, 0, 0.5)'; //红色+半透明
		
		var int = setInterval(function() {
            //在画布(x,y)位置上绘制size大小的方块
            context.fillRect(route[i].x*size, route[i].y*size, size, size);
			++i;
			
			if(i === route.length) { //绘制完毕后停止
				clearInterval(int);
			}
		}, DRAW_PATH_INTERVAL);
	};

    //整个地图的每个点格式初始化
	this.gridify = function(map) {
		
		var obj;
		
		this.grid = [];
		
		for(var i = 0, il = this.map.map.length; i < il; ++i) {
			
			this.grid[i] = [];
			
			for(var j = 0, jl = this.map.map[i].length; j < jl; ++j) {
				
				obj = {
					x: i,   //x坐标
					y: j,   //y坐标
					f: 0,   //f函数
					g: 0,   //g函数
					h: 0,   //h函数
					visted: false,  //是否已访问
					closed: false,  //是否在closed表中，closed表不专门设置，而是通过
					parent: null,   //其父节点的位置
					value: this.map.map[i][j]   //该点的值：1是墙
				};
				
				this.grid[i].push(obj);
				
			}
			
		}
		
	};
	
	this.getNeighbours = function(current, heuristic) {
		var grid = this.grid,
			out = [],
			x = current.x,
			y = current.y;
		
		// left
		if(grid[x-1] && grid[x-1][y]) {
		    out.push(grid[x-1][y]);
	    }
		// right
	    if(grid[x+1] && grid[x+1][y]) {
		    out.push(grid[x+1][y]);
	    }
		// bottom
	    if(grid[x][y-1]) {
		    out.push(grid[x][y-1]);
	    }
		// top
	    if(grid[x][y+1]) {
		    out.push(grid[x][y+1]);
	    }
		
		if(heuristic === 'chebyshev') {
            console.log('chebyshev');
			// top left
			if(grid[x-1] && grid[x-1][y-1]) {
				grid[x-1][y-1].weight += 14;
				out.push(grid[x-1][y-1]);
			}
			// top right
			if(grid[x+1] && grid[x+1][y-1]) {
				grid[x+1][y-1].weight += 14;
				out.push(grid[x+1][y-1]);
			}
			// bottom left
			if(grid[x-1] && grid[x-1][y+1]) {
				grid[x-1][y+1].weight += 14;
				out.push(grid[x-1][y+1]);
			}
			// bottom right
			if(grid[x+1] && grid[x+1][y+1]) {
				grid[x+1][y+1].weight += 14;
				out.push(grid[x+1][y+1]);
			}
		}
	    return out;
	};
	
    
    //A*寻路算法：返回值是搜索到的路径
	this.find = function(start, end, h, context) {
		
		// 设定h函数
		heuristic = (this.heuristics[h] || this.heuristics.manhattan); //默认h函数为曼哈顿方法
		
		this.gridify(this.map); //为每个点创建格式化结构
		
		// Find the start & end point within our grid.
		start = this.grid[start[0]][start[1]];
		end = this.grid[end[0]][end[1]];
		
		var open = [],  //open表
			current,
			neighbours,
			currentNeighbour,
			lowest, i, openlen;
		
		open.push(start);
		
		//搜索循环
		while( (openlen = open.length) && openlen > 0 ) {
			
            		//遍历一遍open表，从中选取f值最小的一个
			low = 0;
			for(i = 0; i < openlen; ++i) {
				if(open[i].f < open[low].f) {
					low = i;
				}
			}
			
			current = open[low]; //从open表中选值最小的元素
			
			if(current === end) { //找到终点：追溯parent回起点，返回路径
				var c = current,
					ret = [];
					
				while(c.parent) {
					ret.push(c);
					c = c.parent;
				}
				return ret.reverse();
			}
			
			// remove current tile from the open list
			open.splice(low, 1); //slice函数：删除low位置开始的1个元素
			
			// mark current tile as closed
			current.closed = true;
			
			// Get current tile's neighbours
			neighbours = this.getNeighbours(current, h);
			
			for(i = 0; i < neighbours.length; ++i) {
				
				currentNeighbour = neighbours[i];
				
				if(currentNeighbour.closed || currentNeighbour.value === 1) {
					continue;
				}
				
				// 计算g的值：从起点到当前位置已走过的距离
				currentNeighbour.g = currentNeighbour.g + 1;
				
				if(!currentNeighbour.visted) {
                    
                    			currentNeighbour.visted = true;
					
                   			// 计算h的值：当前位置到终点的曼哈顿距离 * 当前位置的值
					currentNeighbour.h = heuristic(currentNeighbour.x, currentNeighbour.y, end.x, end.y);
                    			//乘以点的值是因为，值越大认为该位置越难走
					currentNeighbour.h *= currentNeighbour.value;
					
                    			open.push(currentNeighbour);  //加入到open表
                    
                   			currentNeighbour.parent = current;
                   			currentNeighbour.f = currentNeighbour.g + currentNeighbour.h; //计算f的值
					
                		}
            
			}
			
		}
		
		throw new Error('Cannot find route');
	};
	
}
