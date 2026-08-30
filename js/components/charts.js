/* ==========================================================================
   COLLEGE AI ASSISTANT - CHARTS COMPONENT (CHART.JS)
   ========================================================================== */

const ChartsComponent = {
  renderAttendanceChart: function(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (window.Chart) {
      const existing = Chart.getChart(canvasId) || Chart.getChart(ctx);
      if (existing) existing.destroy();

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          datasets: [{
            label: 'Campus Attendance (%)',
            data: [94.5, 96.2, 95.8, 93.9, 96.8, 91.0],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            fill: true,
            tension: 0.4,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { min: 85, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  },

  renderDepartmentBarChart: function(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (window.Chart) {
      const existing = Chart.getChart(canvasId) || Chart.getChart(ctx);
      if (existing) existing.destroy();

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Computer Sci', 'Data Sci', 'Electrical', 'Biotech', 'Mechanical'],
          datasets: [{
            label: 'Students Enrolled',
            data: [850, 620, 740, 480, 760],
            backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }
};
