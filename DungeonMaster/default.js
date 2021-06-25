// An experiment in rendering Dungeon Master levels on a web page
// (c) 2021 Bertrand Le Roy

'use strict';

class Party {
    constructor() {
        this.onMoved = [];
        this.facing = Party.facingDirection.north;
        this.champions = [];
    }

    goto(tile) {
        this.tile = tile;

        this.onMoved.forEach(handler => handler(this));

        if (tile.step) {
            tile.step(this);
        }
    }

    moveForward() {
        const [dx, dy] =
            this.facing === Party.facingDirection.north ? [-1, 0] :
            this.facing === Party.facingDirection.south ? [1, 0] :
            this.facing === Party.facingDirection.east ? [0, 1] :
            [0, -1];
        this.moveBy(dx, dy);
    }

    moveBack() {
        const [dx, dy] =
            this.facing === Party.facingDirection.north ? [1, 0] :
            this.facing === Party.facingDirection.south ? [-1, 0] :
            this.facing === Party.facingDirection.east ? [0, -1] :
            [0, 1];
        this.moveBy(dx, dy);
    }

    moveLeft() {
        const [dx, dy] =
            this.facing === Party.facingDirection.north ? [0, -1] :
            this.facing === Party.facingDirection.south ? [0, 1] :
            this.facing === Party.facingDirection.east ? [-1, 0] :
            [1, 0];
        this.moveBy(dx, dy);
    }

    moveRight() {
        const [dx, dy] =
            this.facing === Party.facingDirection.north ? [0, 1] :
            this.facing === Party.facingDirection.south ? [0, -1] :
            this.facing === Party.facingDirection.east ? [1, 0] :
            [-1, 0];
        this.moveBy(dx, dy);
    }

    turnLeft() {
        this.facing =
            this.facing === Party.facingDirection.north ? Party.facingDirection.west :
            this.facing === Party.facingDirection.south ? Party.facingDirection.east :
            this.facing === Party.facingDirection.east ? Party.facingDirection.north :
            Party.facingDirection.south;

        this.onMoved.forEach(handler => handler(this));
    }

    turnRight() {
        this.facing =
            this.facing === Party.facingDirection.north ? Party.facingDirection.east :
            this.facing === Party.facingDirection.south ? Party.facingDirection.west :
            this.facing === Party.facingDirection.east ? Party.facingDirection.south :
            Party.facingDirection.north;

        this.onMoved.forEach(handler => handler(this));
    }

    moveBy(dx, dy) {
        const currentTile = this.tile;
        const level = currentTile.level;
        const [x, y] = [
            Math.min(level.height - 1, Math.max(0, currentTile.row + dx)),
            Math.min(level.width - 1, Math.max(0, currentTile.column + dy))
        ];
        if ((x != currentTile.row || y != currentTile.column) && !level.map[x][y].blocks) {
            this.goto(level.map[x][y]);
        }
    }

    peek(displacement) {
        const currentTile = this.tile;
        const level = currentTile.level;
        const transform = this.facing === Party.facingDirection.north ? [[1, 0], [0, 1]] :
            this.facing === Party.facingDirection.south ? [[-1, 0], [0, -1]] :
            this.facing === Party.facingDirection.east ? [[0, 1], [-1, 0]]:
            [[0, -1], [1, 0]];
        const [dx, dy] = multiply(transform, displacement);
        const [x, y] = [currentTile.row + dx, currentTile.column + dy];
        if (x < 0 || y < 0 || x >= level.height || y >= level.width) {
            return new WallTile({type: WallTile});
        }
        return level.map[x][y];
    }

    addMoveListener(handler) {
        this.onMoved.push(handler);
    }

    removeMoveListener(handler) {
        const handlerIndex = this.onMoved.indexOf(handler);
        if (handlerIndex > -1) {
            this.onMoved.splice(handlerIndex, 1);
        }
    }

    static facingDirection = Object.freeze({
        north: "N",
        south: "S",
        east: "E",
        west: "W"
    });
}

class Champion {
    constructor(def) {
        this.name = def.name;
        this.class = def.class;
        this.portrait = def.portrait;
        this.health = this.maxHealth = def.health;
        this.stamina = this.maxStamina = def.stamina;
        this.mana = this.maxMana = def.mana;
        this.load = this.maxLoad = def.load;
        this.inventory = {
            head: null,
            chest: null,
            legs: null,
            feet: null,
            neck: null,
            leftHand: null,
            rightHand: null,
            bag: [],
            fanny: [],
            quiver: []
        };
    }
}

class Dungeon {
    constructor() {
        this.levels = [];
    }

    addLevel(level) {
        this.levels.push(level);
    }
}

class Level {
    constructor(levelDefinition, dungeon) {
        this.name = levelDefinition.name;
        this.tileIndex = {};
        this.map = levelDefinition.map.map((line, i) => {
            const parsedLine = [];
            for (let j = 0; j < line.length; j++) {
                const c = line.charAt(j);
                const tileDefinition = levelDefinition.tiles[c] || {
                    type: SpaceTile
                };
                const tile = Tile.build(tileDefinition, this, dungeon, i, j);
                parsedLine.push(tile);
                if (!this.tileIndex[c]) {
                    this.tileIndex[c] = [];
                }
                this.tileIndex[c].push(tile);
            }
            return parsedLine;
        });
        this.width = levelDefinition.map[0].length;
        this.height = levelDefinition.map.length;
    }

    find(tileId) { return this.tileIndex[tileId]; }

    findFirst(tileId) { return this.tileIndex[tileId][0]; }
}

class Tile {
    constructor(def, level, dungeon, row, column) {
        this.type = def.type;
        this.level = level;
        this.dungeon = dungeon;
        this.row = row;
        this.column = column;
    }

    get blocks() { return false; }

    static build(tileDefinition, level, dungeon, row, column) {
        return Reflect.construct(tileDefinition.type, [tileDefinition, level, dungeon, row, column]);
    }
}

class SpaceTile extends Tile {
}

class WallTile extends Tile {
    get blocks() { return true; }

    static side = Object.freeze({
        north: "N",
        south: "S",
        east: "E",
        west: "W"
    });
}

class HeroTile extends WallTile {
    constructor(def, level, dungeon, row, column) {
        super(def, level, dungeon, row, column);
        this.side = def.side;
    }
}

class DoorTile extends Tile {
    constructor(def, level, dungeon, row, column) {
        super(def, level, dungeon, row, column);
        this.open = false;
        this.orientation = def.orientation;
    }

    get blocks() { return !this.open; }

    open() {
        this.open = true;
    }

    close() {
        this.open = false;
    }

    static orientation = Object.freeze({
        horizontal: 1,
        vertical: 2
    });
}

class PressurePlateTile extends Tile {
    constructor(def, level, dungeon, row, column) {
        super(def, level, dungeon, row, column);
        this.opens = level.find(def.opens);
    }

    step() {
        if (this.opens) {
            this.opens.forEach(door => door.open());
        }
    }
}

class EntranceTile extends SpaceTile {}

class StairsTile extends Tile {
    constructor(def, level, dungeon, row, column) {
        super(def, level, dungeon, row, column);
        this.goesTo = def.goesTo;
    }

    step(party) {
        party.goto(dungeon.levels[this.goesTo[0]].findFirst(this.goesTo[1]))
    }
}

const level1 = {
    name: "Hall of Champions",
    map: [
      // 012345678901234567
        "   XXXXXXXAXXX5XXX", // 00
        " B XXXCX    X    X", // 01
        " D XX       X XX 6", // 02
        "   E   X FG X40X X", // 03
        "X X   HI    J3XX=X", // 04
        "X K  XXX    X X7 X", // 05
        "X X LXMXXX X2 X8 X", // 06
        "N X X   OX XX X9 X", // 07
        "           #|1XXXX", // 08
        "   XXPXX XQXXXXXXX", // 09
        " R SXX   TXXX    X", // 10
        "     X Z XXXX XX X", // 11
        "XX   X   XXXX XX  ", // 12
        "XV        X X XX X", // 13
        "XX   XXWX   X XX X", // 14
        "XXXUXXXXXXX   XX X", // 15
        "XXXXXXXXXXX XXXX^X"  // 16
    ],
    tiles: {
        " ": {
            type: SpaceTile
        },
        X: {
            type: WallTile
        },
        "=": {
            type: DoorTile,
            orientation: DoorTile.orientation.horizontal
        },
        "|": {
            type: DoorTile,
            orientation: DoorTile.orientation.vertical
        },
        "#": {
            type: PressurePlateTile,
            opens: "|"
        },
        "^": {
            type: EntranceTile
        },
        "0": {
            type: StairsTile,
            goesTo: [0, "^"]
        },
        A: {
            type: HeroTile,
            side: WallTile.side.south
        }
    }
};

const levelDefinitions = [level1];
const dungeon = new Dungeon();
levelDefinitions.map(l => dungeon.addLevel(new Level(l, dungeon)));
const party = new Party();

const keyEventMap = {};

document.addEventListener('keydown', e => {
    const handlers = keyEventMap[e.key];
    if (handlers) {
        handlers.forEach(handler => handler(e));
    }
});

document.addEventListener('DOMContentLoaded', e => {
    command(document.getElementsByClassName('turn-left'), 'q', e => {
        party.turnLeft();
    });

    command(document.getElementsByClassName('forward'), ['w', 'ArrowUp'], e => {
        party.moveForward();
    });

    command(document.getElementsByClassName('turn-right'), 'e', e => {
        party.turnRight();
    });

    command(document.getElementsByClassName('left'), ['a', 'ArrowLeft'], e => {
        party.moveLeft();
    });

    command(document.getElementsByClassName('back'), ['s', 'ArrowDown'], e => {
        party.moveBack();
    });

    command(document.getElementsByClassName('right'), ['d', 'ArrowRight'], e => {
        party.moveRight();
    });

    const viewport = document.getElementsByClassName('viewport');

    party.addMoveListener(p => {
        render(party, viewport);
    });
    party.goto(dungeon.levels[0].findFirst("^"));
});

function onClick(btn, handler) {
    for (const el of btn) {
        el.addEventListener('click', handler);
    }
}

function command(btn, keys, handler) {
    onClick(btn, handler);
    if (keys) {
        if (typeof(keys) === "string") {
            keys = [keys];
        }
        for (let key of keys) {
            if (!keyEventMap[key]) {
                keyEventMap[key] = [];
            }
            keyEventMap[key].push(handler);
        }
    }
}

function setVisibility(parents, className, isVisible) {
    [...parents].forEach(parent =>
        [...parent.getElementsByClassName(className)].forEach(el => {
            el.style.visibility = isVisible ? "visible" : "hidden";
    }));
}

function setClass(elements, className, condition) {
    [...elements].forEach(el => {
        if (condition) el.classList.add(className);
        else el.classList.remove(className);
    });
}

function render(party, viewport) {
    const l0 = party.peek([0, -1]);
    const r0 = party.peek([0, 1]);
    const l1 = party.peek([-1, -1]);
    const f1 = party.peek([-1, 0]);
    const r1 = party.peek([-1, 1]);
    const l2 = party.peek([-2, -1]);
    const f2 = party.peek([-2, 0]);
    const r2 = party.peek([-2, 1]);
    const l3 = party.peek([-3, -1]);
    const f3 = party.peek([-3, 0]);
    const r3 = party.peek([-3, 1]);

    setVisibility(viewport, 'l0', l0.blocks);
    setVisibility(viewport, 'r0', r0.blocks);
    setVisibility(viewport, 'fl1', l1.blocks);
    setVisibility(viewport, 'ff1', f1.blocks);
    setVisibility(viewport, 'fr1', r1.blocks);
    setVisibility(viewport, 'l1', l1.blocks);
    setVisibility(viewport, 'r1', r1.blocks);
    setVisibility(viewport, 'fl2', l2.blocks);
    setVisibility(viewport, 'ff2', f2.blocks);
    setVisibility(viewport, 'fr2', r2.blocks);
    setVisibility(viewport, 'l2', l2.blocks);
    setVisibility(viewport, 'r2', r2.blocks);
    setVisibility(viewport, 'fl3', l3.blocks);
    setVisibility(viewport, 'ff3', f3.blocks);
    setVisibility(viewport, 'fr3', r3.blocks);
    setVisibility(viewport, 'l3', l3.blocks);
    setVisibility(viewport, 'r3', r3.blocks);

    setClass(viewport, "alternate",
        (party.tile.row + party.tile.column +
            (party.facing == Party.facingDirection.east || party.facing == Party.facingDirection.west ? 1 : 0)
        ) % 2 === 0);
}

const multiply = (matrix, vector) =>
    matrix.map(row => row.reduce((acc, val, i) => acc + val * vector[i], 0));
