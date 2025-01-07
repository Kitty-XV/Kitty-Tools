document.addEventListener('DOMContentLoaded', function() {
    const uploadBox = document.getElementById('uploadBox');
    const pdfInput = document.getElementById('pdfInput');
    const settingsSection = document.getElementById('settingsSection');
    const resultSection = document.getElementById('resultSection');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityLevel = document.getElementById('qualityLevel');
    const compressBtn = document.getElementById('compressBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let currentFile = null;
    let compressedPdf = null;
    
    // 处理文件上传
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
        e.target.value = '';
    });
    
    // 拖拽上传
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

    uploadBox.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(file => file.type === 'application/pdf');
        
        if (pdfFile) {
            handleFile(pdfFile);
        } else {
            showToast('请上传PDF文件！');
        }
    });

    // 质量滑块事件
    qualitySlider.addEventListener('input', () => {
        const levels = ['低', '中', '高'];
        qualityLevel.textContent = levels[qualitySlider.value - 1];
    });

    // 压缩按钮事件
    compressBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        
        try {
            compressBtn.disabled = true;
            compressBtn.textContent = '压缩中...';
            
            const quality = qualitySlider.value;
            compressedPdf = await compressPDF(currentFile, quality);
            
            updateResultInfo(currentFile.size, compressedPdf.size);
            resultSection.style.display = 'block';
            
        } catch (error) {
            showToast('压缩失败: ' + error.message);
        } finally {
            compressBtn.disabled = false;
            compressBtn.textContent = '开始压缩';
        }
    });

    // 下载按钮事件
    downloadBtn.addEventListener('click', () => {
        if (!compressedPdf) return;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedPdf);
        link.download = 'compressed_' + currentFile.name;
        link.click();
    });

    // 处理文件
    async function handleFile(file) {
        if (file.size > 50 * 1024 * 1024) {
            showToast('文件大小不能超过50MB');
            return;
        }

        if (file.type !== 'application/pdf') {
            showToast('请上传PDF文件');
            return;
        }

        currentFile = file;
        settingsSection.style.display = 'block';
        resultSection.style.display = 'none';
        showToast('文件已选择，请设置压缩质量');
    }

    // 压缩PDF
    async function compressPDF(file, quality) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // 获取所有页面
        const pages = pdfDoc.getPages();
        
        // 遍历每一页进行优化
        for (const page of pages) {
            // 获取页面的操作对象
            const { width, height } = page.getSize();
            
            // 根据质量等级设置字体子集化
            if (quality < 3) {
                // 获取页面中使用的所有字体
                const fonts = await page.node.Resources().lookup(PDFLib.PDFName.of('Font'));
                if (fonts) {
                    // 对每个字体进行子集化处理
                    for (const [name, font] of Object.entries(fonts.dict)) {
                        if (font instanceof PDFLib.PDFRef) {
                            const fontDict = await font.lookupAsync();
                            if (fontDict instanceof PDFLib.PDFDict) {
                                fontDict.delete(PDFLib.PDFName.of('ToUnicode'));
                            }
                        }
                    }
                }
            }
        }
        
        // 根据质量等级设置压缩参数
        const compressionLevel = {
            1: { 
                quality: 0.1,
                imageQuality: 0.1,
                objectStreamLength: 100,
                preserveObjectIds: false,
                compress: true,
                removeUnusedObjects: true,
                useObjectStreams: true,
                addDefaultPage: false,
                updateMetadata: false,
                // 文本相关压缩选项
                objectCompressionMethod: 'deflate',
                compressStreams: true,
                stripBuffer: true,
                mergeStreams: true
            },
            2: { 
                quality: 0.3,
                imageQuality: 0.3,
                objectStreamLength: 50,
                preserveObjectIds: false,
                compress: true,
                removeUnusedObjects: true,
                useObjectStreams: true,
                addDefaultPage: false,
                updateMetadata: false,
                objectCompressionMethod: 'deflate',
                compressStreams: true,
                stripBuffer: true
            },
            3: { 
                quality: 0.5,
                imageQuality: 0.5,
                objectStreamLength: 25,
                preserveObjectIds: false,
                compress: true,
                removeUnusedObjects: true,
                useObjectStreams: true,
                addDefaultPage: false,
                updateMetadata: false,
                compressStreams: true
            }
        }[quality];

        // 压缩PDF
        const compressedBytes = await pdfDoc.save({
            ...compressionLevel
        });

        return new Blob([compressedBytes], { type: 'application/pdf' });
    }

    // 更新结果信息
    function updateResultInfo(originalSize, compressedSize) {
        document.getElementById('originalSize').textContent = formatFileSize(originalSize);
        document.getElementById('compressedSize').textContent = formatFileSize(compressedSize);
        
        const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        document.getElementById('compressionRatio').textContent = ratio + '%';
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Toast提示
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}); 