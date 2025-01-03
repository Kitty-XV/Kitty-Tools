document.addEventListener('DOMContentLoaded', function() {
    // 标签页切换功能
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // 更新标签页状态
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 更新面板显示
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === target + 'Panel') {
                    panel.classList.add('active');
                }
            });
        });
    });

    // Word转PDF功能
    const wordInput = document.getElementById('wordInput');
    const wordUploadBox = document.getElementById('wordUploadBox');
    const wordFilesList = document.getElementById('wordFilesList');
    const wordItems = document.getElementById('wordItems');
    const convertToPdfBtn = document.getElementById('convertToPdfBtn');
    
    let wordFiles = [];
    const MAX_FILES = 10;

    // 处理Word文件上传
    wordInput.addEventListener('change', (e) => {
        handleWordFiles(Array.from(e.target.files));
        e.target.value = '';
    });

    // 拖拽上传Word文件
    wordUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        wordUploadBox.classList.add('dragover');
    });

    wordUploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        wordUploadBox.classList.remove('dragover');
    });

    wordUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        wordUploadBox.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => {
            return file.name.match(/\.(doc|docx)$/i);
        });
        
        if (files.length === 0) {
            alert('请上传Word文件（.doc或.docx格式）！');
            return;
        }
        
        handleWordFiles(files);
    });

    // 处理Word文件
    function handleWordFiles(files) {
        if (files.length + wordFiles.length > MAX_FILES) {
            alert(`最多只能上传${MAX_FILES}个文件！`);
            return;
        }

        files.forEach(file => {
            if (file.size > 50 * 1024 * 1024) {
                alert(`文件 ${file.name} 超过50MB限制！`);
                return;
            }

            const fileItem = createFileItem(file, 'word');
            wordFiles.push({
                file: file,
                element: fileItem
            });
            wordItems.appendChild(fileItem);
        });

        updateFileCount('word');
        wordFilesList.style.display = 'block';
    }

    // PDF转Word功能
    const pdfInput = document.getElementById('pdfInput');
    const pdfUploadBox = document.getElementById('pdfUploadBox');
    const pdfFilesList = document.getElementById('pdfFilesList');
    const pdfItems = document.getElementById('pdfItems');
    const convertToWordBtn = document.getElementById('convertToWordBtn');
    
    let pdfFiles = [];

    // 处理PDF文件上传
    pdfInput.addEventListener('change', (e) => {
        handlePdfFiles(Array.from(e.target.files));
        e.target.value = '';
    });

    // 拖拽上传PDF文件
    pdfUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pdfUploadBox.classList.add('dragover');
    });

    pdfUploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pdfUploadBox.classList.remove('dragover');
    });

    pdfUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pdfUploadBox.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => {
            return file.type === 'application/pdf';
        });
        
        if (files.length === 0) {
            alert('请上传PDF文件！');
            return;
        }
        
        handlePdfFiles(files);
    });

    // 处理PDF文件
    function handlePdfFiles(files) {
        if (files.length + pdfFiles.length > MAX_FILES) {
            alert(`最多只能上传${MAX_FILES}个文件！`);
            return;
        }

        files.forEach(file => {
            if (file.size > 50 * 1024 * 1024) {
                alert(`文件 ${file.name} 超过50MB限制！`);
                return;
            }

            const fileItem = createFileItem(file, 'pdf');
            pdfFiles.push({
                file: file,
                element: fileItem
            });
            pdfItems.appendChild(fileItem);
        });

        updateFileCount('pdf');
        pdfFilesList.style.display = 'block';
    }

    // 创建文件项
    function createFileItem(file, type) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'file-item';
        itemDiv.innerHTML = `
            <img src="converter-icon.svg" alt="文件图标" class="file-icon">
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <div class="file-status">等待转换</div>
            <div class="file-actions">
                <button class="remove-btn">删除</button>
            </div>
        `;

        // 添加删除功能
        itemDiv.querySelector('.remove-btn').onclick = () => {
            const files = type === 'word' ? wordFiles : pdfFiles;
            const index = files.findIndex(item => item.element === itemDiv);
            if (index > -1) {
                files.splice(index, 1);
                itemDiv.remove();
                updateFileCount(type);
                
                if (files.length === 0) {
                    (type === 'word' ? wordFilesList : pdfFilesList).style.display = 'none';
                }
            }
        };

        return itemDiv;
    }

    // 更新文件数量显示
    function updateFileCount(type) {
        const files = type === 'word' ? wordFiles : pdfFiles;
        const container = type === 'word' ? wordFilesList : pdfFilesList;
        container.querySelector('.file-count').textContent = `共 ${files.length} 个文件`;
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Word转PDF
    convertToPdfBtn.addEventListener('click', async () => {
        if (wordFiles.length === 0) {
            alert('请先上传Word文件！');
            return;
        }

        alert('Word转PDF功能需要后端服务支持，目前仅作为界面演示。');
    });

    // PDF转Word
    convertToWordBtn.addEventListener('click', async () => {
        if (pdfFiles.length === 0) {
            alert('请先上传PDF文件！');
            return;
        }

        alert('PDF转Word功能需要后端服务支持，目前仅作为界面演示。');
    });
}); 