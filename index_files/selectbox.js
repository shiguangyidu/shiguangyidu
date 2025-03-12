define(function() {
    return {
        name: "select_box",
        template: '\
	    <div :class="[\'select_box\', \'border_1px\', \'paddingleft_14\', {\'disable\': disable}]" \
	        :style="{height:height+\'px\',lineHeight:height+\'px\'}" \
	    >\
	        <div :id="id?id+\'_selectlist_parenselect\':\'\'" class="info_show user_select paddingright_20" @click.stop="changeShow">{{active}}</div>\
	        <div class="list_fixed border_1px" v-show="listShow" \
	            :style="{maxHeight:maxRows*height+\'px\',height:height*Math.min(maxRows,comList.length)+\'px\'}" \
	        >\
	            <ul :id="id?id+\'_selectlist\':\'\'" class="select_list" ref="scroller" :style="scrollerStyle"  @scroll.stop="bindMouseMove($event)">\
	                <li :id="getLiId(item,index)" :class="[\'paddingleft_10\', \'paddingright_15\', {active:(item.value || item) == active}]" v-for="(item,index) in comList" :key="index" @click.stop="itemClick(item,item.Index)">{{typeof item === \'object\' ? item.value : item}}</li>\
	            </ul>\
	        </div>\
	        <div v-if="comList.length>maxRows" v-show="listShow" class="scroll_box right_0" :style="{height:scrollBarBoxHeight+\'px\',marginTop:space+3+\'px\'}" @click.self="scrollBoxClick($event)">\
	            <div :class="[\'scroll_bar\',\'right_0\',{active:startDrag}]" :style="{height:barHeight+\'px\', top:barTop+\'px\'}" ref="scrollBar" @mousedown="mousedown($event)"></div>\
	        </div>\
	        <div class="model_layer" v-show="listShow" @click="changeShow"></div>\
	    </div>\
		',
        props: {
            active: [String, Number], // 当前选中项的值
            selectList: [Array,String],        // 下拉列表数组
            height: {                 // 每一列的高度
              type: Number,
              default: 37
            },
            maxRows: {                // 下拉列表显示的最大行数
              type: Number,
              default: 6
            },
            sync: {                   // 是否数据双向绑定
              type: Boolean,
              default: false
            },
            id: String,
            liIds: Array,
            unadd: false,
            disable: false
        },
        data: function() {
            return {
              listShow: false,        // 下拉列表是否显示
              barTop: 0,              // 滚动条滑动的top值
              space: 2,               // 滚动条区域的上下留白
              scrollBarWidth: 17,     // 滚动条区域的宽度
              moveDistance: 0,        // 起始移动点
              startDrag: false        // 是否点击了滚动条滑动，用以控制样式
            };
        },
        mounted: function() {
          this.scrollBarWidth = this.getScrollWidth();
        },
        computed: {
          list: function() {
            if(typeof this.selectList === 'object') {
              return this.selectList
            } else {
              var arr = this.selectList.split('-');
              var newList = [];
              var length = arr[1].length;
              var sublength = '';
              for (var j = 0; j < length; j++) {
                sublength += '0'            
              }
              for (var i = +arr[0]; i <= arr[1]; i++) {
                newList.push(length===1?i:((sublength + i).substr(("" + i).length)))             
              }
              return newList
            }
          },
          comList: function() {
            var data = this.$util.cloneObj(this.list).map(function(value,index) {
              if(typeof value === 'object') {
                value.Index = index
                return value
              } else {
                return {
                  value: value,
                  Index: index
                }
              }
            })
            return data.filter(function(item) {
              return typeof item === 'object'&&item.value!=='' || typeof item !== 'object'&&item !== ''
            })
          },
          barHeight: function() {
            return Math.abs(
              (this.maxRows / this.list.length) * this.scrollBarBoxHeight
            );
          },
          scrollBarBoxHeight: function() {
            return this.maxRows * this.height - this.space * 2;
          },
          ratio: function() {
            return (this.scrollBarBoxHeight - this.barHeight) / (this.list.length - this.maxRows) / this.height
          },
          scrollerStyle: function() {
            var style = {};
            var direction = g_reserveLang ? 'Left' : 'Right';
            style['margin'+direction] = -this.scrollBarWidth+'px';
            style['padding'+direction] = (this.comList.length>this.maxRows?0:this.scrollBarWidth)+'px'
            return style
          }
        },
        methods: {
          getLiId: function(item, index) {
            var currentId = typeof item === 'object'&&typeof item.id !== 'undefined' ? item.id : (this.liIds ? this.liIds[index] : (!this.unadd && index<10?('0'+index):index) + '_' + (this.id || ''));
            var id = currentId+'_selectlist_SmallSelectBoxScrollItemID';
            return id
          },
          // 计算浏览器原生滚动条的宽度
          getScrollWidth: function() {
            var outer = document.createElement("div");
            outer.style.width = "100px";
            outer.style.visibility = "hidden";
            outer.style.position = "absolute";
            outer.style.top = "-9999px";
            document.body.appendChild(outer);
            var widthNoScroll = outer.offsetWidth;
            outer.style.overflow = "scroll";
            var inner = document.createElement("div");
            inner.style.width = "100%";
            outer.appendChild(inner);
            var widthWithScroll = inner.offsetWidth;
            outer.parentNode.removeChild(outer);
            var scrollBarWidth = widthNoScroll - widthWithScroll;
            return scrollBarWidth;
          },
          changeShow: function() {
            if(this.disable) return;
            this.listShow = !this.listShow;
          },
          bindMouseMove: function(e) {
            var top = e.target.scrollTop;
            this.barTop = top * this.ratio;
          },
          itemClick: function(item, index) {
            var value = item.value || item;
            this.listShow = false;
            if(this.sync) {
              // 如果为同步，则数据双向绑定，直接传递修改值
              this.$emit("update:active", value)
            } else {
              // 如果不同步，则数据单向提交给父组件，包含数值和其索引
              this.$emit("itemClick", { value: value, index: index });
            }
          },
          scrollBoxClick: function(e) {
            // 获取当前点击位置距离滚动条盒子顶部的距离
            var offset = Math.abs(e.target.getBoundingClientRect().top - e.clientY);
            // 防止滚动超长，空白区域最大为this.scrollBarBoxHeight - this.barHeight，最理想的状态是点击之后点击点位于滚动条滑动的中间，因此offset - this.barHeight / 2
            var num = Math.min(
              offset - this.barHeight / 2,
              this.scrollBarBoxHeight - this.barHeight
            );
            // 防止计算后滚动值为负数
            var currentTop = Math.max(0, num)
            // 使用refs获取dom，下拉列表的盒子
            var scroller = this.$refs.scroller;
            // 修改下拉列表盒子的scrollTop，这样会触发步骤(5)中的bindMouseMove事件，因此滚动条滑块的barTop会自行改变
            scroller.scrollTop = (currentTop / this.scrollBarBoxHeight) * this.list.length * this.height;
          },
          mousemove: function(e) {
            // 记录本次鼠标移动的距离
            var currentDistance = e.clientY - this.moveDistance;
            // 重新记录起始移动点
            this.moveDistance = e.clientY;
            // 根据比例计算当前列表应该滚动的距离
            var scrollTop = currentDistance / this.ratio;
            // 获取滚动盒子：下拉列表的盒子
            var scroller = this.$refs.scroller;
            // 将本次应该滚动的距离加给scrollTop
            scrollTop += scroller.scrollTop;
            // 同样需要对scrollTop做边界值的判断
            scrollTop = Math.max(0, scrollTop);
            scrollTop = Math.min(
              (this.list.length - this.maxRows) * this.height,
              scrollTop
            );
            // 将计算好的scrollTop赋值给下拉列表的盒子的scrollTop
            scroller.scrollTop = scrollTop;
          },
          mousedown: function(e) {
            // 滚动滑块点击样式
            this.startDrag = true;
            // 记录下当前点击点的纵坐标
            this.moveDistance = e.clientY;
            // 绑定mousemove的监听
            document.addEventListener("mousemove", this.mousemove);
            // 禁止滑块被选中，影响拖动效果
            document.onselectstart = function() {
              return false;
            };
            // 绑定mouseup的监听
            document.addEventListener("mouseup", this.removeMoveEvent);
          },
          removeMoveEvent: function() {
            // 恢复滚动条滑块的样式
            this.startDrag = false;
            // 移除mousemove事件的监听
            document.removeEventListener("mousemove", this.mousemove);
            // 移除禁止选中
            document.onselectstart = null;
            // 移除mouseup的监听
            document.removeEventListener("mouseup", this.removeMoveEvent);
          }
        }
  }
})
