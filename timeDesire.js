(function($) {
    $.tools = $.tools || {
        version: '1.1'
    };
    /*  插件默认参数
    * @param printTemplate 输出模板，模板格式自订
     * 模板参数：{date:Y/M/D/h/m/s/past_Y/past_M/past_D/past_h/past_m/past_s} 所有代表日期的字母出现的次数代表输出的长度
	  * {date:YYYY} - 倒计时用年份
	  * {date:MM} - 倒计时用月份
	  * {date:DD} - 倒计时用天数
	  * {date:hh} - 倒计时用小时
	  * {date:mm} - 倒计时用分钟
	  * {date:ss} - 倒计时用秒数
	  * {date:past_YYYY} - 已过时间用年份
	  * {date:past_MM} - 已过时间用月份
	  * {date:past_DD} - 已过时间用天数
	  * {date:past_hh} - 已过时间用小时
	  * {date:past_mm} - 已过时间用分钟
	  * {date:past_ss} - 已过时间用秒数
  * @param autoChange 当此参数为false时 timeStyle生效
  * @param range 计时范围
    * */
    $.tools.timeDesire = {
			isReduce:true,   //true-递减 | false-递增
			autoChange:true,    //自动改变输出格式
		 	range:null,	//时间区间 > 24h 时 输出 大于 1天
			timeStyle:'d',   //输出的时间单位 当autoChange==false时 该属性有效
			printTemplate:'剩余时间：<span><em>{date:YYYY}</em>年<em>{date:MM}</em>月<em>{date:WW}</em>周<em>{date:DD}</em>天<em>{date:hh}</em>时<em>{date:mm}</em>分<em>{date:ss}</em>秒</span>',   //输出格式
			incremental:1000,    //增/减量
			startTime:null,	//开始时间
			endTime:null,	//结束时间
		 	afterReachEndTime:null,	//到达最终时间以后的回调函数
			overStop:false,	//鼠标经过停止计时
			outStart:true,	//鼠标离开继续计时
		   	getNow:null,	//接口获取服务器时间
		   	whenChange:null,	//每次时间变化时执行的函数
		   	afterReachEndTime_tpl:null	//到达最终时间以后输出的内容
    };
    /*
     * 插件方法主体，一个插件的代码都写在这里
     * @param handle 调用对象
     * @param conf   插件配置
     * @param fn     回调函数
     */
	var instances = [];

	var timeArray=[[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];  //timeArray[0]-已过时间 timeArray[1]-剩余时间 数组元素分别对应 年 月 周 天 时 分 秒 毫秒

	function Layerout(that,conf, fn) { /* 记录变量 */
		var self = that,/* 扩展方法到self */
			totlePast= 0,	//已过秒数
			perYear= 0,
			startYear=new Date(conf.startTime).getFullYear(),
			totleYear= 0,
			remainTime= 0,
			getMaxOne= 0,
			interval_action=null,
			getTime_interval=null;

		var endYear=new Date(conf.endTime).getFullYear(),
			spareYear= endYear>startYear? endYear-startYear : startYear-endYear;    //递减时差
			incSpareTime=parseFloat(conf.endTime);
			$.extend(self,{
				/*	初始化 */
				initLayer:function(that){
					if(!that.startTime){
						var options_startTime=new Date().getTime(),
							options_endTime=new Date();
						options_endTime.setDate(options_endTime.getDate()+1);   //天数+1
						options_endTime.setHours(options_endTime.getHours()+1);   //小时+1
						options_endTime.setMinutes(options_endTime.getMinutes()+1);   //分钟+1
						options_endTime.getSeconds(options_endTime.getSeconds()+1);   //秒钟+1
						options_endTime=options_endTime.getTime();
						that.startTime=options_startTime;
						that.endTime=options_endTime;
					}
					self.perYear(spareYear);
					self.action(that);
				},
				/* 倒计时 */
				action:function(that){
					var isReduce=that.isReduce,
						startTime=parseFloat(that.startTime),
						endTime=parseFloat(that.endTime),
						overStop=that.overStop,
						outStart=that.outStart,
						getNow=that.getNow,
						spareTime= endTime-startTime;    //时差
					if(spareTime>0){
						if(getNow){
							clearTimeout(getTime_interval);
							var url=getNow.url+'?r='+ $.now(),
								interTime=getNow.interTime;
							getTime_interval=setTimeout(function(){
								self.getNowTime(that,url);
							},interTime);
						}
						incremental=parseFloat(that.incremental);
						interval_action=null;
						getMaxOne=self.getMaxOne(that);
						/* 鼠标移出功能暂缓
						 overStop ? self.bind('mouseover.overStop',function(){
						 clearInterval(interval_action);
						 }) : null;
						 outStart ? self.bind('mouseout.outStart',function(){
						 self.dateToSecs(that,timeArray[1]);
						 clearInterval(interval_action);
						 self.action(that);
						 }) : null;*/
						if(isReduce){	//递减
							self.soNervous(that,spareTime);
						}
					}else{
						that.afterReachEndTime && that.afterReachEndTime();	//到达最终时间 回调
						self.html(self.formatting(that,0));
					};
				},
				/* 倒计时 */
				soNervous:function(that,spareTime){
					var incremental=that.incremental,
						incremental_tmp=incremental,
						end_sign=0;
					
					if(spareTime>0){
						remainTime=spareTime-=incremental;
						self.html(self.formatting(that,spareTime));
						if(spareTime>=incremental_tmp){
							interval_action=setTimeout(function(){
								(function(that,spareTime){
									self.soNervous(that,spareTime);
								})(that,spareTime)
							},incremental);
							end_sign=0;
						}else{
							end_sign=1;
						}
					}else{
						end_sign=1;
					}
					if(end_sign==1){
						clearTimeout(interval_action);
						clearTimeout(getTime_interval);
						that.afterReachEndTime && that.afterReachEndTime();	//到达最终时间 回调
						self.html(self.formatting(that,0));
					}
					
					that.whenChange && that.whenChange({"spareTime":spareTime});
				},
				getMaxOne:function(that){	//获得所需单位的最大循环值
					var templateArray=that.printTemplate.match(/{date:\w+}/g),
						templateArray_temp=templateArray[0].match(/[^:]+(?=})/)[0];
					if(/^Y+$/.test(templateArray_temp)){	//到计时-年
						templateArray_temp=0;
					}else if(/^M+$/.test(templateArray_temp)){	//到计时-月
						templateArray_temp=1;
					}else if(/^W+$/.test(templateArray_temp)){	//到计时-周
						templateArray_temp=2;
					}else if(/^D+$/.test(templateArray_temp)){	//到计时-日
						templateArray_temp=3;
					}else if(/^h+$/.test(templateArray_temp)){	//到计时-时
						templateArray_temp=4;
					}else if(/^m+$/.test(templateArray_temp)){	//到计时-分
						templateArray_temp=5;
					}else if(/^s+$/.test(templateArray_temp)){	//到计时-秒
						templateArray_temp=6;
					}else if(/^(past\_)Y+$/.test(templateArray_temp)){	//已过时间-年
						templateArray_temp=7;
					}else if(/^(past\_)M+$/.test(templateArray_temp)){	//已过时间-月
						templateArray_temp=8;
					}else if(/^(past\_)W+$/.test(templateArray_temp)){	//已过时间-周
						templateArray_temp=9;
					}else if(/^(past\_)D+$/.test(templateArray_temp)){	//已过时间-日
						templateArray_temp=10;
					}else if(/^(past\_)h+$/.test(templateArray_temp)){	//已过时间-时
						templateArray_temp=11;
					}else if(/^(past\_)m+$/.test(templateArray_temp)){	//已过时间-分
						templateArray_temp=12;
					}else if(/^(past\_)s+$/.test(templateArray_temp)){	//已过时间-秒
						templateArray_temp=13;
					}
					return templateArray_temp;
				},
				/* 格式化输出格式 */
				formatting:function(that,spareTime){
					isReduce ? incSpareTime-=that.incremental : incSpareTime+=that.incremental;
					var array_afterChange=spareTime<=0 ? self.timerCenter(that,0) : self.timerCenter(that,spareTime);
					var printTemplate=that.printTemplate,
						range=that.range,
						isReduce=that.isReduce,
						num=range ? range[1].match(/\d+(?=[YMWDhms])/)[0] : null,
						company=range ? range[1].match(/[^\d+]/)[0] : null,
						compareParam=null;
					
					if(spareTime<=0 && that.afterReachEndTime_tpl){
						return that.afterReachEndTime_tpl;
					}
					
					endYear=new Date(incSpareTime).getFullYear();
					spareYear= endYear>startYear? endYear-startYear : startYear-endYear;    //递减时差
					self.perYear(spareYear);
					compareParam=self.secsToDate(spareTime,company);
                    var bigHead=range ? new Function("return "+(compareParam+range[0]+num)) : new Function("return false"),
						printNum=range ? range[2].match(/\d+(?=[YMWDhms])/) : null,
						printCompany=range ? range[2].match(/[^\d+]/)[0] : null;
					if(bigHead()){	//表达式成立
						printTemplate=range[2];
					}else{
						var templateArray=printTemplate.match(/{date:\w+(\.\w+)?}/g),
							changedArray=[];
						$.each(templateArray,function(index){
							var templateArray_i=templateArray[index],
								iLength= 0,
								num=0;
                            var b;
							templateArray_i=templateArray_i.match(/[^:]+(?=})/)[0];
							iLength = /\./.test(templateArray_i) ? [templateArray_i.split('.')[0].length,templateArray_i.split('.')[1].length] : /^(past_)/.test(templateArray_i) ? templateArray_i.split('_')[1].length : templateArray_i.length;
							if(/^Y+$/.test(templateArray_i)){	//到计时-年
								num=array_afterChange[1][0];
							}else if(/^M+$/.test(templateArray_i)){	//到计时-月
								num=array_afterChange[1][1];
							}else if(/^W+$/.test(templateArray_i)){	//到计时-周
								num=array_afterChange[1][2];
							}else if(/^D+$/.test(templateArray_i)){	//到计时-日
								num=array_afterChange[1][3];
							}else if(/^h+$/.test(templateArray_i)){	//到计时-时
								num=array_afterChange[1][4];
							}else if(/^m+$/.test(templateArray_i)){	//到计时-分
								num=array_afterChange[1][5];
							}else if(/^s+/.test(templateArray_i)){	//到计时-秒
								num=array_afterChange[1][6];
                                b=1;
							}else if(/^(past\_)Y+$/.test(templateArray_i)){	//已过时间-年
								num=array_afterChange[0][0];
							}else if(/^(past\_)M+$/.test(templateArray_i)){	//已过时间-月
								num=array_afterChange[0][1];
							}else if(/^(past\_)W+$/.test(templateArray_i)){	//已过时间-周
								num=array_afterChange[0][2];
							}else if(/^(past\_)D+$/.test(templateArray_i)){	//已过时间-日
								num=array_afterChange[0][3];
							}else if(/^(past\_)h+$/.test(templateArray_i)){	//已过时间-时
								num=array_afterChange[0][4];
							}else if(/^(past\_)m+$/.test(templateArray_i)){	//已过时间-分
								num=array_afterChange[0][5];
							}else if(/^(past\_)s+$/.test(templateArray_i)){	//已过时间-秒
								num=array_afterChange[0][6];
							}
							changedArray.push(self.paddingDate(self,num,iLength,b));
						});
						templateArray_temp=templateArray[0].match(/[^:]+(?=})/)[0];
						compareParam=self.secsToDate(spareTime,templateArray_temp.substr(0,1));
						$.each(templateArray,function(z){
							printTemplate=printTemplate.replace(templateArray[z],z==0 ? compareParam : changedArray[z]);
						});
					}
					return printTemplate;
				},
				/* * 更改时间数组timeArray */
				timerCenter:function(that,spareTime){
					var timeStyle=that.timeStyle,
						endStr=null,
						tempTime=spareTime/1000,
						pastTime=0;
                    if(tempTime>0){
                        totlePast+=that.incremental/1000;
                        pastTime=totlePast;
                        timeArray[0][0]=parseInt(pastTime/(86400*perYear),10);	//年
                        pastTime%=(86400*perYear);
                        timeArray[0][1]=parseInt(pastTime/(86400*30),10);	//月
                        pastTime%=(86400*30);
                        timeArray[0][2]=parseInt(pastTime/604800,10);	//周
                        pastTime%=604800;
                        timeArray[0][3]=parseInt(pastTime/86400,10);	//日
                        pastTime%=86400;
                        timeArray[0][4]=parseInt(pastTime/3600,10);	//时
                        pastTime%=3600;
                        timeArray[0][5]=parseInt(pastTime/60,10);	//分
                        pastTime%=60;
                        pastTime%=1000;
                        timeArray[0][6]=parseInt(pastTime,10);	//秒
                        pastTime=pastTime*1000%1000;
                        timeArray[0][7]=parseInt(pastTime,10);	//毫秒
                        if(that.autoChange){
                            timeArray[1][0]=parseInt(tempTime/(86400*perYear),10);
                            tempTime%=86400*perYear;
                            timeArray[1][1]=parseInt(tempTime/(86400*30),10);
                            tempTime%=(86400*30);
                            timeArray[1][2]=parseInt(tempTime/604800,10);
                            tempTime%=604800;
                            timeArray[1][2]=parseInt(tempTime/86400,10);
                            tempTime%=86400;
                            timeArray[1][4]=parseInt(tempTime/3600,10);
                            tempTime%=3600;
                            timeArray[1][5]=parseInt(tempTime/60,10);
                            tempTime%=60;
                            tempTime%=1000;
                            timeArray[1][6]=parseInt(tempTime,10);
                            tempTime=tempTime*1000%1000;
                            timeArray[1][7]=parseInt(tempTime,10);
                        }else{
                            switch(timeStyle){
                                case"ms":
                                    timeArray[1][7]=spareTime;
                                    break;
                                case"s":
                                    timeArray[1][6]=parseFloat(tempTime.toFixed(2));
                                    break;
                                case"m":
                                    tempTime=tempTime/60;
                                    timeArray[1][5]=parseFloat(tempTime.toFixed(2));
                                    break;
                                case"h":
                                    tempTime=tempTime/3600;
                                    timeArray[1][4]=parseFloat(tempTime.toFixed(2));
                                    break;
                                case"D":
                                    tempTime=tempTime/86400;
                                    timeArray[1][3]=parseFloat(tempTime.toFixed(2));
                                    break;
                                case"W":
                                    tempTime=tempTime/604800;
                                    timeArray[1][2]=parseFloat(tempTime.toFixed(2));
                                    break;
                                case"M":
                                    tempTime=tempTime/(86400*30);
                                    timeArray[1][1]=parseFloat(tempTime.toFixed(2));
                                    break;
                                case"Y":
                                    tempTime=tempTime/(86400*perYear);
                                    timeArray[1][0]=parseFloat(tempTime.toFixed(2));
                                    break;
                            }
                        }
                    }else{
                        $.each(timeArray[1],function(d){
                            timeArray[1][d]=0;
                        });
                    }
					return timeArray;
				},
				/* 日期位数补足 */
				paddingDate:function(that,val,len,b){
					if((typeof len)=='object'){
						val+='';
						var str_int=val+'',
							str_dec='',
							len_int=len[0],
							len_dec=len[1],
							isReduce=conf.isReduce,
							ms2s=0;
                        isReduce ? ms2s=timeArray[1][7]/1000 : ms2s=timeArray[0][7]/1000;
						str_dec=(ms2s+'').split('.')[1] ? (ms2s+'').split('.')[1].substr(0,1) : ms2s+'';
                        for(var i=0;i<len_int;i++){
							if(str_int.length<len_int){
								str_int='0'+str_int;
							}
						}
						for(var j=0;j<len_dec;j++){
							if(str_dec.length<len_dec){
								str_dec='0'+str_dec;
							}
						}
						var str=str_int+'.'+str_dec;
					}else{
						var str=val+'';
						for(var i=0;i<len;i++){
							if(str.length<len){
								str='0'+str;
							}
						}
					}
					return str;
				},
				/* 将日期转变为秒数 */
				dateToSecs:function(that,dateArray){
					var newStartTime=remainTime+that.endTime;
					that.startTime=newStartTime;
				},
				/* 秒数转换为指定单位 */
				secsToDate:function(spareTime,company){
					spareTime/=1000;
					var endStr='';
					switch(company){
						case 'Y':endStr=spareTime/86400*360;break;
						case 'M':endStr=spareTime/86400*30;break;
						case 'W':endStr=spareTime/604800;break;
						case 'D':endStr=spareTime/86400;break;
						case 'h':endStr=spareTime/3600;break;
						case 'm':endStr=spareTime/60;break;
						case 's':endStr=spareTime;break;
					}
					return parseInt(endStr,10);
				},
				/* 是否闰年 */
				isLeapYear:function(year){
					var result=((year%4==0 && year%100!=0) || year%400==0) ? true : false;
					return result;
				},
				/* 返回当前操作的起始年份所在时间段内的年平均天数 */
				perYear:function(spareYear){
					totleYear=0;
					if(spareYear){
						for(var i=0;i<spareYear;i++){
							totleYear+=self.isLeapYear(startYear+i) ? 366 : 365;
						}
					}else{
						totleYear=self.isLeapYear(startYear) ? 366 : 365;
						spareYear=1;
					}
					perYear=totleYear/spareYear;
					return perYear;
				},
				/* 返回当前操作的起始年份所在时间段内的月平均天数 */
				perMonth:function(spareMonth){
////					totleYear=0;
////					if(spareYear){
////						for(var i=0;i<spareYear;i++){
////							totleYear+=self.isLeapYear(startYear+i) ? 366 : 365;
////						}
////					}else{
////						totleYear=self.isLeapYear(startYear) ? 366 : 365;
////						spareYear=1;
////					}
////					perYear=totleYear/spareYear;
//					return perYear;
				},
				/* 获取服务器时间 */
				getNowTime:function(that,url){
					var startTime=parseFloat(that.startTime),
						endTime=parseFloat(that.endTime),
						spareTime= endTime-startTime;    //时差
					$.getJSON(url,function(data){
						var code=data.code,
							data=data.data,
							nowTime=0,
							stop=0;
						if(code=='AX0001'){
							nowTime=data;
							if(endTime>parseInt(nowTime,10)){
								that.startTime=nowTime;
								clearTimeout(interval_action);
								self.action(that);
							}else{
								//location.reload();
								that.afterReachEndTime ? that.afterReachEndTime() : null;	//到达最终时间 回调
								spareTime=0;
								self.html(self.formatting(that,spareTime));
							}
							if(spareTime>0){
								clearTimeout(getTime_interval);
								getTime_interval=setTimeout(function(){
									self.getNowTime(that,that.getNow.url+'?r='+ $.now());
								},that.getNow.interTime);
							}else{
								clearTimeout(getTime_interval);
								clearTimeout(interval_action);
							}
						}
					});
				}
			});

		/* 绑定自定义事件 */
		$.each(['afterReachEndTime'], function(i, name) {
			if ($.isFunction(conf[name])) {
				self.bind(name, conf[name]);
			} else if (self[conf[name]]) {
				self.bind(name, self[conf[name]]);
			}
		});

		/*
		*初始化
		*conf.event为空代表没有调用对象，指向body，自动触发
		*/
		if ( conf.event ) {
			self.bind( conf.event , function () {
				self.initLayer(conf);
				// 调用回调
				if (fn != undefined) {
					fn.call(window , self);
				}
			});
		} else {
			self.initLayer(conf);
			// 调用回调
			if (fn != undefined) {
				fn.call(window , self);
			}
		}
		return self;
	}

	$.fn.timeDesire = function(options, fn) {
		var that=this;
		var el;
		this.each(function() {
			if($.isFunction(options)){
				fn = options;
				options = $.extend({}, $.tools.timeDesire);
			} else {
				options = $.extend({}, $.tools.timeDesire, options);
			}
			el = new Layerout($(this),options,fn);
			instances.push(el);
		});
		return options.api ? el: this;
	};

	$.extend({
		timeDesire : function(options,fn){
			/* 在jQuery.fn上扩展方法 */
			return $('body').timeDesire(options,fn);
		}
	});
})(jQuery);
