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
        
        // C64 Color Palette (authentic Commodore 64 colors)
        this.colors = {
            black: '#000000',
            white: '#ffffff',
            red: '#880000',
            cyan: '#aaffee',
            lightBlue: '#a3a3ff',
            purple: '#6c5eb5',
            brown: '#9f6e43',
            darkBrown: '#6b4423',
            lightBrown: '#d4976e',
            green: '#50e89d',
            darkGreen: '#3fba7a',
            lightGray: '#d0d0d0',
            gray: '#6c6c6c',
            mediumGray: '#959595',
            pink: '#a0426a',
            blue: '#4040e8',
            orange: '#d55a24',
            peach: '#ffc0a4',
            yellow: '#ffc600',
            lightRed: '#ff7777'
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
            personY: 360,  // Fixed: actual floor position
            personFloor: 1,
            dogX: 280,
            dogY: 360,  // Fixed: actual floor position
            dogState: 'following', // following, resting, playing
            isWalking: false,
            walkFrame: 0,
            idleFrame: 0,
            blinkTimer: 0,
            direction: 1, // 1 = right, -1 = left
            currentAction: null,
            actionTimer: 0,
            targetX: 320,
            targetY: 360,  // Fixed: actual floor position
            targetFloor: 1,
            lastDecisionTime: 0,
            personality: {
                hunger_tolerance: 0.3 + Math.random() * 0.4,
                energy_need: 0.2 + Math.random() * 0.3,
                tv_preference: Math.random(),
                social_need: Math.random()
            }
        };
        
        // House locations for pathfinding (fixed to match actual floor surfaces)
        // Floor surfaces are at: Floor 3 = y:160, Floor 2 = y:270, Floor 1 = y:370
        this.locations = {
            // Floor 3 - Bedroom & Relaxation Zone (actual floor at y=160)
            bed: { x: 90, y: 155, floor: 3 },
            bed_sleeping: { x: 90, y: 155, floor: 3 }, // Center of bed for sleeping
            nightstand: { x: 190, y: 155, floor: 3 },
            reading_spot: { x: 180, y: 155, floor: 3 }, // Read at nightstand
            dresser: { x: 450, y: 155, floor: 3 },
            dogbasket: { x: 520, y: 155, floor: 3 },
            window_view: { x: 560, y: 155, floor: 3 }, // Look out window
            bedroom_center: { x: 320, y: 155, floor: 3 },
            
            // Stairs 2-3
            stairs_2_top: { x: 320, y: 160, floor: 3 },
            stairs_2_mid1: { x: 320, y: 185, floor: 2.8 },
            stairs_2_mid2: { x: 320, y: 210, floor: 2.6 },
            stairs_2_mid3: { x: 320, y: 235, floor: 2.4 },
            stairs_2_mid4: { x: 320, y: 260, floor: 2.2 },
            stairs_2_bottom: { x: 320, y: 270, floor: 2 },
            
            // Floor 2 - Living Room & Entertainment Zone (actual floor at y=270)
            couch: { x: 85, y: 265, floor: 2 },
            tv_watching: { x: 85, y: 265, floor: 2 },  // Sit on couch to watch TV
            tv: { x: 510, y: 265, floor: 2 },
            bookshelf: { x: 500, y: 265, floor: 2 },
            table: { x: 240, y: 265, floor: 2 },
            table_center: { x: 250, y: 265, floor: 2 }, // Sit at table
            plant_corner: { x: 560, y: 265, floor: 2 }, // Decorative plant area
            living_center: { x: 320, y: 265, floor: 2 },
            
            // Stairs 1-2
            stairs_1_top: { x: 320, y: 270, floor: 2 },
            stairs_1_mid1: { x: 320, y: 292, floor: 1.8 },
            stairs_1_mid2: { x: 320, y: 314, floor: 1.6 },
            stairs_1_mid3: { x: 320, y: 336, floor: 1.4 },
            stairs_1_mid4: { x: 320, y: 348, floor: 1.2 },
            stairs_1_bottom: { x: 320, y: 360, floor: 1 },
            
            // Floor 1 - Kitchen & Dining Zone (actual floor at y=370)
            fridge: { x: 510, y: 360, floor: 1 },
            fridge_eating: { x: 505, y: 360, floor: 1 }, // Stand at fridge to eat
            counter: { x: 90, y: 360, floor: 1 },
            counter_prep: { x: 95, y: 360, floor: 1 }, // Food prep area
            sink: { x: 205, y: 360, floor: 1 },
            sink_washing: { x: 205, y: 360, floor: 1 }, // Wash dishes
            stove: { x: 155, y: 360, floor: 1 },
            dining_area: { x: 380, y: 360, floor: 1 }, // Eat at table
            water_bowl: { x: 560, y: 360, floor: 1 }, // Dog water bowl
            kitchen_center: { x: 320, y: 360, floor: 1 }
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
        
        // Day/Night sky color
        const hours = Math.floor(this.state.gameTime / 60) % 24;
        let skyColor = this.colors.blue;
        
        if (hours < 6) {
            // Night
            skyColor = '#0a0a2e';
        } else if (hours < 8) {
            // Dawn
            skyColor = '#4a5f8f';
        } else if (hours < 19) {
            // Day
            skyColor = this.colors.blue;
        } else if (hours < 22) {
            // Dusk
            skyColor = '#2d3561';
        } else {
            // Night
            skyColor = '#0a0a2e';
        }
        
        // Clear canvas with dynamic sky
        this.ctx.fillStyle = skyColor;
        this.ctx.fillRect(0, 0, 640, 400);
        
        // Draw ground first
        this.drawGround();
        
        // Draw house exterior
        this.drawHouseExterior();
        
        // Draw house interior floors
        this.drawFloor(3, 58);   // Bedroom (floor surface at y=148)
        this.drawFloor(2, 168);  // Living room (floor surface at y=258)
        this.drawFloor(1, 278);  // Kitchen (floor surface at y=368)
        
        // Draw visible stairs with proper positioning
        this.drawStairs(148, 2);  // Between floors 2-3 (from floor 2 surface)
        this.drawStairs(258, 1);  // Between floors 1-2 (from floor 1 surface)
        
        // Draw furniture
        this.drawFurniture();
        
        // Draw entities with proper z-ordering based on Y position
        const entities = [
            { type: 'dog', y: this.state.dogY, draw: () => this.drawDog() },
            { type: 'person', y: this.state.personY, draw: () => this.drawPerson() }
        ];
        entities.sort((a, b) => a.y - b.y);
        entities.forEach(entity => entity.draw());
        
        // Apply night overlay for atmosphere
        if (hours < 6 || hours >= 22) {
            this.ctx.fillStyle = 'rgba(0, 0, 50, 0.5)';
            this.ctx.fillRect(0, 0, 640, 400);
        } else if (hours >= 19 && hours < 22) {
            // Dusk
            this.ctx.fillStyle = 'rgba(0, 0, 50, 0.3)';
            this.ctx.fillRect(0, 0, 640, 400);
        } else if (hours >= 6 && hours < 8) {
            // Dawn
            this.ctx.fillStyle = 'rgba(0, 0, 50, 0.2)';
            this.ctx.fillRect(0, 0, 640, 400);
        }
        
        // Draw clock on top of everything
        this.drawClock();
        
        // Continue animation loop
        this.animationId = requestAnimationFrame((t) => this.render(t));
    }
    
    drawHouseExterior() {
        // House outline with isometric 3D perspective
        const houseLeft = 20;
        const houseRight = 620;
        const houseTop = 40;
        const houseBottom = 380;
        
        // Roof - triangular/peaked with depth
        this.ctx.fillStyle = this.colors.orange;
        this.ctx.beginPath();
        this.ctx.moveTo(320, 10);  // Peak
        this.ctx.lineTo(houseLeft - 10, houseTop);  // Left edge
        this.ctx.lineTo(houseRight + 10, houseTop); // Right edge
        this.ctx.closePath();
        this.ctx.fill();
        
        // Roof right side (darker for 3D depth)
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.beginPath();
        this.ctx.moveTo(320, 10);
        this.ctx.lineTo(houseRight + 10, houseTop);
        this.ctx.lineTo(houseRight + 14, houseTop + 4);
        this.ctx.lineTo(324, 14);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Roof shadow line
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(houseLeft - 10, houseTop, houseRight - houseLeft + 20, 4);
        
        // Left wall with shading
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(houseLeft, houseTop, 4, houseBottom - houseTop);
        
        // Right wall (darker for 3D depth)
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(houseRight - 4, houseTop, 8, houseBottom - houseTop);
        
        // Right side panel for 3D depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(houseRight + 4, houseTop + 4, 8, houseBottom - houseTop - 4);
        
        // Floor dividers (visible from outside) - at correct positions
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(houseLeft, 168, houseRight - houseLeft, 3);
        this.ctx.fillRect(houseLeft, 278, houseRight - houseLeft, 3);
        
        // Floor beams (structural)
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(houseLeft, 168, houseRight - houseLeft, 6);
        this.ctx.fillRect(houseLeft, 278, houseRight - houseLeft, 6);
        
        // Bottom floor line with shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(houseLeft, houseBottom, houseRight - houseLeft, 2);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(houseLeft, houseBottom + 2, houseRight - houseLeft, 6);
    }
    
    drawFloor(floorNum, y) {
        const height = 110;
        const leftMargin = 24;
        const rightMargin = 620;
        const floorDepth = 20;  // Isometric floor depth
        
        // Back wall with C64-style dithered wallpaper pattern
        for (let i = leftMargin; i < rightMargin; i += 8) {
            this.ctx.fillStyle = i % 16 === 0 ? this.colors.purple : this.colors.lightBlue;
            this.ctx.fillRect(i, y, 8, height - floorDepth);
        }
        
        // C64-style dithering for texture
        this.ctx.fillStyle = this.colors.purple;
        for (let px = leftMargin; px < rightMargin; px += 4) {
            for (let py = y; py < y + height - floorDepth; py += 4) {
                if ((px + py) % 8 === 0) {
                    this.ctx.fillRect(px, py, 2, 2);
                }
            }
        }
        
        // Add subtle wall details for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let i = leftMargin; i < rightMargin; i += 32) {
            this.ctx.fillRect(i, y, 1, height - floorDepth);
        }
        
        // Isometric floor - draw as trapezoid for perspective
        const floorY = y + height - floorDepth;
        
        // Floor front edge (closest to viewer) - lighter
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(leftMargin, floorY, rightMargin - leftMargin, 6);
        
        // Floor middle section
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(leftMargin, floorY + 6, rightMargin - leftMargin, 10);
        
        // Floor back edge (farthest from viewer) - darker for depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(leftMargin, floorY + 16, rightMargin - leftMargin, 4);
        
        // Wood plank lines for detail with perspective
        this.ctx.fillStyle = this.colors.darkBrown;
        for (let i = leftMargin; i < rightMargin; i += 48) {
            this.ctx.fillRect(i, floorY, 2, floorDepth);
        }
        
        // Floor baseboard shadow at wall junction
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(leftMargin, floorY, rightMargin - leftMargin, 2);
    }
    
    drawStairs(y, stairSet) {
        // Draw isometric stairs with proper 3D perspective
        const stairWidth = 60;  // Wider for better visibility
        const stairDepth = 12;  // Deeper for isometric view
        const centerX = 320 - stairWidth / 2;
        const numStairs = 8;  // More stairs between floors
        const stepHeight = 14;  // Vertical rise per step
        
        for (let i = 0; i < numStairs; i++) {
            const stairY = y + i * stepHeight;
            const perspectiveScale = 1 - (i * 0.02);  // Slight scaling for depth
            const scaledWidth = stairWidth * perspectiveScale;
            const xOffset = (stairWidth - scaledWidth) / 2;
            
            // Shadow underneath each step
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.fillRect(centerX + xOffset + 2, stairY + stairDepth + 1, scaledWidth - 2, 3);
            
            // Stair tread (top surface) - lightest
            this.ctx.fillStyle = this.colors.lightBrown;
            this.ctx.fillRect(centerX + xOffset, stairY, scaledWidth, stairDepth);
            
            // Tread highlight (front edge)
            this.ctx.fillStyle = this.colors.peach;
            this.ctx.fillRect(centerX + xOffset, stairY, scaledWidth, 2);
            
            // Stair riser (vertical face) - medium tone
            this.ctx.fillStyle = this.colors.brown;
            this.ctx.fillRect(centerX + xOffset, stairY + stairDepth, scaledWidth, stepHeight - stairDepth);
            
            // Riser shadow at bottom
            this.ctx.fillStyle = this.colors.darkBrown;
            this.ctx.fillRect(centerX + xOffset, stairY + stepHeight - 2, scaledWidth, 2);
            
            // Left side panel for 3D depth
            this.ctx.fillStyle = this.colors.darkBrown;
            this.ctx.fillRect(centerX - 4, stairY, 4, stepHeight);
            
            // Right side panel for 3D depth
            this.ctx.fillRect(centerX + stairWidth, stairY, 4, stepHeight);
        }
        
        // Bannister rails on both sides
        this.ctx.fillStyle = this.colors.darkBrown;
        for (let i = 0; i <= numStairs; i++) {
            const postY = y + i * stepHeight;
            // Left posts
            this.ctx.fillRect(centerX - 6, postY, 4, 4);
            // Right posts
            this.ctx.fillRect(centerX + stairWidth + 2, postY, 4, 4);
            
            // Post highlights for 3D
            this.ctx.fillStyle = this.colors.brown;
            this.ctx.fillRect(centerX - 6, postY, 1, 4);
            this.ctx.fillRect(centerX + stairWidth + 2, postY, 1, 4);
            this.ctx.fillStyle = this.colors.darkBrown;
        }
        
        // Top handrails
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(centerX - 6, y, 4, numStairs * stepHeight);
        this.ctx.fillRect(centerX + stairWidth + 2, y, 4, numStairs * stepHeight);
    }
    
    drawGround() {
        // Ground base with depth
        this.ctx.fillStyle = this.colors.darkGreen;
        this.ctx.fillRect(0, 380, 640, 20);
        
        // Grass pattern at bottom with texture
        for (let i = 0; i < 640; i += 16) {
            this.ctx.fillStyle = i % 32 === 0 ? this.colors.green : this.colors.darkGreen;
            this.ctx.fillRect(i, 382, 16, 18);
        }
        
        // Grass blade details
        this.ctx.fillStyle = this.colors.green;
        for (let i = 0; i < 640; i += 8) {
            this.ctx.fillRect(i + Math.random() * 4, 382 + Math.random() * 10, 1, 4);
        }
    }
    
    drawFurniture() {
        // Floor 3 - Bedroom (floor surface at y=150)
        this.drawBed(60, 125);
        this.drawNightstand(160, 135);
        this.drawDresser(430, 133);
        this.drawDogBasket(500, 135);
        this.drawWindow(550, 65);
        
        // Floor 2 - Living Room (floor surface at y=260)
        this.drawCouch(60, 220);
        this.drawTable(220, 230);
        this.drawTV(500, 218);
        this.drawBookshelf(480, 220);
        this.drawPlant(550, 232);
        this.drawWindow(550, 175);
        
        // Floor 1 - Kitchen (floor surface at y=360)
        this.drawCounter(60, 330);
        this.drawStove(140, 333);
        this.drawSink(180, 335);
        this.drawFridge(500, 308);
        this.drawDiningTable(360, 335);
        this.drawDogBowl(550, 350);
        this.drawWindow(550, 285);
    }
    
    drawBed(x, y) {
        // Shadow on floor
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 35, 64, 4);
        
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
        
        // Right side panel for 3D isometric depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 60, y + 2, 6, 32);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 60, y + 2, 6, 2);
        
        // Right side panel for 3D isometric depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 60, y + 2, 6, 32);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 60, y + 2, 6, 2);
        
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
    
    drawDogBasket(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 22, 36, 3);
        
        // Basket base (woven texture)
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y + 8, 36, 16);
        // Basket weave pattern
        this.ctx.fillStyle = this.colors.lightBrown;
        for (let i = 0; i < 36; i += 4) {
            this.ctx.fillRect(x + i, y + 8, 2, 16);
        }
        for (let i = 0; i < 16; i += 4) {
            this.ctx.fillRect(x, y + 8 + i, 36, 2);
        }
        
        // Basket rim
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x, y + 6, 36, 2);
        this.ctx.fillRect(x, y + 24, 36, 2);
        
        // Cozy blanket/cushion inside
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 4, y + 10, 28, 12);
        // Blanket folds
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x + 8, y + 12, 2, 8);
        this.ctx.fillRect(x + 18, y + 14, 2, 6);
        this.ctx.fillRect(x + 26, y + 11, 2, 9);
        
        // Side panel for 3D depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 36, y + 8, 6, 16);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 38, y + 8, 4, 16);
    }
    
    drawDresser(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 32, 46, 3);
        
        // Dresser body
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y, 44, 30);
        // Top
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x, y, 44, 3);
        
        // Drawers
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 2, y + 6, 40, 1);
        this.ctx.fillRect(x + 2, y + 14, 40, 1);
        this.ctx.fillRect(x + 2, y + 22, 40, 1);
        
        // Handles
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 20, y + 10, 4, 2);
        this.ctx.fillRect(x + 20, y + 18, 4, 2);
        this.ctx.fillRect(x + 20, y + 26, 4, 2);
        
        // Side panel for 3D
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 44, y + 2, 6, 28);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 46, y + 2, 4, 28);
    }
    
    drawCouch(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 42, 56, 3);
        
        // Base
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x, y + 20, 54, 22);
        
        // Seat cushions
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 2, y + 22, 24, 14);
        this.ctx.fillRect(x + 28, y + 22, 24, 14);
        // Cushion details
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x + 26, y + 22, 2, 14);
        
        // Back cushions
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x, y, 54, 22);
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 4, y + 4, 20, 14);
        this.ctx.fillRect(x + 30, y + 4, 20, 14);
        
        // Arms
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x - 4, y + 6, 6, 32);
        this.ctx.fillRect(x + 52, y + 6, 6, 32);
        
        // 3D side panel
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 54, y + 6, 6, 36);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 56, y + 6, 4, 36);
    }
    
    drawBookshelf(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 48, 36, 2);
        
        // Shelf structure
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y, 34, 46);
        // Shelves
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x + 2, y + 2, 30, 2);
        this.ctx.fillRect(x + 2, y + 16, 30, 2);
        this.ctx.fillRect(x + 2, y + 30, 30, 2);
        this.ctx.fillRect(x + 2, y + 44, 30, 2);
        
        // Books on shelves
        const bookColors = [this.colors.red, this.colors.blue, this.colors.green, this.colors.purple, this.colors.orange, this.colors.pink];
        for (let shelf = 0; shelf < 3; shelf++) {
            let bookX = x + 4;
            const shelfY = y + 5 + (shelf * 14);
            for (let i = 0; i < 5; i++) {
                const bookWidth = 3 + Math.floor(Math.random() * 3);
                this.ctx.fillStyle = bookColors[Math.floor(Math.random() * bookColors.length)];
                this.ctx.fillRect(bookX, shelfY, bookWidth, 10);
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(bookX, shelfY, 1, 10);
                bookX += bookWidth + 1;
            }
        }
    }
    
    drawPlant(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 18, 16, 2);
        
        // Pot
        this.ctx.fillStyle = this.colors.orange;
        this.ctx.fillRect(x + 2, y + 8, 14, 10);
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 2, y + 8, 14, 2);
        
        // Plant leaves
        this.ctx.fillStyle = this.colors.green;
        this.ctx.fillRect(x + 6, y, 6, 8);
        this.ctx.fillRect(x + 4, y + 2, 4, 6);
        this.ctx.fillRect(x + 10, y + 2, 4, 6);
        this.ctx.fillRect(x + 7, y - 2, 4, 4);
        
        // Leaf details
        this.ctx.fillStyle = this.colors.darkGreen;
        this.ctx.fillRect(x + 6, y, 1, 8);
        this.ctx.fillRect(x + 10, y + 2, 1, 6);
    }
    
    drawStove(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 28, 28, 2);
        
        // Stove body
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x, y, 28, 26);
        // Top
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x + 2, y + 2, 24, 2);
        
        // Burners
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 4, y + 6, 8, 8);
        this.ctx.fillRect(x + 16, y + 6, 8, 8);
        // Burner grates
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x + 6, y + 8, 4, 4);
        this.ctx.fillRect(x + 18, y + 8, 4, 4);
        
        // Oven door
        this.ctx.fillStyle = this.colors.mediumGray;
        this.ctx.fillRect(x + 2, y + 16, 24, 8);
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 4, y + 18, 20, 4);
        
        // Handle
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x + 10, y + 15, 8, 2);
    }
    
    drawDiningTable(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 28, 46, 2);
        
        // Table top
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x, y + 10, 44, 6);
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x, y + 10, 44, 2);
        
        // Legs
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 4, y + 16, 4, 12);
        this.ctx.fillRect(x + 36, y + 16, 4, 12);
        
        // Place setting
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 12, y + 6, 8, 6);
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x + 13, y + 7, 6, 4);
        // Fork and knife
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 10, y + 8, 1, 4);
        this.ctx.fillRect(x + 22, y + 8, 1, 4);
        
        // Side panel
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 44, y + 12, 4, 4);
    }
    
    drawDogBowl(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 1, y + 9, 14, 2);
        
        // Bowl
        this.ctx.fillStyle = this.colors.red;
        this.ctx.fillRect(x + 2, y + 2, 12, 6);
        this.ctx.fillStyle = this.colors.lightRed;
        this.ctx.fillRect(x + 2, y + 2, 12, 1);
        
        // Water/food inside
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(x + 4, y + 4, 8, 3);
        this.ctx.fillStyle = this.colors.cyan;
        this.ctx.fillRect(x + 4, y + 4, 8, 1);
    }
    
    drawClock() {
        // Clock in top-right corner
        const clockX = 540;
        const clockY = 15;
        
        // Convert game time to hours and minutes
        const totalMinutes = Math.floor(this.state.gameTime) % (24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const displayHours = hours % 12 || 12;
        const ampm = hours < 12 ? 'AM' : 'PM';
        
        // Time of day indicator
        const isNight = hours < 6 || hours >= 22;
        const isDawn = hours >= 6 && hours < 8;
        const isDusk = hours >= 19 && hours < 22;
        
        // Clock background
        this.ctx.fillStyle = isNight ? this.colors.darkGray : this.colors.mediumGray;
        this.ctx.fillRect(clockX, clockY, 85, 28);
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(clockX + 2, clockY + 2, 81, 24);
        
        // Time display
        const timeStr = `${displayHours.toString().padStart(2, ' ')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        this.ctx.fillStyle = isNight ? this.colors.cyan : this.colors.yellow;
        this.ctx.font = 'bold 12px "Courier New", monospace';
        this.ctx.fillText(timeStr, clockX + 8, clockY + 17);
        
        // Day/Night icon
        let icon = 'O';
        let iconColor = this.colors.yellow;
        if (isNight) {
            icon = 'C';
            iconColor = this.colors.cyan;
        } else if (isDawn || isDusk) {
            icon = 'D';
            iconColor = this.colors.orange;
        }
        this.ctx.fillStyle = iconColor;
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.fillText(icon, clockX + 9, clockY + 30);
        
        // Day indicator
        const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const currentDay = Math.floor(this.state.gameTime / (24 * 60)) % 7;
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.font = 'bold 10px "Courier New", monospace';
        this.ctx.fillText(dayOfWeek[currentDay], clockX + 28, clockY + 30);
    }
    
    drawWindow(x, y) {
        // Outer frame with 3D depth
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x - 2, y - 2, 44, 54);
        
        // Main frame
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x, y, 40, 50);
        // Frame inner shadow for depth
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 2, y + 48, 36, 2);
        this.ctx.fillRect(x + 36, y + 2, 2, 46);
        
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
        // Bar highlights for 3D
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 18, y + 4, 1, 42);
        this.ctx.fillRect(x + 4, y + 23, 32, 1);
        // Bar shadows for 3D
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 21, y + 4, 1, 42);
        this.ctx.fillRect(x + 4, y + 26, 32, 1);
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
        
        // Right side panel for 3D depth
        this.ctx.fillStyle = this.colors.purple;
        this.ctx.fillRect(x + 32, y + 2, 5, 38);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 34, y + 2, 3, 38);
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
        
        // Right side of table top for 3D depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 60, y + 22, 6, 6);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 60, y + 22, 6, 1);
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
        
        // TV side panel for depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 48, y + 12, 6, 40);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 50, y + 12, 4, 40);
        
        // Stand
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 18, y + 52, 12, 8);
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 18, y + 59, 12, 1);
        // Stand side
        this.ctx.fillRect(x + 30, y + 54, 4, 6);
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
        
        // Right side panel for 3D depth
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 100, y + 2, 8, 38);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 104, y + 2, 4, 38);
        
        // Countertop right edge
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 100, y, 8, 8);
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x + 104, y + 2, 4, 6);
    }
    
    drawFridge(x, y) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 2, y + 62, 36, 2);
        
        // Body
        this.ctx.fillStyle = this.colors.lightGray;
        this.ctx.fillRect(x, y, 36, 60);
        // Right side panel for 3D isometric depth
        this.ctx.fillStyle = this.colors.gray;
        this.ctx.fillRect(x + 36, y + 2, 10, 58);
        // Side panel shading for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 40, y + 2, 6, 58);
        
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
        
        // Dynamic shadow based on movement and lighting
        const shadowAlpha = 0.35 + Math.sin(this.state.idleFrame * 0.02) * 0.05;
        const shadowStretch = this.state.isWalking ? 1.2 : 1.0;
        this.ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        this.ctx.fillRect(x - 7 * shadowStretch, y + 2, 14 * shadowStretch, 3);
        
        // Enhanced breathing animation with emotional state
        const emotionalMultiplier = this.state.emotionalState === 'stressed' ? 1.5 : 
                                   this.state.emotionalState === 'tired' ? 0.7 : 1.0;
        const breathe = this.state.isWalking ? 0 : Math.sin(this.state.idleFrame * 0.05) * 0.5 * emotionalMultiplier;
        
        // Head with better shading (fixed positioning)
        this.ctx.fillStyle = this.colors.peach;
        const headX = dir === 1 ? x - 4 : x - 4;
        this.ctx.fillRect(headX, y - 20 + breathe, 8, 8);
        // Face shading for depth
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(headX, y - 20 + breathe, 1, 8);
        
        // Hair with more detail
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(headX, y - 20 + breathe, 8, 3);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(headX + 1, y - 19 + breathe, 6, 1);
        
        // Eyes with blinking animation
        const isBlinking = this.state.blinkTimer > 0;
        this.ctx.fillStyle = this.colors.black;
        if (!isBlinking) {
            if (dir === 1) {
                this.ctx.fillRect(x + 1, y - 17 + breathe, 2, 2);
                this.ctx.fillRect(x + 4, y - 17 + breathe, 1, 2);
                // Eye shine
                this.ctx.fillStyle = this.colors.white;
                this.ctx.fillRect(x + 1, y - 17 + breathe, 1, 1);
            } else {
                this.ctx.fillRect(x - 3, y - 17 + breathe, 2, 2);
                this.ctx.fillRect(x - 5, y - 17 + breathe, 1, 2);
                // Eye shine
                this.ctx.fillStyle = this.colors.white;
                this.ctx.fillRect(x - 3, y - 17 + breathe, 1, 1);
            }
        } else {
            // Closed eyes (blink)
            this.ctx.fillStyle = this.colors.darkBrown;
            if (dir === 1) {
                this.ctx.fillRect(x + 1, y - 17 + breathe, 2, 1);
                this.ctx.fillRect(x + 4, y - 17 + breathe, 1, 1);
            } else {
                this.ctx.fillRect(x - 3, y - 17 + breathe, 2, 1);
                this.ctx.fillRect(x - 5, y - 17 + breathe, 1, 1);
            }
        }
        
        // Expressive mouth based on emotional state
        this.ctx.fillStyle = this.colors.darkBrown;
        let mouthY = y - 14 + breathe;
        let mouthWidth = 2;
        
        if (this.state.emotionalState === 'happy' || this.state.mood === 'Very Happy') {
            // Big smile
            mouthY = y - 15 + breathe;
            this.ctx.fillRect(x + (dir === 1 ? 2 : -3), mouthY, 2, 1);
            this.ctx.fillRect(x + (dir === 1 ? 1 : -4), y - 14 + breathe, 1, 1);
            this.ctx.fillRect(x + (dir === 1 ? 4 : -1), y - 14 + breathe, 1, 1);
        } else if (this.state.emotionalState === 'tired' || this.state.mood === 'Tired') {
            // Small neutral mouth
            this.ctx.fillRect(x + (dir === 1 ? 2 : -3), y - 13 + breathe, 1, 1);
        } else if (this.state.emotionalState === 'stressed') {
            // Frown
            this.ctx.fillRect(x + (dir === 1 ? 1 : -4), y - 13 + breathe, 1, 1);
            this.ctx.fillRect(x + (dir === 1 ? 2 : -3), y - 12 + breathe, 2, 1);
            this.ctx.fillRect(x + (dir === 1 ? 4 : -1), y - 13 + breathe, 1, 1);
        } else {
            // Content/neutral
            this.ctx.fillRect(x + (dir === 1 ? 2 : -3), mouthY, 2, 1);
        }
        
        // Body with shading and breathing (fixed positioning)
        this.ctx.fillStyle = this.colors.purple;
        const bodyX = dir === 1 ? x - 5 : x - 5;
        this.ctx.fillRect(bodyX, y - 12 + breathe, 10, 12);
        // Body highlight
        this.ctx.fillStyle = this.colors.lightBlue;
        this.ctx.fillRect(bodyX + 1, y - 12 + breathe, 2, 10);
        // Body shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(bodyX + 8, y - 12 + breathe, 2, 12);
        
        // Arms with improved animation (fixed positioning)
        this.ctx.fillStyle = this.colors.purple;
        if (this.state.isWalking) {
            const armSwing = Math.sin(this.state.walkFrame * 0.35) * 2;
            this.ctx.fillRect(x - 7, y - 10 + armSwing, 2, 8);
            this.ctx.fillRect(x + 5, y - 10 - armSwing, 2, 8);
            // Hands
            this.ctx.fillStyle = this.colors.peach;
            this.ctx.fillRect(x - 7, y - 2 + armSwing, 2, 2);
            this.ctx.fillRect(x + 5, y - 2 - armSwing, 2, 2);
        } else {
            // Idle arm position with slight movement
            const idleArm = Math.sin(this.state.idleFrame * 0.03) * 0.5;
            this.ctx.fillRect(x - 7, y - 10 + idleArm, 2, 8);
            this.ctx.fillRect(x + 5, y - 10 + idleArm, 2, 8);
            // Hands
            this.ctx.fillStyle = this.colors.peach;
            this.ctx.fillRect(x - 7, y - 2 + idleArm, 2, 2);
            this.ctx.fillRect(x + 5, y - 2 + idleArm, 2, 2);
        }
        
        // Legs (enhanced walking animation with natural gait, fixed positioning)
        this.ctx.fillStyle = this.colors.blue;
        if (this.state.isWalking) {
            const speed = this.state.hunger < 30 ? 1.3 : 1.0;
            const legCycle = this.state.walkFrame * 0.4 * speed;
            const leftLeg = Math.sin(legCycle) * 4.5;
            const rightLeg = Math.sin(legCycle + Math.PI) * 4.5;
            const bounce = Math.abs(Math.sin(legCycle)) * 0.8;
            const bodyTilt = Math.sin(legCycle) * 0.3;
            
            this.ctx.fillRect(x - 4 + bodyTilt, y - bounce, 3, 8 + Math.max(0, leftLeg));
            this.ctx.fillRect(x + 1 + bodyTilt, y - bounce, 3, 8 + Math.max(0, rightLeg));
            
            // Shoes with highlights
            this.ctx.fillStyle = this.colors.black;
            this.ctx.fillRect(x - 4 + bodyTilt, y + 8 - bounce + Math.max(0, leftLeg), 3, 2);
            this.ctx.fillRect(x + 1 + bodyTilt, y + 8 - bounce + Math.max(0, rightLeg), 3, 2);
            // Shoe highlights
            this.ctx.fillStyle = this.colors.darkGray;
            this.ctx.fillRect(x - 4 + bodyTilt, y + 8 - bounce + Math.max(0, leftLeg), 1, 1);
            this.ctx.fillRect(x + 1 + bodyTilt, y + 8 - bounce + Math.max(0, rightLeg), 1, 1);
        } else {
            this.ctx.fillRect(x - 4, y, 3, 8);
            this.ctx.fillRect(x + 1, y, 3, 8);
            
            // Shoes
            this.ctx.fillStyle = this.colors.black;
            this.ctx.fillRect(x - 4, y + 8, 3, 2);
            this.ctx.fillRect(x + 1, y + 8, 3, 2);
        }
    }
    
    drawDog() {
        const x = Math.floor(this.state.dogX);
        const y = Math.floor(this.state.dogY);
        const time = Date.now() * 0.01;
        
        // Enhanced tail wag based on emotional state and activity
        let wagSpeed = 1.0;
        let tailWagAmount = 3;
        
        if (this.state.dogState === 'resting') {
            wagSpeed = 0.3;
            tailWagAmount = 1;
        } else if (this.state.dogState === 'drinking') {
            wagSpeed = 0.5;
            tailWagAmount = 2;
        } else if (this.state.dogEmotionalState === 'playful') {
            wagSpeed = 1.5;
            tailWagAmount = 4;
        } else if (this.state.dogEmotionalState === 'happy') {
            wagSpeed = 1.2;
            tailWagAmount = 3.5;
        } else if (this.state.dogEmotionalState === 'alert') {
            wagSpeed = 0.8;
            tailWagAmount = 2.5;
        }
        
        const tailWag = Math.sin(time * wagSpeed) * tailWagAmount;
        
        // Shadow on floor for proper 3D grounding
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(x - 9, y + 2, 18, 3);
        
        // Enhanced body with detailed shading and breathing
        const breathe = this.state.dogState === 'resting' ? Math.sin(time * 0.5) * 0.5 : 0;
        const dogBounce = this.state.dogState === 'following' ? Math.abs(Math.sin(time * 2)) * 0.3 : 0;
        
        // Body with gradient-like shading
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x - 8, y - 6 + breathe * 0.5 - dogBounce, 16, 8);
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x - 8, y - 6 + breathe * 0.5 - dogBounce, 16, 2);
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x - 8, y + 0 + breathe * 0.5 - dogBounce, 16, 1);
        
        // Belly spot with highlight
        this.ctx.fillStyle = this.colors.peach;
        this.ctx.fillRect(x - 4, y - 2 + breathe * 0.5 - dogBounce, 8, 3);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(x - 3, y - 2 + breathe * 0.5 - dogBounce, 2, 1);
        
        // Head with more detail (head down when drinking)
        const headDown = this.state.dogState === 'drinking' ? 3 : 0;
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x + 6, y - 8 + headDown, 8, 8);
        // Snout highlight
        this.ctx.fillStyle = this.colors.lightBrown;
        this.ctx.fillRect(x + 11, y - 5 + headDown, 3, 4);
        
        // Expressive ears based on emotional state
        this.ctx.fillStyle = this.colors.darkBrown;
        let earFlick = 0;
        let earPosition = 0;
        
        if (this.state.dogEmotionalState === 'alert') {
            earPosition = -1; // Ears up
            earFlick = Math.sin(time * 3) * 0.3;
        } else if (this.state.dogEmotionalState === 'playful') {
            earFlick = Math.sin(time * 2.5) * 0.8;
        } else if (this.state.dogState === 'following') {
            earFlick = Math.sin(time * 2) * 0.5;
        }
        
        this.ctx.fillRect(x + 6, y - 9 + earFlick + headDown + earPosition, 2, 3);
        this.ctx.fillRect(x + 12, y - 9 - earFlick + headDown + earPosition, 2, 3);
        // Inner ear detail
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x + 7, y - 8 + earFlick + headDown + earPosition, 1, 2);
        
        // Nose (wet looking)
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x + 13, y - 4 + headDown, 2, 2);
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 13, y - 4 + headDown, 1, 1);
        
        // Eye with shine
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x + 10, y - 6 + headDown, 2, 2);
        this.ctx.fillStyle = this.colors.white;
        this.ctx.fillRect(x + 10, y - 6 + headDown, 1, 1);
        
        // Mouth (panting when active, open when drinking)
        if (this.state.dogState === 'following' || this.state.dogState === 'drinking') {
            this.ctx.fillStyle = this.colors.pink;
            this.ctx.fillRect(x + 12, y - 2 + headDown, 2, 1);
        }
        
        // Tongue out when drinking
        if (this.state.dogState === 'drinking') {
            this.ctx.fillStyle = this.colors.pink;
            this.ctx.fillRect(x + 13, y - 1 + headDown, 2, 2);
        }
        
        // Tail with wag animation and fluff
        this.ctx.fillStyle = this.colors.darkBrown;
        this.ctx.fillRect(x - 12, y - 4 + tailWag, 4, 4);
        this.ctx.fillStyle = this.colors.brown;
        this.ctx.fillRect(x - 12, y - 4 + tailWag, 4, 1);
        // Tail tip
        this.ctx.fillStyle = this.colors.peach;
        this.ctx.fillRect(x - 13, y - 3 + tailWag, 1, 2);
        
        // Animated legs when moving
        this.ctx.fillStyle = this.colors.darkBrown;
        const legAnimation = this.state.dogState === 'following' ? Math.sin(time * 2.5) : 0;
        const frontLegOffset = legAnimation * 1.5;
        const backLegOffset = -legAnimation * 1.5;
        
        this.ctx.fillRect(x - 6, y + 2 - dogBounce, 2, 4 + Math.max(0, backLegOffset));
        this.ctx.fillRect(x - 2, y + 2 - dogBounce, 2, 4 + Math.max(0, frontLegOffset));
        this.ctx.fillRect(x + 2, y + 2 - dogBounce, 2, 4 + Math.max(0, backLegOffset));
        this.ctx.fillRect(x + 6, y + 2 - dogBounce, 2, 4 + Math.max(0, frontLegOffset));
        // Paws with toe beans and dynamic positioning
        this.ctx.fillStyle = this.colors.black;
        this.ctx.fillRect(x - 6, y + 6 - dogBounce + Math.max(0, backLegOffset), 2, 1);
        this.ctx.fillRect(x - 2, y + 6 - dogBounce + Math.max(0, frontLegOffset), 2, 1);
        this.ctx.fillRect(x + 2, y + 6 - dogBounce + Math.max(0, backLegOffset), 2, 1);
        this.ctx.fillRect(x + 6, y + 6 - dogBounce + Math.max(0, frontLegOffset), 2, 1);
        this.ctx.fillStyle = this.colors.pink;
        this.ctx.fillRect(x - 6, y + 6 - dogBounce + Math.max(0, backLegOffset), 1, 1);
        this.ctx.fillRect(x - 2, y + 6 - dogBounce + Math.max(0, frontLegOffset), 1, 1);
        this.ctx.fillRect(x + 2, y + 6 - dogBounce + Math.max(0, backLegOffset), 1, 1);
        this.ctx.fillRect(x + 6, y + 6 - dogBounce + Math.max(0, frontLegOffset), 1, 1);
    }
    
    // ===== GAME LOOP =====
    startGameLoop() {
        setInterval(() => {
            // Update game time (1 real second = 1 game minute at 60x speed)
            this.state.gameTime += (this.state.timeSpeed / 60);
            
            // Check sleep schedule
            const hours = Math.floor(this.state.gameTime / 60) % 24;
            const minutes = Math.floor(this.state.gameTime) % 60;
            const currentTimeInMinutes = (hours * 60) + minutes;
            
            // Time to sleep
            if (!this.state.isSleeping && currentTimeInMinutes >= this.state.bedtime && this.state.energy < 70) {
                this.state.isSleeping = true;
                if (!this.state.isWalking && this.state.currentAction !== 'sleep') {
                    this.walkTo('bed_sleeping', () => {
                        this.state.currentAction = 'sleep';
                        this.state.actionTimer = 999999; // Sleep until wake time
                        this.updateActivity('Sleeping');
                        this.showMessage('TIME FOR BED... ZZZZZ');
                    });
                }
            }
            
            // Time to wake up
            if (this.state.isSleeping && currentTimeInMinutes >= this.state.wakeTime && currentTimeInMinutes < this.state.bedtime) {
                this.state.isSleeping = false;
                this.state.actionTimer = 0;
                this.state.currentAction = null;
                this.showMessage('GOOD MORNING!');
            }
            
            // Slower hunger/energy drain during night, energy restoration during sleep
            const nightMultiplier = (hours >= 22 || hours < 6) ? 0.5 : 1.0;
            
            if (this.state.isSleeping && this.state.currentAction === 'sleep') {
                // Restore energy while sleeping
                this.state.energy = Math.min(100, this.state.energy + 1.5);
                this.state.hunger = Math.max(0, this.state.hunger - 0.5);
            } else {
                this.state.hunger = Math.max(0, this.state.hunger - (1.5 * nightMultiplier));
                this.state.energy = Math.max(0, this.state.energy - (0.8 * nightMultiplier));
            }
            this.updateStats();
            this.updateMood();
        }, 5000);
        
        this.animate();
    }
    
    animate() {
        // Update animation counters
        if (this.state.isWalking) {
            this.walkToTarget();
            this.state.walkFrame++;
        } else {
            this.state.idleFrame++;
        }
        
        // Blink animation
        if (this.state.blinkTimer > 0) {
            this.state.blinkTimer--;
        } else if (Math.random() > 0.98) {
            this.state.blinkTimer = 3; // Blink for 3 frames
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
        
        // Check if dog is near basket (bedroom floor 3)
        const basketX = 520;
        const basketY = 155;
        
        // Check if near water bowl (kitchen floor 1)
        const bowlX = 558;
        const bowlY = 360;
        const bowlDx = bowlX - this.state.dogX;
        const bowlDy = bowlY - this.state.dogY;
        const bowlDistance = Math.sqrt(bowlDx * bowlDx + bowlDy * bowlDy);
        
        // Dog drinks water occasionally when near bowl
        if (bowlDistance < 20 && Math.random() > 0.97 && this.state.personFloor === 1) {
            this.state.dogState = 'drinking';
            this.state.dogX = Math.max(30, Math.min(610, bowlX + (Math.random() - 0.5) * 5));
            this.state.dogY = Math.max(155, Math.min(360, bowlY + (Math.random() - 0.5) * 3));
            return;
        }
        
        // Reset drinking state after a while
        if (this.state.dogState === 'drinking' && Math.random() > 0.96) {
            this.state.dogState = 'following';
        }
        
        const basketDx = basketX - this.state.dogX;
        const basketDy = basketY - this.state.dogY;
        const basketDistance = Math.sqrt(basketDx * basketDx + basketDy * basketDy);
        
        // Enhanced intelligent dog behavior with emotional awareness
        const personIsMoving = this.state.isWalking;
        const personNeeds = (this.state.hunger + this.state.energy) / 2;
        
        if (basketDistance < 15) {
            // In basket - resting state
            this.state.dogState = 'resting';
            this.state.dogEmotionalState = 'sleepy';
            if (Math.random() > 0.99) {
                // Occasional small movement and breathing
                this.state.dogX += (Math.random() - 0.5) * 1;
                this.state.dogY += (Math.random() - 0.5) * 0.5;
            }
            // Wake up if person comes close or needs attention
            if ((distance < 40 && Math.random() > 0.95) || (personIsMoving && distance < 50 && Math.random() > 0.98)) {
                this.state.dogState = 'following';
                this.state.dogEmotionalState = 'alert';
            }
        } else if (basketDistance < 30 && this.state.personFloor === 3 && Math.random() > 0.97) {
            // Near basket, decide to rest (more likely if person is resting too)
            if (!personIsMoving || Math.random() > 0.7) {
                this.state.dogState = 'resting';
                this.state.dogX += (basketDx / basketDistance) * 1.2;
                this.state.dogY += (basketDy / basketDistance) * 1.2;
            }
        } else {
            // Enhanced following behavior with emotional intelligence
            this.state.dogState = 'following';
            const loyalty = this.state.dogLoyalty;
            const playful = this.state.dogPlayfulness;
            
            if (distance > 100) {
                // Run to catch up (person is very far)
                this.state.dogEmotionalState = 'alert';
                const catchUpSpeed = 2.0 * (1 + loyalty * 0.3);
                this.state.dogX = Math.max(30, Math.min(610, this.state.dogX + (dx / distance) * catchUpSpeed));
                this.state.dogY = Math.max(155, Math.min(360, this.state.dogY + (dy / distance) * catchUpSpeed));
            } else if (distance > 60) {
                // Trot to follow
                this.state.dogEmotionalState = 'alert';
                this.state.dogX = Math.max(30, Math.min(610, this.state.dogX + (dx / distance) * (1.2 + loyalty * 0.2)));
                this.state.dogY = Math.max(155, Math.min(360, this.state.dogY + (dy / distance) * (1.2 + loyalty * 0.2)));
            } else if (distance > 35) {
                // Walk slowly, occasionally look around
                this.state.dogEmotionalState = 'happy';
                const baseSpeed = 0.6;
                const wanderX = Math.sin(Date.now() * 0.001) * 0.1;
                const wanderY = Math.cos(Date.now() * 0.001) * 0.1;
                this.state.dogX = Math.max(30, Math.min(610, this.state.dogX + (dx / distance) * baseSpeed + wanderX));
                this.state.dogY = Math.max(155, Math.min(360, this.state.dogY + (dy / distance) * baseSpeed + wanderY));
            } else if (distance < 25 && Math.random() > 0.96) {
                // Close to person - play or explore based on playfulness
                if (playful > 0.7 && Math.random() > 0.5) {
                    this.state.dogState = 'playing';
                    this.state.dogEmotionalState = 'playful';
                    // Playful circle movement around person
                    const angle = Date.now() * 0.002;
                    this.state.dogX += Math.cos(angle) * 2;
                    this.state.dogY += Math.sin(angle) * 1;
                } else if (Math.random() > 0.6 && this.state.personFloor === 3) {
                    // Sometimes go to basket when tired
                    this.state.dogEmotionalState = 'sleepy';
                    this.state.dogX += (basketDx / basketDistance) * 0.8;
                    this.state.dogY += (basketDy / basketDistance) * 0.8;
                } else {
                    // Random playful movement (bounded)
                    this.state.dogX = Math.max(30, Math.min(610, this.state.dogX + (Math.random() - 0.5) * (2 + playful)));
                    this.state.dogY = Math.max(155, Math.min(360, this.state.dogY + (Math.random() - 0.5) * (2 + playful)));
                }
            }
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    // ===== AI SYSTEM =====
    startAI() {
        setInterval(() => {
            // Don't make decisions during sleep time
            if (!this.state.isWalking && !this.state.currentAction && !this.state.isSleeping) {
                this.makeDecision();
            }
        }, 4000);
    }
    
    makeDecision() {
        let decisions = [];
        const p = this.state.personality;
        const now = Date.now();
        const emotional = this.state.emotionalState;
        
        // Time of day awareness
        const hours = Math.floor(this.state.gameTime / 60) % 24;
        const isNight = hours >= 22 || hours < 6;
        const isEvening = hours >= 18 && hours < 22;
        const isMorning = hours >= 6 && hours < 12;
        
        // Emotional state affects decision priorities
        const stressMultiplier = emotional === 'stressed' ? 1.5 : 1.0;
        const happyBonus = emotional === 'happy' ? 20 : 0;
        
        // Critical needs override everything (stress increases urgency)
        if (this.state.hunger < 20) {
            decisions.push({ action: 'eat', priority: 150 * stressMultiplier, location: 'fridge_eating' });
        }
        if (this.state.energy < 15 || (isNight && this.state.energy < 50)) {
            decisions.push({ action: 'sleep', priority: 150 * stressMultiplier, location: 'bed_sleeping' });
        }
        
        // Evening tiredness
        if (isEvening && this.state.energy < 60) {
            decisions.push({ action: 'sleep', priority: 100, location: 'bed_sleeping' });
        }
        
        // High priority needs based on personality
        const hungerThreshold = 30 + (p.hunger_tolerance * 40);
        if (this.state.hunger < hungerThreshold) {
            decisions.push({ action: 'eat', priority: 80 + (70 - this.state.hunger), location: 'fridge_eating' });
        }
        
        const energyThreshold = 25 + (p.energy_need * 35);
        if (this.state.energy < energyThreshold) {
            decisions.push({ action: 'sleep', priority: 70 + (60 - this.state.energy), location: 'bed_sleeping' });
        }
        
        // Medium priority needs
        if (this.state.hunger < 65) {
            decisions.push({ action: 'eat', priority: 40 + Math.random() * 20, location: 'dining_area' });
        }
        if (this.state.energy < 55) {
            decisions.push({ action: 'rest', priority: 35 + Math.random() * 15, location: 'couch' });
        }
        
        // Home activities
        if (this.state.hunger > 50 && Math.random() > 0.7) {
            decisions.push({ action: 'cook', priority: 25 + Math.random() * 15, location: 'cooking_area' });
        }
        
        // Social and entertainment needs (reduced TV frequency)
        const timeSinceLastDecision = now - this.state.lastDecisionTime;
        
        // TV watching preference (only if they like TV and not too often)
        if (this.state.energy > 40 && this.state.hunger > 40 && Math.random() > 0.6) {
            decisions.push({ action: 'watch_tv', priority: 15 + (p.tv_preference * 25), location: 'tv_watching' });
        }
        
        // Social behaviors when happy
        if (emotional === 'happy' && Math.random() > 0.6) {
            decisions.push({ action: 'wander', priority: 30 + happyBonus, location: 'window_view' });
        }
        
        // Morning routine
        if (isMorning && this.state.energy > 50 && Math.random() > 0.7) {
            decisions.push({ action: 'eat', priority: 50, location: 'dining_area' });
        }
        
        // Evening relaxation (more variety)
        if (isEvening && this.state.energy > 30) {
            if (p.tv_preference > 0.6) {
                decisions.push({ action: 'watch_tv', priority: 45 + (p.tv_preference * 15), location: 'tv_watching' });
            }
            decisions.push({ action: 'read', priority: 50, location: 'reading_spot' });
            decisions.push({ action: 'rest', priority: 48, location: 'couch' });
        }
        
        // Reading books (higher priority)
        if (this.state.energy > 30 && Math.random() > 0.5) {
            decisions.push({ action: 'read', priority: 35 + Math.random() * 15, location: 'reading_spot' });
        }
        
        // Browse bookshelf
        if (Math.random() > 0.8) {
            decisions.push({ action: 'browse_books', priority: 15 + Math.random() * 10, location: 'bookshelf' });
        }
        
        // Dog rests in basket sometimes
        if (Math.random() > 0.7) {
            decisions.push({ action: 'wander', priority: Math.random() * 25, location: 'dogbasket' });
        }
        
        // Random exploration
        decisions.push({ action: 'wander', priority: 10 + Math.random() * 20, location: this.getRandomLocation() });
        
        decisions.sort((a, b) => b.priority - a.priority);
        
        if (decisions.length > 0) {
            this.state.lastDecisionTime = now;
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
        const messages = {
            eat: ['ENJOYING A DELICIOUS MEAL!', 'MMM... TASTY!', 'EATING HAPPILY', 'YUM YUM!'],
            sleep: ['SLEEPING SOUNDLY...', 'ZZZZZ...', 'HAVING SWEET DREAMS', 'RESTING PEACEFULLY'],
            rest: ['RELAXING ON THE COUCH', 'TAKING A BREAK', 'FEELING COMFORTABLE', 'RESTING'],
            watch_tv: ['WATCHING FAVORITE SHOW', 'ENJOYING THE PROGRAM', 'TV TIME!', 'ENTERTAINED'],
            read: ['READING A GOOD BOOK', 'ENJOYING A STORY', 'LEARNING SOMETHING NEW', 'ABSORBED IN READING'],
            cook: ['COOKING SOMETHING TASTY', 'PREPARING A MEAL', 'CHEF AT WORK', 'MAKING DINNER'],
            browse_books: ['CHOOSING A BOOK', 'LOOKING AT TITLES', 'BROWSING THE COLLECTION'],
            wander: ['EXPLORING THE HOUSE', 'JUST WANDERING', 'THINKING ABOUT THINGS', 'STROLLING AROUND']
        };
        
        switch(action) {
            case 'eat':
                this.state.actionTimer = 120; // 2 game hours (2 real minutes)
                this.state.hunger = Math.min(100, this.state.hunger + 35);
                this.updateActivity('Eating');
                this.showMessage(messages.eat[Math.floor(Math.random() * messages.eat.length)]);
                break;
            case 'sleep':
                this.state.actionTimer = 999999; // Sleep until wake time
                this.state.energy = Math.min(100, this.state.energy + 2); // Gradual restoration
                this.updateActivity('Sleeping');
                this.showMessage(messages.sleep[Math.floor(Math.random() * messages.sleep.length)]);
                break;
            case 'rest':
                this.state.actionTimer = 90; // 1.5 game hours
                this.state.energy = Math.min(100, this.state.energy + 20);
                this.updateActivity('Resting');
                this.showMessage(messages.rest[Math.floor(Math.random() * messages.rest.length)]);
                break;
            case 'watch_tv':
                this.state.actionTimer = 180; // 3 game hours (3 real minutes)
                this.state.energy = Math.min(100, this.state.energy + 8);
                this.updateActivity('Watching TV');
                this.showMessage(messages.watch_tv[Math.floor(Math.random() * messages.watch_tv.length)]);
                break;
            case 'read':
                this.state.actionTimer = 150; // 2.5 game hours
                this.state.energy = Math.min(100, this.state.energy + 12);
                this.updateActivity('Reading');
                this.showMessage(messages.read[Math.floor(Math.random() * messages.read.length)]);
                break;
            case 'cook':
                this.state.actionTimer = 90; // 1.5 game hours (cooking time)
                this.state.hunger = Math.min(100, this.state.hunger + 25);
                this.updateActivity('Cooking');
                this.showMessage('COOKING SOMETHING DELICIOUS!');
                break;
            case 'browse_books':
                this.state.actionTimer = 60; // 1 game hour
                this.state.energy = Math.min(100, this.state.energy + 8);
                this.updateActivity('Browsing Books');
                this.showMessage('LOOKING FOR A GOOD BOOK');
                break;
            case 'wander':
                this.state.actionTimer = 45; // 45 game minutes
                this.updateActivity('Wandering');
                const msg = messages.wander[Math.floor(Math.random() * messages.wander.length)];
                if (Math.random() > 0.5) this.showMessage(msg);
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
        
        // Smooth deceleration near target with personality
        const arrivalThreshold = 3;
        const baseSpeed = 2.2 + (this.state.energy / 100) * 0.8; // Speed varies with energy
        const speed = this.state.hunger < 30 ? baseSpeed * 1.3 : baseSpeed; // Faster when hungry
        const adjustedSpeed = distance < 20 ? speed * (distance / 20) * 0.8 : speed;
        
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
        
        // Update emotional state based on conditions
        if (avg > 75) {
            this.state.emotionalState = 'happy';
        } else if (avg > 50) {
            this.state.emotionalState = 'content';
        } else if (avg > 30) {
            this.state.emotionalState = 'neutral';
        } else if (avg > 15) {
            this.state.emotionalState = 'tired';
        } else {
            this.state.emotionalState = 'stressed';
        }
        
        // Update dog emotional state
        const timeSinceInteraction = Date.now() - this.state.lastInteractionTime;
        if (this.state.dogState === 'playing') {
            this.state.dogEmotionalState = 'playful';
        } else if (this.state.dogState === 'resting') {
            this.state.dogEmotionalState = 'sleepy';
        } else if (timeSinceInteraction < 5000) {
            this.state.dogEmotionalState = 'happy';
        } else {
            this.state.dogEmotionalState = 'alert';
        }
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
        this.state.emotionalState = 'content';
        this.state.lastInteractionTime = Date.now();
        this.updateStats();
        this.updateMood();
    }
    
    giveFood() {
        this.showMessage('DELICIOUS! THANK YOU!');
        this.state.hunger = Math.min(100, this.state.hunger + 40);
        this.state.emotionalState = 'happy';
        this.state.lastInteractionTime = Date.now();
        // Dog gets excited when person gets food
        this.state.dogEmotionalState = 'playful';
        this.updateStats();
        this.updateMood();
    }
    
    playMusic() {
        this.showMessage('ENJOYING THE MUSIC!');
        this.state.energy = Math.min(100, this.state.energy + 12);
        this.state.emotionalState = 'happy';
        this.state.lastInteractionTime = Date.now();
        // Dog reacts to music
        this.state.dogEmotionalState = 'playful';
        this.updateStats();
        this.updateMood();
    }
    
    callPerson() {
        this.showMessage('WAVES AT YOU!');
        this.state.energy = Math.min(100, this.state.energy + 8);
        this.state.emotionalState = 'happy';
        this.state.lastInteractionTime = Date.now();
        // Dog comes closer when called
        if (this.state.dogState !== 'drinking') {
            this.state.dogEmotionalState = 'happy';
            this.state.dogState = 'following';
        }
        this.updateStats();
        this.updateMood();
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new LittleComputerPeople();
});
