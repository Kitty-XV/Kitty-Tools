document.addEventListener('DOMContentLoaded', function() {
    // Toast 提示函数
    function showToast(message, duration = 2000) {
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
        }, duration);
    }

    // 复制功能
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('复制成功');
        }).catch(() => {
            showToast('复制失败，请重试');
        });
    }

    // 编码功能
    function encodeText() {
        const input = document.querySelector('#input').value;
        if (!input) {
            showToast('请输入要编码的文本');
            return;
        }
        const output = document.querySelector('#output');
        const mode = document.querySelector('input[name="mode"]:checked').value;
        
        try {
            output.value = mode === 'component' 
                ? encodeURIComponent(input)
                : encodeURI(input);
        } catch (error) {
            showToast('编码失败：' + error.message);
        }
    }

    // 解码功能
    function decodeText() {
        const input = document.querySelector('#input').value;
        if (!input) {
            showToast('请输入要解码的文本');
            return;
        }
        const output = document.querySelector('#output');
        const mode = document.querySelector('input[name="mode"]:checked').value;
        
        try {
            output.value = mode === 'component'
                ? decodeURIComponent(input)
                : decodeURI(input);
        } catch (e) {
            showToast('解码失败，输入格式可能不正确');
        }
    }

    // 绑定事件
    document.querySelector('#encodeBtn').addEventListener('click', encodeText);
    document.querySelector('#decodeBtn').addEventListener('click', decodeText);
    document.querySelector('#clearBtn').addEventListener('click', () => {
        document.querySelector('#input').value = '';
        document.querySelector('#output').value = '';
    });
    document.querySelector('#copyBtn').addEventListener('click', () => {
        const output = document.querySelector('#output').value;
        if (output) {
            copyToClipboard(output);
        } else {
            showToast('没有可复制的内容');
        }
    });

    // 添加快捷键支持
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter: 编码
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            encodeText();
        }
        // Ctrl/Cmd + Shift + Enter: 解码
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            decodeText();
        }
    });
}); 