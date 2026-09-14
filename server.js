const express = require('express');
const path = require('path');
const { calculateBaziChart } = require('@openfate/bazi-engine');

const app = express();
const PORT = 8765;

app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 八字排盘 API
app.post('/api/bazi', (req, res) => {
  try {
    const { year, month, day, hour, minute, gender, longitude, timezone, calendarType, name } = req.body;

    if (!year || !month || !day || !gender) {
      return res.status(400).json({ error: '缺少必要参数：年、月、日、性别' });
    }

    const input = {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      gender: gender,
      longitude: longitude ? parseFloat(longitude) : 116.39,
      timezone: timezone ? parseInt(timezone) : 8
    };

    if (hour !== undefined && hour !== null && hour !== '') {
      input.hour = parseInt(hour);
    }
    if (minute !== undefined && minute !== null && minute !== '') {
      input.minute = parseInt(minute);
    }
    if (calendarType === 'lunar') {
      input.calendarType = 'lunar';
    }

    const chart = calculateBaziChart(input);

    // 记录名字
    if (name) {
      chart.name = name;
    }

    res.json({ success: true, data: chart });
  } catch (err) {
    console.error('Bazi calculation error:', err);
    res.status(500).json({ error: '排盘计算失败: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Upon Star 服务已启动: http://localhost:${PORT}`);
  console.log(`八字排盘 API: POST /api/bazi`);
});
