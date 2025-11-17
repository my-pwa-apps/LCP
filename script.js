// Little Computer People - C64 Style with Canvas Rendering
class LittleComputerPeople {
    constructor() {
        this.canvas = document.getElementById('house');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.ctx.imageSmoothingEnabled = false;
        
        // Performance optimization
        this.lastRenderTime = 0;
        this.renderDelta = 0;
        this.animationId = null;
        
        // C64 Color Palette
        this.colors = {
            black: '#000000',
            white: '#ffffff',
            lightBlue: '#a3a3ff',
            purple: '#6c5eb5',
            brown: '#9f6e43',
            darkBrown: '#6b4423',
            lightBrown: '#d4976e',
            green: '#50e89d',
            darkGreen: '#3fba7a',
            lightGray: '#d0d0d0',
            gray: '#6c6c6c',
            pink: '#a0426a',
            blue: '#4040e8',
            orange: '#d55a24',
            peach: '#ffc0a4',
            yellow: '#ffc600'
        };
        
        // UI elements
        this.messageBox = document.getElementById('message-box');
        this.moodDisplay = document.getElementById('mood');
        this.activityDisplay = document.getElementById('activity');
        this.hungerBar = document.getElementById('hunger-bar');
        this.energyBar = document.getElementById('energy-bar');
        
        // Game state
        this.state = {
            mood: 'Content',
            activity: 'Idle',
            hunger: 75,
            energy: 85,
            personX: 320,
            personY: 330,
            personFloor: 1,
            dogX: 280,
            dogY: 330,
            isWalking: false,
            walkFrame: 0,
            direction: 1, // 1 = right, -1 = left
            currentAction: null,
            actionTimer: 0,
            targetX: 320,
            targetY: 330,
            targetFloor: 1
        };
        
        // House locations for pathfinding (adjusted for new rendering)
        this.locations = {
            // Floor 3 (y=90-130)
            bed: { x: 120, y: 110, floor: 3 },
            nightstand: { x: 200, y: 110, floor: 3 },
            bedroom_center: { x: 320, y: 110, floor: 3 },
            
            // Stairs 2-3
            stairs_2_top: { x: 320, y: 140, floor: 3 },
            stairs_2_mid1: { x: 320, y: 146, floor: 2.8 },
            stairs_2_mid2: { x: 320, y: 152, floor: 2.6 },
            stairs_2_mid3: { x: 320, y: 158, floor: 2.4 },
            stairs_2_mid4: { x: 320, y: 164, floor: 2.2 },
            stairs_2_bottom: { x: 320, y: 170, floor: 2 },
            
            // Floor 2 (y=200-240)
            chair: { x: 120, y: 220, floor: 2 },
            tv: { x: 500, y: 220, floor: 2 },
            table: { x: 250, y: 220, floor: 2 },
            living_center: { x: 320, y: 220, floor: 2 },
            
            // Stairs 1-2
            stairs_1_top: { x: 320, y: 250, floor: 2 },
            stairs_1_mid1: { x: 320, y: 256, floor: 1.8 },
            stairs_1_mid2: { x: 320, y: 262, floor: 1.6 },
            stairs_1_mid3: { x: 320, y: 268, floor: 1.4 },
            stairs_1_mid4: { x: 320, y: 274, floor: 1.2 },
            stairs_1_bottom: { x: 320, y: 280, floor: 1 },
            
            // Floor 1 (y=310-350)
            counter: { x: 150, y: 330, floor: 1 },
            fridge: { x: 500, y: 330, floor: 1 },
            sink: { x: 250, y: 330, floor: 1 },
            kitchen_center: { x: 320, y: 330, floor: 1 }
        };
        
        // Pathfinding
        this.path = [];
        this.pathIndex = 0;
        
        // Start systems
        this.startGameLoop();
        this.startAI();
        this.lastRenderTime = performance.now();
        this.render(this.lastRenderTime);
        this.showMessage('YOUR LITTLE COMPUTER PERSON HAS MOVED IN!');
    }
    
    // ===== RENDERING =====
    render(timestamp) {
        // Calculate delta time for smooth animations
        this.renderDelta = timestamp - this.lastRenderTime;
        this.lastRenderTime = timestamp;
        
        // Clear canvas - Sky
        this.ctx.fillStyle = this.colors.blue;
        this.ctx.fillRect(0, 0, 640, 400);
        
        // Draw ground first
        this.drawGround();
        
        // Draw house exterior
        this.drawHouseExterior();
        
        // Draw house interior floors
        this.drawFloor(3, 58);   // Bedroom
        this.drawFloor(2, 168);  // Living room
        this.drawFloor(1, 278);  // Kitchen
        
        // Draw visible stairs
        this.drawStairs(138, 2);  // Between floors 2-3
        this.drawStairs(248, 1);  // Between floors 1-2
        
        // Draw furniture
        this.drawFurniture();
        
        // Draw entities with proper z-ordering based on Y position
        const entities = [
            { type: 'dog', y: this.state.dogY, draw: () => this.drawDog() },
            { type: 'person', y: this.state.personY, draw: () => this.drawPerson() }
        ];
        entities.sort((a, b) => a.y - b.y);
        entities.forEach(entity => entity.draw());
        
        // Continue animation loop
        this.animationId = requestAnimationFrame((t) => this.render(t));
    }
    
    drawHouseExterior() {
        // House outline - brown walls
        const houseLeft = 20;
        const houseRight = 620;
        const houseTop = 40;
        const houseBottom = 360;
        
        // Roof - triangular/peaked
        this.ctx.fillStyle = this.colors.orange;
        this.ctx.beginPath();
        this.ctx.moveTo(320, 10);  // Peak
        this.ctx.lineTo(houseLeft - 10, houseTop);  // Left edge
        this.ctx.lineTo(houseRight + 10, houseTop); // Right edge
        this.ctx.closePath();
        this.ctx.fill();
        
        // Roof shadow line
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(houseLeft - 10, houseTop, houseRight - houseLeft + 20, 4);
        
        // Left wall
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(houseLeft, houseTop, 4, houseBottom - houseTop);
        
        // Right wall
        this.ctx.fillRect(houseRight - 4, houseTop, 4, houseBottom - houseTop);
        
        // Floor dividers (visible from outside)
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(houseLeft, 158, houseRight - houseLeft, 6);
        this.ctx.fillRect(houseLeft, 268, houseRight - houseLeft, 6);
        
        // Bottom floor line
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(houseLeft, houseBottom, houseRight - houseLeft, 6);
    }
    
    drawFloor(floorNum, y) {
        const height = 110;
        const leftMargin = 24;
        const rightMargin = 620;
        
        // Back wall with improved wallpaper pattern
        for (let i = leftMargin; i < rightMargin; i += 8) {
            this.ctx.fillStyle = i % 16 === 0 ? this.colors.purple : this.colors.lightBlue;
            this.ctx.fillRect(i, y, 8, height - 12);
        }
        
        // Add subtle wall details for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = leftMargin; i < rightMargin; i += 32) {
            this.ctx.fillRect(i, y, 1, height - 12);
        }
        
        // Floor surface (wooden planks)
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(leftMargin, y + height - 12, rightMargin - leftMargin, 4);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(leftMargin, y + height - 8, rightMargin - leftMargin, 8);
        
        // Wood plank lines for detail
        this.ctx.fillStyle = this.colors.darkBrown;
        for (let i = leftMargin; i < rightMargin; i += 48) {
            this.ctx.fillRect(i, y + height - 8, 2, 8);
        }
        
        // Floor edge shadow
        this.ctx.fillRect(leftMargin, y + height, rightMargin - leftMargin, 2);
    }
    
    drawStairs(y, stairSet) {
        // Draw visible isometric stairs with improved 3D perspective
        const stairWidth = 50;
        const stairDepth = 8;
        const centerX = 320 - stairWidth / 2;
        const numStairs = 5;
        
        for (let i = 0; i < numStairs; i++) {
            const stairY = y + i * 6;
            const depth = (numStairs - i) * 0.5; // Depth perspective
            
            // Shadow underneath for depth
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(centerX + 2, stairY + stairDepth + 6, stairWidth - 2, 2);
            
            // Stair tread (top surface) - isometric view with depth gradient
            this.ctx.fillStyle = this.colors.lightBrown;
            this.ctx.fillRect(centerX, stairY, stairWidth, stairDepth);
            
            // Highlight on top edge for 3D effect
            this.ctx.fillStyle = this.colors.peach;
            this.ctx.fillRect(centerX, stairY, stairWidth, 1);
            
            // Stair riser (front face) with gradient
            this.ctx.fillStyle = this.colors.brown;
            this.ctx.fillRect(centerX, stairY + stairDepth, stairWidth, 6);
            
            // Shadow/depth line
            this.ctx.fillStyle = this.colors.darkBrown;
            this.ctx.fillRect(centerX, stairY + stairDepth + 5, stairWidth, 1);
            
            // Left side rail with depth
            this.ctx.fillStyle = this.colors.darkBrown;
            this.ctx.fillRect(centerX - 3, stairY, 3, 14);
            
            // Right side rail with depth
            this.ctx.fillRect(centerX + stairWidth, stairY, 3, 14);
        }
        
        // Bannister posts with enhanced detail
        this.ctx.fillStyle = this.colors.darkBrown;
        for (let i = 0; i <= numStairs; i++) {
            const postY = y + i * 6;
            this.ctx.fillRect(centerX - 3, postY, 3, 3);
            this.ctx.fillRect(centerX + stairWidth, postY, 3, 3);
            
            // Highlight on posts
            this.ctx.fillStyle = this.colors.brown;
            this.ctx.fillRect(centerX - 3, postY, 1, 3);
            this.ctx.fillRect(centerX + stairWidth, postY, 1, 3);
            this.ctx.fillStyle = this.colors.darkBrown;
        }
    }
    
    drawGround() {
        // Grass pattern at bottom
        for (let i = 0; i < 640; i += 16) {
            this.ctx.fillStyle = i % 32 === 0 ? this.colors.green : this.colors.darkGreen;
            this.ctx.fillRect(i, 366, 16, 34);
        }
    }
    
    drawFurniture() {
        // Floor 3 - Bedroom
        this.drawBed(80, 90);
        this.drawNightstand(180, 100);
        this.drawWindow(550, 70);
        
        // Floor 2 - Living Room
        this.drawChair(80, 190);
        this.drawTable(200, 195);
        this.drawTV(480, 190);
        this.drawWindow(550, 180);
        
        // Floor 1 - Kitchen
        this.drawCounter(100, 305);
        this.drawFridge(480, 290);
        this.drawSink(220, 310);
        this.drawWindow(550, 290);
    }
    
    drawBed(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 2, y + 32, 60, 3);
        
        // Bed frame
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y, 60, 30);
        // Frame highlight for 3D
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x, y, 60, 2);
        
        // Mattress
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 2, y + 2, 56, 20);
        // Mattress shading
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x + 2, y + 20, 56, 2);
        
        // Sheet/blanket draped over bed
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 4, y + 8, 50, 14);
        // Sheet folds/wrinkles
        this.ctx.fillStyle = this.colors.blue;
        this.ctx.fillRect(x + 15, y + 10, 2, 10);
        this.ctx.fillRect(x + 30, y + 12, 2, 8);
        this.ctx.fillRect(x + 42, y + 9, 2, 11);
        
        // Pillow (fluffier)
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 42, y + 4, 14, 10);
        // Pillow crease
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 48, y + 4, 2, 10);
        this.ctx.fillRect(x + 42, y + 11, 14, 3);
        
        // Posts with depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x, y, 4, 30);
        this.ctx.fillRect(x + 56, y, 4, 30);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y, 1, 30);
        this.ctx.fillRect(x + 56, y, 1, 30);
    }
    
    drawNightstand(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 2, y + 30, 24, 2);
        
        // Nightstand body
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y, 24, 28);
        // Top highlight
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x, y, 24, 2);
        
        // Drawer handles
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 10, y + 8, 4, 2);
        this.ctx.fillRect(x + 10, y + 20, 4, 2);
        
        // Stack of books on nightstand
        this.ctx.fillStyle = this.colors.blue;
        this.ctx.fillRect(x + 1, y - 2, 6, 3);
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x + 2, y - 5, 6, 3);
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 1, y - 8, 6, 3);
        // Book spines
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 1, y - 2, 1, 3);
        this.ctx.fillRect(x + 2, y - 5, 1, 3);
        
        // Lamp base
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 10, y - 2, 4, 4);
        // Lamp stem
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 11, y - 8, 2, 6);
        // Lamp shade (glowing)
        this.ctx.fillStyle = this.colors.yellow;
        this.ctx.fillRect(x + 8, y - 12, 8, 4);
        // Lamp glow
        this.ctx.fillStyle = 'rgba(255, 198, 0, 0.3)';
        this.ctx.fillRect(x + 6, y - 14, 12, 8);
        
        // Small plant in pot next to lamp
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 17, y - 2, 5, 4);
        // Plant leaves
        this.ctx.fillStyle = this.colors.green;
        this.ctx.fillRect(x + 18, y - 4, 2, 2);
        this.ctx.fillRect(x + 20, y - 3, 2, 2);
        this.ctx.fillRect(x + 19, y - 6, 2, 2);
    }
    
    drawWindow(x, y) {
        // Frame
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x, y, 40, 50);
        // Frame inner shadow
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 2, y + 48, 36, 2);
        
        // Glass with sky reflection
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 4, y + 4, 32, 42);
        // Shine/reflection
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 6, y + 6, 8, 8);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x + 6, y + 16, 12, 20);
        
        // Cross bars with depth
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 18, y + 4, 4, 42);
        this.ctx.fillRect(x + 4, y + 23, 32, 4);
        // Bar highlights
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 18, y + 4, 1, 42);
        this.ctx.fillRect(x + 4, y + 23, 32, 1);
    }
    
    drawChair(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 2, y + 52, 30, 2);
        
        // Legs
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 2, y + 40, 4, 12);
        this.ctx.fillRect(x + 26, y + 40, 4, 12);
        // Leg highlights
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 2, y + 40, 1, 12);
        this.ctx.fillRect(x + 26, y + 40, 1, 12);
        
        // Seat base
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x, y + 20, 32, 20);
        // Seat shading
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x, y + 36, 32, 4);
        
        // Seat cushion (plump)
        this.ctx.fillStyle = this.colors.peach;
        this.ctx.fillRect(x + 2, y + 22, 28, 12);
        // Cushion button/tuft
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 8, y + 27, 2, 2);
        this.ctx.fillRect(x + 22, y + 27, 2, 2);
        
        // Back
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x, y, 32, 24);
        // Back highlight
        this.ctx.fillStyle = this.colors.peach;
        this.ctx.fillRect(x, y, 32, 2);
        
        // Back cushion
        this.ctx.fillStyle = this.colors.peach;
        this.ctx.fillRect(x + 2, y + 6, 28, 14);
        // Cushion tufts
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 9, y + 12, 2, 2);
        this.ctx.fillRect(x + 21, y + 12, 2, 2);
    }
    
    drawTable(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 2, y + 52, 58, 2);
        
        // Legs
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 4, y + 28, 6, 24);
        this.ctx.fillRect(x + 50, y + 28, 6, 24);
        // Leg highlights
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 4, y + 28, 1, 24);
        this.ctx.fillRect(x + 50, y + 28, 1, 24);
        
        // Top surface
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y + 20, 60, 8);
        // Top highlight for 3D
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x, y + 20, 60, 2);
        // Top edge shadow
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x, y + 26, 60, 2);
        
        // Vase with flowers centerpiece
        // Vase body
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x + 24, y + 10, 8, 10);
        // Vase highlight
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 24, y + 10, 2, 8);
        // Vase rim
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x + 23, y + 9, 10, 2);
        
        // Flowers (roses)
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 25, y + 4, 3, 3);
        this.ctx.fillRect(x + 28, y + 2, 3, 3);
        this.ctx.fillRect(x + 26, y + 6, 3, 3);
        // Stems
        this.ctx.fillStyle = this.colors.darkGreen;
        this.ctx.fillRect(x + 26, y + 7, 1, 4);
        this.ctx.fillRect(x + 29, y + 5, 1, 6);
        // Leaves
        this.ctx.fillStyle = this.colors.green;
        this.ctx.fillRect(x + 27, y + 8, 2, 1);
        this.ctx.fillRect(x + 30, y + 7, 2, 1);
    }
    
    drawTV(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 62, 44, 2);
        
        // TV body
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x, y + 10, 48, 42);
        // Body highlight
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x, y + 10, 48, 2);
        
        // Screen with animated static
        const flicker = Math.random() > 0.9 ? 0.3 : 0;
        this.ctx.fillStyle = this.colors.blue;
        this.ctx.fillRect(x + 4, y + 14, 40, 30);
        // Screen glow
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 6, y + 16, 36, 2);
        // Random static pixels
        for (let i = 0; i < 8; i++) {
            this.ctx.fillStyle = Math.random() > 0.5 ? this.colors.white : this.colors.lightBlue;
            this.ctx.fillRect(
                x + 8 + Math.random() * 30,
                y + 18 + Math.random() * 24,
                2, 2
            );
        }
        
        // Stand
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 18, y + 52, 12, 8);
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 18, y + 59, 12, 1);
    }
    
    drawCounter(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 42, 100, 2);
        
        // Counter body
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y + 8, 100, 32);
        // Body shading
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x, y + 35, 100, 5);
        
        // Top countertop
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x, y, 100, 8);
        // Top highlight
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x, y, 100, 2);
        // Top depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x, y + 6, 100, 2);
        
        // Fruit bowl on counter
        this.ctx.fillStyle = this.colors.yellow;
        this.ctx.fillRect(x + 8, y - 2, 16, 8);
        this.ctx.fillStyle = this.colors.orange;
        this.ctx.fillRect(x + 8, y + 4, 16, 2);
        // Fruits in bowl
        this.ctx.fillStyle = this.colors.orange;
        this.ctx.fillRect(x + 10, y - 2, 4, 4);
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 15, y - 1, 4, 4);
        this.ctx.fillStyle = this.colors.green;
        this.ctx.fillRect(x + 19, y, 3, 3);
        
        // Cutting board
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x + 60, y - 2, 14, 8);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 60, y - 2, 14, 1);
        // Knife on board
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 62, y + 1, 10, 2);
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 62, y + 1, 3, 2);
        
        // Coffee maker
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x + 78, y - 6, 12, 12);
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 80, y - 4, 8, 2);
        this.ctx.fillStyle = this.colors.orange;
        this.ctx.fillRect(x + 82, y - 2, 2, 2);
        
        // Drawer handles
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 24, y + 16, 8, 4);
        this.ctx.fillRect(x + 68, y + 16, 8, 4);
        this.ctx.fillRect(x + 24, y + 28, 8, 4);
        this.ctx.fillRect(x + 68, y + 28, 8, 4);
        // Handle highlights
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 24, y + 16, 8, 1);
        this.ctx.fillRect(x + 68, y + 16, 8, 1);
        this.ctx.fillRect(x + 24, y + 28, 8, 1);
        this.ctx.fillRect(x + 68, y + 28, 8, 1);
    }
    
    drawFridge(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 62, 36, 2);
        
        // Body
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x, y, 36, 60);
        // Side panel for depth
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 36, y + 2, 4, 58);
        
        // Top section
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 2, y + 2, 32, 28);
        // Highlight
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 2, y + 28, 32, 2);
        
        // Magnets and notes on fridge door
        // Shopping list note
        this.ctx.fillStyle = this.colors.yellow;
        this.ctx.fillRect(x + 6, y + 6, 10, 12);
        this.ctx.fillStyle = this.colors.orange;
        this.ctx.fillRect(x + 7, y + 8, 8, 1);
        this.ctx.fillRect(x + 7, y + 10, 6, 1);
        this.ctx.fillRect(x + 7, y + 12, 7, 1);
        // Magnet holding note
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 8, y + 5, 3, 2);
        
        // Photo magnet
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 20, y + 8, 8, 10);
        this.ctx.fillStyle = this.colors.peach;
        this.ctx.fillRect(x + 21, y + 9, 6, 6);
        // Magnet
        this.ctx.fillStyle = this.colors.blue;
        this.ctx.fillRect(x + 22, y + 7, 3, 2);
        
        // Clock magnet
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x + 8, y + 20, 6, 6);
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 10, y + 22, 2, 2);
        
        // Bottom section
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 2, y + 32, 32, 26);
        
        // Handles with depth
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 34, y + 12, 4, 8);
        this.ctx.fillRect(x + 34, y + 40, 4, 8);
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 35, y + 13, 2, 6);
        this.ctx.fillRect(x + 35, y + 41, 2, 6);
    }
    
    drawSink(x, y) {
        // Basin rim
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x, y, 32, 20);
        // Basin highlight
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x, y, 32, 2);
        
        // Basin interior (dark)
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x + 4, y + 4, 24, 12);
        // Water with bubbles
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 6, y + 6, 8, 4);
        this.ctx.fillRect(x + 16, y + 8, 6, 3);
        // Bubbles
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 7, y + 7, 2, 2);
        this.ctx.fillRect(x + 10, y + 6, 2, 2);
        this.ctx.fillRect(x + 17, y + 9, 2, 2);
        
        // Plate in sink
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 10, y + 10, 8, 5);
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 11, y + 11, 6, 3);
        
        // Drain
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 14, y + 13, 4, 2);
        
        // Dish soap bottle
        this.ctx.fillStyle = this.colors.green;
        this.ctx.fillRect(x - 8, y + 2, 6, 12);
        this.ctx.fillStyle = this.colors.darkGreen;
        this.ctx.fillRect(x - 8, y + 2, 6, 2);
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x - 7, y + 6, 4, 3);
        
        // Sponge
        this.ctx.fillStyle = this.colors.yellow;
        this.ctx.fillRect(x + 32, y + 4, 6, 4);
        this.ctx.fillStyle = this.colors.green;
        this.ctx.fillRect(x + 32, y + 4, 6, 1);
        
        // Faucet stem
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 14, y - 8, 4, 12);
        // Faucet spout
        this.ctx.fillRect(x + 10, y - 8, 12, 4);
        // Faucet highlights
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 14, y - 8, 1, 12);
        this.ctx.fillRect(x + 10, y - 8, 12, 1);
        
        // Handles
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 8, y - 6, 4, 3);
        this.ctx.fillRect(x + 20, y - 6, 4, 3);
    }
    
    drawPerson() {
        const x = Math.floor(this.state.personX);
        const y = Math.floor(this.state.personY);
        const dir = this.state.direction;
        
        // Shadow for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - 6, y + 8, 12, 2);
        
        // Head with better shading
        this.ctx.fillStyle = this.colors.peach;
        this.ctx.fillRect(x - 4 * dir, y - 20, 8, 8);
        // Hair
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x - 4 * dir, y - 20, 8, 2);
        // Eyes
        this.ctx.fillStyle = this.colors.black;
        if (dir === 1) {
            this.ctx.fillRect(x + 1, y - 17, 2, 2);
            this.ctx.fillRect(x + 4, y - 17, 1, 2);
        } else {
            this.ctx.fillRect(x - 3, y - 17, 2, 2);
            this.ctx.fillRect(x - 5, y - 17, 1, 2);
        }
        // Mouth
        this.ctx.fillRect(x + (dir === 1 ? 2 : -3), y - 14, 2, 1);
        
        // Body with shading
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x - 5 * dir, y - 12, 10, 12);
        // Body highlight
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x - 4 * dir, y - 12, 2, 10);
        
        // Arms
        this.ctx.fillStyle = this.colors.purple;
        if (this.state.isWalking) {
            const armSwing = Math.sin(this.state.walkFrame * 0.3) * 1.5;
            this.ctx.fillRect(x - 7 * dir, y - 10 + armSwing, 2, 8);
            this.ctx.fillRect(x + 6 * dir, y - 10 - armSwing, 2, 8);
        } else {
            this.ctx.fillRect(x - 7 * dir, y - 10, 2, 8);
            this.ctx.fillRect(x + 6 * dir, y - 10, 2, 8);
        }
        
        // Legs (improved walking animation)
        this.ctx.fillStyle = this.colors.blue;
        if (this.state.isWalking) {
            const legOffset = Math.sin(this.state.walkFrame * 0.4) * 3;
            this.ctx.fillRect(x - 4 * dir, y, 3, 8 + Math.max(0, legOffset));
            this.ctx.fillRect(x + 2 * dir, y, 3, 8 + Math.max(0, -legOffset));
        } else {
            this.ctx.fillRect(x - 4 * dir, y, 3, 8);
            this.ctx.fillRect(x + 2 * dir, y, 3, 8);
        }
        
        // Shoes
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x - 4 * dir, y + 8, 3, 2);
        this.ctx.fillRect(x + 2 * dir, y + 8, 3, 2);
    }
    
    drawDog() {
        const x = Math.floor(this.state.dogX);
        const y = Math.floor(this.state.dogY);
        const tailWag = Math.sin(Date.now() * 0.01) * 2;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - 8, y + 6, 16, 2);
        
        // Body with shading
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x - 8, y - 6, 16, 8);
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x - 8, y - 6, 16, 2);
        
        // Head
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 6, y - 8, 8, 8);
        // Ears
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 6, y - 9, 2, 3);
        this.ctx.fillRect(x + 12, y - 9, 2, 3);
        // Nose
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x + 13, y - 4, 2, 2);
        // Eye
        this.ctx.fillRect(x + 10, y - 6, 2, 2);
        
        // Tail with wag animation
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x - 12, y - 4 + tailWag, 4, 4);
        
        // Legs
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x - 6, y + 2, 2, 4);
        this.ctx.fillRect(x - 2, y + 2, 2, 4);
        this.ctx.fillRect(x + 2, y + 2, 2, 4);
        this.ctx.fillRect(x + 6, y + 2, 2, 4);
        // Paws
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x - 6, y + 6, 2, 1);
        this.ctx.fillRect(x - 2, y + 6, 2, 1);
        this.ctx.fillRect(x + 2, y + 6, 2, 1);
        this.ctx.fillRect(x + 6, y + 6, 2, 1);
    }
    
    // ===== GAME LOOP =====
    startGameLoop() {
        setInterval(() => {
            this.state.hunger = Math.max(0, this.state.hunger - 1.5);
            this.state.energy = Math.max(0, this.state.energy - 0.8);
            this.updateStats();
            this.updateMood();
        }, 5000);
        
        this.animate();
    }
    
    animate() {
        if (this.state.isWalking) {
            this.walkToTarget();
            this.state.walkFrame++;
        }
        
        if (this.state.actionTimer > 0) {
            this.state.actionTimer--;
        } else if (this.state.currentAction) {
            this.completeAction();
        }
        
        // Dog follows with better physics
        const dx = this.state.personX - this.state.dogX;
        const dy = this.state.personY - this.state.dogY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Dog maintains distance but follows when person is far
        if (distance > 80) {
            // Run to catch up
            this.state.dogX += (dx / distance) * 1.5;
            this.state.dogY += (dy / distance) * 1.5;
        } else if (distance > 50) {
            // Walk slowly
            this.state.dogX += (dx / distance) * 0.5;
            this.state.dogY += (dy / distance) * 0.5;
        } else if (distance < 20 && Math.random() > 0.95) {
            // Occasionally wander nearby
            this.state.dogX += (Math.random() - 0.5) * 2;
            this.state.dogY += (Math.random() - 0.5) * 2;
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    // ===== AI SYSTEM =====
    startAI() {
        setInterval(() => {
            if (!this.state.isWalking && !this.state.currentAction) {
                this.makeDecision();
            }
        }, 4000);
    }
    
    makeDecision() {
        let decisions = [];
        
        if (this.state.hunger < 30) {
            decisions.push({ action: 'eat', priority: 100, location: 'fridge' });
        }
        if (this.state.energy < 25) {
            decisions.push({ action: 'sleep', priority: 100, location: 'bed' });
        }
        if (this.state.hunger < 60) {
            decisions.push({ action: 'eat', priority: 50, location: 'counter' });
        }
        if (this.state.energy < 50) {
            decisions.push({ action: 'rest', priority: 40, location: 'chair' });
        }
        
        decisions.push({ action: 'watch_tv', priority: Math.random() * 30, location: 'tv' });
        decisions.push({ action: 'wander', priority: Math.random() * 20, location: this.getRandomLocation() });
        
        decisions.sort((a, b) => b.priority - a.priority);
        
        if (decisions.length > 0) {
            this.executeDecision(decisions[0]);
        }
    }
    
    executeDecision(decision) {
        const target = this.locations[decision.location];
        if (!target) return;
        
        this.state.currentAction = decision.action;
        this.walkTo(decision.location, () => {
            this.performAction(decision.action);
        });
    }
    
    performAction(action) {
        switch(action) {
            case 'eat':
                this.state.actionTimer = 180;
                this.state.hunger = Math.min(100, this.state.hunger + 35);
                this.updateActivity('Eating');
                this.showMessage('ENJOYING A MEAL!');
                break;
            case 'sleep':
                this.state.actionTimer = 300;
                this.state.energy = Math.min(100, this.state.energy + 50);
                this.updateActivity('Sleeping');
                this.showMessage('TAKING A NAP...');
                break;
            case 'rest':
                this.state.actionTimer = 200;
                this.state.energy = Math.min(100, this.state.energy + 20);
                this.updateActivity('Resting');
                this.showMessage('RELAXING IN CHAIR');
                break;
            case 'watch_tv':
                this.state.actionTimer = 250;
                this.updateActivity('Watching TV');
                this.showMessage('WATCHING TV');
                break;
            case 'wander':
                this.state.actionTimer = 120;
                this.updateActivity('Wandering');
                break;
        }
    }
    
    completeAction() {
        this.state.currentAction = null;
        this.updateActivity('Idle');
    }
    
    getRandomLocation() {
        const locs = Object.keys(this.locations).filter(k => !k.includes('stairs'));
        return locs[Math.floor(Math.random() * locs.length)];
    }
    
    // ===== MOVEMENT =====
    walkTo(locationName, callback) {
        const target = this.locations[locationName];
        if (!target) return;
        
        // Build path with stairs if needed
        this.path = this.buildPath(this.state.personFloor, target.floor);
        this.path.push(target);
        this.pathIndex = 0;
        
        if (this.path.length > 0) {
            this.state.targetX = this.path[0].x;
            this.state.targetY = this.path[0].y;
            this.state.targetFloor = this.path[0].floor;
        }
        
        this.state.isWalking = true;
        this.onArrival = callback;
    }
    
    buildPath(currentFloor, targetFloor) {
        let path = [];
        
        if (currentFloor === targetFloor) {
            return path;
        }
        
        // Going up
        if (targetFloor > currentFloor) {
            if (currentFloor === 1) {
                path.push(this.locations.stairs_1_bottom);
                path.push(this.locations.stairs_1_mid1);
                path.push(this.locations.stairs_1_mid2);
                path.push(this.locations.stairs_1_mid3);
                path.push(this.locations.stairs_1_mid4);
                path.push(this.locations.stairs_1_top);
            }
            if (currentFloor <= 2 && targetFloor === 3) {
                if (currentFloor === 1) {
                    path.push(this.locations.stairs_1_bottom);
                    path.push(this.locations.stairs_1_mid1);
                    path.push(this.locations.stairs_1_mid2);
                    path.push(this.locations.stairs_1_mid3);
                    path.push(this.locations.stairs_1_mid4);
                    path.push(this.locations.stairs_1_top);
                }
                path.push(this.locations.stairs_2_bottom);
                path.push(this.locations.stairs_2_mid1);
                path.push(this.locations.stairs_2_mid2);
                path.push(this.locations.stairs_2_mid3);
                path.push(this.locations.stairs_2_mid4);
                path.push(this.locations.stairs_2_top);
            }
        }
        
        // Going down
        if (targetFloor < currentFloor) {
            if (currentFloor === 3) {
                path.push(this.locations.stairs_2_top);
                path.push(this.locations.stairs_2_mid4);
                path.push(this.locations.stairs_2_mid3);
                path.push(this.locations.stairs_2_mid2);
                path.push(this.locations.stairs_2_mid1);
                path.push(this.locations.stairs_2_bottom);
            }
            if (currentFloor >= 2 && targetFloor === 1) {
                if (currentFloor === 3) {
                    path.push(this.locations.stairs_2_top);
                    path.push(this.locations.stairs_2_mid4);
                    path.push(this.locations.stairs_2_mid3);
                    path.push(this.locations.stairs_2_mid2);
                    path.push(this.locations.stairs_2_mid1);
                    path.push(this.locations.stairs_2_bottom);
                }
                path.push(this.locations.stairs_1_top);
                path.push(this.locations.stairs_1_mid4);
                path.push(this.locations.stairs_1_mid3);
                path.push(this.locations.stairs_1_mid2);
                path.push(this.locations.stairs_1_mid1);
                path.push(this.locations.stairs_1_bottom);
            }
        }
        
        return path;
    }
    
    walkToTarget() {
        const dx = this.state.targetX - this.state.personX;
        const dy = this.state.targetY - this.state.personY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Smooth deceleration near target
        const arrivalThreshold = 3;
        const speed = 2.5;
        const adjustedSpeed = distance < 20 ? speed * (distance / 20) : speed;
        
        if (distance < arrivalThreshold) {
            this.state.personX = this.state.targetX;
            this.state.personY = this.state.targetY;
            this.state.personFloor = this.state.targetFloor;
            
            // Move to next waypoint in path
            this.pathIndex++;
            if (this.pathIndex < this.path.length) {
                this.state.targetX = this.path[this.pathIndex].x;
                this.state.targetY = this.path[this.pathIndex].y;
                this.state.targetFloor = this.path[this.pathIndex].floor;
            } else {
                // Path complete
                this.state.isWalking = false;
                this.path = [];
                this.pathIndex = 0;
                if (this.onArrival) {
                    this.onArrival();
                    this.onArrival = null;
                }
            }
        } else {
            // Smooth interpolation with easing
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            this.state.personX += normalizedDx * adjustedSpeed;
            this.state.personY += normalizedDy * adjustedSpeed;
            
            // Update direction only when moving significantly horizontally
            if (Math.abs(dx) > 0.5) {
                this.state.direction = dx > 0 ? 1 : -1;
            }
        }
    }
    
    // ===== UI =====
    updateStats() {
        this.hungerBar.style.width = this.state.hunger + '%';
        this.energyBar.style.width = this.state.energy + '%';
        
        this.hungerBar.style.background = this.state.hunger < 30 ? '#a0426a' : 
                                         this.state.hunger < 60 ? '#ffc600' : '#50e89d';
        this.energyBar.style.background = this.state.energy < 30 ? '#a0426a' : 
                                         this.state.energy < 60 ? '#ffc600' : '#50e89d';
    }
    
    updateMood() {
        const avg = (this.state.hunger + this.state.energy) / 2;
        this.state.mood = avg > 80 ? 'Very Happy' : avg > 60 ? 'Happy' : 
                         avg > 40 ? 'Content' : avg > 25 ? 'Tired' : 'Unhappy';
        this.moodDisplay.textContent = this.state.mood;
    }
    
    updateActivity(activity) {
        this.state.activity = activity;
        this.activityDisplay.textContent = activity;
    }
    
    showMessage(msg) {
        this.messageBox.textContent = msg;
    }
    
    // ===== PLAYER INTERACTIONS =====
    giveLetter() {
        this.showMessage('READING YOUR LETTER!');
        this.state.energy = Math.min(100, this.state.energy + 15);
        this.updateStats();
        this.updateMood();
    }
    
    giveFood() {
        this.showMessage('DELICIOUS! THANK YOU!');
        this.state.hunger = Math.min(100, this.state.hunger + 40);
        this.updateStats();
        this.updateMood();
    }
    
    playMusic() {
        this.showMessage('ENJOYING THE MUSIC!');
        this.state.energy = Math.min(100, this.state.energy + 12);
        this.updateStats();
        this.updateMood();
    }
    
    callPerson() {
        this.showMessage('WAVES AT YOU!');
        this.state.energy = Math.min(100, this.state.energy + 8);
        this.updateStats();
        this.updateMood();
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new LittleComputerPeople();
});
