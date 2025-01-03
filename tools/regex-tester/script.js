document.addEventListener('DOMContentLoaded', function() {
    // 获取所有输入元素
    const regexInput = document.getElementById('regexInput');
    const flagsInput = document.getElementById('flagsInput');
    const testInput = document.getElementById('testInput');
    const highlightMatches = document.getElementById('highlightMatches');
    const multilineMatch = document.getElementById('multilineMatch');
    const matchCount = document.getElementById('matchCount');
    const resultList = document.getElementById('resultList');
    const copyResultBtn = document.getElementById('copyResultBtn');

    // 存储当前的匹配结果
    let currentMatches = [];

    // 更新匹配结果
    function updateMatches() {
        try {
            // 清除错误状态
            regexInput.classList.remove('error');
            const errorMessage = document.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }

            const pattern = regexInput.value;
            const flags = flagsInput.value;
            const text = testInput.value;

            if (!pattern || !text) {
                currentMatches = [];
                updateUI();
                return;
            }

            // 创建正则表达式对象
            const regex = new RegExp(pattern, flags);
            
            // 获取所有匹配
            currentMatches = [];
            let match;
            
            if (flags.includes('g')) {
                while ((match = regex.exec(text)) !== null) {
                    currentMatches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1),
                        input: match.input
                    });
                }
            } else {
                match = regex.exec(text);
                if (match) {
                    currentMatches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1),
                        input: match.input
                    });
                }
            }

            updateUI();

        } catch (error) {
            // 显示错误信息
            regexInput.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = error.message;
            regexInput.parentNode.appendChild(errorDiv);
            
            currentMatches = [];
            updateUI();
        }
    }

    // 更新UI显示
    function updateUI() {
        // 更新匹配数量
        matchCount.textContent = currentMatches.length;

        // 更新结果列表
        resultList.innerHTML = '';
        
        if (currentMatches.length === 0) {
            const noMatch = document.createElement('div');
            noMatch.className = 'match-item';
            noMatch.textContent = '没有找到匹配项';
            resultList.appendChild(noMatch);
            return;
        }

        currentMatches.forEach((match, index) => {
            const matchItem = document.createElement('div');
            matchItem.className = 'match-item';

            // 创建匹配信息
            const matchInfo = document.createElement('div');
            matchInfo.innerHTML = `
                <strong>匹配 #${index + 1}:</strong> 
                <span class="match-highlight">${escapeHtml(match.match)}</span>
                <br>
                <small>位置: ${match.index}</small>
            `;

            // 如果有捕获组，显示捕获组信息
            if (match.groups.length > 0) {
                const groupsInfo = document.createElement('div');
                groupsInfo.innerHTML = match.groups.map((group, i) => 
                    `<br>组 ${i + 1}: ${escapeHtml(group)}`
                ).join('');
                matchInfo.appendChild(groupsInfo);
            }

            matchItem.appendChild(matchInfo);
            resultList.appendChild(matchItem);
        });

        // 如果启用了高亮，更新测试文本的显示
        if (highlightMatches.checked) {
            const text = testInput.value;
            let highlightedText = text;
            let offset = 0;

            currentMatches.forEach(match => {
                const before = highlightedText.slice(0, match.index + offset);
                const after = highlightedText.slice(match.index + match.match.length + offset);
                const highlighted = `<span class="match-highlight">${escapeHtml(match.match)}</span>`;
                highlightedText = before + highlighted + after;
                offset += highlighted.length - match.match.length;
            });

            // 创建一个新的div来显示高亮文本
            const highlightContainer = document.createElement('div');
            highlightContainer.style.cssText = `
                background: white;
                padding: 1rem;
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                margin-top: 1rem;
                white-space: pre-wrap;
                font-family: monospace;
            `;
            highlightContainer.innerHTML = highlightedText;
            
            // 替换原来的高亮容器（如果存在）
            const existingContainer = document.querySelector('.highlight-container');
            if (existingContainer) {
                existingContainer.remove();
            }
            highlightContainer.className = 'highlight-container';
            testInput.parentNode.appendChild(highlightContainer);
        } else {
            // 移除高亮容器
            const highlightContainer = document.querySelector('.highlight-container');
            if (highlightContainer) {
                highlightContainer.remove();
            }
        }
    }

    // HTML转义函数
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 事件监听
    regexInput.addEventListener('input', updateMatches);
    flagsInput.addEventListener('input', updateMatches);
    testInput.addEventListener('input', updateMatches);
    highlightMatches.addEventListener('change', updateMatches);
    multilineMatch.addEventListener('change', () => {
        if (multilineMatch.checked) {
            flagsInput.value = flagsInput.value.includes('m') ? flagsInput.value : flagsInput.value + 'm';
        } else {
            flagsInput.value = flagsInput.value.replace('m', '');
        }
        updateMatches();
    });

    // 复制结果按钮
    copyResultBtn.addEventListener('click', () => {
        if (currentMatches.length === 0) {
            showToast('没有可复制的匹配结果！');
            return;
        }

        const resultText = currentMatches.map((match, index) => 
            `匹配 #${index + 1}: ${match.match}\n位置: ${match.index}${
                match.groups.length ? '\n组: ' + match.groups.join(', ') : ''
            }`
        ).join('\n\n');

        navigator.clipboard.writeText(resultText).then(() => {
            showToast('已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败，请手动复制');
        });
    });

    // 初始化
    updateMatches();
});

// 在文件开头添加 showToast 函数
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