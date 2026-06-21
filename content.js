// 1. Create and style the floating UI container
const overlay = document.createElement('div');
overlay.id = 'canvas-tracker-overlay';
Object.assign(overlay.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '280px',
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
    zIndex: '9999999',
    border: '1px solid #333',
    display: 'none' // Hidden everywhere by default
});

// Build interface with Hide/Show button
overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 6px; user-select: none;">
        <span style="font-weight:bold; color:#00befa;">Times Tables Solver</span>
        <button id="tracker-hide-btn" style="background: #333; color: #fff; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; font-family: monospace;">Hide</button>
    </div>
    <div id="tracker-output" style="min-height: 40px;">Waiting for equations...</div>
`;
document.documentElement.appendChild(overlay);

const outputDiv = overlay.querySelector('#tracker-output');
const hideBtn = overlay.querySelector('#tracker-hide-btn');
let isMinimized = false;

// Manual Minimize / Restore button logic
hideBtn.addEventListener('click', () => {
    if (!isMinimized) {
        outputDiv.style.display = 'none';
        hideBtn.textContent = 'Show';
        overlay.style.width = '160px'; 
        isMinimized = true;
    } else {
        outputDiv.style.display = 'block';
        hideBtn.textContent = 'Hide';
        overlay.style.width = '280px'; 
        isMinimized = false;
    }
});

// 2. URL Checking Loop - Checks the address path every 500ms
setInterval(() => {
    const currentURL = window.location.href;
    // Only show if the current URL contains the specific game path
    if (currentURL.includes('student/games/HundredClub')) {
        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }
}, 500);

// 3. Helper function to parse text and solve math operations
function solveExpression(text) {
    let cleanText = text.replace(/×/g, '*').replace(/x/gi, '*').replace(/÷/g, '/');
    const match = cleanText.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
    if (match) {
        const num1 = parseInt(match[1], 10);
        const operator = match[2];
        const num2 = parseInt(match[3], 10);
        
        switch (operator) {
            case '*': return num1 * num2;
            case '/': return num2 !== 0 ? (num1 / num2) : 'Error';
            case '+': return num1 + num2;
            case '-': return num1 - num2;
        }
    }
    return null;
}

// 4. Overwrite getContext on the global prototype chain
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, attributes) {
    const ctx = originalGetContext.apply(this, arguments);
    
    if (type === '2d' && ctx && !ctx.hooked) {
        ctx.hooked = true;
        const originalFillText = ctx.fillText;
        
        ctx.fillText = function(text, x, y, maxWidth) {
            const textStr = String(text).trim();
            
            if (textStr.includes('×') || textStr.includes('x') || textStr.includes('=') || textStr.includes('?')) {
                const answer = solveExpression(textStr);
                
                if (answer !== null) {
                    const outputTarget = document.getElementById('tracker-output');
                    if (outputTarget) {
                        outputTarget.innerHTML = `
                            <div style="color:#aaa; margin-bottom: 4px;">Question: ${textStr}</div>
                            <div style="font-size: 18px;">Answer: <strong style="color:#ffaa00;">${answer}</strong></div>
                        `;
                    }
                }
            }
            return originalFillText.apply(this, arguments);
        };
    }
    return ctx;
};