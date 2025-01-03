document.addEventListener('DOMContentLoaded', function() {
    // 获取所有输入元素
    const colorInput = document.getElementById('colorInput');
    const redSlider = document.getElementById('redSlider');
    const greenSlider = document.getElementById('greenSlider');
    const blueSlider = document.getElementById('blueSlider');
    const alphaSlider = document.getElementById('alphaSlider');
    const redInput = document.getElementById('redInput');
    const greenInput = document.getElementById('greenInput');
    const blueInput = document.getElementById('blueInput');
    const alphaInput = document.getElementById('alphaInput');
    const hexInput = document.getElementById('hexInput');
    const rgbInput = document.getElementById('rgbInput');
    const rgbaInput = document.getElementById('rgbaInput');
    const hslInput = document.getElementById('hslInput');
    const colorPreview = document.getElementById('colorPreview');
    const saveColorBtn = document.getElementById('saveColorBtn');
    const colorList = document.getElementById('colorList');

    // 从localStorage加载保存的颜色
    let savedColors = JSON.parse(localStorage.getItem('savedColors') || '[]');
    updateColorList();

    // 更新所有颜色值
    function updateColor(source) {
        let r, g, b, a;
        
        if (source === 'hex') {
            const hex = hexInput.value.replace('#', '');
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
            a = alphaSlider.value / 100;
        } else if (source === 'sliders') {
            r = parseInt(redSlider.value);
            g = parseInt(greenSlider.value);
            b = parseInt(blueSlider.value);
            a = alphaSlider.value / 100;
        }

        // 更新滑块和数字输入框
        redSlider.value = redInput.value = r;
        greenSlider.value = greenInput.value = g;
        blueSlider.value = blueInput.value = b;
        
        // 更新十六进制值
        const hex = '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        hexInput.value = hex;
        colorInput.value = hex;

        // 更新RGB/RGBA值
        rgbInput.value = `rgb(${r}, ${g}, ${b})`;
        rgbaInput.value = `rgba(${r}, ${g}, ${b}, ${a})`;

        // 更新HSL值
        const [h, s, l] = rgbToHsl(r, g, b);
        hslInput.value = `hsl(${h}, ${s}%, ${l}%)`;

        // 更新颜色预览
        colorPreview.style.backgroundColor = rgbaInput.value;
    }

    // RGB转HSL
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }

        return [
            Math.round(h),
            Math.round(s * 100),
            Math.round(l * 100)
        ];
    }

    // 事件监听器
    colorInput.addEventListener('input', () => {
        hexInput.value = colorInput.value;
        updateColor('hex');
    });

    hexInput.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
            updateColor('hex');
        }
    });

    [redSlider, greenSlider, blueSlider, alphaSlider].forEach(slider => {
        slider.addEventListener('input', () => updateColor('sliders'));
    });

    [redInput, greenInput, blueInput, alphaInput].forEach(input => {
        input.addEventListener('change', () => {
            input.value = Math.min(Math.max(parseInt(input.value) || 0, 0), input.max);
            updateColor('sliders');
        });
    });

    // 复制按钮功能
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            const input = document.getElementById(format + 'Input');
            input.select();
            document.execCommand('copy');
            showToast('已复制到剪贴板！');
        });
    });

    // 保存颜色功能
    saveColorBtn.addEventListener('click', () => {
        const color = hexInput.value;
        if (!savedColors.includes(color)) {
            savedColors.push(color);
            if (savedColors.length > 24) {
                savedColors.shift();
            }
            localStorage.setItem('savedColors', JSON.stringify(savedColors));
            updateColorList();
        }
    });

    // 更新颜色列表
    function updateColorList() {
        colorList.innerHTML = '';
        savedColors.forEach((color, index) => {
            const div = document.createElement('div');
            div.className = 'color-item';
            div.style.backgroundColor = color;
            div.setAttribute('data-color', color);
            
            // 添加删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                savedColors.splice(index, 1);
                localStorage.setItem('savedColors', JSON.stringify(savedColors));
                updateColorList();
                showToast('颜色已删除');
            });
            
            div.addEventListener('click', () => {
                hexInput.value = color;
                updateColor('hex');
            });
            
            div.appendChild(deleteBtn);
            colorList.appendChild(div);
        });
    }

    // 初始化
    updateColor('hex');

    function showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
}); 