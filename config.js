/* =========================================================
   SG.像素2 —— 前端配置（GitHub Pages 镜像站 / 主入口）

   静态页面全部放在 GitHub Pages（实测国内最快，0.6s 首屏）。
   页面本身是纯静态，跑不了服务端，所以接口仍然走 Netlify 的 /api
   —— 现在 Netlify 只负责转发接口，不再承担整站流量。

   如果哪天 Netlify 出问题，把下面这行换成备用接口即可（一条配置）：
   window.__ROOM_API__ = "https://sg-pixel2.pages.dev";
   ========================================================= */
window.__ROOM_API__ = "https://sg-pixel2.netlify.app";