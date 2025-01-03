document.addEventListener('DOMContentLoaded', function() {
    // 添加 Toast 提示函数
    function showToast(message, duration = 2000) {
        // 检查是否已存在 toast 元素
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

    // 获取所有工具卡片
    const toolCards = document.querySelectorAll('.tool-card');
    
    // 已实现的工具路径
    const implementedTools = [
        'tools/image-compressor/index.html',
        'tools/pdf-editor/index.html',
        'tools/doc-converter/index.html',
        'tools/base64/index.html',
        'tools/url-encoder/index.html',
        'tools/color-picker/index.html',
        'tools/regex-tester/index.html',
        'tools/timestamp/index.html',
    ];
    
    // 为每个工具卡片添加点击事件
    toolCards.forEach(card => {
        card.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // 检查工具是否已实现
            if (!implementedTools.includes(href)) {
                e.preventDefault();
                showToast('该工具正在开发中，敬请期待！');
            }
            // 已实现的工具不做处理，让它正常跳转
        });
    });

    // 搜索功能实现
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const categories = document.querySelectorAll('.category');
        
        categories.forEach(category => {
            const cards = category.querySelectorAll('.tool-card');
            let hasVisibleCard = false;
            
            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const desc = card.querySelector('p').textContent.toLowerCase();
                const isMatch = title.includes(searchTerm) || desc.includes(searchTerm);
                
                card.style.display = isMatch ? 'block' : 'none';
                if (isMatch) hasVisibleCard = true;
            });
            
            // 如果分类下没有匹配的卡片，隐藏整个分类
            category.style.display = hasVisibleCard ? 'block' : 'none';
        });
    }
    
    searchInput.addEventListener('input', performSearch);
    searchBtn.addEventListener('click', performSearch);
}); 