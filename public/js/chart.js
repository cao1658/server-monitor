Failed to resolve the requested file.
// 图表初始化和配置
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在仪表盘页面
    if (document.getElementById('resourceChart') && document.getElementById('serverDistributionChart')) {
        initResourceChart();
        initServerDistributionChart();
    }
});

// 初始化资源监控图表
function initResourceChart() {
    const ctx = document.getElementById('resourceChart').getContext('2d');
    
    // 生成过去24小时的时间标签
    const timeLabels = generateTimeLabels(24);
    
    // 模拟数据
    const cpuData = generateRandomData(24, 20, 80);
    const memoryData = generateRandomData(24, 30, 90);
    const diskData = generateRandomData(24, 40, 75);
    
    const resourceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'CPU使用率',
                    data: cpuData,
                    borderColor: '#3a86ff',
                    backgroundColor: 'rgba(58, 134, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#3a86ff'
                },
                {
                    label: '内存使用率',
                    data: memoryData,
                    borderColor: '#8338ec',
                    backgroundColor: 'rgba(131, 56, 236, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#8338ec'
                },
                {
                    label: '磁盘使用率',
                    data: diskData,
                    borderColor: '#ffbe0b',
                    backgroundColor: 'rgba(255, 190, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#ffbe0b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 6
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#e9ecef',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 5,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        borderDash: [2, 2]
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
    
    // 添加图表更新功能
    window.updateResourceChart = function(period) {
        const hours = period === '6h' ? 6 : period === '12h' ? 12 : period === '7d' ? 168 : 24;
        const newLabels = generateTimeLabels(hours);
        const newCpuData = generateRandomData(hours, 20, 80);
        const newMemoryData = generateRandomData(hours, 30, 90);
        const newDiskData = generateRandomData(hours, 40, 75);
        
        resourceChart.data.labels = newLabels;
        resourceChart.data.datasets[0].data = newCpuData;
        resourceChart.data.datasets[1].data = newMemoryData;
        resourceChart.data.datasets[2].data = newDiskData;
        resourceChart.update();
    };
}

// 初始化服务器分布图表
function initServerDistributionChart() {
    const ctx = document.getElementById('serverDistributionChart').getContext('2d');
    
    // 模拟数据
    const data = {
        labels: ['在线', '离线', '警告', '错误'],
        datasets: [{
            data: [65, 10, 15, 10],
            backgroundColor: [
                '#38b000', // 在线 - 绿色
                '#adb5bd', // 离线 - 灰色
                '#ffbe0b', // 警告 - 黄色
                '#ff006e'  // 错误 - 红色
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };
    
    const serverDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#e9ecef',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 5,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${percentage}% (${value}台)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
    
    // 添加图表更新功能
    window.updateServerDistributionChart = function(online, offline, warning, error) {
        serverDistributionChart.data.datasets[0].data = [online, offline, warning, error];
        serverDistributionChart.update();
    };
}

// 生成过去N小时的时间标签
function generateTimeLabels(hours) {
    const labels = [];
    const now = new Date();
    
    for (let i = hours - 1; i >= 0; i--) {
        const time = new Date(now);
        time.setHours(now.getHours() - i);
        
        // 格式化为 HH:MM
        const hour = time.getHours().toString().padStart(2, '0');
        const minute = time.getMinutes().toString().padStart(2, '0');
        labels.push(`${hour}:${minute}`);
    }
    
    return labels;
}

// 生成随机数据
function generateRandomData(count, min, max) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
}

// 更新仪表盘统计数据
function updateDashboardStats(total, online, warning, error) {
    document.getElementById('totalServers').textContent = total;
    document.getElementById('onlineServers').textContent = online;
    document.getElementById('warningServers').textContent = warning;
    document.getElementById('errorServers').textContent = error;
    
    // 更新进度条
    if (total > 0) {
        const onlinePercent = (online / total) * 100;
        const warningPercent = (warning / total) * 100;
        const errorPercent = (error / total) * 100;
        
        document.getElementById('onlineProgress').style.width = `${onlinePercent}%`;
        document.getElementById('warningProgress').style.width = `${warningPercent}%`;
        document.getElementById('errorProgress').style.width = `${errorPercent}%`;
    }
    
    // 更新服务器分布图表
    if (window.updateServerDistributionChart) {
        window.updateServerDistributionChart(online, total - online - warning - error, warning, error);
    }
}

// 导出函数
window.chartUtils = {
    updateDashboardStats,
    updateResourceChart: function(period) {
        if (window.updateResourceChart) {
            window.updateResourceChart(period);
        }
    }
};