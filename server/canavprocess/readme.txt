服务分为四个：
(1) parse：TCP协议，接收RTCM数据{接收数据格式：{"sta_id":0,"buff":data}}，UTF8编码
(2) pos:http协议，接收解析后的观测数据及定位数据，
（3）post_file:数据后处理程序，启动参数说明（测站地址，buff大小，开始时间，结束时间，坐标说明（0=ECEF坐标、1=大地坐标），XYZ/LLH(三个），要处理的文件）
处理完成后，结果数据存储在post文件下的statistic文件中。

（4）integrity：实时数据统计程序（本服务为可选项，需要时配置pvtpos\config\opt.json文件中配置	"statis_open"为1）
测试程序：
test_parse，读取RTCM数据文件(启动参数说明使用： node .js -help 获取)。发送到parse服务


注意事项：
parse 服务中，测试程序时注意更改opt.json 中“start_time”的时间与测试数据大致起始时间一致，在服务处理实时数据时，本项设置为1





