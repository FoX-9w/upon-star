/* ============================================================
   画廊数据（壁纸 / 头像推荐墙）— 唯一数据源
   ------------------------------------------------------------
   上新流程：
   1. 图片放入 assets/gallery/（建议 webp，壁纸长边 ≤1600px，头像 ≤400px）
   2. 在下方 wallpapers 或 avatars 数组追加一条对象即可，部署后全网可见
   3. 每条必须写 author（图源作者署名），这是授权使用的信用义务

   字段说明：
     src      图片路径（相对本页，如 'assets/gallery/wp-01.webp'）
     title    作品名（可自拟）
     author   图源作者署名（必填，如 '@某人'；站内自制可写 'Upon Star'）
     ratio    壁纸：'phone'（9:16）| 'wide'（16:9）；头像可省略
     note     一句话说明（可省略）
     placeholder  1 = 占位样张（无真图，仅示意版式；真图上架后删除这些条目）
   ============================================================ */
window.GALLERY = {

  wallpapers: [
    { src: '', ratio: 'phone', title: '星轨 · 夜', author: '待上架', note: '占位样张 · 竖屏 9:16', placeholder: 1 },
    { src: '', ratio: 'phone', title: '拱门 · 月下', author: '待上架', note: '占位样张 · 竖屏 9:16', placeholder: 1 },
    { src: '', ratio: 'wide',  title: '星野 · 平芜', author: '待上架', note: '占位样张 · 横屏 16:9', placeholder: 1 }
  ],

  avatars: [
    { src: '', title: '八芒星 · 暖金', author: '待上架', note: '占位样张 · 圆形头像', placeholder: 1 },
    { src: '', title: '眉眼 · 低语', author: '待上架', note: '占位样张 · 圆形头像', placeholder: 1 },
    { src: '', title: '星屑 · 青蓝', author: '待上架', note: '占位样张 · 圆形头像', placeholder: 1 }
  ]

};
