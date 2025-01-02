document.addEventListener('DOMContentLoaded', function() {
    const uploadBox = document.getElementById('uploadBox');
    const imageInput = document.getElementById('imageInput');
    const previewSection = document.getElementById('previewSection');
    const imagesContainer = document.getElementById('imagesContainer');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityInput = document.getElementById('qualityInput');
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

    // 处理拖拽上传
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
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
            const validExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
            
            return validTypes.includes(file.type.toLowerCase()) || 
                   validExtensions.test(file.name.toLowerCase());
        });
        
        if (imageFiles.length === 0) {
            alert('请拖拽图片文件！');
            return;
        }
        
        if (imageFiles.length + imageItems.length > MAX_FILES) {
            alert(`最多只能上传${MAX_FILES}张图片！`);
            return;
        }
        
        handleFiles(imageFiles);
    });

    // 处理质量滑块变化
    qualitySlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        const quality = value / 100;
        let displayText;
        
        if (quality >= 0.9) {
            displayText = '原图质量';
        } else if (quality >= 0.7) {
            displayText = '高质量';
        } else if (quality >= 0.4) {
            displayText = '中等质量';
        } else {
            displayText = '低质量';
        }
        
        // 更新滑条颜色
        this.style.setProperty('--value', `${value}%`);
        // 更新质量显示
        document.getElementById('qualityLevel').textContent = displayText;
        
        updateCompression(quality);
    });

    qualityInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        if (isNaN(value)) value = 80;
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        this.value = value;
        qualitySlider.value = value;
        
        // 触发滑块的input事件以更新显示
        const event = new Event('input');
        qualitySlider.dispatchEvent(event);
    });

    // 初始化滑条颜色和质量显示
    qualitySlider.style.setProperty('--value', '80%');
    document.getElementById('qualityLevel').textContent = '高质量';

    // 下载所有图片
    downloadAllBtn.addEventListener('click', () => {
        if (imageItems.length === 0) {
            alert('没有可下载的图片！');
            return;
        }

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
            e.stopPropagation();
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
            updateMainPreview(imageItem);
        });

        return imageItem;
    }

    function loadImage(imageItem) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const originalDataUrl = e.target.result;
            
            imageItem.originalImage = new Image();
            imageItem.originalImage.onload = function() {
                // 生成缩略图
                const thumbnailDataUrl = createThumbnail(imageItem.originalImage);
                
                // 更新卡片中的缩略图
                const thumbnailPreview = imageItem.element.querySelector('.original-preview');
                thumbnailPreview.src = thumbnailDataUrl;

                // 更新主预览区域
                if (selectedItem === imageItem || imageItems.length === 1) {
                    const mainPreview = document.getElementById('mainPreview');
                    const originalPreview = mainPreview.querySelector('.original-preview');
                    originalPreview.src = originalDataUrl; // 主预览区域使用原图
                    updateMainPreview(imageItem);
                }
                
                compressImage(imageItem, qualitySlider.value / 100);
            };
            
            imageItem.originalImage.src = originalDataUrl;
        };
        
        reader.readAsDataURL(imageItem.file);
    }

    // 修改缩略图生成函数，降低质量提高速度
    function createThumbnail(img, maxSize = 200) { // 减小缩略图尺寸
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算缩略图尺寸
        let width = img.width;
        let height = img.height;
        const ratio = Math.min(maxSize / width, maxSize / height);
        
        if (ratio < 1) {
            width *= ratio;
            height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        return canvas.toDataURL('image/jpeg', 0.6); // 降低质量以提高速度
    }

    // 优化压缩函数
    function compressImage(imageItem, quality) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = imageItem.originalImage;
            const originalSize = imageItem.file.size;

            // 如果图片太大，先进行预缩放
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 2048;
            
            if (width > MAX_SIZE || height > MAX_SIZE) {
                const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            let compressedDataUrl;
            let compressedSize;

            // 根据滑块数值直接计算压缩质量
            if (quality >= 0.9) {
                // 90-100%: 使用原图
                compressedDataUrl = imageItem.originalImage.src;
                compressedSize = originalSize;
            } else {
                // 将0-90%的范围映射到0.1-0.9的压缩质量
                const actualQuality = 0.1 + (quality * 0.8);
                
                // 进行压缩
                compressedDataUrl = canvas.toDataURL('image/jpeg', actualQuality);
                compressedSize = Math.round((compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);

                // 如果压缩后反而更大，使用原图
                if (compressedSize > originalSize) {
                    compressedDataUrl = imageItem.originalImage.src;
                    compressedSize = originalSize;
                }
            }

            imageItem.compressedDataUrl = compressedDataUrl;

            // 更新UI
            requestAnimationFrame(() => {
                imageItem.element.querySelector('.compressed-size').textContent = formatFileSize(compressedSize);
                
                if (selectedItem === imageItem) {
                    const mainPreview = document.getElementById('mainPreview');
                    const mainCompressedPreview = mainPreview.querySelector('.compressed-preview');
                    mainCompressedPreview.src = compressedDataUrl;
                    mainPreview.querySelector('.compressed-size').textContent = formatFileSize(compressedSize);
                }
            });
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

    // 优化批量压缩
    function updateCompression(quality) {
        if (quality < 0 || quality > 1) return;
        
        // 使用 requestAnimationFrame 和 Promise 优化批量处理
        const process = async () => {
            for (const item of imageItems) {
                if (item.originalImage) {
                    await new Promise(resolve => {
                        requestAnimationFrame(() => {
                            compressImage(item, quality);
                            resolve();
                        });
                    });
                }
            }
        };
        
        process();
    }

    function updateMainPreview(imageItem) {
        const mainPreview = document.getElementById('mainPreview');
        const originalPreview = mainPreview.querySelector('.original-preview');
        const compressedPreview = mainPreview.querySelector('.compressed-preview');
        const filename = mainPreview.querySelector('.filename');
        const originalSize = mainPreview.querySelector('.original-size');
        const compressedSize = mainPreview.querySelector('.compressed-size');

        filename.textContent = imageItem.file.name;
        originalSize.textContent = formatFileSize(imageItem.file.size);

        originalPreview.setAttribute('data-file', imageItem.file.name);
        compressedPreview.setAttribute('data-file', imageItem.file.name);

        if (imageItem.originalImage && imageItem.originalImage.src) {
            originalPreview.src = imageItem.originalImage.src;
        }

        if (imageItem.compressedDataUrl) {
            compressedPreview.src = imageItem.compressedDataUrl;
            const compressedBytes = Math.round((imageItem.compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);
            compressedSize.textContent = formatFileSize(compressedBytes);
        } else {
            compressedSize.textContent = '处理中...';
        }
    }
}); 