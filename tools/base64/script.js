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

    // 获取DOM元素
    const textInput = document.getElementById('textInput');
    const textOutput = document.getElementById('textOutput');
    const imageInput = document.getElementById('imageInput');
    const imageUploadBox = document.getElementById('imageUploadBox');
    const previewSection = document.querySelector('.preview-section');
    const imagePreview = document.getElementById('imagePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileType = document.getElementById('fileType');
    const imageBase64Output = document.getElementById('imageBase64Output');

    // 标签页切换功能
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === target + 'Panel') {
                    panel.classList.add('active');
                }
            });
        });
    });

    // 文本转换功能
    function handleTextEncode() {
        const text = textInput.value;
        if (!text) {
            showToast('请输入要编码的文本');
            return;
        }
        try {
            textOutput.value = btoa(unescape(encodeURIComponent(text)));
        } catch (error) {
            showToast('编码失败：' + error.message);
        }
    }

    function handleTextDecode() {
        const text = textInput.value;
        if (!text) {
            showToast('请输入要解码的Base64文本');
            return;
        }
        try {
            textOutput.value = decodeURIComponent(escape(atob(text)));
        } catch (error) {
            showToast('解码失败：输入的不是有效的Base64编码');
        }
    }

    // 图片处理功能
    function handleImage(file) {
        if (file.size > 10 * 1024 * 1024) {
            showToast('图片大小不能超过10MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileType.textContent = file.type;
            imageBase64Output.value = e.target.result;
            previewSection.style.display = 'block';
            showToast('图片加载成功');
        };
        reader.onerror = function() {
            showToast('读取文件失败');
        };
        reader.readAsDataURL(file);
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 绑定事件
    document.getElementById('encodeBtn').addEventListener('click', handleTextEncode);
    document.getElementById('decodeBtn').addEventListener('click', handleTextDecode);
    document.getElementById('clearTextBtn').addEventListener('click', () => {
        textInput.value = '';
        textOutput.value = '';
    });

    // 复制按钮事件
    document.getElementById('copyTextBtn').addEventListener('click', () => {
        if (textOutput.value) {
            copyToClipboard(textOutput.value);
        } else {
            showToast('没有可复制的内容');
        }
    });

    document.getElementById('copyImageBase64Btn').addEventListener('click', () => {
        if (imageBase64Output.value) {
            copyToClipboard(imageBase64Output.value);
        } else {
            showToast('没有可复制的内容');
        }
    });

    // 下载图片
    document.getElementById('downloadImageBtn').addEventListener('click', () => {
        if (!imagePreview.src) {
            showToast('没有可下载的图片');
            return;
        }
        const link = document.createElement('a');
        link.download = 'converted_image.png';
        link.href = imagePreview.src;
        link.click();
        showToast('开始下载图片');
    });

    // 处理图片上传
    imageInput.addEventListener('change', handleImageSelect);

    // 拖拽上传
    imageUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        imageUploadBox.classList.add('dragover');
    });

    imageUploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        imageUploadBox.classList.remove('dragover');
    });

    imageUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        imageUploadBox.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));
        
        if (imageFile) {
            handleImage(imageFile);
        } else {
            showToast('请上传图片文件');
        }
    });

    function handleImageSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleImage(file);
        }
        e.target.value = '';
    }
}); 