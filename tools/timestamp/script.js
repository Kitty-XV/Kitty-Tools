document.addEventListener('DOMContentLoaded', function() {
    // 获取所有元素
    const currentDateTime = document.getElementById('currentDateTime');
    const currentTimestamp = document.getElementById('currentTimestamp');
    const refreshBtn = document.getElementById('refreshBtn');
    const timestampInput = document.getElementById('timestampInput');
    const dateTimeInput = document.getElementById('dateTimeInput');
    const nowBtn = document.getElementById('nowBtn');
    const currentBtn = document.getElementById('currentBtn');
    const dateTimeOutput = document.getElementById('dateTimeOutput');
    const utcOutput = document.getElementById('utcOutput');
    const relativeOutput = document.getElementById('relativeOutput');
    const secondsOutput = document.getElementById('secondsOutput');
    const millisecondsOutput = document.getElementById('millisecondsOutput');

    // 日期时间选择器相关
    const datetimePopup = document.getElementById('datetimePopup');
    const currentMonth = document.querySelector('.current-month');
    const daysContainer = document.querySelector('.days');
    const hourInput = document.getElementById('hourInput');
    const minuteInput = document.getElementById('minuteInput');
    const secondInput = document.getElementById('secondInput');

    let selectedDate = new Date();
    let currentDisplayMonth = new Date();

    // 更新当前时间显示
    function updateCurrentTime() {
        const now = new Date();
        currentDateTime.textContent = formatDateTime(now);
        currentTimestamp.textContent = Math.floor(now.getTime() / 1000) + ' 秒';
    }

    // 格式化日期时间
    function formatDateTime(date) {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    // 格式化UTC时间
    function formatUTC(date) {
        return date.toUTCString();
    }

    // 计算相对时间
    function getRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(Math.abs(diff) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (diff < 0) {
            if (days > 0) return `${days}天后`;
            if (hours > 0) return `${hours}小时后`;
            if (minutes > 0) return `${minutes}分钟后`;
            return `${seconds}秒后`;
        } else {
            if (days > 0) return `${days}天前`;
            if (hours > 0) return `${hours}小时前`;
            if (minutes > 0) return `${minutes}分钟前`;
            return `${seconds}秒前`;
        }
    }

    // 处理时间戳转换
    function handleTimestampConversion() {
        let timestamp = timestampInput.value;
        if (!timestamp) {
            clearTimestampOutputs();
            return;
        }

        if (timestamp.length >= 13) {
            timestamp = Math.floor(timestamp / 1000);
        }
        timestamp = parseInt(timestamp);

        try {
            const date = new Date(timestamp * 1000);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid timestamp');
            }

            dateTimeOutput.value = formatDateTime(date);
            utcOutput.value = formatUTC(date);
            relativeOutput.value = getRelativeTime(date.getTime());
        } catch (error) {
            clearTimestampOutputs();
            showToast('请输入有效的时间戳');
        }
    }

    // 处理日期转换
    function handleDateConversion() {
        const dateString = dateTimeInput.value;
        if (!dateString) {
            clearDateOutputs();
            return;
        }

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }

            const timestamp = Math.floor(date.getTime() / 1000);
            secondsOutput.value = timestamp;
            millisecondsOutput.value = timestamp * 1000;
        } catch (error) {
            clearDateOutputs();
            showToast('请选择有效的日期时间');
        }
    }

    // 清空时间戳转换输出
    function clearTimestampOutputs() {
        dateTimeOutput.value = '';
        utcOutput.value = '';
        relativeOutput.value = '';
    }

    // 清空日期转换输出
    function clearDateOutputs() {
        secondsOutput.value = '';
        millisecondsOutput.value = '';
    }

    // 设置当前时间
    function setCurrentTime() {
        const now = new Date();
        const timestamp = Math.floor(now.getTime() / 1000);
        timestampInput.value = timestamp;
        handleTimestampConversion();
    }

    // 设置当前日期时间
    function setCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        dateTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        handleDateConversion();
    }

    // 复制功能
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input.value) {
                showToast('没有可复制的内容！');
                return;
            }
            input.select();
            document.execCommand('copy');
            showToast('已复制到剪贴板！');
        });
    });

    // 事件监听
    refreshBtn.addEventListener('click', updateCurrentTime);
    timestampInput.addEventListener('input', handleTimestampConversion);
    dateTimeInput.addEventListener('input', handleDateConversion);
    nowBtn.addEventListener('click', setCurrentTime);
    currentBtn.addEventListener('click', setCurrentDateTime);

    // 初始化
    updateCurrentTime();
    const timer = setInterval(updateCurrentTime, 1000);

    // 页面卸载时清除定时器
    window.addEventListener('unload', () => {
        clearInterval(timer);
    });

    // 打开日期选择器
    dateTimeInput.addEventListener('click', () => {
        datetimePopup.classList.add('active');
        updateCalendar();
    });

    // 确定按钮
    document.querySelector('.confirm-btn').addEventListener('click', () => {
        datetimePopup.classList.remove('active');
        handleDateConversion();
    });

    // 现在按钮 - 不再自动关闭日历
    document.querySelector('.now-btn').addEventListener('click', () => {
        selectedDate = new Date();
        currentDisplayMonth = new Date(selectedDate);
        hourInput.value = String(selectedDate.getHours()).padStart(2, '0');
        minuteInput.value = String(selectedDate.getMinutes()).padStart(2, '0');
        secondInput.value = String(selectedDate.getSeconds()).padStart(2, '0');
        updateCalendar();
        dateTimeInput.value = formatSelectedDateTime();
    });

    // 更新日历显示
    function updateCalendar() {
        const year = currentDisplayMonth.getFullYear();
        const month = currentDisplayMonth.getMonth();
        
        currentMonth.textContent = `${year}年${month + 1}月`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = new Date(firstDay);
        startDay.setDate(1 - firstDay.getDay());
        
        daysContainer.innerHTML = '';
        
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDay);
            date.setDate(startDay.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = date.getDate();
            
            if (date.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            if (isSameDay(date, new Date())) {
                dayElement.classList.add('today');
            }
            
            if (isSameDay(date, selectedDate)) {
                dayElement.classList.add('selected');
            }
            
            dayElement.addEventListener('click', () => {
                selectedDate = new Date(date);
                selectedDate.setHours(hourInput.value || 0);
                selectedDate.setMinutes(minuteInput.value || 0);
                selectedDate.setSeconds(secondInput.value || 0);
                updateCalendar();
                dateTimeInput.value = formatSelectedDateTime();
            });
            
            daysContainer.appendChild(dayElement);
        }
    }

    // 检查是否是同一天
    function isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    // 格式化选中的日期时间
    function formatSelectedDateTime() {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const hours = String(selectedDate.getHours()).padStart(2, '0');
        const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
        const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 月份导航
    document.querySelector('.month-nav.prev').addEventListener('click', () => {
        currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() - 1);
        updateCalendar();
    });

    document.querySelector('.month-nav.next').addEventListener('click', () => {
        currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() + 1);
        updateCalendar();
    });

    // 时间输入处理
    [hourInput, minuteInput, secondInput].forEach(input => {
        input.addEventListener('change', () => {
            let value = parseInt(input.value) || 0;
            const max = parseInt(input.max);
            value = Math.max(0, Math.min(value, max));
            input.value = String(value).padStart(2, '0');
            
            selectedDate.setHours(hourInput.value || 0);
            selectedDate.setMinutes(minuteInput.value || 0);
            selectedDate.setSeconds(secondInput.value || 0);
            dateTimeInput.value = formatSelectedDateTime();
        });
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
}); 