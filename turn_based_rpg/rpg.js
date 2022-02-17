function gameInit() {
    var canvas = document.getElementById('canvas'),
        context = canvas.getContext('2d'),
        template_class_stats = JSON.parse(document.getElementById('template_class_stats').innerHTML);
    
    const BASE_HEIGHT  = 500, ENTITY_DIM = { dx : 50, dy : 100 }, HEALTH_BAR_DIM = { dx : 120, dy : 10 },
        HEALTH_DROP_SPEED = 0.003, X_OFFSET = 130, ENTITY_OFFSET = 170;
    
    class Vector2F {
        constructor (x, y) {
            this.x = x; this.y = y;
        }
        translate(vec) {
            return new Vector2F(this.x + vec.x, this.y + vec.y);
        }
    }
    const ENTITY_TO_HEALTH_BAR_OFFSET = new Vector2F(-35, -35);
    class Entity {
        constructor (Xpos, level, health, hit_damage, hit_chance, crit_damage, 
            crit_chance, dodge_chance) {
            
            this.level = level;
            this.position = new Vector2F(Xpos, BASE_HEIGHT);
            this.max_health = health; this.health = this.max_health; this.hit_damage = hit_damage;
            this.hit_chance = hit_chance; this.crit_damage = crit_damage; 
            this.crit_chance = crit_chance; this.dodge_chance = dodge_chance;
            this.statusEffects = [];
        }
        // NEED TO REPLACE IN HTTP_CLIENT
        hasIntersection(point2F) {
            return (this.position.x < point2F.x && this.position.y < point2F.y 
                && (this.position.x + ENTITY_DIM.dx) > point2F.x  && 
                (this.position.y + ENTITY_DIM.dy) > point2F.y);
        }
        dealDamage(entitycast, damage) {
            var combined_hitchance = (1.0 - this.dodge_chance) * entitycast.hit_chance;
            var doHit = (Math.random() < combined_hitchance) ? true : false;
            if (doHit) {
                console.log("Is a hit!");
                console.log (this.health); console.log(damage);
                var newHealth = Math.max(0, this.health - damage);
                var healthbaranimate = new HealthBarAnimation(this.position, this.max_health, this.health, newHealth);
                this.health = newHealth;
            }
            else {
                console.log("Is a miss!");
            }
        }
    }
    class SkillInfo {
        constructor (skillName, targetType, skillProc) {
            this.skillName =skillName; this.targetType = targetType; this.skillProc = skillProc;
        }
    }
    class TemplateClass extends Entity {
        static normalAttack = new SkillInfo('normalAttack', undefined, TemplateClass.normalAttackProc);
        static normalAttackProc(entitycast, entity) {
            entity.dealDamage(entitycast, entitycast.hit_damage);
        }
        constructor (Xpos, level, normalAttackType, classObj) {
            var level_stats = (-1 == level) ? template_class_stats[template_class_stats.length -1] : 
                template_class_stats[level - 1];
            super(Xpos, level_stats['level'], level_stats['health'], level_stats['hit_damage'],
                level_stats['hit_chance'], level_stats['crit_damage'], level_stats['crit_chance'],
                level_stats['dodge_chance']);
            this.statusEffects = [];
            this.normalAttackType = normalAttackType;
            this.classObj = classObj;
        }
        findstatusEffect(statusEffectName) {
            var i = -1;
            for (var j=0; j< this.statusEffects.length; j++) {
                if (statusEffectName == this.statusEffects[j]) {
                    i = j; break;
                }
            }
            return i;
        }
        addstatusEffect(statusEffectName) {
            for (var j=0; i< this.statusEffects.length; j++) {
                if (undefined === this.statusEffects[j]) {
                    this.statusEffects[j] = statusEffectName; return;
                }
            }
            this.statusEffects.push(statusEffectName);
        }
        applySkillEffects(skillIndex, index) {
            var skill = (skillIndex > -1) ? this.classObj.skills[skillIndex] : TemplateClass.normalAttack;
            if (!TemplateClass.verifySkillCastingIndex(skill, index)) return false;
            var attackType = (undefined === skill.attackType) ? this.normalAttackType : skill.targetType;
            switch (attackType) {
                case 'multi':
                    skill.skillProc(this, g_EnemyArrray);
                    break;
                case 'single':
                    if (-1 != index) skill.skillProc(this, g_EnemyArrray[index]);
                    else {
                        return false;
                    }
                    break;
                case 'multi-ally':
                    skill.skillProc(this, g_AlliesArray);
                    break;
                case 'single-ally':
                    if (-1 != index) skill.skillProc(this, g_AlliesArray[index]);
                    else {
                        return false;
                    }
                    break;
            }
            return true;
        }
        static verifySkillCastingIndex(skill, index) {
            if ("single" === skill.targetType) return (index > -1 && index < g_EnemyArrray.length);
            else if ("single-ally" == skill.targetType) return (index > -1 && index < g_AlliesArray.length);
            return true;
        }
    }
    class DummyClass extends TemplateClass {
        constructor (Xpos) {
            super(Xpos, -1, undefined, DummyClass);
        }
    }
    class MageClass extends TemplateClass {
        static skills = [new SkillInfo('Fire Blast', 'single', MageClass.fireBlastProc),
            new SkillInfo('Ice Shard', 'single', MageClass.iceShardProc),
            new SkillInfo('Explosion', 'multi', MageClass.explosionProc)];

        static fireBlastProc(entitycast, entity) {
            var i = entity.findstatusEffect('Frozen Blood'), damage = 432;         
            if (-1 != i)  {
                damage *= 1.75; delete entity.statusEffects[i];
            }
            else {
                i = entity.findstatusEffect('Scorched');
                if (-1 == i) entity.addstatusEffect('Scorched');
            }
            entity.dealDamage(entitycast, damage);
        }
        static iceShardProc(entitycast, entity) {
            var i = entity.findstatusEffect('Scorched'), damage = 321;
            if (-1 != i) {
                damage *= 1.25; delete entity.statusEffects[i];
            }
            else {
                i = entity.findstatusEffect('Frozen Blood');
                if (-1 == i) entity.addstatusEffect('Frozen Blood');
            }
            entity.dealDamage(entitycast, damage);
        }
        static explosionProc(entitycast, entityArray) {
            for(var i=0; i<entityArray.length; i++) {
                entityArray[i].dealDamage(entitycast, 221);
            }
        }
        constructor (Xpos, level) {
            super(Xpos, level, 'single', MageClass);
        }
    }
    function renderEntities(entityArray, color) {
        var healthBarPosition;
        context.save();
        for (i=0; i<entityArray.length; i++) {
            context.fillStyle = color;
            context.fillRect(entityArray[i].position.x, entityArray[i].position.y, 
                ENTITY_DIM.dx, ENTITY_DIM.dy);
            context.fillStyle = 'green';
            healthBarPosition = entityArray[i].position.translate(ENTITY_TO_HEALTH_BAR_OFFSET);
            context.fillRect(healthBarPosition.x, healthBarPosition.y, HEALTH_BAR_DIM.dx,
                HEALTH_BAR_DIM.dy);
        }
    }
    function findEntityFromPoint(entityArray, point2F) {
        var returnIndex = -1;
        entityArray.forEach(function(item, index) {
            if (item.hasIntersection(point2F)) returnIndex = index;
        });
        return returnIndex;
    }
    function selectEntityMouseEvent(event) {
        var tempIndex; var canvasEventPos = new Vector2F(event.layerX, event.layerY);
        if (1 == event.which) {
            tempIndex = findEntityFromPoint(g_EnemyArrray, canvasEventPos);
            if (-1 != tempIndex) g_enemyIndex = tempIndex;
            tempIndex = findEntityFromPoint(g_AlliesArray, canvasEventPos);
            if (-1 != tempIndex) g_allyIndex = tempIndex; 
        }
    }
    function playerControlKeyboardEvent(event) {
        var skillProcSucccess = undefined;
        if (g_allyIndex > -1 && g_allyIndex < g_AlliesArray.length && g_isYourTurn)
        {
            switch (event.key) {
                case 'q':
                    skillProcSucccess = g_AlliesArray[g_allyIndex].applySkillEffects(0, g_enemyIndex);
                    break;
                case 'w':
                    skillProcSucccess = g_AlliesArray[g_allyIndex].applySkillEffects(1, g_enemyIndex);
                    break;
                case 'e':
                    skillProcSucccess = g_AlliesArray[g_allyIndex].applySkillEffects(2, g_enemyIndex);
                    break;
                case 'r': 
                    skillProcSucccess = g_AlliesArray[g_allyIndex].applySkillEffects(3, g_enemyIndex);
                    break;
                default:
                    skillProcSucccess  = false;
            }
        }
        if (undefined === skillProcSucccess || !skillProcSucccess) console.log("Failed to cast skill! g_allyIndex: " + g_allyIndex + 
             ", g_enemyIndex: " + g_enemyIndex + ", g_isYourTurn: " + g_isYourTurn);
        else if (undefined !== skillProcSucccess) g_hasCasted = skillProcSucccess;
    }
    var g_AlliesArray = [], g_EnemyArrray = [], g_allyIndex = -1, g_enemyIndex = -1;
     
    var g_hasCasted = false, g_isYourTurn = true;
    
    g_EnemyArrray.push(new DummyClass(canvas.width - X_OFFSET));
    g_AlliesArray.push(new MageClass(X_OFFSET + ENTITY_OFFSET, 10));

    renderEntities(g_AlliesArray, 'green'); renderEntities(g_EnemyArrray, 'orange');

    canvas.addEventListener('mouseup', selectEntityMouseEvent);
    window.addEventListener('keyup', playerControlKeyboardEvent);

    function gameloop() {
        Animation.paintAnimations();
        update_game();
        window.requestAnimationFrame(gameloop);
    }
    function update_game() {
        if (g_hasCasted) {
            g_hasCasted = false; g_isYourTurn = !g_isYourTurn;
        }
    }
    window.requestAnimationFrame(gameloop);
}

window.addEventListener('load', gameInit);