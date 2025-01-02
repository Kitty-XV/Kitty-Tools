document.addEventListener('DOMContentLoaded', function() {
    const uploadBox = document.getElementById('uploadBox');
    const imageInput = document.getElementById('imageInput');
    const previewSection = document.getElementById('previewSection');
    const imagesContainer = document.getElementById('imagesContainer');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    let imageItems = [];
    const MAX_FILES = 10;
    let selectedItem = null;

    // 处理文件上传
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        // 修改文件类型检查逻辑
        const imageFiles = files.filter(file => {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
            const validExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
            
            return validTypes.includes(file.type.toLowerCase()) || 
                   validExtensions.test(file.name.toLowerCase());
        });
        
        if (imageFiles.length === 0) {
            alert('请选择图片文件！');
            e.target.value = '';
            return;
        }
        
        if (imageFiles.length + imageItems.length > MAX_FILES) {
            alert(`最多只能上传${MAX_FILES}张图片！`);
            e.target.value = '';
            return;
        }
        
        if (imageFiles.length < files.length) {
            alert('已过滤掉非图片文件！');
        }
        
        handleFiles(imageFiles);
        e.target.value = '';
    });

    // 修改拖拽相关的事件处理
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.add('dragover');
    });

    uploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.remove('dragover');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.remove('dragover');
        
        // 获取拖拽的文件
        const files = Array.from(e.dataTransfer.files);
        
        // 添加调试信息
        console.log('拖拽的文件:', files.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size
        })));
        
        // 修改文件类型检查逻辑
        const imageFiles = files.filter(file => {
            // 检查文件类型和扩展名
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
            const validExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
            
            const hasValidType = validTypes.includes(file.type.toLowerCase());
            const hasValidExtension = validExtensions.test(file.name.toLowerCase());
            
            // 添加调试信息
            console.log('文件检查:', {
                fileName: file.name,
                fileType: file.type,
                hasValidType,
                hasValidExtension
            });
            
            return hasValidType || hasValidExtension;
        });
        
        // 添加调试信息
        console.log('过滤后的图片文件:', imageFiles.map(f => f.name));
        
        if (imageFiles.length === 0) {
            alert('请拖拽图片文件！');
            return;
        }
        
        if (imageFiles.length + imageItems.length > MAX_FILES) {
            alert(`最多只能上传${MAX_FILES}张图片！`);
            return;
        }
        
        // 如果有文件被过滤掉，显示提示
        if (imageFiles.length < files.length) {
            alert('已过滤掉非图片文件！');
        }
        
        // 处理图片文件
        handleFiles(imageFiles);
    });

    // 处理质量滑块变化
    qualitySlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        qualityInput.value = value;
        updateCompression(value / 100);
    });

    qualityInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        if (isNaN(value)) value = 80;
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        this.value = value;
        qualitySlider.value = value;
        updateCompression(value / 100);
    });

    // 下载所有图片
    downloadAllBtn.addEventListener('click', () => {
        if (imageItems.length === 0) {
            alert('没有可下载的图片！');
            return;
        }

        // 直接触发每个图片的下载
        imageItems.forEach(item => {
            const link = document.createElement('a');
            link.download = `compressed-${item.file.name}`;
            link.href = item.compressedDataUrl;
            link.click();
        });
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        
        files.forEach(file => {
            const imageItem = createImageItem(file);
            imageItems.push(imageItem);
            imagesContainer.appendChild(imageItem.element);
            loadImage(imageItem);
            
            // 如果是第一张图片，自动选中并显示在主预览区
            if (imageItems.length === 1) {
                selectedItem = imageItem;
                imageItem.element.classList.add('selected');
                updateMainPreview(imageItem);
            }
        });

        previewSection.style.display = 'block';
    }

    function createImageItem(file) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'image-item';
        itemDiv.innerHTML = `
            <h3 title="${file.name}">${file.name}</h3>
            <div class="preview-container">
                <img class="original-preview" alt="原图预览" data-file="${file.name}">
            </div>
            <div class="file-info">
                <div>
                    <span>原始：</span>
                    <span class="original-size">${formatFileSize(file.size)}</span>
                </div>
                <div>
                    <span>压缩后：</span>
                    <span class="compressed-size">处理中...</span>
                </div>
            </div>
            <div class="item-controls">
                <button class="download-btn">下载</button>
                <button class="remove-btn">删除</button>
            </div>
        `;

        const imageItem = {
            file,
            element: itemDiv,
            originalImage: null,
            compressedDataUrl: null
        };

        // 添加删除功能
        itemDiv.querySelector('.remove-btn').onclick = () => {
            const index = imageItems.indexOf(imageItem);
            if (index > -1) {
                imageItems.splice(index, 1);
                itemDiv.remove();
                if (imageItems.length === 0) {
                    previewSection.style.display = 'none';
                }
            }
        };

        // 添加单个下载功能
        itemDiv.querySelector('.download-btn').onclick = (e) => {
            e.stopPropagation(); // 防止触发选中效果
            if (imageItem.compressedDataUrl) {
                const link = document.createElement('a');
                link.download = `compressed-${imageItem.file.name}`;
                link.href = imageItem.compressedDataUrl;
                link.click();
            }
        };

        // 添加点击选择功能
        itemDiv.addEventListener('click', () => {
            if (selectedItem) {
                selectedItem.element.classList.remove('selected');
            }
            selectedItem = imageItem;
            itemDiv.classList.add('selected');
            
            // 确保在切换时立即显示原图
            const mainPreview = document.getElementById('mainPreview');
            const originalPreview = mainPreview.querySelector('.original-preview');
            if (imageItem.originalImage && imageItem.originalImage.src) {
                originalPreview.src = imageItem.originalImage.src;
            }
            
            updateMainPreview(imageItem);
        });

        return imageItem;
    }

    function loadImage(imageItem) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const originalDataUrl = e.target.result;
            
            // 创建新图片对象
            imageItem.originalImage = new Image();
            
            imageItem.originalImage.onload = function() {
                // 更新所有原图预览（包括卡片和主预览区域）
                const originalPreviews = document.querySelectorAll(`.original-preview[data-file="${imageItem.file.name}"]`);
                originalPreviews.forEach(preview => {
                    preview.src = originalDataUrl;
                });

                // 如果是第一张图片或当前选中的图片，更新主预览
                if (selectedItem === imageItem || imageItems.length === 1) {
                    const mainPreview = document.getElementById('mainPreview');
                    const originalPreview = mainPreview.querySelector('.original-preview');
                    originalPreview.src = originalDataUrl;
                    updateMainPreview(imageItem);
                }
                
                // 开始压缩
                compressImage(imageItem, qualitySlider.value / 100);
            };
            
            // 设置图片源
            imageItem.originalImage.src = originalDataUrl;
        };
        
        reader.onerror = function() {
            console.error('文件读取失败');
            alert('文件读取失败，请重试！');
        };
        
        try {
            reader.readAsDataURL(imageItem.file);
        } catch (error) {
            console.error('读取文件时出错:', error);
            alert('读取文件失败：' + error.message);
        }
    }

    function compressImage(imageItem, quality) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageItem.originalImage.width;
            canvas.height = imageItem.originalImage.height;
            
            ctx.drawImage(imageItem.originalImage, 0, 0);
            
            let compressedDataUrl;
            if (quality >= 0.95) {
                compressedDataUrl = imageItem.originalImage.src;
            } else {
                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                const compressedSize = Math.round((compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);
                const originalSize = imageItem.file.size;
                
                if (compressedSize > originalSize) {
                    compressedDataUrl = imageItem.originalImage.src;
                }
            }
            
            imageItem.compressedDataUrl = compressedDataUrl;
            
            // 更新文件大小显示
            const finalSize = Math.round((compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);
            imageItem.element.querySelector('.compressed-size').textContent = formatFileSize(finalSize);
            
            // 如果是当前选中的图片，更新主预览区域的压缩图
            if (selectedItem === imageItem) {
                const mainPreview = document.getElementById('mainPreview');
                const mainCompressedPreview = mainPreview.querySelector('.compressed-preview');
                mainCompressedPreview.src = compressedDataUrl;
                mainPreview.querySelector('.compressed-size').textContent = formatFileSize(finalSize);
            }
        } catch (error) {
            console.error('压缩失败:', error);
            alert('图片压缩失败：' + error.message);
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 修改更新压缩的函数
    function updateCompression(quality) {
        if (quality < 0 || quality > 1) {
            console.error('压缩质量必须在0-1之间');
            return;
        }
        
        imageItems.forEach(item => {
            if (item.originalImage) {
                compressImage(item, quality);
            }
        });
    }

    // 修改主预览更新函数
    function updateMainPreview(imageItem) {
        const mainPreview = document.getElementById('mainPreview');
        const originalPreview = mainPreview.querySelector('.original-preview');
        const compressedPreview = mainPreview.querySelector('.compressed-preview');
        const filename = mainPreview.querySelector('.filename');
        const originalSize = mainPreview.querySelector('.original-size');
        const compressedSize = mainPreview.querySelector('.compressed-size');

        // 设置文件名和大小信息
        filename.textContent = imageItem.file.name;
        originalSize.textContent = formatFileSize(imageItem.file.size);

        // 设置标识
        originalPreview.setAttribute('data-file', imageItem.file.name);
        compressedPreview.setAttribute('data-file', imageItem.file.name);

        // 确保原图预览显示
        if (imageItem.originalImage && imageItem.originalImage.src) {
            originalPreview.src = imageItem.originalImage.src;
        }

        // 设置压缩图预览
        if (imageItem.compressedDataUrl) {
            compressedPreview.src = imageItem.compressedDataUrl;
            const compressedBytes = Math.round((imageItem.compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);
            compressedSize.textContent = formatFileSize(compressedBytes);
        } else {
            compressedSize.textContent = '处理中...';
        }
    }
}); 