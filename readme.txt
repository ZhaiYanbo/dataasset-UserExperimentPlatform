【注意：前后端系统均需要启动才能正常进行用户评估实验】

前端系统——用于呈现用户界面
【命令，均在根目录下执行】
配置环境依赖包：`npm install`
运行：`npm run dev`
浏览器访问：`127.0.0.1:401`

后台系统——主要用于数据记录，数据存储至根目录下的"db.sqlite3"
【命令，在根目录下执行】
配置环境依赖包：`pip install -r requirement.txt`
运行：`python manage.py runserver 0.0.0.0:40192`
之后前端用户注册以及提交问答等操作均会记录到数据库中


其他tip：
Q：我可以修改浏览器访问和后台服务的端口号吗？
A：当然可以，修改前端系统中的'vite.config.ts'中声明内容即可
其中:
server.port字段表示前端浏览器访问时的端口号
server.proxy下的相关target表示与其他服务器通信时的ip和端口号，如果想要修改后台端口号，则修改'/userStudy'下的target即可

Q：我在部署前端系统时，为什么其他计算机访问不了？
A：可能是前端主机ip未修改，可以尝试修改'vite.config.ts'下server.host属性，改成部署计算机的ipv4地址，再重新运行