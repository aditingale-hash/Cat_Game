const ROOM_DATA = {
    1: {
      bgKey:   'bg1',
      timeLimit: 20,
      objects: [
        { x:400,y:300,question:'What is len([1,2,3,4])?', answer:'4' },
        { x:600,y:250,question:'What is 2 + 3 * 4?',      answer:'14' },
        { x:200,y:400,question:'What is len([10,20])?',    answer:'2'  }
      ]
    },
    2: {
      bgKey:   'bg2',
      timeLimit: 20,
      objects: [
        { x:400,y:300,question:'What is 5 - 2?',        answer:'3' },
        { x:650,y:350,question:'What is 3 * 3?',        answer:'9' },
        { x:150,y:250,question:'What is len("cat")?',   answer:'3' }
      ]
    }
  };
  
  class MainScene extends Phaser.Scene {
    constructor() {
      super('MainScene');
      this.asking = false;
      this.answer = '';
    }
  
    preload() {
      this.load.image('bg1',  'assets/room1.png');
      this.load.image('bg2',  'assets/room2.png');
      this.load.image('cat',  'assets/cat.png');
      this.load.image('box',  'assets/box.png');
      this.load.image('food', 'assets/food.png');
    }
  
    create() {
      this.currentRoom = 1;
      this.currentObj  = 0;
      this.points      = 0;
      this.cursors     = this.input.keyboard.createCursorKeys();
  
      this.createScoreboard();
      this.initRoom();
      this.spawnCurrentObject();
      this.startTimer();
  
      this.scale.on('resize', () => {
        this.redrawScoreboard();
        this.redrawTimer();
        this.initRoom();
        this.spawnCurrentObject();
      });
    }
  
    initRoom() {
      this.bgSprite?.destroy();
      this.cat?.destroy();
      this.box?.destroy();
  
      const bg = ROOM_DATA[this.currentRoom].bgKey;
      this.bgSprite = this.add.image(
        this.scale.width/2, this.scale.height/2, bg
      ).setDisplaySize(this.scale.width, this.scale.height);
  
      this.cat = this.physics.add.sprite(
        100, this.scale.height - 120, 'cat'
      ).setScale(0.1)
       .setOrigin(0.5,1)
       .setCollideWorldBounds(true);
    }
  
    spawnCurrentObject() {
      const objs = ROOM_DATA[this.currentRoom].objects;
      if (this.currentObj >= objs.length) {
        return this.onRoomComplete();
      }
  
      this.box?.destroy();
      const { x,y } = objs[this.currentObj];
      this.box = this.physics.add.staticSprite(x,y,'box')
        .setScale(0.1)
        .refreshBody();
  
      this.physics.add.overlap(this.cat, this.box, () => {
        if (!this.asking) this.showQuestionDialog();
      });
  
      this.updateScoreboard();
    }
  
    update() {
      if (this.asking) return this.cat.setVelocity(0);
      const speed = 200;
      let vx=0, vy=0;
      if (this.cursors.left.isDown)  vx=-speed;
      if (this.cursors.right.isDown) vx=speed;
      if (this.cursors.up.isDown)    vy=-speed;
      if (this.cursors.down.isDown)  vy=speed;
      this.cat.setVelocity(vx, vy);
    }
  
    showQuestionDialog() {
      this.asking = true;
      this.answer = '';
      this.cat.setVelocity(0);
  
      this.qOverlay = this.add.graphics()
        .fillStyle(0x000000,0.5)
        .fillRect(0,0,this.scale.width,this.scale.height);
  
      this.qBox = this.add.graphics()
        .fillStyle(0xfff0f5,1)
        .lineStyle(4,0xff69b4,1)
        .fillRoundedRect(
          this.scale.width/2-250,
          this.scale.height/2-100,
          500,200,24
        )
        .strokeRoundedRect(
          this.scale.width/2-250,
          this.scale.height/2-100,
          500,200,24
        );
  
      const q = ROOM_DATA[this.currentRoom].objects[this.currentObj].question;
      this.qText = this.add.text(
        this.scale.width/2-220,
        this.scale.height/2-70,
        `🐱  ${q}`, {
          fontFamily:'Comic Sans MS', fontSize:'22px', color:'#333'
        }
      );
      this.ansText = this.add.text(
        this.scale.width/2-220,
        this.scale.height/2-10,
        '_', {
          fontFamily:'Comic Sans MS', fontSize:'28px', color:'#aa0044'
        }
      );
      this.input.keyboard.on('keydown', this.handleKey, this);
    }
  
    handleKey(e) {
      if (!this.asking) return;
      if (e.key==='Backspace') this.answer=this.answer.slice(0,-1);
      else if (e.key==='Enter') return this.checkAnswer();
      else if (e.key.length===1) this.answer+=e.key;
      this.ansText.setText(this.answer + '_');
    }
  
    checkAnswer() {
      const correct = ROOM_DATA[this.currentRoom].objects[this.currentObj].answer;
      if (this.answer.trim()===correct) {
        this.showPopup('✅ Correct!',0xd4f4dd,0x2e8b57,true);
      } else {
        this.showPopup('😿 Try again!',0xffe4e1,0xdc143c,false);
      }
    }
  
    showPopup(text,bg,stroke,isOK) {
      const W=400,H=100;
      const x=this.scale.width/2-W/2,
            y=this.scale.height/2-H/2;
      this.popupBg = this.add.graphics()
        .fillStyle(bg,1)
        .lineStyle(4,stroke,1)
        .fillRoundedRect(x,y,W,H,20)
        .strokeRoundedRect(x,y,W,H,20);
  
      this.popupText = this.add.text(
        this.scale.width/2,
        this.scale.height/2,
        text,{
          fontFamily:'Comic Sans MS',
          fontSize:'28px',
          color:'#333',
          align:'center'
        }
      ).setOrigin(0.5);
  
      this.tweens.add({
        targets:[this.popupBg,this.popupText],
        alpha:0,delay:1000,duration:800,
        onComplete:()=>{
          this.popupBg.destroy();
          this.popupText.destroy();
          this.cleanupDialog();
          if(isOK) this.onCorrect();
        }
      });
    }
  
    onCorrect() {
      const { x,y } = ROOM_DATA[this.currentRoom].objects[this.currentObj];
      const food = this.physics.add.sprite(x,y,'food')
        .setScale(0.15).setDepth(5);
      this.tweens.add({
        targets:food,
        x:this.cat.x,y:this.cat.y,
        ease:'Cubic.easeInOut',duration:800,
        onComplete:()=>food.destroy()
      });
      this.box.destroy();
      this.currentObj++;
      this.points++;
      this.time.delayedCall(800,()=>{
        this.spawnCurrentObject();
        this.updateScoreboard();
      });
    }
  
    cleanupDialog() {
      this.asking=false;
      this.input.keyboard.off('keydown',this.handleKey,this);
      this.qOverlay?.destroy();
      this.qBox?.destroy();
      this.qText?.destroy();
      this.ansText?.destroy();
    }
  
    onRoomComplete() {
      this.timerEvent.remove();
      this.showPopup('🎉 Room Complete!',0xffe4e1,0x8b008b,false);
      this.time.delayedCall(2000,()=>{
        if(this.currentRoom===2) return;
        this.currentRoom++;
        this.currentObj=0;
        this.points=0;
        this.initRoom();
        this.spawnCurrentObject();
        this.updateScoreboard();
        this.startTimer();
      });
    }
  
    startTimer() {
      this.timeLeft = ROOM_DATA[this.currentRoom].timeLimit;
      // Timer badge
      this.redrawTimer();
      this.timerEvent = this.time.addEvent({
        delay:1000,loop:true,callback:()=>{
          this.timeLeft--;
          this.timerText.setText(`⏱ ${this.timeLeft}s`);
          if(this.timeLeft<10) this.timerText.setColor('#ff4444');
          if(this.timeLeft<=0){
            this.timerEvent.remove();
            this.showPopup('⏰ Time\'s up!\nRestarting...',0x000000,0xff0000,false);
            this.time.delayedCall(2000,() => {
              this.currentRoom=1;
              this.currentObj=0;
              this.points=0;
              this.initRoom();
              this.spawnCurrentObject();
              this.updateScoreboard();
              this.startTimer();
            });
          }
        }
      });
    }
  
    redrawTimer() {
      const W=140,H=50, x=this.scale.width-W-20, y=20;
      if(this.timerBg) this.timerBg.clear();
      else this.timerBg=this.add.graphics().setDepth(10).setScrollFactor(0);
      this.timerBg
        .fillStyle(0xfff8dc,1)
        .lineStyle(3,0xffd700,1)
        .fillRoundedRect(x,y,W,H,12)
        .strokeRoundedRect(x,y,W,H,12);
  
      if(!this.timerText) {
        this.timerText = this.add.text(x+W/2, y+H/2, `⏱ ${this.timeLeft||ROOM_DATA[this.currentRoom].timeLimit}s`, {
          fontFamily:'Arial',fontSize:'22px',color:'#333'
        }).setOrigin(0.5).setDepth(11).setScrollFactor(0);
      } else {
        this.timerText.setPosition(x+W/2, y+H/2);
      }
    }
  
    createScoreboard() {
      // Score + progress UI
      this.scoreBg = this.add.graphics()
        .fillStyle(0xfff0f5,0.8)
        .lineStyle(3,0xff69b4,2)
        .fillRoundedRect(0,0,200,90,12)
        .strokeRoundedRect(0,0,200,90,12)
        .setDepth(10).setScrollFactor(0);
  
      this.scoreText = this.add.text(100,30,'',{
        fontFamily:'Arial',fontSize:'20px',color:'#333'
      }).setOrigin(0.5).setDepth(11).setScrollFactor(0);
  
      this.progressBg = this.add.graphics()
        .fillStyle(0xffffff,0.2)
        .fillRoundedRect(20,60,160,16,8)
        .setDepth(10).setScrollFactor(0);
  
      this.progressFill = this.add.graphics().setDepth(11).setScrollFactor(0);
  
      this.updateScoreboard();
    }
  
    updateScoreboard() {
      this.scoreText.setText(`Score: ${this.points}`);
      const total=ROOM_DATA[this.currentRoom].objects.length;
      const done=this.currentObj;
      const w=Math.floor((done/total)*160);
      this.progressFill.clear()
        .fillStyle(0x00ff00,1)
        .fillRoundedRect(20,60,w,16,8);
    }
  
    redrawScoreboard() {
      // reposition on resize
      // scoreBg & text stay at top-left, timer at top-right
      this.scoreBg.setPosition(0,0);
      this.scoreText.setPosition(100,30);
      this.progressBg.setPosition(0,0);
      this.updateScoreboard();
    }
  }
  
  const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    width: 800, height: 600,
    physics: { default:'arcade', arcade:{ debug:false } },
    scene: MainScene
  };
  
  new Phaser.Game(config);
  