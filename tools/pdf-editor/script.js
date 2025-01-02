// 初始化 PDF.js
if (typeof pdfjsLib !== 'undefined') {
    // 设置 worker 路径
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
} else {
    console.error('PDF.js 库未正确加载');
    alert('PDF.js 库加载失败，请刷新页面重试');
}

document.addEventListener('DOMContentLoaded', function() {
    // 确保 PDF.js 和 PDF-lib 都已加载
    if (typeof pdfjsLib === 'undefined' || typeof PDFLib === 'undefined') {
        alert('必要的库未加载完成，请刷新页面重试');
        return;
    }

    // 标签页切换
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

    // PDF分页编辑功能
    const splitFileInput = document.getElementById('splitFileInput');
    const splitUploadBox = document.getElementById('splitUploadBox');
    const splitEditSection = document.getElementById('splitEditSection');
    const thumbnailsList = document.getElementById('thumbnailsList');
    const previewCanvas = document.getElementById('previewCanvas');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    const pageRangeInput = document.getElementById('pageRangeInput');
    const splitBtn = document.getElementById('splitBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentPdfDoc = null;
    let currentPageNum = 1;
    let pdfPages = [];

    // 处理文件上传
    splitFileInput.addEventListener('change', handleSplitFileSelect);
    
    // 拖拽上传
    splitUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        splitUploadBox.classList.add('dragover');
    });

    splitUploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        splitUploadBox.classList.remove('dragover');
    });

    splitUploadBox.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        splitUploadBox.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(file => file.type === 'application/pdf');
        
        if (pdfFile) {
            await handlePdfFile(pdfFile);
        } else {
            alert('请上传PDF文件！');
        }
    });

    // 处理PDF文件选择
    async function handleSplitFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            await handlePdfFile(file);
        } else {
            alert('请选择PDF文件！');
        }
        e.target.value = '';
    }

    // 处理PDF文件
    async function handlePdfFile(file) {
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'loading-message';
        loadingMessage.textContent = '正在加载PDF文件...';
        splitUploadBox.appendChild(loadingMessage);

        try {
            if (file.size > 50 * 1024 * 1024) {
                throw new Error('文件大小超过50MB限制');
            }

            if (!file.type.includes('pdf')) {
                throw new Error('请上传PDF格式的文件');
            }

            const arrayBuffer = await file.arrayBuffer();
            const originalPdfBytes = new Uint8Array(arrayBuffer);
            
            // 使用 PDF.js 加载文档
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/cmaps/',
                cMapPacked: true,
            });
            
            currentPdfDoc = await loadingTask.promise;
            
            // 更新页面计数
            const numPages = currentPdfDoc.numPages;
            totalPagesSpan.textContent = numPages;
            document.querySelector('.page-count').textContent = `共 ${numPages} 页`;
            
            // 清空并重新生成缩略图
            thumbnailsList.innerHTML = '';
            pdfPages = [];
            
            // 加载PDF-lib文档
            const pdfLibDoc = await PDFLib.PDFDocument.load(originalPdfBytes);
            const pages = pdfLibDoc.getPages();
            
            // 生成缩略图
            for (let i = 1; i <= numPages; i++) {
                const pdfJsPage = await currentPdfDoc.getPage(i);
                // 存储PDF-lib的页面和PDF.js的页面
                pdfPages.push({
                    pdfJsPage: pdfJsPage,
                    pdfLibPage: pages[i-1],
                    pageNum: i,
                    originalPageNumber: i  // 保存原始页码
                });
                await createThumbnail(pdfPages[i-1].pdfJsPage, i);
            }
            
            // 显示编辑区域
            splitEditSection.style.display = 'block';
            
            // 显示第一页
            currentPageNum = 1;
            await showPage(currentPageNum);
            
            // 更新导航按钮状态
            updateNavButtons();
            
            // 保存原始PDF数据
            currentPdfDoc.originalPdfBytes = originalPdfBytes;
        } catch (error) {
            console.error('加载PDF文件失败:', error);
            alert(error.message || '无法加载PDF文件，请确保文件未损坏或加密。');
        } finally {
            loadingMessage.remove();
        }
    }

    // 创建缩略图
    async function createThumbnail(page, pageNum) {
        const scale = 0.5;
        const viewport = page.getViewport({ scale });
        
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item';
        thumbnailItem.setAttribute('data-page', pageNum);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        const thumbnailPreview = document.createElement('div');
        thumbnailPreview.className = 'thumbnail-preview';
        thumbnailPreview.appendChild(canvas);
        
        const thumbnailInfo = document.createElement('div');
        thumbnailInfo.className = 'thumbnail-info';
        thumbnailInfo.textContent = `第 ${pageNum} 页`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation(); // 防止触发缩略图的点击事件
            await deletePage(pageNum);
        };
        
        const thumbnailActions = document.createElement('div');
        thumbnailActions.className = 'thumbnail-actions';
        thumbnailActions.appendChild(deleteBtn);
        
        thumbnailItem.appendChild(thumbnailPreview);
        thumbnailItem.appendChild(thumbnailInfo);
        thumbnailItem.appendChild(thumbnailActions);
        
        thumbnailsList.appendChild(thumbnailItem);
        
        // 添加拖拽功能
        makeDraggable(thumbnailItem);
        
        // 添加点击事件
        thumbnailItem.addEventListener('click', () => {
            currentPageNum = pageNum;
            showPage(currentPageNum);
            
            // 移除其他缩略图的选中状态
            document.querySelectorAll('.thumbnail-item').forEach(item => {
                item.classList.remove('selected');
            });
            // 添加当前缩略图的选中状态
            thumbnailItem.classList.add('selected');
        });
        
        // 如果是当前页，添加选中状态
        if (pageNum === currentPageNum) {
            thumbnailItem.classList.add('selected');
        }
    }

    // 显示页面
    async function showPage(pageNum) {
        try {
            const page = pdfPages[pageNum - 1].pdfJsPage;
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            
            previewCanvas.width = viewport.width;
            previewCanvas.height = viewport.height;
            
            const renderContext = {
                canvasContext: previewCanvas.getContext('2d'),
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            currentPageSpan.textContent = pageNum;
            updateNavButtons();
        } catch (error) {
            console.error('显示页面失败:', error);
            alert('显示页面失败');
        }
    }

    // 更新导航按钮状态
    function updateNavButtons() {
        prevPageBtn.disabled = currentPageNum <= 1;
        nextPageBtn.disabled = currentPageNum >= pdfPages.length;
    }

    // 页面导航
    prevPageBtn.addEventListener('click', () => {
        if (currentPageNum > 1) {
            currentPageNum--;
            showPage(currentPageNum);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPageNum < pdfPages.length) {
            currentPageNum++;
            showPage(currentPageNum);
        }
    });

    // 删除页面
    async function deletePage(pageNum) {
        if (pdfPages.length <= 1) {
            alert('无法删除最后一页！');
            return;
        }
        
        // 如果删除的是当前页，先切换到前一页
        if (pageNum === currentPageNum && currentPageNum > 1) {
            currentPageNum--;
        } else if (pageNum < currentPageNum) {
            currentPageNum--;
        }

        pdfPages.splice(pageNum - 1, 1);
        thumbnailsList.innerHTML = '';
        
        // 使用 for...of 循环确保按顺序处理
        let index = 0;
        for (const pageInfo of pdfPages) {
            pageInfo.pageNum = index + 1;
            await createThumbnail(pageInfo.pdfJsPage, index + 1);
            index++;
        }
        
        // 更新页面计数
        document.querySelector('.page-count').textContent = `共 ${pdfPages.length} 页`;
        totalPagesSpan.textContent = pdfPages.length;
        
        // 确保当前页码不超出范围
        if (currentPageNum > pdfPages.length) {
            currentPageNum = pdfPages.length;
        }
        if (currentPageNum < 1) {
            currentPageNum = 1;
        }

        // 等待缩略图生成完成后再更新预览
        await showPage(currentPageNum);
        
        // 更新导航按钮状态
        updateNavButtons();
    }

    // 实现拖拽功能
    function makeDraggable(element) {
        element.draggable = true;
        
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.getAttribute('data-page'));
            element.classList.add('dragging');
        });
        
        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
            // 拖拽结束后更新页面顺序
            updatePagesOrder();
        });
        
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            const afterElement = getDragAfterElement(thumbnailsList, e.clientY);
            
            if (afterElement) {
                thumbnailsList.insertBefore(draggingElement, afterElement);
            } else {
                thumbnailsList.appendChild(draggingElement);
            }
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.thumbnail-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // 更新页面顺序
    async function updatePagesOrder() {
        // 获取新的页面顺序
        const newOrder = Array.from(thumbnailsList.children).map(item => 
            parseInt(item.getAttribute('data-page'))
        );
        
        // 重新排序pdfPages数组
        const newPdfPages = newOrder.map(index => pdfPages[index - 1]);
        pdfPages = newPdfPages;
        
        // 清空缩略图列表
        thumbnailsList.innerHTML = '';
        
        // 重新生成缩略图和更新页码
        for (let i = 0; i < pdfPages.length; i++) {
            pdfPages[i].pageNum = i + 1;
            await createThumbnail(pdfPages[i].pdfJsPage, i + 1);
        }
        
        // 更新当前预览
        if (currentPageNum > pdfPages.length) {
            currentPageNum = pdfPages.length;
        }
        await showPage(currentPageNum);
        
        // 更新导航按钮状态
        updateNavButtons();
    }

    // 分割PDF
    splitBtn.addEventListener('click', async () => {
        const range = pageRangeInput.value.trim();
        if (!range) {
            alert('请输入要分割的页码范围！');
            return;
        }
        
        try {
            const pageRanges = parsePageRanges(range);
            const sourcePdf = await PDFLib.PDFDocument.load(currentPdfDoc.originalPdfBytes);
            const pdfDoc = await PDFLib.PDFDocument.create();
            
            for (const range of pageRanges) {
                const [start, end] = range;
                for (let i = start; i <= end; i++) {
                    if (i > 0 && i <= pdfPages.length) {
                        const originalPageIndex = parseInt(pdfPages[i - 1].pdfJsPage.pageNumber) - 1;
                        const [copiedPage] = await pdfDoc.copyPages(sourcePdf, [originalPageIndex]);
                        pdfDoc.addPage(copiedPage);
                    }
                }
            }
            
            const pdfBytes = await pdfDoc.save();
            downloadPdf(pdfBytes, 'split.pdf');
        } catch (error) {
            console.error('分割PDF失败:', error);
            alert('分割PDF失败，请检查页码范围格式是否正确。');
        }
    });

    // 解析页码范围
    function parsePageRanges(input) {
        const ranges = [];
        const parts = input.split(',');
        
        for (const part of parts) {
            const range = part.trim().split('-');
            if (range.length === 1) {
                const num = parseInt(range[0]);
                ranges.push([num, num]);
            } else if (range.length === 2) {
                const start = parseInt(range[0]);
                const end = parseInt(range[1]);
                ranges.push([start, end]);
            }
        }
        
        return ranges;
    }

    // 下载修改后的PDF
    downloadBtn.addEventListener('click', async () => {
        try {
            const sourcePdf = await PDFLib.PDFDocument.load(currentPdfDoc.originalPdfBytes);
            const pdfDoc = await PDFLib.PDFDocument.create();
            
            for (const pageInfo of pdfPages) {
                const originalPageIndex = parseInt(pageInfo.pdfJsPage.pageNumber) - 1;
                const [copiedPage] = await pdfDoc.copyPages(sourcePdf, [originalPageIndex]);
                pdfDoc.addPage(copiedPage);
            }
            
            const pdfBytes = await pdfDoc.save();
            downloadPdf(pdfBytes, 'modified.pdf');
        } catch (error) {
            console.error('下载PDF失败:', error);
            alert('生成PDF文件失败。');
        }
    });

    // 下载PDF文件
    function downloadPdf(pdfBytes, filename) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    // PDF拼接功能
    const mergeFileInput = document.getElementById('mergeFileInput');
    const mergeUploadBox = document.getElementById('mergeUploadBox');
    const pdfList = document.getElementById('pdfList');
    const pdfItems = document.getElementById('pdfItems');
    const mergeBtn = document.getElementById('mergeBtn');
    
    let mergeFiles = [];

    // 处理拼接文件上传
    mergeFileInput.addEventListener('change', handleMergeFileSelect);
    
    // 拖拽上传
    mergeUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mergeUploadBox.classList.add('dragover');
    });

    mergeUploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mergeUploadBox.classList.remove('dragover');
    });

    mergeUploadBox.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        mergeUploadBox.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files)
            .filter(file => file.type === 'application/pdf');
        
        if (files.length > 0) {
            await handleMergeFiles(files);
        } else {
            alert('请上传PDF文件！');
        }
    });

    // 处理多个PDF文件选择
    async function handleMergeFileSelect(e) {
        const files = Array.from(e.target.files)
            .filter(file => file.type === 'application/pdf');
        
        if (files.length > 0) {
            await handleMergeFiles(files);
        } else {
            alert('请选择PDF文件！');
        }
        e.target.value = '';
    }

    // 处理多个PDF文件
    async function handleMergeFiles(files) {
        try {
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
                
                mergeFiles.push({
                    name: file.name,
                    size: file.size,
                    data: arrayBuffer,
                    doc: pdfDoc
                });
                
                await createPdfItem(file.name, file.size, pdfDoc);
            }
            
            // 显示PDF列表
            pdfList.style.display = 'block';
            document.querySelector('.file-count').textContent = 
                `共 ${mergeFiles.length} 个文件`;
        } catch (error) {
            console.error('加载PDF文件失败:', error);
            alert('无法加载某些PDF文件，请确保文件未损坏或加密。');
        }
    }

    // 创建PDF文件项
    async function createPdfItem(filename, filesize, pdfDoc) {
        const pdfItem = document.createElement('div');
        pdfItem.className = 'pdf-item';
        pdfItem.setAttribute('data-filename', filename);
        
        // 创建预览
        const preview = document.createElement('div');
        preview.className = 'pdf-preview';
        
        // 显示第一页预览
        try {
            const page = await pdfDoc.getPage(1);
            const scale = 0.5;
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            preview.appendChild(canvas);
        } catch (error) {
            console.error('创建预览失败:', error);
            preview.textContent = '预览失败';
        }
        
        // 创建信息区域
        const info = document.createElement('div');
        info.className = 'pdf-info';
        info.innerHTML = `
            <h4>${filename}</h4>
            <p>${formatFileSize(filesize)} | ${pdfDoc.numPages} 页</p>
        `;
        
        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = () => deletePdfItem(filename);
        
        pdfItem.appendChild(preview);
        pdfItem.appendChild(info);
        pdfItem.appendChild(deleteBtn);
        
        // 添加拖拽功能
        makePdfItemDraggable(pdfItem);
        
        pdfItems.appendChild(pdfItem);
    }

    // 删除PDF文件项
    function deletePdfItem(filename) {
        const index = mergeFiles.findIndex(file => file.name === filename);
        if (index !== -1) {
            mergeFiles.splice(index, 1);
            const item = pdfItems.querySelector(`[data-filename="${filename}"]`);
            if (item) {
                item.remove();
            }
            
            document.querySelector('.file-count').textContent = 
                `共 ${mergeFiles.length} 个文件`;
            
            if (mergeFiles.length === 0) {
                pdfList.style.display = 'none';
            }
        }
    }

    // PDF文件项拖拽功能
    function makePdfItemDraggable(element) {
        element.draggable = true;
        
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.getAttribute('data-filename'));
            element.classList.add('dragging');
        });
        
        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });
        
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            const afterElement = getDragAfterElement(pdfItems, e.clientY);
            
            if (afterElement) {
                pdfItems.insertBefore(draggingElement, afterElement);
            } else {
                pdfItems.appendChild(draggingElement);
            }
        });
    }

    // 合并PDF
    mergeBtn.addEventListener('click', async () => {
        if (mergeFiles.length < 2) {
            alert('请至少上传两个PDF文件！');
            return;
        }
        
        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            // 按照显示顺序获取文件
            const orderedFiles = Array.from(pdfItems.children)
                .map(item => mergeFiles.find(file => file.name === item.getAttribute('data-filename')));
            
            for (const file of orderedFiles) {
                const pdf = await PDFLib.PDFDocument.load(file.data);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }
            
            const mergedPdfBytes = await mergedPdf.save();
            downloadPdf(mergedPdfBytes, 'merged.pdf');
        } catch (error) {
            console.error('合并PDF失败:', error);
            alert('合并PDF文件失败。');
        }
    });

    // 文件大小格式化
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 