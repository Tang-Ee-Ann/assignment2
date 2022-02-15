import json
import math

class rpg_class:
    def __init__(self, level, health, hit_damage, hit_chance, crit_damage,
        crit_chance, dodge_chance):
        self.level = level
        self.health = health
        self.hit_damage = hit_damage
        self.hit_chance = hit_chance
        self.crit_damage = crit_damage
        self.crit_chance = crit_chance
        self.dodge_chance = dodge_chance
    def to_list(self):
        return {"level" : self.level, "health": self.health, "hit_damage": self.hit_damage,
            "hit_chance": self.hit_chance, "crit_damage": self.crit_damage,
            "crit_chance": self.crit_chance, "dodge_chance": self.dodge_chance}


def rpg_class_get_health(level):
    return math.floor(727 + math.sqrt(210947 * math.pow(level, 0.34)))

def rpg_class_get_chance(level):
    return 0.15 + math.sqrt(0.000229 * math.pow(level, 1.14))

def rpg_class_get_hitchance(level):
    return 0.75 + 3 *math.sqrt(0.000229 * math.pow(level, 1.14))

template_class = []

for i in range(1, 11):
    template_class.append(rpg_class(i, rpg_class_get_health(i),
        300, rpg_class_get_hitchance(i),400, rpg_class_get_chance(i),
        rpg_class_get_chance(i)).to_list())

with open('template_class.json', 'w') as json_file:
    json_file.write(json.dumps(template_class))
