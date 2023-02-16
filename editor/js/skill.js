/**
 * Represents the data for a dynamic skill
 *
 * @param {string} name - the name of the skill
 *
 * @constructor
 */
function Skill(name) {
    this.components = [];

    // Included to simplify code when adding components
    this.html = document.getElementById('builderContent');

    this.dataKey = 'attributes';
    this.componentKey = 'components';

    // Skill data
    this.data = [
        new StringValue('技能名字', 'name', name).setTooltip('技能内部名称。这不应使用颜色代码'),
        new StringValue('类型', 'type', 'Dynamic').setTooltip('描述技能的类型，例如“AOE/单体”或自定义内容 (填啥都行 只是描述)'),
        new IntValue('最高等级', 'max-level', 5).setTooltip('技能的最高等级'),
        new ListValue('父技能', 'skill-req', ['None'], 'None').setTooltip('先解锁父技能才可以学习该技能 None为不需要'),
        new IntValue('父技能等级', 'skill-req-lvl', 1).setTooltip('将父技能提升至特定等级才能学习该技能'),
        new ListValue('权限', 'needs-permission', ['True', 'False'], 'False').setTooltip('需要拥有权限才能解锁. 权限格式为 "skillapi.skill.{技能名字}"'),
        new AttributeValue('职业等级', 'level', 1, 0).setTooltip('职业技能达到要求才能解锁技能'),
        new AttributeValue('技能点消耗', 'cost', 1, 0).setTooltip('解锁和升级该技能所需的技能点数'),
        new AttributeValue('冷却', 'cooldown', 0, 0).setTooltip('技能冷却时间（单位: 秒） (技能主动释放才有效)'),
        new AttributeValue('法力值', 'mana', 0, 0).setTooltip('释放技能消耗的法力值 (技能主动释放有效)'),
        new AttributeValue('最小技能点消耗', 'points-spent-req', 0, 0).setTooltip('在升级此技能前需要至少消耗多少技能点'),
        new StringValue('释放消息', 'msg', '&6{player} &2has cast &6{skill}').setTooltip('技能释放时显示给半径内玩家的信息，半径大小在 config.yml 文件中设置'),
        new StringValue('组合键', 'combo', '').setTooltip('开启后可以使用组合键释放技能. 可用的键位(L, R, S, LS, RS, P, Q,F) 字母间需要一个空格(L为左键,R为右键,S为下蹲键,Q为丢物品键,F为副手切换键,P为鼠标滚轮键) 例如:“L L R R” 以此按即可释放技能!'),
        new ListValue('指示器', 'indicator', ['2D', '3D', 'None'], '2D').setTooltip('使用指定类型的显示来播放.这适用于施放条设置中的“悬停条”.'),
        new ListValue('图标', 'icon', getMaterials, 'Jack O Lantern').setTooltip('在GUI中技能显示的图标'),
        new IntValue('图表数据', 'icon-data', 0).setTooltip('图标的数据值/耐久度.'),
        new StringListValue('图标介绍(lore)', 'icon-lore', [
            '&d{name} &7({level}/{max})',
            '&2类型: &6{type}',
            '',
            '{req:level}等级: {attr:level}',
            '{req:cost}消耗: {attr:cost}',
            '',
            '&2法力值消耗: {attr:mana}',
            '&2冷却时间: {attr:cooldown}秒 '
        ]).setTooltip('在GUI内显示的lore'),
        new StringListValue('冲突的技能', 'incompatible', []).setTooltip('如果想学习该技能，则以下技能不能被学习')
    ];
}

/**
 * Applies the skill data to the HTML page, overwriting any previous data
 */
Skill.prototype.apply = function () {
    var builder = document.getElementById('builderContent');
    builder.innerHTML = '';

    // Set up the builder content
    for (var i = 0; i < this.components.length; i++) {
        this.components[i].createBuilderHTML(builder);
    }
}

/**
 * Creates the form HTML for editing the skill and applies it to
 * the appropriate area on the page
 */
Skill.prototype.createFormHTML = function () {
    var form = document.createElement('form');

    var header = document.createElement('h4');
    header.innerHTML = '技能信息编辑';
    form.appendChild(header);

    form.appendChild(document.createElement('hr'));
    form.appendChild(this.createEditButton(form));
    form.appendChild(document.createElement('hr'));

    this.data[3].list.splice(1, this.data[3].list.length - 1);
    for (var i = 0; i < skills.length; i++) {
        if (skills[i] != this) {
            this.data[3].list.push(skills[i].data[0].value);
        }
    }
    for (var i = 0; i < this.data.length; i++) {
        this.data[i].createHTML(form);
    }

    var hr = document.createElement('hr');
    form.appendChild(hr);

    form.appendChild(this.createEditButton(form));

    var target = document.getElementById('skillForm');
    target.innerHTML = '';
    target.appendChild(form);
}

Skill.prototype.createEditButton = function (form) {
    var done = document.createElement('h5');
    done.className = 'doneButton';
    done.innerHTML = '保存',
        done.skill = this;
    done.form = form;
    done.addEventListener('click', function (e) {
        this.skill.update();
        var list = document.getElementById('skillList');
        list[list.selectedIndex].text = this.skill.data[0].value;
        this.form.parentNode.removeChild(this.form);
        showSkillPage('builder');
    });
    return done;
}

/**
 * Updates the skill data from the details form if it exists
 */
Skill.prototype.update = function () {
    var index;
    var list = document.getElementById('skillList');
    for (var i = 0; i < skills.length; i++) {
        if (skills[i] == this) {
            index = i;
            break;
        }
    }
    var prevName = this.data[0].value;
    for (var j = 0; j < this.data.length; j++) {
        this.data[j].update();
    }
    var newName = this.data[0].value;
    this.data[0].value = prevName;
    if (isSkillNameTaken(newName)) return;
    this.data[0].value = newName;
    list[index].text = this.data[0].value;
}

/**
 * Checks whether or not the skill is using a given trigger
 *
 * @param {string} trigger - name of the trigger to check
 *
 * @returns {boolean} true if using it, false otherwise
 */
Skill.prototype.usingTrigger = function (trigger) {
    for (var i = 0; i < this.components.length; i++) {
        if (this.components[i].name == trigger) return true;
    }
    return false;
}

/**
 * Creates and returns a save string for the skill
 */
Skill.prototype.getSaveString = function () {
    var saveString = '';

    saveString += this.data[0].value + ":\n";
    for (var i = 0; i < this.data.length; i++) {
        if (isAttribute(this.data[i])) continue;
        saveString += this.data[i].getSaveString('  ');
    }
    saveString += '  attributes:\n';
    for (var i = 0; i < this.data.length; i++) {
        if (isAttribute(this.data[i])) {
            saveString += this.data[i].getSaveString('    ');
        }
    }
    if (this.components.length > 0) {
        saveString += '  components:\n';
        saveIndex = 0;
        for (var i = 0; i < this.components.length; i++) {
            saveString += this.components[i].getSaveString('    ');
        }
    }
    return saveString;
}

function isAttribute(input) {
    return (input instanceof AttributeValue) || (input.key == 'incompatible');
}

/**
 * Loads skill data from the config lines stating at the given index
 *
 * @param {YAMLObject} data - the data to load
 *
 * @returns {Number} the index of the last line of data for this skill
 */
Skill.prototype.load = function (data) {
    if (data.active || data.embed || data.passive) {
        // Load old skill config for conversion
    } else {
        this.loadBase(data);
    }
}

Skill.prototype.loadBase = loadSection;

/**
 * Creates a new skill and switches the view to it
 *
 * @returns {Skill} the new skill
 */
function newSkill() {
    var id = 1;
    while (isSkillNameTaken('Skill ' + id)) id++;

    activeSkill = addSkill('Skill ' + id);

    var list = document.getElementById('skillList');
    list.selectedIndex = list.length - 2;

    activeSkill.apply();
    activeSkill.createFormHTML();
    showSkillPage('skillForm');

    return activeSkill;
}

/**
 * Adds a skill to the editor without switching the view to it
 *
 * @param {string} name - the name of the skill to add
 *
 * @returns {Skill} the added skill
 */
function addSkill(name) {
    var skill = new Skill(name);
    skills.push(skill);

    var option = document.createElement('option');
    option.text = name;
    var list = document.getElementById('skillList');
    list.add(option, list.length - 1);

    return skill;
}

/**
 * Checks whether or not a skill name is currently taken
 *
 * @param {string} name - name to check for
 *
 * @returns {boolean} true if the name is taken, false otherwise
 */
function isSkillNameTaken(name) {
    return getSkill(name) != null;
}

/**
 * Retrieves a skill by name
 *
 * @param {string} name - name of the skill to retrieve
 *
 * @returns {Skill} the skill with the given name or null if not found
 */
function getSkill(name) {
    name = name.toLowerCase();
    for (var i = 0; i < skills.length; i++) {
        if (skills[i].data[0].value.toLowerCase() == name) return skills[i];
    }
    return null;
}


var activeSkill = new Skill('Skill 1');
var activeComponent = undefined;
var skills = [activeSkill];
activeSkill.createFormHTML();
showSkillPage('skillForm');
