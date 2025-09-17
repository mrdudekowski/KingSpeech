/**
 * Aurora Background Effect
 * Адаптированная версия React Aurora для ванильного JavaScript
 */

class AuroraBackground {
    constructor(container, options = {}) {
        this.container = container;
        
        // Определяем цвета в зависимости от темы
        const isDark = document.documentElement.classList.contains('dark');
        const defaultColors = isDark 
            ? ["#FF8C42", "#FF7A33", "#E56F22"] // Более мягкие оранжевые оттенки для темной темы
            : ["#FFB366", "#FFE8D6", "#FFEDE0"]; // Мягкий оранжевый + теплые оттенки для светлой темы
        
        this.options = {
            colorStops: options.colorStops || defaultColors,
            blend: options.blend || 0.2, // Очень мягкий blend для комфортного просмотра
            amplitude: options.amplitude || 0.8, // Уменьшаем амплитуду
            speed: options.speed || 0.2, // Замедляем анимацию
            opacity: options.opacity || 0.4, // Мягкая прозрачность для комфортного просмотра
            ...options
        };
        
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.mesh = null;
        this.animateId = null;
        
        this.init();
    }
    
    init() {
        console.log('🔍 AuroraBackground.init() called');
        
        if (!this.container) {
            console.error('❌ Container is null or undefined');
            return;
        }
        
        console.log('✅ Container found:', this.container);
        console.log('🎨 Aurora colors:', this.options.colorStops);
        
        // Создаем canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '2'; // Выше контейнера
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.background = 'transparent';
        
        // Добавляем отладочную информацию
        console.log('🔍 Canvas styles:', {
            position: this.canvas.style.position,
            top: this.canvas.style.top,
            left: this.canvas.style.left,
            width: this.canvas.style.width,
            height: this.canvas.style.height,
            zIndex: this.canvas.style.zIndex
        });
        
        console.log('✅ Canvas created:', this.canvas);
        
        // Инициализируем WebGL
        this.gl = this.canvas.getContext('webgl2', {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true
        });
        
        if (!this.gl) {
            console.warn('❌ WebGL2 не поддерживается, пробуем WebGL1...');
            this.gl = this.canvas.getContext('webgl', {
                alpha: true,
                premultipliedAlpha: true,
                antialias: true
            });
            
            if (!this.gl) {
                console.warn('❌ WebGL не поддерживается, Aurora эффект отключен');
                return;
            }
        }
        
        console.log('✅ WebGL2 context created:', this.gl);
        
        this.setupGL();
        this.createShaders();
        this.createGeometry();
        
        // Проверяем успешность настройки программы
        if (!this.setupProgram()) {
            console.error('❌ Failed to setup WebGL program');
            return;
        }
        
        // Принудительно устанавливаем размеры контейнера
        this.container.style.width = '100vw';
        this.container.style.height = '100vh';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.right = '0';
        this.container.style.bottom = '0';
        
        this.resize();
        this.startAnimation();
        
        // Добавляем canvas в контейнер
        this.container.appendChild(this.canvas);
        
        // Убираем тестовый div - он больше не нужен
        console.log('✅ Aurora container setup completed');
        
        // Обработчик изменения размера
        window.addEventListener('resize', () => this.resize());
    }
    
    setupGL() {
        const gl = this.gl;
        
        // Настройка очистки
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Настройка blending для прозрачности
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Отключаем depth test для 2D рендеринга
        gl.disable(gl.DEPTH_TEST);
        
        // Устанавливаем прозрачный фон для canvas
        this.canvas.style.backgroundColor = 'transparent';
        
        console.log('✅ WebGL setup completed');
    }
    
    createShaders() {
        this.vertexShader = `#version 300 es
            in vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;
        
        this.fragmentShader = `#version 300 es
            precision highp float;
            
            uniform float uTime;
            uniform vec3 uColorStops[3];
            uniform vec2 uResolution;
            uniform float uOpacity;
            
            out vec4 fragColor;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / uResolution;
                
                // Простой тестовый эффект - градиент с анимацией
                vec3 color1 = uColorStops[0];
                vec3 color2 = uColorStops[1];
                vec3 color3 = uColorStops[2];
                
                // Создаем простой градиент
                vec3 gradient = mix(color1, color2, uv.x);
                gradient = mix(gradient, color3, uv.y);
                
                // Добавляем простую анимацию
                float wave = sin(uv.x * 5.0 + uTime * 0.5) * 0.5 + 0.5;
                float wave2 = sin(uv.y * 3.0 + uTime * 0.3) * 0.5 + 0.5;
                
                vec3 finalColor = gradient * wave * wave2;
                float alpha = uOpacity * (wave * 0.5 + 0.5);
                
                fragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    createGeometry() {
        const gl = this.gl;
        
        // Создаем треугольник для покрытия всего экрана
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1
        ]);
        
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }
    
    setupProgram() {
        const gl = this.gl;
        
        // Создаем шейдеры
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vertexShader);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, this.fragmentShader);
        gl.compileShader(fragmentShader);
        
        // Проверяем компиляцию
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Ошибка компиляции vertex shader:', gl.getShaderInfoLog(vertexShader));
            return false;
        }
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Ошибка компиляции fragment shader:', gl.getShaderInfoLog(fragmentShader));
            return false;
        }
        
        // Создаем программу
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Ошибка линковки программы:', gl.getProgramInfoLog(this.program));
            return false;
        }
        
        // Используем программу перед получением uniform locations
        gl.useProgram(this.program);
        
        // Получаем uniform locations (убираем uAmplitude)
        this.uniforms = {
            uTime: gl.getUniformLocation(this.program, 'uTime'),
            uColorStops: gl.getUniformLocation(this.program, 'uColorStops'),
            uResolution: gl.getUniformLocation(this.program, 'uResolution'),
            uOpacity: gl.getUniformLocation(this.program, 'uOpacity')
        };
        
        // Получаем attribute location
        this.attributes = {
            position: gl.getAttribLocation(this.program, 'position')
        };
        
        // Проверяем uniform locations
        console.log('🔍 Uniform locations:', {
            uTime: this.uniforms.uTime,
            uColorStops: this.uniforms.uColorStops,
            uResolution: this.uniforms.uResolution,
            uOpacity: this.uniforms.uOpacity
        });
        
        console.log('✅ WebGL program setup completed');
        return true;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [0, 0, 0];
    }
    
    resize() {
        if (!this.container || !this.canvas) return;
        
        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;
        
        // Отладочная информация только при необходимости
        
        this.canvas.width = width * window.devicePixelRatio;
        this.canvas.height = height * window.devicePixelRatio;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Устанавливаем uniform переменные только если программа активна
        if (this.uniforms.uResolution && this.program) {
            this.gl.useProgram(this.program);
            this.gl.uniform2f(this.uniforms.uResolution, width, height);
        }
        
        // Canvas resized successfully
    }
    
    startAnimation() {
        let frameCount = 0;
        const animate = (time) => {
            this.animateId = requestAnimationFrame(animate);
            frameCount++;
            
            if (!this.gl || !this.program) {
                console.warn('❌ WebGL or program not ready, skipping frame');
                return;
            }
            
            const gl = this.gl;
            
            // Очищаем canvas
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // Используем программу
            gl.useProgram(this.program);
            
                    // Проверяем, что все uniform locations существуют (убираем uAmplitude из проверки)
        if (this.uniforms.uTime && this.uniforms.uColorStops && this.uniforms.uOpacity) {
                // Устанавливаем uniforms (убираем uAmplitude)
                gl.uniform1f(this.uniforms.uTime, time * 0.01 * this.options.speed);
                gl.uniform1f(this.uniforms.uOpacity, this.options.opacity);
                
                // Устанавливаем цвета
                const colorStops = this.options.colorStops.map(hex => this.hexToRgb(hex));
                gl.uniform3fv(this.uniforms.uColorStops, new Float32Array(colorStops.flat()));
                
                // Устанавливаем атрибуты
                gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
                gl.enableVertexAttribArray(this.attributes.position);
                gl.vertexAttribPointer(this.attributes.position, 2, gl.FLOAT, false, 0, 0);
                
                // Рисуем
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                
                // Логируем каждые 300 кадров (примерно раз в 5 секунд)
                if (frameCount % 300 === 0) {
                    console.log('🎨 Aurora running:', { 
                        frameCount, 
                        time: Math.round(time * 0.01 * this.options.speed),
                        colors: this.options.colorStops.length
                    });
                }
                         } else {
                 console.warn('❌ Uniform locations missing:', {
                     uTime: !!this.uniforms.uTime,
                     uColorStops: !!this.uniforms.uColorStops,
                     uOpacity: !!this.uniforms.uOpacity
                 });
             }
        };
        
        this.animateId = requestAnimationFrame(animate);
        console.log('✅ Aurora animation started');
    }
    
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        if (this.gl && this.program && this.uniforms.uColorStops) {
            this.gl.useProgram(this.program);
            const colorStops = this.options.colorStops.map(hex => this.hexToRgb(hex));
            this.gl.uniform3fv(this.uniforms.uColorStops, new Float32Array(colorStops.flat()));
            console.log('🎨 Aurora options updated, new colors:', this.options.colorStops);
        }
    }
    
    destroy() {
        if (this.animateId) {
            cancelAnimationFrame(this.animateId);
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        if (this.gl) {
            this.gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
        
        window.removeEventListener('resize', this.resize);
    }
}

// Глобальная функция для создания Aurora
window.createAuroraBackground = function(container, options) {
    console.log('🎨 createAuroraBackground called with:', { container, options });
    return new AuroraBackground(container, options);
};

console.log('🎨 Aurora.js loaded successfully');

// Автоматическая инициализация Aurora
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 DOM loaded, initializing Aurora...');
    
    const auroraContainer = document.querySelector('.aurora-container');
    if (auroraContainer) {
        console.log('✅ Aurora container found:', auroraContainer);
        window.auroraInstance = new AuroraBackground(auroraContainer);
        console.log('✅ Aurora initialized successfully');
    } else {
        console.error('❌ Aurora container not found');
    }
});