/* ==========================================================================
   COLLEGE AI ASSISTANT - PUBLIC VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

/* ==========================================================================
   COLLEGE AI ASSISTANT - PUBLIC VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const LandingCanvasEngine = {
  activeInstances: [],
  observer: null,
  currentQIndex: 0,
  autoRotateTimer: null,
  typewriterTimer: null,

  questionsData: [
    {
      question: "Can you explain Neural Networks simply?",
      answer: "Neural networks learn patterns from data and help make intelligent predictions."
    },
    {
      question: "Check tomorrow's assignment submission deadline",
      answer: "You have 1 deadline tomorrow: CS-401 Lab Report #3 is due at 11:59 PM in Room 304."
    },
    {
      question: "What are office hours for Prof. Vance?",
      answer: "Prof. Vance holds office hours on Tuesdays & Thursdays (2:00 PM – 4:00 PM) in Science Hall Room 304."
    }
  ],

  init: function() {
    this.destroy();
    
    const heroCanvas = document.getElementById('hero-neural-canvas');
    if (heroCanvas) {
      this.createNeuralCanvas(heroCanvas);
    }

    const boardCanvas = document.getElementById('hero-board-canvas');
    if (boardCanvas) {
      this.createBoardCanvas(boardCanvas);
    }

    const aboutCanvas = document.getElementById('about-network-canvas');
    if (aboutCanvas) {
      this.createNetworkCanvas(aboutCanvas);
    }

    const featuresCanvas = document.getElementById('features-particles-canvas');
    if (featuresCanvas) {
      this.createStreamCanvas(featuresCanvas);
    }

    if (!this.observer) {
      this.observer = new MutationObserver(() => {
        this.activeInstances.forEach(inst => inst.updateTheme());
      });
      this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    this.initClassroomInteractiveScene();
  },

  destroy: function() {
    this.activeInstances.forEach(inst => inst.stop());
    this.activeInstances = [];
    if (this.autoRotateTimer) clearInterval(this.autoRotateTimer);
    if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
  },

  createBoardCanvas: function(canvas) {
    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let isRunning = true;

    let width = (canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : 500);
    let height = (canvas.height = canvas.parentElement ? canvas.parentElement.offsetHeight : 400);

    const particles = Array.from({ length: 22 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1
    }));

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = 1 - dist / 100;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    this.activeInstances.push({
      stop: () => {
        isRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resize);
      },
      updateTheme: () => {}
    });
  },

  initClassroomInteractiveScene: function() {
    if (!document.getElementById('hero-student-question')) return;
    this.switchQuestion(0, false);

    if (this.autoRotateTimer) clearInterval(this.autoRotateTimer);
    this.autoRotateTimer = setInterval(() => {
      const nextIndex = (this.currentQIndex + 1) % this.questionsData.length;
      this.switchQuestion(nextIndex, false);
    }, 8500);
  },

  switchQuestion: function(index, userClicked = true) {
    if (userClicked && this.autoRotateTimer) {
      clearInterval(this.autoRotateTimer);
      this.autoRotateTimer = setInterval(() => {
        const nextIndex = (this.currentQIndex + 1) % this.questionsData.length;
        this.switchQuestion(nextIndex, false);
      }, 10000);
    }

    this.currentQIndex = index;
    const data = this.questionsData[index];

    // Update Question Chips
    const chips = document.querySelectorAll('.copilot-chip, .holo-chip, .question-chip');
    chips.forEach((c, idx) => {
      if (idx === index) c.classList.add('active');
      else c.classList.remove('active');
    });

    // Update Student Question text
    const qEl = document.getElementById('hero-student-question');
    if (qEl) {
      qEl.style.opacity = '0';
      setTimeout(() => {
        qEl.innerHTML = data.question;
        qEl.style.opacity = '1';
        qEl.style.transition = 'opacity 0.3s ease';
      }, 150);
    }

    // Show processing indicator and reveal typing response
    const procEl = document.getElementById('hero-ai-processing');
    const targetEl = document.getElementById('hero-typing-target');
    
    if (procEl) procEl.style.display = 'flex';
    if (targetEl) targetEl.innerHTML = '';

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    setTimeout(() => {
      if (procEl) procEl.style.display = 'none';
      if (targetEl) {
        targetEl.innerHTML = '';
        targetEl.style.opacity = '1';
        targetEl.style.transform = 'translateY(0)';
        
        let charIndex = 0;
        const text = data.answer;
        this.typewriterTimer = setInterval(() => {
          if (charIndex <= text.length) {
            targetEl.innerHTML = text.slice(0, charIndex);
            charIndex++;
          } else {
            clearInterval(this.typewriterTimer);
          }
        }, 22);
      }
    }, 550);
  },

  sendCustomQuestion: function() {
    const input = document.getElementById('hero-copilot-input');
    if (!input || !input.value.trim()) return;
    const userQuery = input.value.trim();
    input.value = '';

    if (this.autoRotateTimer) clearInterval(this.autoRotateTimer);

    // Deselect preset chips
    const chips = document.querySelectorAll('.copilot-chip, .holo-chip, .question-chip');
    chips.forEach(c => c.classList.remove('active'));

    const qEl = document.getElementById('hero-student-question');
    if (qEl) {
      qEl.style.opacity = '0';
      setTimeout(() => {
        qEl.textContent = userQuery;
        qEl.style.opacity = '1';
      }, 150);
    }

    const procEl = document.getElementById('hero-ai-processing');
    const targetEl = document.getElementById('hero-typing-target');
    if (procEl) procEl.style.display = 'flex';
    if (targetEl) targetEl.innerHTML = '';

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    setTimeout(() => {
      if (procEl) procEl.style.display = 'none';
      if (targetEl) {
        targetEl.innerHTML = '';
        targetEl.style.opacity = '1';
        
        const customReply = "I've analyzed your question: \"" + userQuery + "\". Based on campus resources, everything is synchronized and updated for your courses!";
        let charIndex = 0;
        this.typewriterTimer = setInterval(() => {
          if (charIndex <= customReply.length) {
            targetEl.innerHTML = customReply.slice(0, charIndex);
            charIndex++;
          } else {
            clearInterval(this.typewriterTimer);
          }
        }, 20);
      }
    }, 600);
  },

  createNeuralCanvas: function(canvas) {
    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let isRunning = true;

    const getThemeColors = () => {
      const isLight = (document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme')) === 'light';
      return {
        nodeColor: isLight ? 'rgba(59, 130, 246, 0.4)' : 'rgba(99, 102, 241, 0.45)',
        lineColor: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(99, 102, 241, 0.12)'
      };
    };

    let themeColors = getThemeColors();
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 14 : 36;
    const maxDist = isMobile ? 90 : 130;

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 2 + 1.2
    }));

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = themeColors.nodeColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = themeColors.lineColor;
            ctx.lineWidth = 1 - dist / maxDist;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    this.activeInstances.push({
      stop: () => {
        isRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resize);
      },
      updateTheme: () => {
        themeColors = getThemeColors();
        if (prefersReducedMotion) render();
      }
    });
  },

  createNetworkCanvas: function(canvas) {
    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let isRunning = true;

    const getThemeColors = () => {
      const isLight = (document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme')) === 'light';
      return {
        nodeColor: isLight ? 'rgba(37, 99, 235, 0.35)' : 'rgba(139, 92, 246, 0.4)',
        lineColor: isLight ? 'rgba(37, 99, 235, 0.07)' : 'rgba(139, 92, 246, 0.1)'
      };
    };

    let themeColors = getThemeColors();
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 10 : 25;
    const maxDist = 140;

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2.2 + 1
    }));

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = themeColors.nodeColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = themeColors.lineColor;
            ctx.lineWidth = 0.8 * (1 - dist / maxDist);
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    this.activeInstances.push({
      stop: () => {
        isRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resize);
      },
      updateTheme: () => {
        themeColors = getThemeColors();
        if (prefersReducedMotion) render();
      }
    });
  },

  createStreamCanvas: function(canvas) {
    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let isRunning = true;

    const getThemeColors = () => {
      const isLight = (document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme')) === 'light';
      return {
        color: isLight ? 'rgba(59, 130, 246, 0.25)' : 'rgba(99, 102, 241, 0.3)'
      };
    };

    let themeColors = getThemeColors();
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 12 : 30;

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: Math.random() * 0.4 + 0.2,
      radius: Math.random() * 1.5 + 1
    }));

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.y += p.vy;
          if (p.y > height) {
            p.y = 0;
            p.x = Math.random() * width;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = themeColors.color;
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    this.activeInstances.push({
      stop: () => {
        isRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resize);
      },
      updateTheme: () => {
        themeColors = getThemeColors();
        if (prefersReducedMotion) render();
      }
    });
  }
};

const PublicViews = {
  selectedRole: 'student',

  // 1. Home / Single-Page Scrolling Landing Page
  renderHome: function() {
    return `
      <div id="landing-container">
        <!-- 1. HERO SECTION -->
        <section id="home" class="landing-section-full landing-hero" style="position: relative; padding: 7rem 2rem 5rem 2rem; overflow: hidden;">
          <canvas id="hero-neural-canvas" class="landing-canvas-bg"></canvas>
          <div class="hero-ambient-glow"></div>

          <div class="landing-hero-content" style="position: relative; z-index: 1; max-width: 820px; margin: 0 auto; text-align: center;">
            <span class="badge badge-primary" style="margin-bottom: 1.25rem; font-size: 0.8rem; letter-spacing: 0.06em;">
              <i data-lucide="sparkles"></i> NEXT-GEN CAMPUS AI PLATFORM
            </span>
            <h1 class="hero-title" style="font-size: 3.5rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1.5rem; line-height: 1.15;">
              Empowering Education with Intelligent <span class="gradient-text">AI Copilots</span>
            </h1>
            <p style="font-size: 1.18rem; color: var(--text-muted); margin-bottom: 2.5rem; line-height: 1.75; max-width: 660px; margin-left: auto; margin-right: auto;">
              A unified responsive AI platform connecting Students, Faculty, and Campus Administrators with automated schedules, AI tutoring, grading assistants, and real-time campus management.
            </p>
            <div class="hero-actions" style="display: flex; gap: 1.25rem; align-items: center; justify-content: center; flex-wrap: wrap;">
              <a href="#/role-selection" class="btn btn-primary btn-lg">
                <i data-lucide="sparkles"></i> Launch Web Portals
              </a>
              <a href="#features" class="btn btn-secondary btn-lg" onclick="App.scrollToSection('features'); return false;">
                <i data-lucide="arrow-down"></i> Explore Features
              </a>
              <a href="#/login" class="btn btn-outline btn-lg">
                <i data-lucide="log-in"></i> Sign In
              </a>
            </div>
          </div>
        </section>

        <!-- 2. PLATFORM OVERVIEW / STATS SECTION -->
        <section class="landing-section" style="padding-top: 2rem; padding-bottom: 4rem;">
          <div style="background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 2.5rem 3rem; box-shadow: var(--shadow-sm);">
            <div class="grid-cols-3" style="align-items: center; text-align: center; gap: 2rem;">
              <div style="padding: 1rem;">
                <strong style="display: block; font-size: 2.75rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em;">99.9%</strong>
                <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem; display: block;">Platform Uptime</span>
              </div>
              <div style="padding: 1rem; border-left: 1px solid var(--border-color); border-right: 1px solid var(--border-color);">
                <strong style="display: block; font-size: 2.75rem; font-weight: 800; color: var(--primary-400); letter-spacing: -0.02em;">50+</strong>
                <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem; display: block;">Academic Depts</span>
              </div>
              <div style="padding: 1rem;">
                <strong style="display: block; font-size: 2.75rem; font-weight: 800; color: var(--status-success); letter-spacing: -0.02em;">24/7</strong>
                <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem; display: block;">AI Study Companion</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. ABOUT THE PLATFORM & OUR VISION SECTION -->
        <section id="about" class="landing-section" style="position: relative; padding: 6.5rem 2rem; overflow: hidden;">
          <canvas id="about-network-canvas" class="landing-canvas-bg"></canvas>
          <div style="position: relative; z-index: 1;">
            <div style="text-align: center; max-width: 850px; margin: 0 auto 4.5rem auto;">
              <span class="badge badge-primary" style="margin-bottom: 1.25rem; font-size: 0.8rem; letter-spacing: 0.06em;">ABOUT THE PLATFORM</span>
              <h2 style="font-size: 2.75rem; font-weight: 800; margin-bottom: 1.25rem; letter-spacing: -0.02em;">Transforming Campus Life with Intelligent AI</h2>
              <p style="font-size: 1.15rem; color: var(--text-muted); line-height: 1.8;">
                College AI Assistant is a unified digital platform designed to connect students, faculty, and administrators through intelligent AI-powered tools. It simplifies academic support, campus communication, daily activities, and college management in one secure platform.
              </p>
            </div>

            <!-- Our Vision Card -->
            <div class="card glass-panel" style="max-width: 1000px; margin: 0 auto; padding: 3.5rem 3rem; border-color: rgba(129, 140, 248, 0.25); background: linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(139, 92, 246, 0.03) 100%);">
              <div style="display: flex; gap: 2.5rem; align-items: flex-start; flex-wrap: wrap;">
                <div class="stat-icon" style="width: 64px; height: 64px; font-size: 2rem; background: rgba(99, 102, 241, 0.15); color: #818cf8; flex-shrink: 0; border-radius: var(--radius-md);">
                  <i data-lucide="eye"></i>
                </div>
                <div style="flex: 1; min-width: 280px;">
                  <span class="badge badge-primary" style="margin-bottom: 0.75rem;">OUR VISION</span>
                  <h3 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main);">Our Vision</h3>
                  <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-400); margin-bottom: 1rem;">Smarter Campus. Better Experience.</h4>
                  <p style="color: var(--text-muted); font-size: 1.08rem; line-height: 1.8;">
                    Create a connected and intelligent campus where students get faster academic support, faculty can manage their work efficiently, and administrators can make better decisions using real-time campus information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. WHAT WE PROVIDE SECTION -->
        <section class="landing-section" style="position: relative; padding: 6.5rem 2rem; overflow: hidden;">
          <div class="vision-particles-bg"></div>
          <div style="position: relative; z-index: 1;">
            <div style="text-align: center; max-width: 850px; margin: 0 auto 4.5rem auto;">
              <span class="badge badge-primary" style="margin-bottom: 1.25rem; font-size: 0.8rem; letter-spacing: 0.06em;">WHAT WE PROVIDE</span>
              <h2 style="font-size: 2.75rem; font-weight: 800; margin-bottom: 1.25rem; letter-spacing: -0.02em;">Tailored Environments for Campus Users</h2>
              <p style="font-size: 1.15rem; color: var(--text-muted); line-height: 1.8;">
                Dedicated features crafted specifically for Students, Faculty & Staff, and Institutional Administrators.
              </p>
            </div>

            <div class="grid-cols-3" style="gap: 2rem;">
              <!-- For Students -->
              <div class="card card-interactive" style="display: flex; flex-direction: column; justify-content: space-between; padding: 2.25rem; border-top: 4px solid #3b82f6;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                    <span style="font-size: 1.75rem;">🎓</span>
                    <h3 style="font-size: 1.4rem; font-weight: 800;">For Students</h3>
                  </div>
                  <p style="color: var(--text-muted); font-size: 0.98rem; line-height: 1.7; margin-bottom: 2rem;">
                    AI-powered academic assistance, timetables, events, notifications, college information, and a safe anonymous campus community.
                  </p>
                </div>
                <button onclick="App.switchPortal('student')" class="btn btn-outline btn-sm" style="width: 100%;">
                  Explore Student View <i data-lucide="arrow-right"></i>
                </button>
              </div>

              <!-- For Faculty & Staff -->
              <div class="card card-interactive" style="display: flex; flex-direction: column; justify-content: space-between; padding: 2.25rem; border-top: 4px solid #10b981;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                    <span style="font-size: 1.75rem;">👨‍🏫</span>
                    <h3 style="font-size: 1.4rem; font-weight: 800;">For Faculty & Staff</h3>
                  </div>
                  <p style="color: var(--text-muted); font-size: 0.98rem; line-height: 1.7; margin-bottom: 2rem;">
                    AI teaching assistance, task management, class information, announcements, and simplified academic workflows.
                  </p>
                </div>
                <button onclick="App.switchPortal('staff')" class="btn btn-outline btn-sm" style="width: 100%;">
                  Explore Staff View <i data-lucide="arrow-right"></i>
                </button>
              </div>

              <!-- For Administrators -->
              <div class="card card-interactive" style="display: flex; flex-direction: column; justify-content: space-between; padding: 2.25rem; border-top: 4px solid #f59e0b;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                    <span style="font-size: 1.75rem;">🏫</span>
                    <h3 style="font-size: 1.4rem; font-weight: 800;">For Administrators</h3>
                  </div>
                  <p style="color: var(--text-muted); font-size: 0.98rem; line-height: 1.7; margin-bottom: 2rem;">
                    Centralized campus management, student and staff records, announcements, events, reports, and useful campus insights.
                  </p>
                </div>
                <button onclick="App.switchPortal('admin')" class="btn btn-outline btn-sm" style="width: 100%;">
                  Explore Admin View <i data-lucide="arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. AI-POWERED CAMPUS SECTION -->
        <section class="landing-section" style="position: relative; padding: 6.5rem 2rem; overflow: hidden;">
          <div class="ai-grid-bg"></div>
          <div style="position: relative; z-index: 1;">
            <div style="background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 4rem 3rem; position: relative; overflow: hidden;">
              <div style="max-width: 800px; margin: 0 auto; text-align: center;">
                <span class="badge badge-primary" style="margin-bottom: 1.25rem; font-size: 0.8rem; letter-spacing: 0.06em;">INTELLIGENT INFRASTRUCTURE</span>
                <h2 style="font-size: 2.75rem; font-weight: 800; margin-bottom: 1.25rem; letter-spacing: -0.02em;">AI-Powered Campus</h2>
                <p style="font-size: 1.15rem; color: var(--text-muted); line-height: 1.8; margin-bottom: 3rem;">
                  Our platform uses AI to provide intelligent assistance while keeping users connected to the information and services they need throughout their college journey.
                </p>

                <div class="grid-cols-3" style="gap: 1.75rem; text-align: left;">
                  <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <div class="stat-icon" style="width: 44px; height: 44px; font-size: 1.25rem; margin-bottom: 1rem; background: rgba(99, 102, 241, 0.15); color: #818cf8;">
                      <i data-lucide="cpu"></i>
                    </div>
                    <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">24/7 Context Intelligence</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">Instant contextual answers derived from verified course syllabi and campus directories.</p>
                  </div>

                  <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <div class="stat-icon" style="width: 44px; height: 44px; font-size: 1.25rem; margin-bottom: 1rem; background: rgba(6, 182, 212, 0.15); color: #06b6d4;">
                      <i data-lucide="zap"></i>
                    </div>
                    <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">Automated Workflows</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">Automated lesson plan drafting, rubric feedback generation, and timetable conflict checks.</p>
                  </div>

                  <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <div class="stat-icon" style="width: 44px; height: 44px; font-size: 1.25rem; margin-bottom: 1rem; background: rgba(16, 185, 129, 0.15); color: #10b981;">
                      <i data-lucide="shield-alert"></i>
                    </div>
                    <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">AI Moderation Engine</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">Proactive safety filters detecting toxicity and duplicate posts in anonymous community forums.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 6. SECURE & ROLE-BASED SECTION -->
        <section class="landing-section" style="position: relative; padding: 6.5rem 2rem; overflow: hidden;">
          <div class="security-bg"></div>
          <div style="position: relative; z-index: 1;">
            <div style="text-align: center; max-width: 850px; margin: 0 auto 4.5rem auto;">
              <span class="badge badge-primary" style="margin-bottom: 1.25rem; font-size: 0.8rem; letter-spacing: 0.06em;">ROLE-BASED ACCESS CONTROL</span>
              <h2 style="font-size: 2.75rem; font-weight: 800; margin-bottom: 1.25rem; letter-spacing: -0.02em;">Secure & Role-Based</h2>
              <p style="font-size: 1.15rem; color: var(--text-muted); line-height: 1.8;">
                Every user gets a dedicated experience based on their role. Student, Staff, and Administrator portals provide relevant features while maintaining controlled access to campus information.
              </p>
            </div>

            <div class="grid-cols-3" style="gap: 2rem;">
              <!-- Student Highlight -->
              <div class="card glass-panel" style="padding: 2.25rem;">
                <div class="badge badge-student" style="margin-bottom: 1.25rem;">STUDENT PORTAL</div>
                <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem;">Student Workspaces</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.7;">
                  Tailored for learning with AI homework copilots, personalized timetables, event calendars, GPA tracking, and anonymous community access.
                </p>
              </div>

              <!-- Staff Highlight -->
              <div class="card glass-panel" style="padding: 2.25rem;">
                <div class="badge badge-staff" style="margin-bottom: 1.25rem;">STAFF PORTAL</div>
                <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem;">Faculty Management</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.7;">
                  Optimized for educators with AI lesson builders, assignment feedback generators, Kanban task boards, and attendance logs.
                </p>
              </div>

              <!-- Administrator Highlight -->
              <div class="card glass-panel" style="padding: 2.25rem;">
                <div class="badge badge-admin" style="margin-bottom: 1.25rem;">ADMIN PORTAL</div>
                <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem;">Admin Control Center</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.7;">
                  Engineered for leadership with master student/staff rosters, campus-wide analytics, department management, and security controls.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- 7. COMPREHENSIVE PLATFORM FEATURES SECTION -->
        <section id="features" class="landing-section" style="position: relative; padding: 7rem 2rem; overflow: hidden;">
          <canvas id="features-particles-canvas" class="landing-canvas-bg"></canvas>
          <div style="position: relative; z-index: 1;">
            <div style="text-align: center; max-width: 850px; margin: 0 auto 5rem auto;">
              <span class="badge badge-primary" style="margin-bottom: 1.25rem; font-size: 0.8rem; letter-spacing: 0.06em;">PLATFORM FEATURES</span>
              <h2 style="font-size: 2.75rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.02em;">Comprehensive Platform Features</h2>
              <p style="font-size: 1.18rem; color: var(--text-muted);">Everything your campus needs in one intelligent platform.</p>
            </div>

            <div class="grid-cols-3" style="gap: 2rem;">
              <!-- 1. AI Academic Assistant -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(99, 102, 241, 0.15); color: #818cf8;">
                  <i data-lucide="bot"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">1. 🤖 AI Academic Assistant</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Get intelligent, real-time assistance for academic questions, explanations, study support, and everyday college queries.
                </p>
              </div>

              <!-- 2. Smart Announcements & Notifications -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(6, 182, 212, 0.15); color: #06b6d4;">
                  <i data-lucide="megaphone"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">2. 📢 Smart Announcements & Notifications</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Publish targeted campus announcements and automatically notify Students, Staff, or everyone based on the selected audience.
                </p>
              </div>

              <!-- 3. Anonymous Campus Community -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(16, 185, 129, 0.15); color: #10b981;">
                  <i data-lucide="user-check"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">3. 🕵️ Anonymous Campus Community</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Share campus concerns, academic discussions, feedback, and support issues anonymously while protecting student identity.
                </p>
              </div>

              <!-- 4. Trending Campus Issues -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
                  <i data-lucide="flame"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">4. 🔥 Trending Campus Issues</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Discover the most discussed campus issues and community topics through a dedicated trending view.
                </p>
              </div>

              <!-- 5. AI Community Moderation -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(239, 68, 68, 0.15); color: #f87171;">
                  <i data-lucide="shield-check"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">5. 🛡️ AI Community Moderation</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Automatically identify potentially toxic, duplicate, or inappropriate community content to support a safer campus environment.
                </p>
              </div>

              <!-- 6. Smart Timetable & Events -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(139, 92, 246, 0.15); color: #a78bfa;">
                  <i data-lucide="calendar"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">6. 📅 Smart Timetable & Events</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Access class schedules, upcoming events, and important campus activities from one place.
                </p>
              </div>

              <!-- 7. Faculty & Staff Management -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(59, 130, 246, 0.15); color: #60a5fa;">
                  <i data-lucide="briefcase"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">7. 👨‍🏫 Faculty & Staff Management</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Manage faculty information, assigned classes, tasks, and academic responsibilities efficiently.
                </p>
              </div>

              <!-- 8. Real-Time Activity Notifications -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(236, 72, 153, 0.15); color: #f472b6;">
                  <i data-lucide="bell"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">8. 🔔 Real-Time Activity Notifications</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Keep users updated about announcements, events, academic activities, and important system updates.
                </p>
              </div>

              <!-- 9. Centralized College Information -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(16, 185, 129, 0.15); color: #34d399;">
                  <i data-lucide="building"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">9. 🏫 Centralized College Information</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Access important academic and institutional information through a unified campus platform.
                </p>
              </div>

              <!-- 10. Role-Based Portals -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(245, 158, 11, 0.15); color: #fbbf24;">
                  <i data-lucide="users"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">10. 👥 Role-Based Portals</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Dedicated experiences for Students, Staff, and Administrators, with features tailored to each role.
                </p>
              </div>

              <!-- 11. Campus Management & Analytics -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(99, 102, 241, 0.15); color: #818cf8;">
                  <i data-lucide="bar-chart-3"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">11. 📊 Campus Management & Analytics</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Help administrators manage students, staff, departments, announcements, events, attendance, and reports.
                </p>
              </div>

              <!-- 12. Secure Role-Based Access -->
              <div class="card card-interactive" style="padding: 2rem;">
                <div class="stat-icon" style="width: 50px; height: 50px; font-size: 1.4rem; margin-bottom: 1.25rem; background: rgba(16, 185, 129, 0.15); color: #10b981;">
                  <i data-lucide="lock"></i>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">12. 🔐 Secure Role-Based Access</h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.65;">
                  Protect campus information through controlled access based on user roles and permissions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- 8. CONTACT SECTION -->
        <section id="contact" class="landing-section" style="position: relative; padding: 6.5rem 2rem; overflow: hidden;">
          <div style="position: relative; z-index: 1;">
            <div style="text-align: center; max-width: 850px; margin: 0 auto 4.5rem auto;">
              <span class="badge badge-primary" style="margin-bottom: 1.25rem; font-size: 0.8rem; letter-spacing: 0.06em;">GET IN TOUCH</span>
              <h2 style="font-size: 2.75rem; font-weight: 800; margin-bottom: 1.25rem; letter-spacing: -0.02em;">Contact Campus Support & Institutional Sales</h2>
              <p style="color: var(--text-muted); font-size: 1.15rem;">Have questions about onboarding your institution or need technical assistance?</p>
            </div>

            <div class="grid-cols-2" style="gap: 2.5rem;">
              <div>
                <h3 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 1rem;">We're Here to Help</h3>
                <p style="color: var(--text-muted); margin-bottom: 2.5rem; line-height: 1.8; font-size: 1.05rem;">
                  Reach out to our campus IT support team or institution deployment specialists. We provide 24/7 technical assistance for students, faculty, and administrative teams.
                </p>

                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                  <div style="display: flex; gap: 1.25rem; align-items: center;">
                    <div class="stat-icon" style="width: 48px; height: 48px; font-size: 1.3rem; flex-shrink: 0;"><i data-lucide="mail"></i></div>
                    <div>
                      <strong style="display: block; font-size: 1rem;">Email Support</strong>
                      <span style="color: var(--text-muted); font-size: 0.95rem;">support@collegeai.edu</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 1.25rem; align-items: center;">
                    <div class="stat-icon" style="width: 48px; height: 48px; font-size: 1.3rem; flex-shrink: 0;"><i data-lucide="phone"></i></div>
                    <div>
                      <strong style="display: block; font-size: 1rem;">Campus Helpline</strong>
                      <span style="color: var(--text-muted); font-size: 0.95rem;">+1 (800) 555-COLLEGE</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 1.25rem; align-items: center;">
                    <div class="stat-icon" style="width: 48px; height: 48px; font-size: 1.3rem; flex-shrink: 0;"><i data-lucide="map-pin"></i></div>
                    <div>
                      <strong style="display: block; font-size: 1rem;">Location</strong>
                      <span style="color: var(--text-muted); font-size: 0.95rem;">Innovation Quad, Building A, Suite 400</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card glass-panel" style="padding: 2.5rem;">
                <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 1.5rem;">Send a Message</h3>
                <form onsubmit="event.preventDefault(); alert('Message submitted successfully! Our campus team will respond shortly.');">
                  <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="input-field" placeholder="John Doe" required>
                  </div>
                  <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label">Institutional Email</label>
                    <input type="email" class="input-field" placeholder="john@university.edu" required>
                  </div>
                  <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label">Role</label>
                    <select class="input-field select-field">
                      <option value="student">Student</option>
                      <option value="faculty">Faculty / Staff</option>
                      <option value="admin">Administrator</option>
                      <option value="other">Other / Prospective</option>
                    </select>
                  </div>
                  <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label class="form-label">Message</label>
                    <textarea class="input-field" rows="4" placeholder="How can we assist your institution?" required></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i data-lucide="send"></i> Submit Inquiry
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <!-- 9. FINAL CTA SECTION -->
        <section class="landing-section" style="position: relative; padding: 6.5rem 2rem 8rem 2rem; overflow: hidden;">
          <div class="cta-ambient-glow"></div>
          <div style="position: relative; z-index: 1;">
            <div style="background: linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: var(--radius-lg); padding: 4.5rem 2rem; text-align: center; max-width: 1050px; margin: 0 auto; box-shadow: var(--shadow-md);">
              <span class="badge badge-primary" style="margin-bottom: 1.25rem; font-size: 0.8rem; letter-spacing: 0.06em;">GET STARTED TODAY</span>
              <h2 style="font-size: 3rem; font-weight: 800; margin-bottom: 1.25rem; letter-spacing: -0.02em;">One Platform. Three Roles. Smarter Campus.</h2>
              <p style="font-size: 1.2rem; color: var(--text-muted); max-width: 650px; margin: 0 auto 2.5rem auto; line-height: 1.7;">
                Connect your campus with intelligent tools built for Students, Staff, and Administrators.
              </p>
              <div style="display: flex; gap: 1.25rem; justify-content: center; align-items: center; flex-wrap: wrap;">
                <a href="#/role-selection" class="btn btn-primary btn-lg">
                  <i data-lucide="sparkles"></i> Launch Web Portals
                </a>
                <a href="#features" class="btn btn-secondary btn-lg" onclick="App.scrollToSection('features'); return false;">
                  <i data-lucide="arrow-down"></i> Explore Features
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- 10. FOOTER -->
        <footer class="landing-footer">
          <div class="landing-footer-grid">
            <div>
              <div class="navbar-brand" style="margin-bottom: 1rem;">
                <div class="brand-icon"><i data-lucide="bot"></i></div>
                <span>College <span class="portal-gradient-text">AI Assistant</span></span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; max-width: 340px; margin-bottom: 1.25rem;">
                Next-generation intelligent campus web application providing tailored AI assistants, automated schedules, and campus analytics.
              </p>
              <div style="display: flex; gap: 0.5rem; align-items: center; color: var(--status-success); font-size: 0.82rem; font-weight: 600;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--status-success); display: inline-block;"></span>
                All Systems Operational
              </div>
            </div>

            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-main);">Navigation</h4>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem; color: var(--text-muted);">
                <li><a href="#/home" onclick="App.scrollToSection('home'); return false;">Home</a></li>
                <li><a href="#/about" onclick="App.scrollToSection('about'); return false;">About</a></li>
                <li><a href="#/features" onclick="App.scrollToSection('features'); return false;">Features</a></li>
                <li><a href="#/contact" onclick="App.scrollToSection('contact'); return false;">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-main);">Portals</h4>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem; color: var(--text-muted);">
                <li><a href="javascript:void(0)" onclick="App.switchPortal('student')">Student Portal</a></li>
                <li><a href="javascript:void(0)" onclick="App.switchPortal('staff')">Staff & Faculty Portal</a></li>
                <li><a href="javascript:void(0)" onclick="App.switchPortal('admin')">Administration Portal</a></li>
                <li><a href="#/role-selection">Portal Selector</a></li>
              </ul>
            </div>

            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-main);">Account</h4>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem; color: var(--text-muted);">
                <li><a href="#/login">Sign In</a></li>
                <li><a href="#/login">Institutional SSO</a></li>
                <li><a href="#/contact" onclick="App.scrollToSection('contact'); return false;">Help Desk</a></li>
              </ul>
            </div>
          </div>

          <div class="landing-footer-bottom">
            <span>&copy; 2026 College AI Assistant Platform. All rights reserved.</span>
            <span>Empowering Campus Intelligence</span>
          </div>
        </footer>
      </div>
    `;
  },

  // Legacy route handlers delegate to renderHome for single-page scrolling experience
  renderAbout: function() {
    return this.renderHome();
  },

  renderFeatures: function() {
    return this.renderHome();
  },

  renderContact: function() {
    return this.renderHome();
  },

  // 5. Login Page (FUNCTIONAL AUTH SUBMIT)
  renderLogin: function() {
    return `
      <div style="min-height: calc(100vh - var(--navbar-height)); display: flex; align-items: center; justify-content: center; padding: 2rem;">
        <div class="card glass-panel" style="width: 100%; max-width: 440px; padding: 2.5rem;">
          <div style="text-align: center; margin-bottom: 2rem;">
            <div class="brand-icon" style="margin: 0 auto 1rem auto; width: 48px; height: 48px;">
              <i data-lucide="bot"></i>
            </div>
            <h2 style="font-size: 1.75rem; font-weight: 800;">Welcome Back</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">Sign in to your College AI Assistant account</p>
          </div>

          <div class="tabs-nav" style="justify-content: center; margin-bottom: 1.5rem;">
            <button class="tab-btn active" onclick="PublicViews.switchLoginRole('student', this)">Student</button>
            <button class="tab-btn" onclick="PublicViews.switchLoginRole('staff', this)">Staff</button>
            <button class="tab-btn" onclick="PublicViews.switchLoginRole('admin', this)">Admin</button>
          </div>

          <form onsubmit="event.preventDefault(); PublicViews.handleLoginSubmit();">
            <div class="form-group">
              <label class="form-label">Institutional ID / Email</label>
              <div class="input-group">
                <i data-lucide="user" class="input-icon"></i>
                <input type="text" id="login-id" class="input-field" value="STU-2026-894" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-group">
                <i data-lucide="lock" class="input-icon"></i>
                <input type="password" id="login-pass" class="input-field" value="••••••••••••" required>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); cursor: pointer;">
                <input type="checkbox" checked> Remember me
              </label>
              <a href="javascript:void(0)" onclick="alert('Password reset instructions sent to your institutional email.')" style="color: var(--primary-400);">Forgot password?</a>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.85rem;">
              Sign In to Portal <i data-lucide="arrow-right"></i>
            </button>
          </form>
        </div>
      </div>
    `;
  },

  switchLoginRole: function(role, btn) {
    this.selectedRole = role;
    document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const idInput = document.getElementById('login-id');
    if (idInput) {
      if (role === 'student') idInput.value = "STU-2026-894";
      else if (role === 'staff') idInput.value = "STF-201-VANCE";
      else if (role === 'admin') idInput.value = "ADM-001-SYSTEM";
    }
  },

  handleLoginSubmit: function() {
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-pass').value;

    if (Auth.login(this.selectedRole, id, pass)) {
      App.switchPortal(this.selectedRole);
    }
  },

  // 6. Role Selection Page
  renderRoleSelection: function() {
    return `
      <div style="padding: 4rem 2rem; max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 3.5rem;">
          <span class="badge badge-primary" style="margin-bottom: 1rem;">Portal Selector</span>
          <h1 style="font-size: 2.75rem; font-weight: 800;">Choose Your Web Portal Experience</h1>
          <p style="color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem;">Select an institutional role to explore tailored features & dashboards.</p>
        </div>

        <div class="grid-cols-3">
          <!-- Student Card -->
          <div class="card card-interactive portal-card-student" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #2563eb;">
            <div>
              <div class="badge badge-student" style="margin-bottom: 1rem;">Student View</div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem;">Student Portal</h2>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
                Access course timetables, AI homework assistance, notifications, upcoming campus events, academic records, and college info.
              </p>
            </div>
            <button class="btn portal-btn-student" onclick="App.switchPortal('student')" style="background: #2563eb; color: #ffffff; border: none; width: 100%;">
              Enter Student Portal <i data-lucide="arrow-right"></i>
            </button>
          </div>

          <!-- Staff Card -->
          <div class="card card-interactive portal-card-staff" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #059669;">
            <div>
              <div class="badge badge-staff" style="margin-bottom: 1rem;">Faculty & Staff</div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem;">Staff & Management Portal</h2>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
                Manage assigned classes, use AI lesson planning tools, track tasks on Kanban boards, approve leave requests, and view syllabus status.
              </p>
            </div>
            <button class="btn portal-btn-staff" onclick="App.switchPortal('staff')" style="background: #059669; color: #ffffff; border: none; width: 100%;">
              Enter Staff Portal <i data-lucide="arrow-right"></i>
            </button>
          </div>

          <!-- Admin Card -->
          <div class="card card-interactive portal-card-admin" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #d97706;">
            <div>
              <div class="badge badge-admin" style="margin-bottom: 1rem;">System Administrator</div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem;">Administration Portal</h2>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
                Oversee campus-wide analytics, manage student & staff master directories, publish announcements, manage departments, and export reports.
              </p>
            </div>
            <button class="btn portal-btn-admin" onclick="App.switchPortal('admin')" style="background: #d97706; color: #ffffff; border: none; width: 100%;">
              Enter Admin Portal <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
