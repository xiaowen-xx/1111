/**
 * Page2 终极修复版：
 * 1. 修复了重复 ID 导致的预览图不更新问题（现在会同时更新所有同名预览图）
 * 2. 补全了第二页点击空白处换壁纸的功能
 * 3. 保持了滑动、图标替换、本地上传等所有功能
 */
(function() {
    // --- 1. 初始化滑动容器逻辑 (保持不变) ---
    const swiper = document.querySelector('.main-screen-swiper');
    if (swiper) {
        let isDown = false;
        let startX, scrollLeft;
        swiper.addEventListener('mousedown', (e) => {
            isDown = true;
            swiper.style.cursor = 'grabbing';
            swiper.style.scrollSnapType = 'none';
            startX = e.pageX - swiper.offsetLeft;
            scrollLeft = swiper.scrollLeft;
        });
        const stopDragging = () => {
            isDown = false;
            swiper.style.cursor = 'grab';
            swiper.style.scrollSnapType = 'x mandatory'; 
        };
        swiper.addEventListener('mouseup', stopDragging);
        swiper.addEventListener('mouseleave', stopDragging);
        swiper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault(); 
            const x = e.pageX - swiper.offsetLeft;
            const walk = (x - startX) * 1.5;
            swiper.scrollLeft = scrollLeft - walk;
        });
    }

    // --- 2. 核心：第二页图标更换函数 (修复预览问题) ---
    
    // 内部辅助：强力更新所有同名ID元素
    const updateAllPreviews = (id, src) => {
        // 使用属性选择器来绕过 getElementById 只能获取第一个元素的限制
        const elements = document.querySelectorAll(`[id="${id}"]`);
        elements.forEach(el => {
            el.src = src;
            el.style.display = 'block'; // 确保图片显示
        });
    };

    window.changeAppIconAdvanced = function(targetId, mode, previewId) {
        const applyUpdate = (src) => {
            // 1. 更新主屏幕图标
            const tImg = document.getElementById(targetId);
            if (tImg) {
                tImg.src = src;
                tImg.style.display = 'block'; 
            } else {
                console.warn(`未找到目标图标: ${targetId}`);
            }

            // 2. 更新预览图 (使用新方法，解决 ID 重复问题)
            updateAllPreviews(previewId, src);

            // 3. 保存数据
            localStorage.setItem('save_' + targetId, src);
        };

        if (mode === 'link') {
            const url = prompt("请输入图片链接 (URL):");
            if (url && url.trim() !== "") {
                applyUpdate(url);
            }
        } else {
            // 动态创建 input，解决 ID 冲突
            const tempInput = document.createElement('input');
            tempInput.type = 'file';
            tempInput.accept = 'image/*';
            tempInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => applyUpdate(ev.target.result);
                reader.readAsDataURL(file);
            };
            tempInput.click();
        }
    };

    // --- 3. 小组件换图逻辑 (保持原有) ---
    window.changeWidgetImage = function(element) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = event => {
                    const img = element.querySelector('img');
                    if (img) img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // --- 4. 第二页壁纸功能 (新增修复) ---

    // 处理菜单点击
    window.handlePage2Bg = function(mode) {
        const page2 = document.querySelector('.second-page');
        const menu = document.getElementById('page2BgMenu');
        if(menu) menu.style.display = 'none'; // 点击后隐藏菜单

        // 辅助函数：应用并保存
        const applyBg = (src) => {
            page2.style.backgroundImage = `url('${src}')`;
            localStorage.setItem('save_page2_bg', src);
        };

        if (mode === 'clear') {
            page2.style.backgroundImage = '';
            localStorage.removeItem('save_page2_bg');
        } else if (mode === 'link') {
            const url = prompt("请输入壁纸链接:");
            if (url) applyBg(url);
        } else if (mode === 'local') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => applyBg(ev.target.result);
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        }
    };

    // 主函数：点击空白处触发
    window.changePage2Background = function(e, element) {
        // 关键：防止点击里面的小组件时也触发换壁纸
        if (e.target !== element) return;

        // 1. 创建或获取菜单 (单例模式)
        let menu = document.getElementById('page2BgMenu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'page2BgMenu';
            menu.className = 'popover-menu'; // 复用你的 CSS 样式
            menu.style.position = 'fixed';   // 强制固定定位，防止跑偏
            menu.style.zIndex = '9999';
            menu.innerHTML = `
                <div class="menu-item" onclick="handlePage2Bg('link')"><i class="fas fa-link"></i> 图片链接</div>
                <div class="menu-item" onclick="handlePage2Bg('local')"><i class="fas fa-image"></i> 本地图片</div>
                <div class="menu-item" style="color:#ff3b30;" onclick="handlePage2Bg('clear')"><i class="fas fa-trash"></i> 清除壁纸</div>
            `;
            document.body.appendChild(menu);
        }

        // 2. 显示并定位菜单
        menu.style.display = 'flex';
        // 计算位置：防止菜单超出屏幕右边或下边
        let left = e.clientX;
        let top = e.clientY;
        
        // 简单的边界检查 (假设菜单宽130, 高120)
        if (left + 130 > window.innerWidth) left -= 130;
        if (top + 120 > window.innerHeight) top -= 120;

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        // 3. 点击其他地方自动关闭菜单
        const closeMenu = (ev) => {
            // 如果点击的不是菜单本身，也不是触发它的背景区域（防止立即关闭）
            if (!menu.contains(ev.target) && ev.target !== element) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
            // 如果点击了背景区域（因为背景区域很大），也应该关闭旧菜单（实际上上面的逻辑会重新打开，所以这里主要处理点别处）
            if (!menu.contains(ev.target) && ev.type === 'click') {
                 // 这里利用冒泡，不做额外处理，交给下一次点击事件
            }
        };
        
        // 延时绑定，防止本次点击立即触发关闭
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    };

    // --- 5. 页面加载自动恢复 ---
    window.addEventListener('DOMContentLoaded', () => {
        // 恢复图标
        const ids = ['appIcon6', 'appIcon7', 'appIcon8', 'appIcon9'];
        ids.forEach(id => {
            const saved = localStorage.getItem('save_' + id);
            if (saved) {
                const img = document.getElementById(id);
                if (img) {
                    img.src = saved;
                    img.style.display = 'block';
                }
                // 恢复预览图 (同样使用强力更新)
                const previewId = id.replace('appIcon', 'previewApp');
                updateAllPreviews(previewId, saved);
            }
        });

        // 恢复第二页壁纸
        const savedPage2Bg = localStorage.getItem('save_page2_bg');
        const page2 = document.querySelector('.second-page');
        if (savedPage2Bg && page2) {
            page2.style.backgroundImage = `url('${savedPage2Bg}')`;
        }
    });

})();
